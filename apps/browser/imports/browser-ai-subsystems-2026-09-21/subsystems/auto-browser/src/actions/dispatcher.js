/**
 * Action dispatcher. Orchestrates uid-based mutating tool calls:
 *   1. Consume a pre-computed permission decision (from permission-manager.decide).
 *   2. If "ask", await the caller-supplied approver, record the grant on approval.
 *   3. Resolve uids to pixel coordinates via the injected resolver.
 *   4. Sequence the CDP actions for composite tools (fill = click + type; drag;
 *      fill_form = loop of fills).
 *   5. Short-circuit on the first error and surface it to the caller.
 *
 * Pure: all I/O is injected (approve, recordGrant, resolveCoords, send). Tests
 * use fakes that record the sequence. Production wiring lives in content.js —
 * it computes the decision, builds a bbox resolver over the per-turn refmap,
 * and forwards `send` to the SW via chrome.runtime.sendMessage.
 *
 * Why this split: the permission decision + refmap resolution + URL-drift live
 * in the content script (they need DOM + chrome.storage); the actual CDP
 * dispatch lives in the service worker (it owns chrome.debugger). Dispatcher
 * is the seam where those two halves meet, without either having to know
 * about the other's world.
 */

const SUPPORTED_TOOLS = ["click", "hover", "press_key", "fill", "fill_form", "scroll", "drag"];

function unknownToolError(tool) {
  return { error: `dispatcher: unknown tool "${tool}". Supported: ${SUPPORTED_TOOLS.join(", ")}.` };
}

async function resolveOrError(resolveCoords, uid) {
  const coords = resolveCoords(uid);
  if (coords && coords.error) return coords;
  return coords;
}

/**
 * Core entry point. `deps.decision` is the pre-computed 'allow' | 'ask' | 'deny'.
 * On 'ask' the dispatcher calls `deps.approve()` (async → boolean) and, on
 * approval, `deps.recordGrant()` before proceeding.
 *
 * Phase 3.2 — `deps.settle` (optional) is awaited AFTER a successful
 * dispatch and BEFORE returning to the caller. Bridges the race
 * between "send returned ok" and "DOM commit visible to the next
 * snapshot": a click that opens a modal returns immediately, but the
 * modal's render commits a frame later. Production passes a small
 * sleep (~50ms) tuned to typical paint cycles. Optional for backward
 * compat — callers without a settle dep see the prior behavior.
 */
export async function dispatch(tool, args = {}, deps) {
  const { decision, approve, recordGrant, resolveCoords, send, settle } = deps;

  if (decision === "deny") {
    return { error: `${tool}: denied by policy.` };
  }
  if (decision === "ask") {
    const approved = await approve();
    if (!approved) return { error: `${tool}: denied by user.` };
    if (typeof recordGrant === "function") recordGrant();
  }

  let result;
  switch (tool) {
    case "click":     result = await dispatchUidAction(args, resolveCoords, send, "click"); break;
    case "hover":     result = await dispatchUidAction(args, resolveCoords, send, "hover"); break;
    case "press_key": result = await dispatchPressKey(args, send); break;
    case "fill":      result = await dispatchFill(args, resolveCoords, send); break;
    case "fill_form": result = await dispatchFillForm(args, resolveCoords, send); break;
    case "scroll":    result = await dispatchScroll(args, resolveCoords, send); break;
    case "drag":      result = await dispatchDrag(args, resolveCoords, send); break;
    default:          return unknownToolError(tool);
  }

  // Phase 3.2 — settle ONLY on the success path. Failure paths
  // (uid-resolve error, send error, validation error) already
  // short-circuited without mutating the DOM, so there's nothing
  // to wait for. A throwing settle propagates as a normal error
  // so a buggy timer doesn't silently mask the action's success.
  if (!result.error && typeof settle === "function") {
    try {
      await settle();
    } catch (err) {
      return { error: `settle: ${err.message}` };
    }
  }
  return result;
}

async function dispatchUidAction(args, resolveCoords, send, action) {
  const coords = await resolveOrError(resolveCoords, args.uid);
  if (coords.error) return coords;
  return send(action, {
    x: coords.x,
    y: coords.y,
    ...(args.button !== undefined ? { button: args.button } : {}),
    ...(args.modifiers ? { modifiers: args.modifiers } : {}),
    ...(args.clickCount !== undefined ? { clickCount: args.clickCount } : {}),
  });
}

async function dispatchPressKey(args, send) {
  if (typeof args.chord !== "string" || !args.chord.trim()) {
    return { error: "press_key: 'chord' is required (e.g. \"Enter\" or \"cmd+a\")." };
  }
  return send("press_key", { chord: args.chord });
}

async function dispatchFill(args, resolveCoords, send) {
  if (typeof args.text !== "string") {
    return { error: "fill: 'text' is required." };
  }
  const coords = await resolveOrError(resolveCoords, args.uid);
  if (coords.error) return coords;
  // Triple-click selects the entire content of a native input/textarea on
  // every major browser — including macOS, where a cmd+a chord would need
  // platform-specific translation. The subsequent insertText then replaces
  // the selection instead of appending at the caret. Restores the
  // "clear-before-type" guarantee the retired type_text provided.
  const clickRes = await send("click", { x: coords.x, y: coords.y, clickCount: 3 });
  if (clickRes.error) return clickRes;
  const typeRes = await send("type", { text: args.text });
  if (typeRes.error) return typeRes;
  if (args.press_enter) {
    const keyRes = await send("press_key", { chord: "Enter" });
    if (keyRes.error) return keyRes;
  }
  return { ok: true };
}

async function dispatchFillForm(args, resolveCoords, send) {
  const entries = Array.isArray(args.entries) ? args.entries : null;
  if (!entries || entries.length === 0) {
    return { error: "fill_form: non-empty 'entries' array is required." };
  }
  for (const entry of entries) {
    const result = await dispatchFill(entry, resolveCoords, send);
    if (result.error) return result;
  }
  return { ok: true };
}

async function dispatchScroll(args, resolveCoords, send) {
  let x = args.x;
  let y = args.y;
  if (typeof args.uid === "string") {
    const coords = await resolveOrError(resolveCoords, args.uid);
    if (coords.error) return coords;
    x = coords.x;
    y = coords.y;
  }
  return send("scroll", {
    x, y,
    ...(args.deltaX !== undefined ? { deltaX: args.deltaX } : {}),
    ...(args.deltaY !== undefined ? { deltaY: args.deltaY } : {}),
    ...(args.modifiers ? { modifiers: args.modifiers } : {}),
  });
}

async function dispatchDrag(args, resolveCoords, send) {
  const from = await resolveOrError(resolveCoords, args.from_uid);
  if (from.error) return from;
  const to = await resolveOrError(resolveCoords, args.to_uid);
  if (to.error) return to;
  return send("drag", {
    from: { x: from.x, y: from.y },
    to: { x: to.x, y: to.y },
    ...(args.button !== undefined ? { button: args.button } : {}),
    ...(args.modifiers ? { modifiers: args.modifiers } : {}),
  });
}
