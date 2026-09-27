/**
 * Pixel-coordinate action fallback. Used when the snapshot + uid path can't
 * address what the agent needs (canvas apps, WYSIWYG editors, custom-rendered
 * surfaces). The ref-ID path through src/actions/inputs.js is the preferred
 * primary; this is the escape hatch.
 *
 * Pure CDP wire-up:
 *   - Builds payloads via src/cdp/wire.js
 *   - Dispatches via the injected driver (DIP, unit-testable)
 *   - Emits structured errors that double as recovery instructions
 *
 * Permission-gating and URL-drift are the caller's job — computer runs after
 * the dispatcher has cleared those gates. Tests for those gates live with
 * the dispatcher in Phase 2.
 */
import {
  clickSequence,
  wheelEvent,
  mouseEvent,
  insertTextEvent,
  chunkText,
  keyEvent,
  parseKeyChord,
} from "../cdp/wire.js";

const SUPPORTED_ACTIONS = ["click", "type", "scroll", "drag", "hover", "press_key"];

function missingFieldsError(fields) {
  return { error: `computer: missing required field(s): ${fields.join(", ")}.` };
}

async function dispatchClick(driver, tabId, params) {
  if (!Number.isFinite(params?.x) || !Number.isFinite(params?.y)) {
    return missingFieldsError(["x", "y"]);
  }
  const events = clickSequence(params);
  for (const ev of events) {
    await driver.send(tabId, "Input.dispatchMouseEvent", ev);
  }
  return { ok: true };
}

async function dispatchType(driver, tabId, params) {
  if (typeof params?.text !== "string") {
    return missingFieldsError(["text"]);
  }
  for (const ch of chunkText(params.text)) {
    await driver.send(tabId, "Input.insertText", insertTextEvent(ch));
  }
  return { ok: true };
}

async function dispatchScroll(driver, tabId, params) {
  if (!Number.isFinite(params?.x) || !Number.isFinite(params?.y)) {
    return missingFieldsError(["x", "y"]);
  }
  const deltaX = Number.isFinite(params.deltaX) ? params.deltaX : 0;
  const deltaY = Number.isFinite(params.deltaY) ? params.deltaY : 0;
  if (deltaX === 0 && deltaY === 0) {
    // A zero-delta wheel event is a no-op that silently lies to the agent.
    // Fail-fast so malformed scroll intents surface here instead of getting
    // dispatched to Chrome and returning a misleading success.
    return missingFieldsError(["deltaX", "deltaY"]);
  }
  await driver.send(tabId, "Input.dispatchMouseEvent", wheelEvent({ ...params, deltaX, deltaY }));
  return { ok: true };
}

async function dispatchDrag(driver, tabId, params) {
  const from = params?.from;
  const to = params?.to;
  if (!from || !Number.isFinite(from.x) || !Number.isFinite(from.y) ||
      !to || !Number.isFinite(to.x) || !Number.isFinite(to.y)) {
    return missingFieldsError(["from.{x,y}", "to.{x,y}"]);
  }
  await driver.send(tabId, "Input.dispatchMouseEvent", mouseEvent({
    type: "mousePressed", ...from, button: params.button, modifiers: params.modifiers,
  }));
  await driver.send(tabId, "Input.dispatchMouseEvent", mouseEvent({
    type: "mouseMoved", ...to, button: params.button, modifiers: params.modifiers,
  }));
  await driver.send(tabId, "Input.dispatchMouseEvent", mouseEvent({
    type: "mouseReleased", ...to, button: params.button, modifiers: params.modifiers,
  }));
  return { ok: true };
}

async function dispatchHover(driver, tabId, params) {
  if (!Number.isFinite(params?.x) || !Number.isFinite(params?.y)) {
    return missingFieldsError(["x", "y"]);
  }
  await driver.send(tabId, "Input.dispatchMouseEvent", mouseEvent({
    type: "mouseMoved",
    x: params.x,
    y: params.y,
    modifiers: params.modifiers,
    clickCount: 0,
  }));
  return { ok: true };
}

async function dispatchPressKey(driver, tabId, params) {
  if (typeof params?.chord !== "string" || !params.chord.trim()) {
    return missingFieldsError(["chord"]);
  }
  const { key, modifiers } = parseKeyChord(params.chord);
  await driver.send(tabId, "Input.dispatchKeyEvent", keyEvent({
    type: "keyDown", key, modifiers,
  }));
  await driver.send(tabId, "Input.dispatchKeyEvent", keyEvent({
    type: "keyUp", key, modifiers,
  }));
  return { ok: true };
}

export async function computer(driver, tabId, action, params = {}) {
  try {
    switch (action) {
      case "click":     return await dispatchClick(driver, tabId, params);
      case "type":      return await dispatchType(driver, tabId, params);
      case "scroll":    return await dispatchScroll(driver, tabId, params);
      case "drag":      return await dispatchDrag(driver, tabId, params);
      case "hover":     return await dispatchHover(driver, tabId, params);
      case "press_key": return await dispatchPressKey(driver, tabId, params);
      default:
        return {
          error: `computer: unknown action "${action}". Supported: ${SUPPORTED_ACTIONS.join(", ")}.`,
        };
    }
  } catch (err) {
    return { error: err.message };
  }
}
