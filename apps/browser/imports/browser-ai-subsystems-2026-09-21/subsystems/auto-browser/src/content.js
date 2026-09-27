/**
 * Content script — LLM-driven ReAct loop for Auto Browser.
 * Runs in ISOLATED world. Uses page-helper.js for WebMCP access.
 *
 * The LLM decides ALL actions. No hardcoded flow. The agent:
 *   1. Discovers available WebMCP tools
 *   2. Gets page state for context
 *   3. Sends tools + state to LLM
 *   4. LLM picks a tool to call, or ends the turn with {"done": true}
 *   5. Executes the tool, then loops until turn ends
 *
 * LLM is only called when the available tool set changes to minimize API costs.
 */

console.log("[AutoBrowser] Content script loaded");

const DEFAULT_POLL_MS = 1000;
const DEFAULT_MODELS = {
  openrouter: "deepseek/deepseek-v3.2-speciale",
  "builtin-ai": "",
  gemini: "gemini-3.6-flash",
  local: "",
};

// `provider` selects the LLM backend:
//   "openrouter"  (cloud, OpenAI-compatible)
//   "builtin-ai"  (Chrome on-device Gemini Nano via window.LanguageModel)
//   "gemini"      (Google AI Studio cloud, API key)
//   "local"       (OpenAI-compatible local server — Ollama, LM Studio, vLLM, …)
// Per-provider config lives under `config.providers[<id>]`; the content
// script only reads the sub-object for the currently-selected provider.
let config = {
  provider: "openrouter",
  maxSteps: 50,
  // Phase 1.2 — pair every `take_snapshot` call with a screenshot so the
  // LLM receives both the accessibility-tree text AND a pixel view in one
  // turn. Default on; flip to false to suppress (e.g. privacy-sensitive
  // contexts, or cost-constrained runs). On-snapshot triggering keeps
  // token cost bounded to turns the model already asked for a snapshot.
  screenshotInPrompt: true,
  // Phase 2.1b — occlusion filter. When a z-indexed overlay (cookie
  // banner, modal, tooltip) covers an element, its bbox center
  // returns a different element from `document.elementFromPoint`.
  // The walker treats that element as if it didn't exist, preventing
  // "click lands on overlay" failures. Defaults on; flip to false in
  // dev contexts where you want to see every candidate ref
  // regardless of overlay state.
  filterOccluded: true,
  // Phase 3.2 — post-action DOM settle wait. After every successful
  // mutating action the dispatcher awaits this many milliseconds
  // before resolving, so a click that opens a modal doesn't race
  // the next take_snapshot. 50ms covers a typical paint cycle on
  // modern hardware. Set to 0 to disable (e.g. tests, perf-critical
  // automation where the agent will explicitly call wait_for).
  actionSettleMs: 50,
  providers: {
    openrouter: { apiKey: "", model: "" },
    "builtin-ai": {},
    gemini: { apiKey: "", model: "", thinking: false },
    local: { baseUrl: "", apiKey: "", model: "", kind: "custom", vision: [] },
  },
};

function mergeConfig(prev, incoming) {
  const next = { ...prev, ...incoming };
  if (incoming && typeof incoming.providers === "object") {
    next.providers = { ...prev.providers };
    for (const id of Object.keys(incoming.providers)) {
      next.providers[id] = {
        ...(prev.providers?.[id] || {}),
        ...(incoming.providers[id] || {}),
      };
    }
  }
  return next;
}

function getActiveProviderConfig() {
  const id = config.provider || "openrouter";
  return config.providers?.[id] || {};
}

// Map a resolved thinking mode (from src/llm/thinking-mode.js) to the
// provider-neutral `{enabled, effort?}` shape that providers consume on the
// wire (Gemini → thinkingConfig, OpenRouter → reasoning.effort). When the
// mode says "off", we return undefined so providers don't allocate budget /
// effort tokens — the user explicitly disabled thinking and must not pay
// for invisible reasoning.
function modeToWireThinking(mode) {
  if (!mode || (!mode.native && !mode.schemaThoughtRequested)) return undefined;
  // Schema-only thought is local to the loop; no provider-side budget needed.
  // Native modes propagate effort to the provider so it actually thinks.
  if (!mode.native) return undefined;
  return { enabled: true, effort: mode.effort || "medium" };
}

// Lazy-loaded LLM modules. Content scripts are classic scripts so we can't
// `import` at the top level; dynamic import via `chrome.runtime.getURL()`
// fetches the ES module through the `web_accessible_resources` manifest entry.
//
// We keep each module in its own namespace (rather than spread-merging) so
// same-named exports in future modules can't silently shadow each other.
let llmModulesPromise = null;
function loadLLMModules() {
  if (!llmModulesPromise) {
    llmModulesPromise = (async () => {
      const [
        provider,
        schema,
        toolPrefs,
        workingMemory,
        thinkingMode,
        submitShape,
        validator,
        stateFingerprint,
        recovery,
        compaction,
      ] = await Promise.all([
        import(/* @vite-ignore */ chrome.runtime.getURL("src/llm/provider.js")),
        import(/* @vite-ignore */ chrome.runtime.getURL("src/llm/react-schema.js")),
        import(/* @vite-ignore */ chrome.runtime.getURL("src/llm/tool-prefs.js")),
        import(/* @vite-ignore */ chrome.runtime.getURL("src/llm/working-memory.js")),
        import(/* @vite-ignore */ chrome.runtime.getURL("src/llm/thinking-mode.js")),
        import(/* @vite-ignore */ chrome.runtime.getURL("src/llm/submit-shape.js")),
        import(/* @vite-ignore */ chrome.runtime.getURL("src/llm/validator.js")),
        import(/* @vite-ignore */ chrome.runtime.getURL("src/llm/state-fingerprint.js")),
        import(/* @vite-ignore */ chrome.runtime.getURL("src/orchestration/recovery.js")),
        import(/* @vite-ignore */ chrome.runtime.getURL("src/orchestration/history-compaction.js")),
      ]);
      return {
        provider,
        schema,
        toolPrefs,
        workingMemory,
        thinkingMode,
        submitShape,
        validator,
        stateFingerprint,
        recovery,
        compaction,
      };
    })().catch((err) => {
      console.error("[AutoBrowser] Failed to load LLM module:", err);
      llmModulesPromise = null;
      throw err;
    });
  }
  return llmModulesPromise;
}
// Perception + safety modules — lazily loaded via dynamic import, same pattern
// as the LLM modules above. Cached per content-script life (one tab, one
// instance). The refmap + last-snapshot text live here as per-turn state;
// resetPerTurnState() wipes them at each USER_MESSAGE boundary.
let perceptionModulesPromise = null;
function loadPerceptionModules() {
  if (!perceptionModulesPromise) {
    perceptionModulesPromise = (async () => {
      const [snapshotMod, refmapMod, findMod, permMod, policyMod, scriptRiskMod, driftMod, dispatchMod, attachMod, overlayMod, coordsMod, resolveUidMod, recoverMod] = await Promise.all([
        import(/* @vite-ignore */ chrome.runtime.getURL("src/perception/snapshot.js")),
        import(/* @vite-ignore */ chrome.runtime.getURL("src/perception/refmap.js")),
        import(/* @vite-ignore */ chrome.runtime.getURL("src/perception/find.js")),
        import(/* @vite-ignore */ chrome.runtime.getURL("src/safety/permission-manager.js")),
        import(/* @vite-ignore */ chrome.runtime.getURL("src/safety/policy-store.js")),
        import(/* @vite-ignore */ chrome.runtime.getURL("src/safety/script-risk.js")),
        import(/* @vite-ignore */ chrome.runtime.getURL("src/safety/url-drift.js")),
        import(/* @vite-ignore */ chrome.runtime.getURL("src/actions/dispatcher.js")),
        import(/* @vite-ignore */ chrome.runtime.getURL("src/perception/attach-screenshot.js")),
        import(/* @vite-ignore */ chrome.runtime.getURL("src/perception/overlay.js")),
        import(/* @vite-ignore */ chrome.runtime.getURL("src/perception/coords.js")),
        import(/* @vite-ignore */ chrome.runtime.getURL("src/actions/resolve-uid.js")),
        import(/* @vite-ignore */ chrome.runtime.getURL("src/actions/recover-stale-ref.js")),
      ]);
      return {
        snapshot: snapshotMod,
        refmap: refmapMod,
        find: findMod,
        permission: permMod,
        policy: policyMod,
        scriptRisk: scriptRiskMod,
        drift: driftMod,
        dispatcher: dispatchMod,
        attach: attachMod,
        overlay: overlayMod,
        coords: coordsMod,
        resolveUid: resolveUidMod,
        recover: recoverMod,
      };
    })().catch((err) => {
      console.error("[AutoBrowser] Failed to load perception module:", err);
      perceptionModulesPromise = null;
      throw err;
    });
  }
  return perceptionModulesPromise;
}

// Per-turn state — reset on every USER_MESSAGE boundary.
// refmap: uid → Element map populated by take_snapshot, consumed by
//   get_element_info / find / (Phase 2) element-targeted actions.
// lastSnapshotText: the text form of the most recent take_snapshot, so
//   `find` can operate without re-walking the DOM.
// perTurnGrants: Map<toolUseId, {domain, expiresAt?}> for permission-manager
//   — one-action grants keyed to a specific tool call.
// perTurnDomainGrants: Set<domain> — "Allow for this turn" grants that apply
//   to every mutating call on the same domain for the rest of the turn. Kept
//   separate from perTurnGrants because decide() matches grants by toolUseId,
//   and generating a fresh computer_N id per call would otherwise bypass the
//   turn-wide promise the UI makes to the user.
let perTurnRefmap = null;
let lastSnapshotText = "";
let perTurnGrants = new Map();
let perTurnDomainGrants = new Set();
// perTurnScriptGrants: Set<domain> — "Allow scripts for this turn", kept
// SEPARATE from perTurnDomainGrants on purpose. A user approving a click with
// "allow for this turn" has not agreed to arbitrary code execution, and
// collapsing the two would silently widen that promise.
let perTurnScriptGrants = new Set();

// perTurnAutoApprove: "Auto-approve this task" — when armed, mutating-action
// gates upgrade an "ask" decision to "allow" for the rest of the turn, so the
// user isn't prompted per action. Set authoritatively from the USER_MESSAGE
// payload (so it is live for the turn it was armed on) and via the set-only
// SET_TURN_AUTO_APPROVE message for arming mid-run. Deliberately NOT cleared in
// resetPerTurnState: a mid-turn self-navigation must not silently re-arm the
// prompts — it's still "this task". Never overrides a deny (blocklist) or an
// always-ask tool (evaluate_script); see applyTurnAutoApprove.
let perTurnAutoApprove = false;

let pollTimer = null;
let pollIntervalMs = DEFAULT_POLL_MS;
let acting = false;
let stopped = false;
let prevToolNames = "";
let activeLoop = false;
// AbortController used to cancel in-flight LLM fetches on stop.
// Replaced at the start of each `fetchLLM` call; aborted when user clicks stop.
//
// SERIAL INVARIANT: only one `fetchLLM` call may be in flight at a time. The
// orchestrator enforces this — `pollForChanges` short-circuits when `acting`
// is true, and reactLoop awaits each LLM call before issuing the next. The
// only other caller is `maybeSummarizeHistory`, which runs SYNCHRONOUSLY
// inside reactLoop's own await chain — so it's also serialized. If you ever
// add a parallel LLM call, replace this with a Set<AbortController>.
let currentAbortCtl = null;

// Cumulative thought text captured during the most recent in-flight LLM call.
// fetchLLM resets it at start; the onThought callback (or post-parse schema-
// thought hook) updates it; reactLoop reads it after the call returns to
// re-feed into the assistant message via persistAssistantTurn(). Single
// source of truth for "what did the model think during this step", regardless
// of whether the source was a native stream or a schema field.
let lastCallThoughtText = "";

// Persistent conversation history across ReAct loops.
// Compaction is token-budget driven, modeled on Claude Code:
//  - total content chars over budget → summarize older entries
//  - keep the newest entries whose cumulative char count stays under the
//    keep-threshold verbatim (the "suffix after boundary")
// Chars ≈ tokens × 4 (rough English estimate). Budget of 48k chars ≈ 12k tokens.
const HISTORY_BUDGET_CHARS = 48000;
const HISTORY_KEEP_CHARS = 24000;
// Size threshold for superseding a prior tool-result: results larger than this
// get replaced with a short marker when the same tool is called again. Small
// results (confirmations, IDs) are preserved verbatim.
const SUPERSEDABLE_SIZE_CHARS = 400;
let persistentHistory = [];
let memorySummary = ""; // compressed summary of older interactions
let derivedWorkingMemory = null;

// Reminders queued to be wrapped into the NEXT user message (tool result or
// user text) rather than pushed as standalone user turns. Modeled on Claude
// Code's `wrapMessagesInSystemReminder` — keeps the transcript cleaner and
// makes the reminder look like ambient environment info instead of user input.
let pendingReminders = [];
// Set when a `*_changed` (or explicit `boundary: true`) context-invalidated
// event arrives. Tells `pollForChanges` to fire reactLoop even when the tool
// set didn't diff — this is the only way to deliver "new hand started"
// reminders when the new hand exposes the SAME action tools as the prior one
// (preflop fold → next hand same position → tool set unchanged → polling
// otherwise blind to the transition → agent idle until action timer fires).
// Cleared when reminders flush. Scoped to `_changed` so informational
// boundaries (e.g. `hand_resolved` during the announcement window) don't
// each spawn an extra LLM round-trip — they ride along with the next real
// trigger as before.
let pendingBoundaryWakeup = false;

// Set by the agent via {"done": true, "task_complete": true}. While true, the
// orchestrator STOPS auto-re-invoking reactLoop on page/tool-set changes and
// boundary wakeups — the task is finished, so the confirmation page loading,
// the checkout modal closing, or stray DOM churn after submit should not drag
// the agent back in to "do something about it". Cleared only by a fresh
// USER_MESSAGE (new user intent) or STOP_AGENT. Distinct from the per-turn
// `done: true`, which ends a single LLM loop but leaves the agent eligible to
// be woken on the next environmental change — which is correct for ongoing
// tasks (poker) but wrong for one-shot tasks (reservation submitted, confirmed).
let taskCompleted = false;

// Hard safety cap on auto-wakeups (reactLoop invocations) between user
// messages. Every USER_MESSAGE resets the counter to 0; every reactLoop
// increments it. When it hits MAX_CONSECUTIVE_WAKEUPS, the `max_wakeups`
// stop-hook fires, stopping further auto-invocation until the user speaks
// again. Prevents the agent burning API calls in a runaway wakeup loop
// (e.g. a page that repeatedly churns its DOM, or a misbehaving WebMCP app
// that keeps flipping tool sets). Think of it as the cross-turn analog of
// MAX_STEPS-per-turn — same safety rail, different axis.
let consecutiveWakeups = 0;
const MAX_CONSECUTIVE_WAKEUPS = 30;
// One-shot flag so the max_wakeups hook only emits its terminal event
// once per latch, not on every poll tick while it stays tripped.
let maxWakeupsAnnounced = false;

// ── Stop-hook registry ──────────────────────────────────────
//
// Named policies that can veto starting a new reactLoop. Modeled after
// Claude Code's stop_hook_prevented pattern: external policy can block
// continuation without the model knowing. Checked in pollForChanges (and
// startAgent) before firing reactLoop. When any hook returns a stop object,
// we emit `turn_ended` with that reason and skip the reactLoop.
//
// Kept small on purpose — each hook is a pure read of module state. Not a
// general-purpose event system. If this grows beyond ~5 hooks, split into
// a real registry with registration order / priority.
const stopHooks = [];
function registerStopHook(name, check) {
  stopHooks.push({ name, check });
}
/**
 * Run every hook; return the first { stop: true } result or null.
 * Order is registration order — first registered wins. That gives priority
 * to user-initiated stops (registered first) over policy stops.
 *
 * Fail-closed on exception: if a hook throws, we treat it as "stop" with a
 * synthetic reason rather than silently continuing. Hooks are meant to be
 * pure reads of module state — a throw indicates a bug or corrupted state,
 * and the safer default is to pause the agent so a human can investigate
 * than to keep auto-wakeups running while the gate is broken.
 */
function checkStopHooks() {
  for (const h of stopHooks) {
    try {
      const res = h.check();
      if (res && res.stop) return { reason: res.reason, hook: h.name };
    } catch (e) {
      console.error(`[WebMCP] Stop-hook "${h.name}" threw — failing closed:`, e);
      return { reason: "hook_error", hook: h.name };
    }
  }
  return null;
}

// ── Exit reasons ────────────────────────────────────────────
//
// Canonical reasons surfaced to the sidebar via `turn_ended` events. Each
// corresponds to a distinct UX (pill text, color, whether agent remains
// eligible for wakeups). Documented here so reason strings don't drift.
const EXIT_REASONS = {
  TASK_COMPLETE: "task_complete",      // agent said {done:true, task_complete:true}
  WAITING_FOR_ENV: "waiting_for_env",  // plain {done:true} — still eligible
  MAX_STEPS: "max_steps",              // hit per-turn step cap
  MAX_WAKEUPS: "max_wakeups",          // hit cross-turn wakeup cap
  DUPLICATE_SPAM: "duplicate_spam",    // repeated identical tool call
  PARSE_FAILURE: "parse_failure",      // two consecutive unparseable LLM outputs
  PROVIDER_UNAVAILABLE: "provider_unavailable", // 429/5xx outlived the retry budget
  ABORTED: "aborted",                  // user STOP mid-loop (reserved)
  // Phase 3 — named recovery exits. All three render a distinct banner
  // (sidebar/sidebar.js renderTurnEndedBanner) so the user sees WHY the
  // agent paused, instead of the pre-Phase-3 silent "waiting_for_env" on
  // failure modes that were actually "stuck in a loop".
  OSCILLATION: "oscillation",                // working-memory 3-strike advisory tripped
  VERIFICATION_FAILED: "verification_failed", // validator said "failed" twice with no recovery
  RECOVERY_BAILED: "recovery_bailed",        // one-shot recovery call surrendered
};

// Tracks whether the most recently completed reactLoop executed any
// state-mutating tool (anything not matching the read-only pattern below).
// Used to suppress the "Waiting for changes..." pill in the chat when the
// turn was purely conversational (e.g. user asked a question, agent called
// only get_page_content / get_* and replied). On action-oriented pages
// (poker, forms) the pill is useful — agent really is on standby for the
// next opportunity. On info pages it reads as "agent is hanging" after a
// reply, which is what triggered this fix.
//
// Defaults to `true` so the very first polling state after orchestrator
// init still shows the pill (no prior turn to base the decision on; default
// to the visible-pill behavior we had before).
let lastTurnMutated = true;

/**
 * Heuristic: does this tool name imply a read-only / non-mutating operation?
 * Used to decide whether a turn was "conversational" (only reads + done) so
 * we can suppress the "Waiting for changes..." pill afterward. Generic — not
 * poker-specific. Pages following the convention `get_*`, `find_*`, etc.
 * for read-only tools get correct classification automatically.
 *
 * Conservative: when in doubt, treat as mutating (show the pill). False
 * positives just keep the existing noisy behavior; false negatives (hiding
 * the pill on a real action turn) would be more confusing.
 */
// The read-only tool classifier (post-tool seal-rotation decision) now lives in
// the shared src/llm/read-only-tools.js so the content-script loop and the
// service-worker loop classify identically. reactLoop imports it (below).

/**
 * Emit a structured turn-end event to the sidebar. Every reactLoop exit
 * path (natural done, task_complete, max_steps, duplicate_spam, aborted)
 * routes through here with a canonical reason from EXIT_REASONS. The
 * sidebar decides pill text, color, and whether the agent is still busy
 * based on the reason — keeps the "what to render" logic in one place
 * (the UI) instead of duplicated across every exit point here.
 *
 * `mutated` (optional): did this turn run any state-mutating tool? Used by
 * the sidebar's WAITING_FOR_ENV rendering to decide whether the polling
 * pill should show or stay silent (conversational turns shouldn't say
 * "Waiting for changes...").
 *
 * Dual-tracking rationale: callers inside reactLoop know the answer (they
 * tracked mutatedState across steps) and pass it in; callers OUTSIDE the
 * loop (pollForChanges stop-hook gate, max_wakeups announcer) have no
 * loop-local state to pass. For those, we want the event to reflect the
 * most recent ACTUAL turn, not a bogus `false`. So we persist the last
 * known value in module-level `lastTurnMutated` and only overwrite it
 * when the caller passes a real boolean. Callers that pass `undefined`
 * inherit the prior value.
 */
function sendTurnEnded(reason, mutated) {
  if (mutated !== undefined) lastTurnMutated = !!mutated;
  sendStatus({ state: "turn_ended", reason, mutated: lastTurnMutated });
}

// Register stop-hooks in priority order. User STOP first so it wins over
// any policy hook below. `task_complete` is a soft gate (agent declared
// done — wait for user). `max_wakeups` is a hard rail (runaway wakeup
// loop — force a pause). Hooks are consulted in pollForChanges before
// firing reactLoop; the first one that returns { stop: true } wins.
registerStopHook("user_stopped", () =>
  stopped ? { stop: true, reason: EXIT_REASONS.ABORTED } : null,
);
registerStopHook("task_complete", () =>
  taskCompleted ? { stop: true, reason: EXIT_REASONS.TASK_COMPLETE } : null,
);
registerStopHook("max_wakeups", () =>
  consecutiveWakeups >= MAX_CONSECUTIVE_WAKEUPS
    ? { stop: true, reason: EXIT_REASONS.MAX_WAKEUPS }
    : null,
);

/**
 * Queue a system-reminder. Deduped against the pending queue by default.
 * Strips any `<system-reminder>` tags from the input so a page dispatching
 * the generic context-invalidated event can't inject a fake closing tag
 * and escape the wrapper (prompt-injection defense — the extension trusts
 * the page less than it trusts itself).
 *
 * Pass `{ dedupe: false }` for reminders that MUST reach the model even
 * when identical text has already been queued this turn — e.g. a parse-
 * failure retry reminder where dedupe would silently drop the second
 * attempt and leave the retry stalled.
 */
function queueReminder(text, { dedupe = true } = {}) {
  if (!text) return;
  const sanitized = String(text).replace(/<\/?system-reminder>/gi, "").trim();
  if (!sanitized) return;
  if (dedupe && pendingReminders.includes(sanitized)) return;
  pendingReminders.push(sanitized);
}

/** Build a user-message content string with any queued reminders as prefix. */
function flushReminders(content = "") {
  if (pendingReminders.length === 0) return content;
  const prefix = pendingReminders
    .map((r) => `<system-reminder>${r}</system-reminder>`)
    .join("\n");
  pendingReminders = [];
  pendingBoundaryWakeup = false;
  return content ? `${prefix}\n${content}` : prefix;
}

/**
 * Push a user-role message, prefixing any queued reminders.
 * `attachments` is an optional list of `{type:'image'|'audio', blob, mime}` parts
 * produced by `decodeAttachmentDataUrl`. When present, the message content
 * becomes a multimodal array so the provider normalizer can carry the Blobs
 * through to OpenRouter (as base64 data URLs) or Built-in AI (as native Blobs).
 */
function pushUserMessage(content, attachments = []) {
  const wrapped = flushReminders(content);
  if (!wrapped && attachments.length === 0) return;
  if (attachments.length === 0) {
    persistentHistory.push({ role: "user", content: wrapped });
    return;
  }
  const parts = [];
  if (wrapped) parts.push({ type: "text", text: wrapped });
  for (const att of attachments) parts.push(att);
  persistentHistory.push({ role: "user", content: parts });
}

/**
 * Sidebar sends attachments as data URLs (JSON-safe over chrome.runtime).
 * Rebuild Blobs here.
 *
 * Only base64-encoded data URLs are supported — matches what FileReader
 * .readAsDataURL() produces. Percent-encoded text data URLs would need a
 * different decode path; we reject them rather than silently corrupt the
 * payload.
 */
function decodeAttachmentDataUrl(raw) {
  if (!raw || typeof raw.dataUrl !== "string") return null;
  // Must contain the ;base64 marker before the comma; otherwise we'd decode
  // percent-escapes as raw bytes and produce a garbage Blob.
  const match = raw.dataUrl.match(/^data:([^;,]+);base64,(.*)$/);
  if (!match) {
    console.warn("[AutoBrowser] Non-base64 data URL rejected for attachment");
    return null;
  }
  const mime = raw.mime || match[1] || "application/octet-stream";
  const body = match[2] || "";
  let bytes;
  try {
    const binary = atob(body);
    bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  } catch {
    return null;
  }
  const blob = new Blob([bytes], { type: mime });
  const kind = raw.kind === "audio" ? "audio" : "image";
  return { type: kind, blob, mime };
}

/** Push an assistant-role message. Symmetry helper with pushUserMessage. */
function pushAssistantMessage(content) {
  persistentHistory.push({ role: "assistant", content });
}

// V2 schema readers. Local copies of react-schema.js helpers — react-schema
// loads via the dynamic import path which is async, so for synchronous
// dispatch we duplicate the field reads here. Source of truth is still
// react-schema.js (the schema-shape contract).
function readDecisionLabel(decision) {
  if (!decision || typeof decision !== "object") return "";
  if (typeof decision.narration === "string" && decision.narration) return decision.narration;
  if (typeof decision.reasoning === "string" && decision.reasoning) return decision.reasoning;
  return "";
}
function readDecisionThought(decision) {
  if (!decision || typeof decision !== "object") return "";
  if (typeof decision.thought === "string") return decision.thought;
  return "";
}
const VALID_PHASES = new Set(["plan", "analyze", "act", "verify", "recover"]);
function readDecisionPhase(decision) {
  if (!decision || typeof decision !== "object") return null;
  if (typeof decision.phase !== "string") return null;
  return VALID_PHASES.has(decision.phase) ? decision.phase : null;
}

// Phase 2 — post-action validator wrapper. Pulled out of reactLoop so the
// loop body stays readable. Returns the verdict object or null when the
// validator should not run (read-only tool, errored mutation, feature flag
// off, modules failed to load).
//
// The validator NEVER dispatches a mutating action — it only reads. So the
// drift gate is unaffected and the per-tab single-in-flight LLM invariant
// holds as long as the validator's LLM call shares the parent AbortController
// (handled by fetchLLM's `caller:"validator"` branch).
async function runPostActionValidatorIfApplicable({
  decision,
  preState,
  toolMutated,
  resultIsError,
}) {
  // Feature flag — defaults to enabled. Users can disable by setting
  // `enableValidator: false` in chrome.storage.local for emergency rollback.
  if (config.enableValidator === false) return null;
  if (!toolMutated || resultIsError) return null;
  if (!decision || typeof decision.tool !== "string") return null;

  let mods;
  try {
    mods = await loadLLMModules();
  } catch {
    return null;
  }
  if (!mods.submitShape || !mods.validator) return null;

  const args = decision.args || {};
  const accessibleName =
    typeof args.uid === "string"
      ? mods.submitShape.accessibleNameForUid(lastSnapshotText, args.uid)
      : "";
  const isSubmit = mods.submitShape.isSubmitShaped(decision.tool, args, accessibleName);
  const selfFlagged = decision.verification_required === true;
  if (!isSubmit && !selfFlagged) return null;

  // Surface "validator is running" so the sidebar can show a sub-row under
  // the tool card. The verdict event below resolves it.
  sendStatus({ state: "validator_running", tool: decision.tool });

  const intent =
    readDecisionLabel(decision) ||
    `${decision.tool}(${Object.keys(args).join(",") || "—"})`;
  const expectedText =
    typeof args.expected_text === "string"
      ? args.expected_text
      : typeof args.expectedText === "string"
        ? args.expectedText
        : "";

  let verdict = null;
  try {
    verdict = await mods.validator.runValidator({
      intent,
      tool: decision.tool,
      args,
      preState,
      expectedText,
      deps: {
        now: () => ({ url: location.href, title: document.title }),
        waitForNetworkIdle: (input) =>
          handleWaitForNetworkIdle(input).catch(() => null),
        waitForText: (input) =>
          handleWaitForText(input).catch(() => null),
        readConsoleErrors: async () => {
          // Narrow to recent error/warning entries — the validator's LLM
          // call is bounded so we don't want a 200-entry dump.
          const res = await handleReadConsoleMessages({}).catch(() => null);
          if (!res || !Array.isArray(res.entries)) return [];
          const errs = res.entries
            .filter(
              (e) =>
                e &&
                typeof e.level === "string" &&
                /^(error|warning|severe)$/i.test(e.level),
            )
            .slice(-5)
            .map((e) =>
              typeof e.text === "string"
                ? e.text
                : Array.isArray(e.args) && e.args.length
                  ? e.args.map(String).join(" ")
                  : "",
            )
            .filter((s) => s.length > 0);
          return errs;
        },
        callLLM: async (messages) => {
          // Validator runs with thinking OFF so it returns a tight verdict
          // JSON without spending tokens on visible reasoning. The Navigator's
          // own thinking mode is unrelated.
          const validatorMode = { native: false, schemaThoughtRequested: false };
          return fetchLLM(messages, {
            schema: undefined,
            rawText: false,
            thinkingMode: validatorMode,
            caller: "validator",
          });
        },
      },
    });
  } catch (err) {
    console.warn("[AutoBrowser] Validator threw:", err);
    verdict = {
      verdict: "ambiguous",
      evidence: "Validator failed to complete — proceeding cautiously.",
      llmCalled: false,
    };
  }
  if (!verdict || typeof verdict.verdict !== "string") return null;

  sendStatus({
    state: "validator_verdict",
    tool: decision.tool,
    verdict: verdict.verdict,
    evidence: verdict.evidence || "",
    retry_hint: verdict.retry_hint || "",
  });
  return verdict;
}

// Phase 3 — one-shot recovery call before a terminal exit.
//
// Fired when the loop would otherwise bail silently (3-strike advisory,
// repeated validator-failed verdict, duplicate-spam). The Navigator gets
// ONE chance to either:
//
//   1. Propose 1-3 replan_steps that break the loop (returns to normal
//      "act" mode for up to Math.floor(MAX_STEPS/3) more steps), OR
//   2. Surrender with an abort_reason (terminal exit with the matching
//      EXIT_REASON + a user-facing banner).
//
// Respects the single-in-flight LLM invariant by using fetchLLM's
// `caller:"recovery"` branch — shares parent AbortController, suppresses
// stream noise, does NOT clobber the navigator's captured thought.
//
// Returns { replan_steps: string[] }              — loop continues
//      OR { abortReason: string }                 — terminal exit, caller
//                                                   picks matching EXIT_REASON
//      OR null                                     — LLM failure; caller falls
//                                                    back to its default exit.
// Delegates to the shared planRecovery (src/orchestration/recovery.js) so the
// CS loop and the relocated SW loop run identical build/parse logic. Returns the
// loop-shaped result { replanSteps } | { abortReason } | null.
async function runRecovery({ trigger }) {
  const { recovery } = await loadLLMModules();
  return recovery.planRecovery({ history: persistentHistory, trigger, fetchLLM });
}

// Re-feed the captured thought (whether from native channel or schema field)
// into the assistant turn so it survives into history. The thought is
// prepended as a `<thinking>...</thinking>` block before the JSON decision.
// Storage cap mirrors per-tab-state.js's THOUGHT_TEXT_CAP=5000 with a margin
// for the JSON decision body.
//
// PR #19 review fix — schema-thought duplication: in schema-thought mode the
// model emits `thought` inside the JSON decision AND fetchLLM mirrors it into
// `lastCallThoughtText` so the unified `<thinking>` prefix path can render it.
// If we then JSON.stringify the decision verbatim, the same text lands in
// history twice — once in the prefix, once inside the JSON. That doubles
// context growth and feeds the model the same chain-of-thought twice on the
// next turn. So: always strip `thought` from the JSON payload. The thoughtText
// argument (sourced upstream from either the native stream OR decision.thought)
// is the single canonical copy we re-feed.
const HISTORY_THOUGHT_CAP = 4000;
function persistAssistantTurn(decision, thoughtText) {
  // Shallow-copy + delete is safe: we only strip a top-level key, and no
  // downstream reader reads decision.thought after this point.
  const payload =
    decision && typeof decision === "object" && !Array.isArray(decision)
      ? { ...decision }
      : decision;
  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    delete payload.thought;
  }
  const json = JSON.stringify(payload);
  if (!thoughtText) {
    pushAssistantMessage(json);
    return;
  }
  let t = thoughtText;
  if (t.length > HISTORY_THOUGHT_CAP) {
    t = t.slice(0, HISTORY_THOUGHT_CAP) + "\n…[truncated]";
  }
  pushAssistantMessage(`<thinking>\n${t}\n</thinking>\n${json}`);
}

/** Flush any queued reminders as a standalone user message. No-op if empty. */
function flushPendingReminders() {
  if (pendingReminders.length === 0) return;
  pushUserMessage("");
}

async function getOrCreateWorkingMemory() {
  const { workingMemory } = await loadLLMModules();
  if (!derivedWorkingMemory) {
    derivedWorkingMemory = workingMemory.createWorkingMemory();
  }
  workingMemory.setUserGoal(derivedWorkingMemory, userInstruction || "");
  return { workingMemory, state: derivedWorkingMemory };
}

function resetWorkingMemory() {
  derivedWorkingMemory = null;
}

async function recordDerivedMemory(toolName, args, result, isError) {
  try {
    const { workingMemory, state } = await getOrCreateWorkingMemory();
    // Phase 3 — environment fingerprint fallback. When the tool's own result
    // has no positional / state-carrying fields (the common case on generic
    // web pages: click() returns {ok:true}), the working-memory state-key
    // falls back to URL + normalised a11y + WebMCP tool set. Without this,
    // recordActionAttempt can't tell "this is a new state" from "this is
    // the state I was already in" and the no-progress detector never fires
    // on stuck CDP submits.
    const environment = await buildEnvironmentFingerprint();
    workingMemory.recordToolUse(state, toolName, args, result, { isError, environment });
  } catch (err) {
    console.warn("[AutoBrowser] Failed to update derived working memory:", err);
  }
}

/**
 * Build the env fingerprint passed into recordToolUse. Reads URL + the
 * cached a11y snapshot text + current WebMCP tool names. Returns null when
 * the fingerprint module can't be loaded (fail-closed: working-memory
 * keeps its positional-only behaviour).
 */
async function buildEnvironmentFingerprint() {
  try {
    const mods = await loadLLMModules();
    if (!mods.stateFingerprint) return null;
    return mods.stateFingerprint.fingerprintEnvironment({
      url: location.href,
      a11ySnapshotText: lastSnapshotText,
      webmcpToolNames: currentWebMCPNames,
    });
  } catch {
    return null;
  }
}

async function getDerivedMemoryPrompt() {
  try {
    const { workingMemory, state } = await getOrCreateWorkingMemory();
    return workingMemory.formatWorkingMemoryForPrompt(state);
  } catch (err) {
    console.warn("[AutoBrowser] Failed to format derived working memory:", err);
    return "";
  }
}

async function getWorkingMemoryAdvisory(toolName, args) {
  try {
    const { workingMemory, state } = await getOrCreateWorkingMemory();
    return workingMemory.getWorkingMemoryAdvisory(state, toolName, args);
  } catch (err) {
    console.warn("[AutoBrowser] Failed to compute working-memory advisory:", err);
    return null;
  }
}

/**
 * Push a tool-result user message. Before appending, walk history backward and
 * supersede the most recent prior LARGE result from the same tool — replace
 * its content with a short marker. Keeps the most recent snapshot verbatim
 * (which is all the model needs) and prevents monotonic context bloat from
 * repeated read-only calls. Modeled on Claude Code's on-disk
 * tool-result-cleared pattern, adapted for in-memory.
 *
 * HEURISTIC, NOT GUARANTEE: the size threshold is a proxy for "snapshot-like,
 * safe to drop". Small results (confirmation messages, single IDs) stay
 * verbatim. Large results are assumed to be state snapshots that a later call
 * will refresh. If you add a tool that returns LARGE but non-idempotent data
 * (e.g. a one-time secret), it would be unsafe under this heuristic — either
 * mark the tool with `idempotent: false` (future extension) or keep its
 * payload small.
 *
 * Early-outs after the first match: there can only be one un-superseded prior
 * result at a time, because this walk runs on every push.
 */
/**
 * Extract the text component of a history message's content. Handles both
 * string content (legacy tool-result messages) and multimodal array content
 * (user messages carrying image / audio attachments + a text part).
 */
function toolResultText(msg) {
  if (typeof msg.content === "string") return msg.content;
  if (Array.isArray(msg.content)) {
    const part = msg.content.find((p) => p.type === "text");
    return part?.text || "";
  }
  return "";
}

function hasAttachment(msg) {
  return Array.isArray(msg.content) && msg.content.some((p) => p.type === "image" || p.type === "audio");
}

function pushToolResult(toolName, result) {
  // Split off the multimodal side-channel (take_screenshot populates __image).
  // The text-history path never sees the raw blob; the LLM gets vision input
  // via a multimodal content part alongside the text summary.
  let attachments = [];
  let textResult = result;
  if (result && typeof result === "object" && result.__image) {
    const { __image, ...rest } = result;
    if (__image && __image.blob) attachments = [__image];
    textResult = rest;
  }

  let resultJson;
  // JSON.stringify can throw on circular refs or BigInt. Fall back to a marker
  // so a malformed result doesn't kill the whole turn.
  try {
    resultJson = JSON.stringify(textResult);
  } catch (e) {
    resultJson = `"[unserializable result: ${e?.message || "unknown"}]"`;
  }
  const prefix = `Tool "${toolName}" returned: `;
  const marker = `${prefix}[superseded by a newer call]`;
  // Walk backwards and supersede the most recent un-superseded result for
  // this tool. Works for BOTH string-content legacy messages and multimodal
  // array-content messages (take_screenshot carries an image attachment).
  // Without the array-content branch, image attachments accumulated forever
  // and rode along on every subsequent turn as vision input.
  for (let i = persistentHistory.length - 1; i >= 0; i--) {
    const m = persistentHistory[i];
    if (m.role !== "user") continue;
    const text = toolResultText(m);
    if (!text || text.endsWith(marker)) continue;
    const idx = text.indexOf(prefix);
    if (idx < 0) continue;
    const resultLen = text.length - idx;
    // Supersede when the prior result was large enough to matter OR it
    // carried a multimodal attachment — screenshot metadata alone is tiny
    // but the image part is heavy and must not accumulate.
    if (resultLen <= SUPERSEDABLE_SIZE_CHARS && !hasAttachment(m)) continue;
    // Collapse back to a plain-string marker, preserving anything BEFORE
    // the prefix (e.g. queued reminders). Attachments are dropped.
    m.content = text.slice(0, idx) + marker;
    break;
  }
  pushUserMessage(prefix + resultJson, attachments);
}

// ── Page-world helper ─────────────────────────────────────────
// page-helper.js runs in the MAIN world via the manifest's
// "content_scripts" entry (world: "MAIN", run_at: document_start) — a
// chrome-extension:// <script src=...> append would be blocked by strict
// page CSP. Re-injection after a service-worker restart is covered by
// background.js' ensureContentScript(), which uses chrome.scripting with
// { world: "MAIN" } (also CSP-exempt). No runtime glue required here.

// ── Context-invalidation reminder (generic) ──────────────────
// Any WebMCP-enabled page can dispatch this event to tell the agent that
// a logical context boundary was crossed (new page, new document, new
// game hand, new chat session, etc). The page supplies the reminder
// text — the extension is domain-agnostic and just forwards it.
//
// detail: { reason: string, reminder: string, boundary?: boolean }
//
// `boundary: true` (or any reason ending in `_changed`) signals that all
// prior `<system-reminder>` blocks in history are about a now-stale context
// and should be swept. This prevents the multi-hand reminder accumulation
// pattern observed in long sessions: each hand boundary adds 2-3 reminders,
// none of which get cleaned up, so by hand 30+ the prompt is mostly stale
// "Hand X ended", "Page tool set changed", etc. messages from hands the
// agent already moved past.
document.addEventListener("webmcp:context-invalidated", (e) => {
  const detail = e?.detail || {};
  const reminder = typeof detail.reminder === "string" ? detail.reminder.trim() : "";
  if (!reminder) return;
  // Only queue if the agent has history to invalidate; fresh sessions don't
  // need a reminder for state they never saw.
  if (persistentHistory.length === 0) return;
  // Sweep BEFORE queueing the new reminder. `pendingReminders` is a separate
  // queue, so the just-arrived reminder is safe — we only touch already-pushed
  // history. Treat any `*_changed` reason as a boundary by convention; explicit
  // `boundary: true` works too for non-poker pages adopting the same event.
  const reason = typeof detail.reason === "string" ? detail.reason : "";
  const isBoundary = detail.boundary === true || reason.endsWith("_changed");
  if (isBoundary) {
    sweepStaleReminders();
    // Logical-context change (new hand, new doc, new session) almost always
    // reshuffles the DOM. Stale {uid, seal} pairs from before the boundary
    // must not survive the wakeup — without this, the agent could re-use an
    // old ref_N against elements that no longer exist or have different
    // semantics.
    invalidateSnapshot(`boundary:${reason || "context_invalidated"}`);
    // Force a reactLoop trigger on this boundary even if tool-set diff is
    // empty. Without this, "new hand started" reminders are silently dropped
    // when the new hand registers the same action tools as the prior one
    // (the most common preflop-fold case heads-up). Scoped to `_changed`
    // boundaries: informational events like `hand_resolved` ride along with
    // the next real trigger as before, so we don't pay an extra LLM call
    // for events the agent doesn't need to act on.
    pendingBoundaryWakeup = true;
  }
  queueReminder(reminder);
  console.log("[WebMCP] Context invalidated (" + (reason || "unknown") + ") — reminder queued" + (isBoundary ? " (boundary wakeup armed)" : ""));
});

/**
 * Strip every `<system-reminder>...</system-reminder>` block from prior user
 * messages in `persistentHistory`. Called at logical-context boundaries (new
 * hand, new page, new chat session) when accumulated reminders no longer
 * carry useful signal.
 *
 * Why: reminders are about *transient* environment state at the moment they
 * fired ("Hand X ended", "Page tool set changed (new: ...)"). Once a boundary
 * crosses, every prior reminder is noise: the LLM re-reads them on every
 * subsequent call, paying input tokens for state it can't act on. A 30-hand
 * session was accumulating 35+ blocks (~6-10K chars) of pure stale noise.
 *
 * Preserves any non-reminder content (tool results, user messages) in the
 * same message — only the wrapped blocks are removed. Empty messages get a
 * short marker rather than being deleted so role-alternation isn't disturbed.
 */
function sweepStaleReminders() {
  const rx = /<system-reminder>[\s\S]*?<\/system-reminder>\n?/g;
  let stripped = 0;
  for (const m of persistentHistory) {
    if (m.role !== "user" || typeof m.content !== "string") continue;
    if (!m.content.includes("<system-reminder>")) continue;
    const cleaned = m.content.replace(rx, "").trim();
    if (cleaned !== m.content) {
      m.content = cleaned || "[prior reminders cleared at context boundary]";
      stripped++;
    }
  }
  if (stripped > 0) {
    console.log(`[WebMCP] Swept stale reminders from ${stripped} prior messages`);
  }
}

// ── WebMCP abstraction (via CustomEvent to page helper) ──────

// Live set of WebMCP tool names discovered on the current page. Updated on
// every discoverTools() resolution so executeTool() can route WebMCP names
// to the page bridge before the CDP if-chain, even when a WebMCP tool
// shadows a built-in (e.g. a page exposing its own `fill_form`).
let currentWebMCPNames = new Set();

// Build a stable signature of the WebMCP tool surface for poll-time
// change detection. Reads `currentWebMCPNames` (the post-merge truth
// including legit collisions) rather than the old "not a built-in name"
// heuristic, which silently misclassified collision-only pages as
// non-WebMCP — see PR #10 review F2.
function currentWebMCPToolKey(tools) {
  return tools
    .filter((t) => currentWebMCPNames.has(t.name))
    .map((t) => t.name)
    .sort()
    .join(",");
}

async function discoverTools() {
  // Load the pure merge helper from src/llm/tool-prefs.js. WebMCP wins on
  // name collision — see that module's docstring.
  const { toolPrefs } = await loadLLMModules();
  const { mergeWebMCPWithBuiltins } = toolPrefs;

  return new Promise((resolve) => {
    // Single-settle gate — the 500ms fallback timer must not fire after a
    // successful page-helper response, or it would clobber the authoritative
    // `currentWebMCPNames` back to an empty set mid-turn (PR #10 review F1b).
    let settled = false;
    let timer;
    const finish = (tools, webmcpNames = new Set()) => {
      if (settled) return;
      settled = true;
      if (timer) clearTimeout(timer);
      document.removeEventListener("__autobrowser_tools", handler);
      currentWebMCPNames = webmcpNames;
      resolve(tools);
    };
    const handler = (e) => {
      try {
        const webmcpTools = JSON.parse(e.detail);
        const { merged, webmcpNames } = mergeWebMCPWithBuiltins(
          webmcpTools,
          EXTENSION_TOOLS,
        );
        finish(merged, webmcpNames);
      } catch {
        finish([...EXTENSION_TOOLS]);
      }
    };
    document.addEventListener("__autobrowser_tools", handler);
    document.dispatchEvent(new CustomEvent("__autobrowser_discover"));
    timer = setTimeout(() => {
      finish([...EXTENSION_TOOLS]);
    }, 500);
  });
}

let execIdCounter = 0;

function executeTool(name, input = {}) {
  // WebMCP-first routing: if the current page has claimed this name via
  // its modelContext, forward to the page bridge regardless of whether
  // a same-named built-in exists. Mirrors the prompt's DECISION ORDER and
  // makes the Layer-3 collision rule observable at runtime.
  if (currentWebMCPNames.has(name)) {
    return forwardToWebMCP(name, input);
  }

  // Handle extension-only tools locally
  if (name === "ask_user") {
    // Filter to options with a real string label — drop malformed entries
    // so the sidebar never renders a "null" or empty button.
    let options;
    if (Array.isArray(input.options)) {
      options = input.options
        .filter((o) => o && typeof o.label === "string" && o.label.trim().length > 0)
        .map((o) => ({
          label: o.label.trim(),
          ...(typeof o.description === "string" && o.description.trim()
            ? { description: o.description.trim() }
            : {}),
        }));
      if (options.length === 0) options = undefined;
    }
    return askUser({
      question: input.question || "What would you like to do?",
      options,
      allow_free_text: input.allow_free_text,
    }).then((answer) => ({ answer }));
  }
  if (name === "ask_user_form") {
    // Validate + sanitize fields. Drop malformed entries so the sidebar
    // never renders a broken input; if nothing valid remains, return an
    // error so the agent sees the failure and can self-correct rather than
    // hanging forever waiting for an answer to a form with no inputs.
    // Keep aligned with the docstring example below and the renderForm
    // taxonomy in sidebar.js. All values are valid HTML5 input types (or
    // `textarea`/`select`), passed through to the DOM unchanged.
    const ALLOWED_TYPES = new Set([
      "text", "textarea", "email", "tel", "url", "password",
      "number", "date", "time", "select",
    ]);
    const fields = Array.isArray(input.fields) ? input.fields : [];
    const cleanFields = fields
      .filter((f) =>
        f && typeof f.id === "string" && f.id.trim() &&
        typeof f.label === "string" && f.label.trim() &&
        typeof f.type === "string" && ALLOWED_TYPES.has(f.type),
      )
      .map((f) => ({
        id: f.id.trim(),
        label: f.label.trim(),
        type: f.type,
        required: !!f.required,
        ...(f.type === "select" && Array.isArray(f.options)
          ? { options: f.options.filter((o) => typeof o === "string" && o.trim()).map((o) => o.trim()) }
          : {}),
        ...(typeof f.placeholder === "string" ? { placeholder: f.placeholder } : {}),
        ...(f.default !== undefined ? { default: f.default } : {}),
      }));
    if (cleanFields.length === 0) {
      return Promise.resolve({
        error: "ask_user_form requires at least one valid field with id, label, and a supported type.",
      });
    }
    return askUserForm({
      title: typeof input.title === "string" ? input.title.trim() : "",
      fields: cleanFields,
    }).then((answer) => {
      // askUserForm resolves with an OBJECT on successful submit, but falls
      // back to a STRING on timeout / closed sidebar / cancel. Surface the
      // fallback as a named error rather than masquerading a string as a
      // `values` map — otherwise the agent gets `{values: "(no answer...)"}`
      // and tries to index fields on a string.
      if (typeof answer === "string") return { error: answer };
      if (!answer || typeof answer !== "object") {
        return { error: "ask_user_form received an unexpected answer shape" };
      }
      return { values: answer };
    });
  }
  if (name === "set_poll_interval") {
    const ms = Math.max(200, Math.min(10000, input.interval_ms || DEFAULT_POLL_MS));
    pollIntervalMs = ms;
    console.log(`[WebMCP] Poll interval set to ${ms}ms`);
    if (pollTimer) { stopPolling(); startPolling(); }
    return Promise.resolve({ interval_ms: ms });
  }

  // ── Phase 1 perception + pixel-coord action tools ──────────
  if (name === "take_snapshot")     return handleTakeSnapshot(input);
  if (name === "take_screenshot")   return handleTakeScreenshot(input);
  if (name === "get_page_text")     return handleGetPageText(input);
  if (name === "get_element_info")  return handleGetElementInfo(input);
  if (name === "find")              return handleFind(input);
  if (name === "computer")          return handleComputer(input);

  // ── Phase 2 uid-based mutating tools (dispatcher-backed) ───
  if (name === "click")      return handleUidAction("click", input);
  if (name === "hover")      return handleUidAction("hover", input);
  if (name === "fill")       return handleUidAction("fill", input);
  if (name === "fill_form")  return handleUidAction("fill_form", input);
  if (name === "press_key")  return handleUidAction("press_key", input);
  if (name === "scroll")     return handleUidAction("scroll", input);
  if (name === "drag")       return handleUidAction("drag", input);

  // ── Phase 3 navigation, waits, network/console, evaluate ───
  if (name === "navigate")              return handleNavAction("navigate", input);
  // Tab tools run in the service worker (they need chrome.tabs/tabGroups). In SW
  // mode the host intercepts them before EXECUTE_TOOL, so this only fires on the
  // content-script loop — return a clear error instead of a WebMCP miss.
  if (name === "open_tab" || name === "list_tabs" || name === "switch_focus" || name === "close_tab") {
    return Promise.resolve({ error: "Tab tools require the multi-tab service-worker agent, which isn't active for this tab." });
  }
  if (name === "go_back")               return handleNavAction("go_back", input);
  if (name === "go_forward")            return handleNavAction("go_forward", input);
  if (name === "reload")                return handleNavAction("reload", input);
  if (name === "wait_for")              return handleWaitForText(input);
  if (name === "wait_for_network_idle") return handleWaitForNetworkIdle(input);
  if (name === "list_network_requests") return handleListNetworkRequests(input);
  if (name === "get_network_request")   return handleGetNetworkRequest(input);
  if (name === "read_console_messages") return handleReadConsoleMessages(input);
  if (name === "evaluate_script")       return handleEvaluateScript(input);

  // ── Phase 4 emulation + dialog handling ────────────────────
  if (name === "set_viewport")          return handleSetViewport(input);
  if (name === "set_user_agent")        return handleSetUserAgent(input);
  if (name === "clear_emulation")       return handleClearEmulation(input);
  if (name === "handle_dialog")         return handleDialogAction(input);

  // Unknown tool name — the model called something that isn't in the merged
  // tool list. Fall through to the WebMCP bridge as a last resort so a
  // slow-to-register tool name still reaches the page; the bridge will
  // surface a clear error if the page doesn't recognise it either.
  return forwardToWebMCP(name, input);
}

// Forward a tool call to the page's modelContext (document.modelContext,
// navigator fallback) via the MAIN-world page-helper bridge. Used for
// (a) every WebMCP tool, and
// (b) unknown names as a safety fallback.
//
// Tab-focus gate (entry only): WebMCP tools run in the page's MAIN
// world, which is subject to Chrome's background-tab throttling (JS
// callback budget collapses to ~1/min when the tab is hidden). The 30 s
// generic-timeout below would still fire under throttling, but only
// after the user has waited 30 s for an opaque "execution timed out"
// error. Fail fast with a specific message when the tab is hidden at
// *call time* — we know nothing has dispatched yet, so nothing could
// have committed. Mid-flight visibility changes are NOT treated as
// failures: once __autobrowser_execute has dispatched, the page tool
// may already have fired a mutating network request, and rejecting on
// visibilitychange would surface a hard error that tricks the ReAct
// loop into retrying a mutation that already committed (PR #17 C7
// review). If the tool never responds, the 30 s timeout still fires,
// and its message picks up a tab-focus hint if the tab is hidden at
// that moment.
//
// CDP-backed tools are unaffected — they run through chrome.debugger
// from the service worker and aren't tab-focus-bound. See §6
// "Fail-fast on hidden tab for WebMCP tools" for the decision record.
const HIDDEN_TAB_ERROR = (name) =>
  `WebMCP tool "${name}" can't run while the tab isn't focused — ` +
  `Chrome throttles background-tab JS, which prevents the page's tool ` +
  `handler from completing. Focus the tab and try again.`;

function forwardToWebMCP(name, input) {
  if (document.hidden) {
    return Promise.reject(new Error(HIDDEN_TAB_ERROR(name)));
  }
  return new Promise((resolve, reject) => {
    const id = ++execIdCounter;
    console.log(`[AutoBrowser] forwardToWebMCP("${name}",`, input, `)`);

    let settled = false;
    const settle = (action) => {
      if (settled) return;
      settled = true;
      document.removeEventListener("__autobrowser_result", handler);
      clearTimeout(timer);
      action();
    };

    const handler = (e) => {
      const data = JSON.parse(e.detail);
      if (data.id !== id) return;
      if (data.error) {
        settle(() => reject(new Error(data.error)));
      } else {
        settle(() => resolve(parseToolResult(data.result)));
      }
    };

    const timer = setTimeout(() => {
      // By the time 30 s has elapsed, the tool has almost certainly
      // failed to progress; if the tab is currently hidden, surface
      // that as the likely cause rather than leaving the agent with a
      // generic timeout. Safe to check here (unlike mid-flight) because
      // we've already waited long enough that a successful-but-pending
      // commit is vanishingly unlikely.
      const reason = document.hidden
        ? `Tool "${name}" execution timed out — tab has been unfocused. ` +
          `Chrome throttles background-tab JS; focus the tab and retry.`
        : `Tool "${name}" execution timed out`;
      settle(() => reject(new Error(reason)));
    }, 30000);

    document.addEventListener("__autobrowser_result", handler);
    document.dispatchEvent(
      new CustomEvent("__autobrowser_execute", {
        detail: JSON.stringify({ id, name, input }),
      }),
    );
  });
}

function parseToolResult(raw) {
  if (raw && typeof raw === "object" && Array.isArray(raw.content)) {
    const textEntry = raw.content.find((c) => c.type === "text");
    if (textEntry?.text) {
      try {
        return JSON.parse(textEntry.text);
      } catch {
        return textEntry.text;
      }
    }
    return raw;
  }
  return raw;
}

// ── Perception + action handlers (Phase 1 CDP toolkit) ──────
// These are the uid-based replacements for the older selector-based DOM
// helpers below. The selector-based versions stay alongside during Phase 1
// as a working fallback and retire in Phase 2 when the CDP-based action
// dispatcher lands.

/**
 * Ensure perception + safety modules are loaded and the per-turn refmap
 * exists. Callers that don't run inside a user turn still get a valid map
 * (a fresh one is created lazily).
 */
async function ensurePerceptionReady() {
  const mods = await loadPerceptionModules();
  if (!perTurnRefmap) {
    perTurnRefmap = mods.refmap.createRefmap();
  }
  return mods;
}

/**
 * Reset per-turn perception state. Called on USER_MESSAGE and on hard page
 * navigations so the LLM's ref_N references don't resolve to elements from a
 * previous turn (stale-pointer safety).
 */
function resetPerTurnState(reason = "reset") {
  lastSnapshotText = "";
  perTurnGrants = new Map();
  perTurnDomainGrants = new Set();
  perTurnScriptGrants = new Set();
  if (perTurnRefmap) {
    perTurnRefmap.bumpSeal({ reason, url: location.href });
  }
}

/**
 * Drop the cached snapshot and rotate the refmap seal. Any prior
 * `{uid, seal}` the agent held becomes instantly invalid — the next
 * get_element_info / find / element-targeted call fails the seal check
 * deterministically with an instructional error.
 *
 * Called from three kinds of boundaries:
 *   1. Reactloop post-tool path on every successful non-read-only tool —
 *      the action mutated the page, so the prior snapshot is stale.
 *   2. WebMCP context-invalidated events when `boundary: true` or a
 *      `*_changed` reason arrives — the page signaled a logical
 *      discontinuity (new hand, new doc, new session).
 *   3. pollForChanges env drift (toolset change on WebMCP pages, page
 *      signature change on non-WebMCP pages) — environment-driven
 *      wakeups where the DOM shifted without the agent acting.
 *
 * Grants are intentionally NOT reset here — they're scoped to the whole
 * turn, not per-mutation. resetPerTurnState (called on USER_MESSAGE) owns
 * that lifecycle.
 */
function invalidateSnapshot(reason) {
  lastSnapshotText = "";
  if (perTurnRefmap) {
    perTurnRefmap.bumpSeal({ reason, url: location.href });
  }
}

async function handleTakeSnapshot(input = {}) {
  let mods;
  let snapshotResult;
  // Kept out of the try so the Phase 2.4 overlay path can read refs
  // after the try commits. We don't push them further up — res.refs
  // stays a local so callers can't depend on it.
  let snapshotRefs = [];
  try {
    mods = await ensurePerceptionReady();
    const filter = input.filter || "interactive";
    const depth = Number.isFinite(input.depth) ? input.depth : 30;
    const maxChars = Number.isFinite(input.max_chars) ? input.max_chars : 8000;
    // Phase 2.3 — pagination cursor. `offset` skips the first N
    // emittable refs; walker returns `next_offset` to resume. Each
    // paginated call is still a fresh seal (simpler lifecycle than
    // cross-page seal continuity) — the scan-then-act workflow is
    // paginate through, remember labels, then take one targeted
    // snapshot to act on. Agents that reference a ref from a prior
    // page get the existing stale-seal error with instructions.
    const offset = Number.isFinite(input.offset) && input.offset > 0 ? Math.floor(input.offset) : 0;
    // Rotate the seal on every snapshot. Uid numbering restarts at 1 each
    // snapshot, BUT uids are now version-qualified (`ref_{version}_{n}`) so
    // a stale `ref_1_3` from an earlier snapshot can never collide with the
    // new snapshot's `ref_2_3` — the version segment is a hard isolation
    // layer at the map-key level, independent of the seal check.
    //
    // Clear the cached snapshot text BEFORE rotation so that if the walker
    // throws, find() and get_element_info() don't diverge (one would see the
    // old text, the other the fresh empty refmap). Restore on success.
    lastSnapshotText = "";
    const { version } = perTurnRefmap.bumpSeal({ reason: "snapshot", url: location.href });
    // Phase 2.1b — thread per-element hit testing into the walker
    // for occlusion filtering. `config.filterOccluded` (default true)
    // gates the whole path; if off, the walker ignores the impl and
    // emits every ref.
    //
    // PR #40 F1 — the impl MUST resolve to each element's correct
    // coordinate-space authority. THREE boundary types matter:
    //   - Top document: top `document.elementFromPoint`
    //   - Same-origin iframe: that iframe's `Document.elementFromPoint`
    //     (iframe-local bbox coords don't match top-viewport coords)
    //   - Open shadow root: `shadowRoot.elementFromPoint` (top-doc
    //     hit tests return the shadow host, not the inner element)
    // `element.getRootNode()` returns the right root for all three —
    // the universal `DocumentOrShadowRoot`. Centralized in
    // `coords.js::hitTestRootFor` so this rule lives in one place
    // alongside the other coord-space helpers.
    const filterOccluded = config.filterOccluded !== false;
    const elementFromPoint = filterOccluded
      ? (x, y, element) => mods.coords.hitTestRootFor(element)?.elementFromPoint?.(x, y) ?? null
      : undefined;
    const res = mods.snapshot.takeSnapshot(document.body, {
      filter, depth, maxChars, version, offset,
      filterOccluded,
      elementFromPoint,
    });
    // PR #38 F1 — page_overflow: the walker found an emittable
    // element whose line doesn't fit in max_chars. The walker already
    // returned next_offset=null to break any pagination loop; here we
    // translate to a loud, actionable error so the agent sees WHY
    // the page is empty and what to do. Return early BEFORE allocating
    // refs (nothing to allocate) but accept the seal bump — the agent
    // will re-call with a bigger max_chars and get a fresh seal
    // regardless, same as any other take_snapshot error.
    if (res.page_overflow) {
      return {
        error: `take_snapshot: max_chars=${maxChars} is too small to fit the first line on this page (offset=${offset}). Raise max_chars (default is 8000; snapshot lines are typically 50-120 chars).`,
      };
    }
    for (const ref of res.refs) perTurnRefmap.allocate(ref.uid, ref.element);
    lastSnapshotText = res.text;
    snapshotRefs = res.refs;
    snapshotResult = {
      seal: perTurnRefmap.currentSeal(),
      // Phase 4.1 — positional context for the agent. Saves a
      // permission-gated `evaluate_script("location.href")` round-trip
      // and catches navigation drift early ("I thought I was on
      // /checkout but the URL says /login").
      url: res.url,
      title: res.title,
      text: res.text,
      truncated: res.truncated,
      count: res.refs.length,
      next_offset: res.next_offset,
    };
  } catch (err) {
    lastSnapshotText = "";
    return { error: `take_snapshot: ${err.message}` };
  }

  // Phase 1.2 — pair the snapshot with a JPEG viewport when the agent
  // opts in (`input.include_screenshot: true`). Default is text-only
  // because take_snapshot fires on most ReAct turns — orientation +
  // WebMCP gap-filling — so always-pair would add ~1500 image tokens to
  // nearly every turn and kill the token-efficiency pitch. System-level
  // `config.screenshotInPrompt: false` hard-blocks the opt-in for
  // privacy / cost-cap contexts. Trigger policy + pure merge live in
  // `src/perception/attach-screenshot.js`.
  if (!mods.attach.shouldAttachScreenshot({ input, config })) return snapshotResult;

  try {
    // Phase 2.4 — build numbered-overlay draw list from the snapshot's
    // refs so the service worker can paint short ordinal labels ("5",
    // "12", …) on top of the captured image. The model then sees the
    // same ordinal in BOTH the snapshot text (`ref_1_5 button …`) and
    // on the pixel view, collapsing visual disambiguation from "find
    // the button by color/position" to "find the 5". Bbox extraction
    // is content-script work (DOM-bound); layout math + rendering
    // happen in the SW after capture.
    //
    // Scale factor: CDP Page.captureScreenshot captures at the tab's
    // device-pixel-ratio, and getBoundingClientRect returns CSS
    // pixels, so the viewport-to-image mapping is devicePixelRatio.
    // (If we ever add post-capture downscale we'd multiply that in,
    // but the current flow returns bytes at DPR directly.)
    const overlays = mods.overlay.bboxesForRefs(snapshotRefs);
    const viewport = { width: window.innerWidth, height: window.innerHeight };
    const scale = window.devicePixelRatio || 1;
    const screenshotResult = await handleTakeScreenshot({
      format: "jpeg",
      quality: 60,
      overlays,
      viewport,
      scale,
    });
    return mods.attach.attachScreenshotToSnapshot(snapshotResult, screenshotResult);
  } catch {
    // Any failure in the screenshot path degrades silently to text-only
    // snapshot — the text result is the primary payload.
    return snapshotResult;
  }
}

async function handleGetElementInfo(input = {}) {
  try {
    await ensurePerceptionReady();
    const uid = input.uid;
    if (typeof uid !== "string") {
      return { error: "get_element_info: 'uid' is required. Call take_snapshot first." };
    }
    // The refmap restarts uids at ref_1 on every snapshot, so a stale uid can
    // silently resolve to a DIFFERENT element after a later take_snapshot.
    // The seal closes that gap: it changes every turn and every bumpSeal, so
    // a uid+seal pair is only valid for the snapshot it came from.
    const currentSeal = perTurnRefmap.currentSeal();
    if (typeof input.seal !== "string" || input.seal !== currentSeal) {
      return {
        error: `get_element_info: seal mismatch for ${uid}. Call take_snapshot again and pass the new seal.`,
      };
    }
    const el = perTurnRefmap.get(uid);
    if (!el) {
      return { error: `get_element_info: ${uid} is stale or unknown. Call take_snapshot again.` };
    }
    const rect = el.getBoundingClientRect ? el.getBoundingClientRect() : null;
    const styles = el.ownerDocument?.defaultView?.getComputedStyle
      ? el.ownerDocument.defaultView.getComputedStyle(el)
      : null;
    const attrs = {};
    if (el.attributes) {
      for (const attr of el.attributes) {
        if (attr.name === "value") continue; // secret/PII safety
        attrs[attr.name] = attr.value?.slice?.(0, 100) ?? "";
      }
    }
    return {
      uid,
      tag: el.tagName?.toLowerCase(),
      text: (el.innerText || el.textContent || "").slice(0, 200),
      attributes: attrs,
      visible: rect
        ? rect.width > 0 && rect.height > 0 &&
          (!styles || (styles.display !== "none" && styles.visibility !== "hidden"))
        : undefined,
      position: rect
        ? { top: Math.round(rect.top), left: Math.round(rect.left), width: Math.round(rect.width), height: Math.round(rect.height) }
        : undefined,
      children: el.children?.length ?? 0,
      valuePresent: el.value ? true : undefined,
    };
  } catch (err) {
    return { error: `get_element_info: ${err.message}` };
  }
}

async function handleFind(input = {}) {
  try {
    const mods = await loadPerceptionModules();
    if (!lastSnapshotText) {
      return { error: "find: no snapshot available. Call take_snapshot first." };
    }
    const description = typeof input.description === "string" ? input.description : "";
    const limit = Number.isFinite(input.limit) ? input.limit : 5;
    // Return the current seal alongside matches so the agent always has a
    // fresh anchor when calling get_element_info / (Phase 2) click / etc.
    // Find's uids are always bound to the most recent snapshot, so this seal
    // is authoritative at the moment of the return.
    return {
      seal: perTurnRefmap ? perTurnRefmap.currentSeal() : null,
      matches: mods.find.find(lastSnapshotText, description, { limit }),
    };
  } catch (err) {
    return { error: `find: ${err.message}` };
  }
}

/**
 * Read the page (or a sub-selector) as Markdown (or plain text) with NO cap.
 * Mirrors domGetPageContent's extraction logic but skips the 4000-char
 * truncation so the caller can paginate over the true total. Returns the
 * raw full string; pagination happens one layer up.
 */
function readFullPageText(selector) {
  const el = selector ? document.querySelector(selector) : document.body;
  if (!el) return { error: `No element found for selector: ${selector}` };
  let text;
  let format;
  if (turndownService) {
    const clone = el.cloneNode(true);
    clone.querySelectorAll("[hidden], [aria-hidden='true'], .sr-only").forEach((e) => e.remove());
    text = turndownService.turndown(clone.innerHTML);
    format = "markdown";
  } else {
    text = el.innerText || el.textContent || "";
    format = "text";
  }
  return { url: location.href, title: document.title, content: text, format };
}

async function handleGetPageText(input = {}) {
  try {
    const base = readFullPageText(input.selector);
    if (base.error) return base;
    const full = base.content || "";
    const offset = Number.isFinite(input.offset) ? Math.max(0, Math.floor(input.offset)) : 0;
    const head = Number.isFinite(input.head_limit) ? Math.max(1, Math.floor(input.head_limit)) : null;
    let slice = full.slice(offset);
    const truncated = head != null && slice.length > head;
    if (truncated) slice = slice.slice(0, head);
    return {
      url: base.url,
      title: base.title,
      format: base.format,
      text: slice,
      offset,
      length: slice.length,
      total: full.length,
      truncated,
    };
  } catch (err) {
    return { error: `get_page_text: ${err.message}` };
  }
}

/**
 * Decode a base64 string into a Blob. Mirrors decodeAttachmentDataUrl but
 * for pre-split inputs (CDP returns the body without the data:…;base64, prefix).
 * Returns null on decode failure so the caller can emit a structured error.
 */
function base64ToBlob(base64, mime) {
  try {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new Blob([bytes], { type: mime });
  } catch {
    return null;
  }
}

/**
 * Screenshot tool. Routes the base64 PNG through the multimodal side-channel
 * (`__image`) rather than serializing it into tool-result text: downstream
 * pushToolResult converts `__image` into an image content part on the
 * assistant's next user message, so the LLM sees vision input instead of a
 * 50+ KB base64 blob in its text context.
 */
function handleTakeScreenshot(input = {}) {
  // Single-settle gate mirrors the pattern in `discoverTools()`: the 15s
  // defensive timer must be cleared on success, or every screenshot leaves
  // a zombie timer alive for 15s. No correctness impact (Promise ignores
  // late resolve calls) but on hot paths like Phase 1.2's
  // `include_screenshot:true` turns it piles up timer closures and
  // wakeups.
  return new Promise((resolve) => {
    let settled = false;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(value);
    };
    const timer = setTimeout(
      () => finish({ error: "take_screenshot: request timed out" }),
      15000,
    );

    try {
      chrome.runtime.sendMessage(
        { type: "TAKE_SCREENSHOT", payload: input || {} },
        (response) => {
          if (chrome.runtime.lastError) {
            finish({ error: `take_screenshot: ${chrome.runtime.lastError.message}` });
            return;
          }
          if (!response || response.error) {
            finish(response || { error: "take_screenshot: empty response" });
            return;
          }
          const format = response.format || "png";
          const mime = format === "jpeg" ? "image/jpeg" : `image/${format}`;
          const blob = base64ToBlob(response.data || "", mime);
          if (!blob) {
            finish({ error: "take_screenshot: failed to decode returned data" });
            return;
          }
          finish({
            captured: true,
            format,
            mime,
            size_bytes: blob.size,
            __image: { type: "image", blob, mime },
          });
        },
      );
    } catch (err) {
      finish({ error: `take_screenshot: ${err.message}` });
    }
  });
}

/**
 * Upgrade an "ask" decision to "allow" when "Auto-approve this task" is armed.
 *
 * Safety invariant: only ever upgrades "ask" → "allow". A "deny" (blocklist) is
 * returned untouched, and ALWAYS_ASK_TOOLS (evaluate_script) keep asking
 * regardless of the flag — the user opted into skipping routine confirmations,
 * not into bypassing safety vetoes. Applied at every mutating-action gate.
 */
function applyTurnAutoApprove(decision, tool, mods) {
  if (
    perTurnAutoApprove &&
    decision === "ask" &&
    !mods.permission.ALWAYS_ASK_TOOLS.has(tool)
  ) {
    return "allow";
  }
  return decision;
}

/**
 * Minimal permission gate for `computer`. Runs the pure decide() matrix and,
 * on "ask", surfaces a confirmation through the existing askUser modal.
 *
 * Returns { allow: true } | { allow: false, error }.  Phase 2 replaces the
 * askUser fallback with a dedicated approval chip UI and adds per-domain
 * "Allow for this site" grants; for v1 we only grant per toolUseId (once).
 */
async function gateComputerAction(toolUseId, params) {
  try {
    const mods = await loadPerceptionModules();
    const domain = location.hostname;

    // Turn-scoped domain grant short-circuits decide() entirely — the user
    // already said "yes to computer on this domain for the rest of this
    // turn" and we honor that without generating a new prompt.
    if (perTurnDomainGrants.has(domain)) return { allow: true };

    const policy = await mods.policy.getPolicy();
    const ctx = { domain, toolUseId, policy, grants: perTurnGrants };
    const decision = applyTurnAutoApprove(
      mods.permission.decide("computer", params, ctx),
      "computer",
      mods,
    );
    if (decision === "allow") return { allow: true };
    if (decision === "deny") {
      return {
        allow: false,
        error: `Blocked: ${domain} is on the Auto Browser blocklist. Remove it from src/safety/blocklist.js or user config if this is intentional.`,
      };
    }
    // "ask" — reuse askUser for approval. "Allow this action" records a
    // single-toolUseId grant; "Allow for this turn" records a domain-scoped
    // grant that bypasses decide() for the rest of the turn.
    const answer = await askUser({
      question: `Allow Auto Browser to perform a pixel-coordinate ${params?.action || "action"} on ${domain}?`,
      options: [
        { label: "Allow this action" },
        { label: "Allow for this turn", description: "No more prompts for mutating actions on this domain in the current turn." },
        { label: "Deny" },
      ],
      allow_free_text: false,
    });
    if (typeof answer !== "string") {
      return { allow: false, error: "Computer action: no decision received." };
    }
    if (answer.startsWith("Allow for this turn")) {
      perTurnDomainGrants.add(domain);
      return { allow: true };
    }
    if (answer.startsWith("Allow")) {
      perTurnGrants.set(toolUseId, { domain });
      return { allow: true };
    }
    return { allow: false, error: "Computer action denied by user." };
  } catch (err) {
    return { allow: false, error: `Permission gate failed: ${err.message}` };
  }
}

async function handleComputer(input = {}) {
  const action = input.action;
  if (!action) {
    return {
      error: "computer: 'action' is required. Supported: click, hover, type, press_key, scroll, drag.",
    };
  }
  const toolUseId = `computer_${++execIdCounter}`;
  const gate = await gateComputerAction(toolUseId, input);
  if (!gate.allow) return { error: gate.error };
  // Capture the origin at approval time and ship it with the dispatch. The
  // SW re-checks the live tab URL before running the action — a redirect or
  // login handoff between approval and dispatch would otherwise route the
  // click/type to a different site.
  const expectedOrigin = location.origin;
  return new Promise((resolve) => {
    try {
      chrome.runtime.sendMessage(
        { type: "COMPUTER_ACTION", payload: { action, params: input, expectedOrigin } },
        (response) => {
          if (chrome.runtime.lastError) {
            resolve({ error: `computer: ${chrome.runtime.lastError.message}` });
          } else {
            resolve(response || { error: "computer: empty response" });
          }
        },
      );
    } catch (err) {
      resolve({ error: `computer: ${err.message}` });
    }
    setTimeout(() => resolve({ error: "computer: request timed out" }), 15000);
  });
}

// ── Phase 2: uid-based mutating tools (routed through the dispatcher) ──
// click / fill / fill_form / press_key / hover / scroll / drag all share the
// same content-script scaffolding: resolve uid → bbox center, compute the
// permission decision, post a COMPUTER_ACTION message to the SW. The
// dispatcher (src/actions/dispatcher.js) orchestrates the permission gate,
// coord resolution, and action sequencing — this file only provides the
// DOM-facing and message-routing glue.

// PR #39 F1 — `bboxCenterOf` moved to `src/perception/coords.js` as
// `bboxCenter`. The overlay path and uid action dispatcher now share
// one implementation, so iframe-interior uids click / fill / scroll /
// drag land on the same pixels the overlay labels point at.
//
// Phase 3.1 — the resolver itself moved to
// `src/actions/resolve-uid.js` so its scroll-into-view + (coming
// later) settle-wait + stale-ref retry behavior is unit-testable
// without DOM / chrome-API harness. This thin wrapper closes over
// the per-turn refmap and the loaded coords module.
function resolveUidWithMods(mods, uid) {
  return mods.resolveUid.resolveUidToCoords(uid, {
    refmap: perTurnRefmap,
    bboxCenter: mods.coords.bboxCenter,
  });
}

function sendComputerAction(action, params, expectedOrigin) {
  // expectedOrigin is forwarded to the SW's URL-drift gate. Without it, a
  // login-redirect or popup-handoff between approval and dispatch could land
  // an approved click/fill/drag on a different origin than the one the user
  // saw when they said "Allow". See handleUidAction below for the capture.
  return new Promise((resolve) => {
    try {
      chrome.runtime.sendMessage(
        { type: "COMPUTER_ACTION", payload: { action, params, expectedOrigin } },
        (response) => {
          if (chrome.runtime.lastError) {
            resolve({ error: chrome.runtime.lastError.message });
          } else {
            resolve(response || { error: "SW returned empty response." });
          }
        },
      );
    } catch (err) {
      resolve({ error: err.message });
    }
    setTimeout(() => resolve({ error: "Dispatch timed out." }), 15000);
  });
}

/**
 * Structured approval result. Distinguishing allow_once vs allow_turn is what
 * lets the "Allow for this turn" option actually do what it promises — without
 * this the caller would collapse both to a boolean and re-prompt on the next
 * action.
 */
async function approveAction(tool, domain) {
  const answer = await askUser({
    question: `Allow Auto Browser to ${tool.replace(/_/g, " ")} on ${domain}?`,
    options: [
      { label: "Allow" },
      { label: "Allow for this turn", description: "No more prompts for mutating actions on this domain in the current turn." },
      { label: "Deny" },
    ],
    allow_free_text: false,
  });
  if (typeof answer !== "string") return "deny";
  // Match the most specific prefix first — "Allow for this turn" must NOT
  // fall through to the plain "Allow" branch (both start with "allow").
  if (answer.startsWith("Allow for this turn")) return "allow_turn";
  if (answer.startsWith("Allow")) return "allow_once";
  return "deny";
}

/**
 * Does the tool reference a uid (directly or inside an entries array)?
 * Drives the seal check — tools that don't take uids (press_key, or scroll
 * with raw {x,y}) don't need one.
 */
function toolRequiresSeal(input) {
  if (!input || typeof input !== "object") return false;
  if (typeof input.uid === "string") return true;
  if (typeof input.from_uid === "string") return true;
  if (typeof input.to_uid === "string") return true;
  if (Array.isArray(input.entries) && input.entries.length > 0) return true;
  return false;
}

/**
 * Validate that the caller's seal matches the refmap's current seal before
 * resolving any uid. Because uid numbering restarts at ref_1 on every
 * take_snapshot, a stale ref_N from an earlier snapshot in the same turn
 * would otherwise silently resolve to a DIFFERENT live element. The seal
 * closes that gap — it rotates per snapshot, so only uids from the current
 * snapshot can possibly validate.
 *
 * Returns a structured error on mismatch, or null when the call is clear.
 */
function enforceSnapshotSeal(tool, input) {
  if (!toolRequiresSeal(input)) return null;
  if (!perTurnRefmap) {
    return { error: `${tool}: no snapshot yet. Call take_snapshot first and pass the returned seal.` };
  }
  const current = perTurnRefmap.currentSeal();
  if (typeof input.seal !== "string" || input.seal !== current) {
    return { error: `${tool}: seal mismatch. Call take_snapshot again and pass the new seal.` };
  }
  return null;
}

/**
 * Single entry point for the 7 uid-based mutating tools. Delegates the
 * sequencing and routing to the pure dispatcher; this function wires up the
 * content-script-side dependencies (refmap seal enforcement, per-turn
 * domain-grant shortcut, approve UI, SW send with expectedOrigin for
 * origin-drift enforcement).
 */
async function handleUidAction(tool, input) {
  try {
    const mods = await loadPerceptionModules();
    await ensurePerceptionReady();

    // Seal enforcement runs BEFORE any policy check so a stale-seal call on
    // a blocklisted domain returns the actionable "re-snapshot" error rather
    // than a generic deny — the agent knows how to recover.
    const sealErr = enforceSnapshotSeal(tool, input);
    if (sealErr) return sealErr;

    const domain = location.hostname;
    const toolUseId = `${tool}_${++execIdCounter}`;

    // Turn-scoped domain grant short-circuits decide() entirely — matching
    // the handleComputer pattern so both paths honor "Allow for this turn"
    // identically. Blocklist is still enforced via decide() below whenever
    // the domain is NOT in perTurnDomainGrants.
    const policy = await mods.policy.getPolicy();
    const baseDecision = perTurnDomainGrants.has(domain)
      ? "allow"
      : mods.permission.decide(tool, input, {
          domain,
          toolUseId,
          policy,
          grants: perTurnGrants,
        });
    // "Auto-approve this task" upgrade. No always-ask tool routes through the
    // UID path today (evaluate_script gates via gateMutatingNonUid), so the
    // guard inside applyTurnAutoApprove is a defensive no-op here — keep it so
    // a future always-ask UID tool can't silently bypass the prompt.
    const decision = applyTurnAutoApprove(baseDecision, tool, mods);

    // Capture origin at approval time. expectedOrigin rides with every SW
    // dispatch from this call so a redirect between approval and dispatch
    // aborts rather than landing the action on a different site.
    const expectedOrigin = location.origin;

    const result = await mods.dispatcher.dispatch(tool, input, {
      decision,
      approve: async () => {
        const outcome = await approveAction(tool, domain);
        if (outcome === "allow_turn") {
          perTurnDomainGrants.add(domain);
          return true;
        }
        if (outcome === "allow_once") {
          perTurnGrants.set(toolUseId, { domain });
          return true;
        }
        return false;
      },
      // recordGrant is a no-op here because approve() already persisted the
      // right kind of grant at approval time. Kept on the deps surface so
      // the dispatcher's public contract doesn't change.
      recordGrant: () => {},
      resolveCoords: (uid) => resolveUidWithMods(mods, uid),
      send: (action, params) => sendComputerAction(action, params, expectedOrigin),
      // Phase 3.2 — post-action settle. Skipped when actionSettleMs
      // is 0 / undefined (production default 50ms, tests use 0).
      ...(Number.isFinite(config.actionSettleMs) && config.actionSettleMs > 0
        ? { settle: () => new Promise((r) => setTimeout(r, config.actionSettleMs)) }
        : {}),
    });

    // Phase 3.3 — stale-ref recovery. If the action failed because
    // the snapshot moved on, attach a fresh snapshot in-band so the
    // agent can pick a new uid and re-issue WITHOUT spending another
    // ReAct turn just to call take_snapshot. We do NOT auto-redispatch
    // — the "same conceptual button" by name match could be a
    // semantically different button after a state change, and silent
    // re-clicking is unsafe for state-mutating actions.
    return await mods.recover.withFreshSnapshotOnStale(result, () => handleTakeSnapshot({}));
  } catch (err) {
    return { error: `${tool}: ${err.message}` };
  }
}

// ── Phase 3: navigation, waits, network/console reads, evaluate_script ──
// Uniform shape: gate (if mutating) → SW round-trip via chrome.runtime.
// Reuses the perception-modules bundle for permission-manager + policy.

function sendToBackground(type, payload, timeoutMs = 30000) {
  return new Promise((resolve) => {
    try {
      chrome.runtime.sendMessage({ type, payload }, (response) => {
        if (chrome.runtime.lastError) {
          resolve({ error: chrome.runtime.lastError.message });
        } else {
          resolve(response ?? { error: "SW returned empty response." });
        }
      });
    } catch (err) {
      resolve({ error: err.message });
    }
    setTimeout(() => resolve({ error: `${type}: request timed out.` }), timeoutMs);
  });
}

/**
 * Generalised mutating-tool gate for non-uid-based tools (navigate, evaluate_*,
 * any future mutator the dispatcher doesn't cover). Computes the decision via
 * permission-manager, surfaces the askUser modal on "ask", records the per-
 * turn grant on approval. Returns { allow: true } | { allow: false, error }.
 *
 * For evaluate_script the decision is always "ask" (ALWAYS_ASK_TOOLS); the
 * approve modal includes a code preview so the user sees exactly what runs.
 */
async function gateMutatingNonUid(tool, args) {
  try {
    const mods = await loadPerceptionModules();
    const policy = await mods.policy.getPolicy();
    const domain = location.hostname;
    const toolUseId = `${tool}_${++execIdCounter}`;
    const decision = applyTurnAutoApprove(
      mods.permission.decide(tool, args, {
        domain, toolUseId, policy, grants: perTurnGrants,
      }),
      tool,
      mods,
    );
    if (decision === "deny") return { allow: false, error: `${tool}: denied by policy on ${domain}.` };
    if (decision === "allow") return { allow: true, toolUseId };
    // "ask": check the per-turn grant fast-paths before bothering the user.
    // Scripts consult their OWN grant set — a generic "allow for this turn" on
    // a click never covers code execution (PR #8 review F4 covers why grants
    // can't be keyed to per-call toolUseId here).
    const isAlwaysAsk = mods.permission.ALWAYS_ASK_TOOLS.has(tool);
    if (isAlwaysAsk) {
      if (perTurnScriptGrants.has(domain)) return { allow: true, toolUseId };
    } else if (perTurnDomainGrants.has(domain)) {
      return { allow: true, toolUseId };
    }
    const outcome = await approveActionWithPreview(tool, args, domain);
    if (outcome === "deny") return { allow: false, error: `${tool}: denied by user.` };
    if (outcome === "allow_turn") {
      // Turn-scoped grant, cleared on the next USER_MESSAGE via
      // resetPerTurnState. Scripts land in their own set.
      if (isAlwaysAsk) perTurnScriptGrants.add(domain);
      else perTurnDomainGrants.add(domain);
    } else {
      perTurnGrants.set(toolUseId, { domain });
    }
    return { allow: true, toolUseId };
  } catch (err) {
    return { allow: false, error: `Permission gate failed: ${err.message}` };
  }
}

/**
 * Surface the approval modal with a tool-specific preview.
 *
 * Returns the same discriminator as approveAction (the uid path):
 *   "allow_once"  — grant exactly this call
 *   "allow_turn"  — grant every mutating call on this domain for the rest of
 *                   the turn (NOT offered for evaluate_script)
 *   "deny"
 *
 * For evaluate_script the prompt leads with the agent's stated INTENT rather
 * than the source. Showing 200 characters of minified JavaScript in a narrow
 * panel to someone who may not read JavaScript produces rubber-stamping, not
 * review — the decision has to be phrased in terms the user can actually
 * judge. The code stays available underneath for those who want it, and the
 * risk line is explicitly best-effort (see safety/script-risk.js).
 */
async function approveActionWithPreview(tool, args, domain) {
  let preview = "";
  const isAlwaysAsk = tool === "evaluate_script";
  if (isAlwaysAsk) {
    const intent = typeof args.intent === "string" && args.intent.trim()
      ? args.intent.trim()
      : "The agent did not say what this script does — treat that as a reason to decline.";
    const mods = await loadPerceptionModules();
    const { summary } = mods.scriptRisk.summarizeScriptRisk(args.expression || "");
    const src = typeof args.expression === "string" ? args.expression : "";
    const snippet = src.length > 200 ? src.slice(0, 200) + "…" : src;
    preview =
      `\n\nWhat it does: ${intent}` +
      `\n\nThis script: ${summary}` +
      `\n\nCode:\n${snippet}`;
  } else if (tool === "navigate" && typeof args.url === "string") {
    preview = `\n\nDestination: ${args.url}`;
  }
  const options = isAlwaysAsk
    ? [
        { label: "Allow" },
        { label: "Allow for this turn", description: "Run scripts on this site without asking again until your next message." },
        { label: "Deny" },
      ]
    : [
        { label: "Allow" },
        { label: "Allow for this turn", description: "No more prompts for mutating actions on this domain in the current turn." },
        { label: "Deny" },
      ];
  const answer = await askUser({
    question: `Allow Auto Browser to ${tool.replace(/_/g, " ")} on ${domain}?${preview}`,
    options,
    allow_free_text: false,
  });
  if (typeof answer !== "string") return "deny";
  // Match most-specific prefix first — "Allow for this turn" must NOT fall
  // through to the plain "Allow" branch (both start with "allow").
  if (answer.startsWith("Allow for this turn")) return "allow_turn";
  if (answer.startsWith("Allow")) return "allow_once";
  return "deny";
}

async function handleNavAction(action, input) {
  const gate = await gateMutatingNonUid(action, input);
  if (!gate.allow) return { error: gate.error };
  return sendToBackground("NAV_ACTION", { action, params: input });
}

async function handleEvaluateScript(input) {
  const gate = await gateMutatingNonUid("evaluate_script", input);
  if (!gate.allow) return { error: gate.error };
  // Carry the origin captured at approval time. SW re-checks the live tab
  // URL against this and aborts if a redirect / login handoff drifted us to
  // a different origin between approval and dispatch — same protection
  // COMPUTER_ACTION already has (PR #8 review F3).
  return sendToBackground("EVALUATE_SCRIPT", { ...input, expectedOrigin: location.origin });
}

function handleWaitForText(input) {
  const tt = Number.isFinite(input.timeout_ms) ? input.timeout_ms : 5000;
  return sendToBackground("WAIT_FOR_TEXT", input, tt + 5000);
}

function handleWaitForNetworkIdle(input) {
  const tt = Number.isFinite(input.timeout_ms) ? input.timeout_ms : 10000;
  return sendToBackground("WAIT_FOR_NETWORK_IDLE", input, tt + 5000);
}

function handleListNetworkRequests(input) {
  return sendToBackground("LIST_NETWORK", input);
}

function handleGetNetworkRequest(input) {
  return sendToBackground("GET_NETWORK_REQUEST", input);
}

function handleReadConsoleMessages(input) {
  return sendToBackground("READ_CONSOLE", input);
}

// Phase 4 — emulation + dialog handling. Same gateMutatingNonUid pattern;
// SW round-trip for the actual CDP dispatch. Each preview-able for the user.
//
// expectedOrigin is captured at approval time and rides with every dispatch
// so the SW can re-validate URL drift before running the action — a redirect
// or login handoff between approval and dispatch must not silently apply
// UA/viewport overrides or accept/dismiss a dialog on a different origin
// than the user agreed to (PR #9 review F1).
async function handleSetViewport(input) {
  const gate = await gateMutatingNonUid("set_viewport", input);
  if (!gate.allow) return { error: gate.error };
  return sendToBackground("EMULATION_SET_VIEWPORT", { ...input, expectedOrigin: location.origin });
}
async function handleSetUserAgent(input) {
  const gate = await gateMutatingNonUid("set_user_agent", input);
  if (!gate.allow) return { error: gate.error };
  return sendToBackground("EMULATION_SET_USER_AGENT", { ...input, expectedOrigin: location.origin });
}
async function handleClearEmulation(input) {
  const gate = await gateMutatingNonUid("clear_emulation", input);
  if (!gate.allow) return { error: gate.error };
  return sendToBackground("EMULATION_CLEAR", { ...input, expectedOrigin: location.origin });
}
async function handleDialogAction(input) {
  const gate = await gateMutatingNonUid("handle_dialog", input);
  if (!gate.allow) return { error: gate.error };
  return sendToBackground("HANDLE_DIALOG", { ...input, expectedOrigin: location.origin });
}

// ── Extension-only tools (not from WebMCP) ───────────────────

const EXTENSION_TOOLS = [
  {
    name: "ask_user",
    description:
      `Ask the user a question and wait for their answer.

Use when:
- The user's request involves a choice they didn't specify (which seat, which username, which amount) — never pick arbitrarily.
- You need information you can't derive from the page.
- You're about to take a genuinely irreversible or cross-task action and want confirmation.

Do NOT use to:
- Confirm your plan before acting on a clear request. Just act.
- Ask "should I proceed?" on reversible, in-scope steps.
- Resolve friction you haven't tried to debug yet. Diagnose first.
- Re-ask something the user already answered (check conversation history).
- "Be safe" on a request the user already gave — asking IS the cost. If you have the info, acting is the safer path.

Prefer structured options (2-5 concrete choices) when the answer is discrete. Use free-text only when genuinely open-ended (like a username).

<example>
User: "Sit down and play." Page shows 5 empty seats.
Good: ask_user({question: "Which seat?", options: [{label: "Seat 1"}, {label: "Seat 3"}, {label: "Any (you choose)"}], allow_free_text: false})
Bad: silently pick seat 1 — user didn't specify.
Bad: ask_user({question: "Ready for me to sit down?"}) — they already said to sit.
<commentary>
Discrete choice with user-meaningful consequences (different seats → different positions, different stacks nearby). Structured options are faster than free text because the user clicks instead of typing. Picking arbitrarily erodes trust; re-confirming after a clear instruction wastes a round-trip.
</commentary>
</example>`,
    inputSchema: {
      type: "object",
      properties: {
        question: {
          type: "string",
          description: "The question to ask the user",
        },
        options: {
          type: "array",
          description:
            "2-5 concrete choices the user can pick from. OMIT only if the answer is free-text (e.g. a username). If recommending one, put it first and include '(Recommended)' in the label.",
          items: {
            type: "object",
            properties: {
              label: { type: "string", description: "Short label shown on the button" },
              description: { type: "string", description: "Optional longer explanation" },
            },
            required: ["label"],
          },
        },
        allow_free_text: {
          type: "boolean",
          description:
            "If true AND options are provided, user may answer outside the options via free text. Defaults to false.",
        },
      },
      required: ["question"],
    },
  },
  {
    name: "ask_user_form",
    description:
      `Ask the user to fill out a MULTI-FIELD form in a single prompt. Use when you need several related values at once — e.g. a reservation (name + phone + date + time + guests), a signup (username + email + password), a checkout address. The sidebar renders every field together and the user submits once.

Prefer this over chained ask_user calls whenever you'd otherwise ask ≥2 questions that logically belong to the same form. Don't use it for a single question (use ask_user), or for a branching choice (use ask_user options).

ONLY ASK FOR UNKNOWNS. Before constructing the form, list every field the target page requires. Then REMOVE each field whose value the user already gave in their instruction or that you can derive from context (today's date, the page's stated prices, obvious defaults). The form should contain only fields you genuinely cannot fill. Use \`default\` ONLY when the value is a plausible guess the user should review — not when the user already stated it.

Keep forms to ≤8 fields. If you need more, split into two sequential forms — users lose track of long forms and the sidebar scrolls awkwardly.

Supported field types: text, textarea, email, tel, url, password, number, date, time, select. For select, include \`options\` as an array of strings.

Each field needs a stable \`id\` (used as the result key), a human-readable \`label\`, and a \`type\`. Mark \`required: true\` for fields the user must fill. You may provide \`placeholder\` or \`default\`.

Result shape: { values: { [field.id]: value, ... } }. The form covers UNKNOWNS only — merge its values with the values you already inferred from the user's instruction before filling the actual page form. If the user cancels or times out, the result is { error: "..." } instead of { values: ... } — handle that by ending the turn or asking once for clarification.

<example>
User: "help me make a reservation for 2, next tuesday 9pm"
Current date: 2026-04-15 (Wednesday) → next Tuesday = 2026-04-21.

Good: ask_user_form({title: "Reservation details", fields: [
  {id: "name", label: "Full Name", type: "text", required: true},
  {id: "phone", label: "Phone Number", type: "tel", required: true},
  {id: "seating", label: "Seating Preference", type: "select", options: ["Indoor", "Outdoor", "No preference"]},
  {id: "notes", label: "Special Requests", type: "textarea"},
]})
(Date, time, and guest count were already stated — you know them, don't re-ask. When filling the page form, combine the user's stated values with these form values.)

Bad: including date/time/guests as prefilled fields "for confirmation".
(Still forces the user to scan and confirm 7 rows for information they already gave. Feels like being ignored.)

Bad: seven separate ask_user calls for the same form.
(Slow, lossy, and the user can't review before submitting.)
<commentary>
Related unknowns with a clear bundle identity (everything NEEDED that the user hasn't said) belong in one form. One submit beats N confirms, and the user can correct an earlier field before submitting — impossible with chained ask_user where each answer is locked in before the next question appears. Asking for information the user already gave you wastes their attention; that's the whole budget of this tool.
</commentary>
</example>`,
    inputSchema: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "Optional short heading shown above the form (e.g. 'Reservation details').",
        },
        fields: {
          type: "array",
          description: "Ordered list of form fields to present to the user. Minimum 1.",
          items: {
            type: "object",
            properties: {
              id: {
                type: "string",
                description: "Stable key used in the result object. Keep snake_case.",
              },
              label: { type: "string", description: "Human-readable label shown above the input." },
              type: {
                type: "string",
                enum: ["text", "textarea", "email", "tel", "url", "number", "date", "time", "select"],
                description: "Input type. Use 'select' with 'options' for a dropdown.",
              },
              required: { type: "boolean", description: "If true, the user must fill this field to submit." },
              placeholder: { type: "string", description: "Optional placeholder hint inside the input." },
              default: { description: "Optional default value prefilled into the input." },
              options: {
                type: "array",
                description: "Required when type is 'select': list of option strings.",
                items: { type: "string" },
              },
            },
            required: ["id", "label", "type"],
          },
        },
      },
      required: ["fields"],
    },
  },
  {
    name: "set_poll_interval",
    description:
      `Set the polling rate the orchestrator uses to detect tool-set or page changes while your turn is over. This is a side-effect setting, not a status check — the prior value persists across turns.

Do not call more than once per task. Avoid calling it at all unless the default cadence is clearly wrong for this app.
- Fast (200-500ms): real-time apps where turns change second-to-second.
- Slow (3000-5000ms): mostly-idle pages.

<example>
Good: set_poll_interval called once at task start after noticing a real-time game loop.
Bad: calling set_poll_interval on every turn "to keep polling fresh" — it already persists.
</example>`,
    inputSchema: {
      type: "object",
      properties: {
        interval_ms: {
          type: "number",
          description: "Polling interval in milliseconds (min 200, max 10000)",
        },
      },
      required: ["interval_ms"],
    },
  },
  // ── Phase 1 perception + pixel-coord action tools ─────────
  {
    name: "take_snapshot",
    description:
      `Read the current page as a compact accessibility snapshot. Each interactive element gets a uid (ref_1, ref_2, …) that later tools reference without brittle CSS selectors.

Use this first on any unfamiliar page. Output is a line-per-element text form:
\`ref_3 button "Submit"\`
\`ref_4 textbox "Email"\`

Params:
- \`filter\`: "interactive" (default, only actionable elements) or "all" (also headings, landmarks).
- \`depth\`: DOM walk depth. Default 30.
- \`max_chars\`: cap output length. Default 8000. When the output is truncated you'll see \`"truncated": true\`.
- \`offset\`: pagination cursor. Skip the first N emittable elements and start there — use when a prior call returned \`truncated: true\` and a \`next_offset\`.

Result: \`{seal, url, title, text, truncated, count, next_offset, screenshot_attached?}\`. Every subsequent uid-targeted tool call MUST pass this \`seal\` alongside the uid — the seal pins the uid to THIS snapshot. Uid numbering restarts at ref_1 each snapshot, so without the seal a stale ref_3 would silently resolve to a different element after a later take_snapshot.

\`url\` and \`title\` (Phase 4.1) are the document's location + title at snapshot time — use them to confirm "did the navigate / click actually land me on /checkout" without spending an evaluate_script round-trip. They reflect the TOP document; iframe content is walked into the snapshot text but doesn't change the reported url/title.

On pagination: when \`truncated: true\`, follow \`next_offset\` on the next call: \`take_snapshot({offset: next_offset})\`. Uids are globally numbered across pages (page 1 emits ref_1..ref_50, page 2 emits ref_51..ref_100) so they never collide. Each paginated call is a fresh seal, so refs from prior pages become stale — **scan all pages first to find what you want, then take one final targeted snapshot and act on it**. \`next_offset: null\` means no more pages.

Default is text-only (fast, cheap). Set \`include_screenshot: true\` ONLY when the task needs a pixel view:
 - user references visual cues: color ("the blue button"), position ("the third card", "top-right icon"), or shape/size
 - page content is canvas- or image-only (charts, maps, rendered PDFs, image galleries)
 - a prior click/fill failed and you need to diagnose the visual state
When \`include_screenshot\` is on, each snapshotted element is also painted with a numbered label on the image. The number matches the trailing ordinal of its uid — \`ref_1_5 button "Submit"\` in text ⇔ a yellow box labeled \`5\` drawn over the Submit button. Use the visual labels to confirm which on-screen element you're about to click.
When \`screenshot_attached: true\` is in the result, the JPEG is already in this turn's context — do NOT also call take_screenshot.

Iframes: same-origin frames are walked inline — interactive elements inside them show up as regular refs, indistinguishable from elements in the top document. Cross-origin frames show up as a plain-text marker \`[cross-origin iframe: <title or url>]\` with no uid — you cannot click into an opaque frame; the agent's options are to navigate the top page around it (e.g. close a modal, dismiss a cookie banner) or to accept that specific content is unreachable.

Call again after any mutating action (click, fill, navigate) to get a fresh seal. Do NOT call repeatedly between reads — the snapshot is cheap but not free.`,
    inputSchema: {
      type: "object",
      properties: {
        filter: { type: "string", enum: ["interactive", "all"] },
        depth: { type: "number", description: "Max DOM depth to walk. Default 30." },
        max_chars: { type: "number", description: "Max output length in characters. Default 8000." },
        offset: {
          type: "number",
          description:
            "Pagination cursor — skip the first N emittable elements. Set to the `next_offset` from a prior truncated result to read the next page.",
        },
        include_screenshot: {
          type: "boolean",
          description:
            "Pair a JPEG of the current viewport with the text snapshot. Default false — opt in ONLY for visual tasks (see description above).",
        },
      },
    },
  },
  {
    name: "take_screenshot",
    description:
      `Capture a PNG screenshot of the current viewport via the Chrome DevTools Protocol. Use only when the accessibility snapshot misses something visual — canvas apps, image galleries, chart state, color-coded UI where text alone is ambiguous.

Not a substitute for take_snapshot. A screenshot costs far more tokens than a text snapshot and cannot be referenced by uid.

Params: none required. Optional \`full_page: true\` captures beyond the viewport (larger payload).

Result: \`{data, format}\` where \`data\` is base64 PNG.`,
    inputSchema: {
      type: "object",
      properties: {
        full_page: { type: "boolean", description: "Capture beyond the viewport. Default false." },
      },
    },
  },
  {
    name: "get_page_text",
    description:
      `Read the current page as plain text / Markdown. Use for article-style content where accessibility roles are not the point (news articles, docs, blog posts). For interactive UIs, prefer take_snapshot.

Paginate with \`head_limit\` (chars) and \`offset\`. Result carries \`{text, offset, length, total, truncated}\` so you can stream through long pages without blowing the token budget.`,
    inputSchema: {
      type: "object",
      properties: {
        selector: { type: "string", description: "Optional CSS selector to scope the extraction." },
        head_limit: { type: "number", description: "Max characters to return in this call. Default: return everything." },
        offset: { type: "number", description: "Character offset to start from. Default 0." },
      },
    },
  },
  {
    name: "find",
    description:
      `Rank elements in the most recent snapshot by how well they match a natural-language description. Returns up to \`limit\` candidates with scores so you can pick the right uid when take_snapshot gave you multiple similar-looking elements.

Example: after take_snapshot, call \`find({description: "the submit button on the signup form"})\` → returns \`{seal, matches: [...uids with scores]}\`. Use that \`seal\` when you call get_element_info (or any uid-targeted tool) — it's authoritative at the moment of the find result.

Requires a prior take_snapshot call in the same turn.`,
    inputSchema: {
      type: "object",
      properties: {
        description: { type: "string", description: "Natural-language description of the element you want." },
        limit: { type: "number", description: "Max candidates to return. Default 5." },
      },
      required: ["description"],
    },
  },
  {
    name: "computer",
    description:
      `Pixel-coordinate action fallback when a uid-based tool can't address what you need — canvas apps, WYSIWYG editors, Google Maps, Figma. Prefer uid-based tools whenever they cover the action; \`computer\` is the escape hatch.

Actions:
- \`{action: "click", x, y}\` — single left-click at the given pixel. Also supports \`button, modifiers, clickCount\` (use clickCount: 3 to select-all in a native input).
- \`{action: "hover", x, y}\` — move the pointer to (x, y) without pressing. Triggers hover menus and tooltips on canvas/map/WYSIWYG surfaces.
- \`{action: "type", text: "..."}\` — IME-safe char-by-char typing into the currently-focused element. Pair with a prior \`click\` if focus isn't already where you want it.
- \`{action: "press_key", chord: "cmd+a"}\` — dispatch a keyboard chord. Same chord grammar as the uid-based \`press_key\` tool (Enter, Escape, ArrowDown, cmd/ctrl/alt/shift combos).
- \`{action: "scroll", x, y, deltaX?, deltaY?}\` — wheel event at (x, y). At least one of deltaX/deltaY must be non-zero.
- \`{action: "drag", from: {x,y}, to: {x,y}}\` — left-button drag between two pixels.

This tool is permission-gated. On a new domain you'll be prompted before the first mutating call executes.`,
    inputSchema: {
      type: "object",
      properties: {
        action: { type: "string", enum: ["click", "hover", "type", "press_key", "scroll", "drag"] },
        x: { type: "number" },
        y: { type: "number" },
        text: { type: "string" },
        chord: { type: "string", description: "Required when action is 'press_key'. Examples: 'Enter', 'Escape', 'cmd+a'." },
        deltaX: { type: "number" },
        deltaY: { type: "number" },
        button: { type: "string", enum: ["left", "right", "middle"] },
        clickCount: { type: "number" },
        modifiers: {
          type: "object",
          properties: {
            alt: { type: "boolean" },
            ctrl: { type: "boolean" },
            meta: { type: "boolean" },
            shift: { type: "boolean" },
          },
        },
        from: { type: "object", properties: { x: { type: "number" }, y: { type: "number" } } },
        to: { type: "object", properties: { x: { type: "number" }, y: { type: "number" } } },
      },
      required: ["action"],
    },
  },
  // ── Phase 2 uid-based mutating tools ───────────────────────
  {
    name: "click",
    description:
      `Click an element addressed by its ref_N uid from the most recent take_snapshot. Pair every \`uid\` with the \`seal\` returned by that same take_snapshot — a mismatch fails deterministically so a stale ref_N can never silently resolve to a different element after a later snapshot.

Use when:
- You want to trigger a button, link, menu item, tab, checkbox, or any actionable uid in the snapshot.
- The WebMCP tool surface on this page doesn't expose an atomic action for the same intent.

Mechanics:
- Resolves the uid to the element's current bounding-rect center and dispatches a real mouseMoved → mousePressed → mouseReleased sequence via CDP. Fires every event the page's framework expects — works on React, Vue, Lit, vanilla, etc.
- After a successful click, the snapshot is stale: call take_snapshot again before the next uid-based call.
- Permission-gated per domain on first use; subsequent clicks on the same domain this turn are allowed without re-prompting once you grant.
- If the uid is stale (page navigated, DOM re-rendered, element removed) you get a structured error telling you to re-snapshot — not a silent mis-click. As of Phase 3.3 the error response carries a \`fresh_snapshot\` field with a freshly-taken snapshot's \`{seal, text, count, ...}\` so you can pick a new uid IN THE SAME TURN — no extra take_snapshot call needed. Verify the new uid points to what you intended (a state-changed page may have repurposed the element) before re-issuing.

Prefer a WebMCP tool whenever one covers the same action — those are atomic and server-validated. click is the universal fallback.`,
    inputSchema: {
      type: "object",
      properties: {
        uid: { type: "string", description: "ref_N id from the most recent take_snapshot." },
        seal: { type: "string", description: "Seal returned by the same take_snapshot. REQUIRED — mismatch errors deterministically." },
        button: { type: "string", enum: ["left", "right", "middle"], description: "Default left." },
        modifiers: {
          type: "object",
          properties: {
            alt: { type: "boolean" }, ctrl: { type: "boolean" },
            meta: { type: "boolean" }, shift: { type: "boolean" },
          },
        },
        clickCount: { type: "number", description: "Default 1. Use 2 for double-click." },
      },
      required: ["uid", "seal"],
    },
  },
  {
    name: "hover",
    description:
      `Move the pointer to the given uid without pressing. Use to trigger hover menus, tooltips, and hover-reveal UI.

Mechanics: dispatches a single CDP mouseMoved at the element's center. No press/release. Not a substitute for click.

Read-only — no permission prompt.`,
    inputSchema: {
      type: "object",
      properties: {
        uid: { type: "string" },
        seal: { type: "string", description: "Seal from the same take_snapshot. REQUIRED." },
        modifiers: {
          type: "object",
          properties: {
            alt: { type: "boolean" }, ctrl: { type: "boolean" },
            meta: { type: "boolean" }, shift: { type: "boolean" },
          },
        },
      },
      required: ["uid", "seal"],
    },
  },
  {
    name: "fill",
    description:
      `Type text into an input/textarea/contenteditable addressed by uid.

Mechanics: triple-clicks the element (OS-agnostic select-all on native inputs and textareas), then dispatches Input.insertText one character at a time — IME-safe and compatible with React/Vue controlled inputs. The triple-click selects any existing content so the insert REPLACES rather than appends at the caret. Set \`press_enter: true\` to submit a search box or chat message after typing.

Do NOT use to chain values into a multi-field form — use fill_form, which batches the sequence atomically.`,
    inputSchema: {
      type: "object",
      properties: {
        uid: { type: "string", description: "ref_N of the input." },
        seal: { type: "string", description: "Seal from the same take_snapshot. REQUIRED." },
        text: { type: "string", description: "Text to type. The triple-click before typing selects existing content so this replaces, not appends." },
        press_enter: { type: "boolean", description: "If true, dispatch Enter after typing (search boxes, chat sends)." },
      },
      required: ["uid", "seal", "text"],
    },
  },
  {
    name: "fill_form",
    description:
      `Fill multiple fields in one tool call. Batches N × fill calls into a single permission prompt (if any) and stops at the first error, surfacing which entry failed.

Use for signup / checkout / reservation forms where typing N fields one-by-one would feel janky. The entries run in order — useful if one field's value triggers a reveal of the next.

If any entry's uid resolves stale, the sequence short-circuits before any further sends.`,
    inputSchema: {
      type: "object",
      properties: {
        seal: { type: "string", description: "Seal from the same take_snapshot as the entries' uids. REQUIRED — one seal covers the whole batch." },
        entries: {
          type: "array",
          items: {
            type: "object",
            properties: {
              uid: { type: "string" },
              text: { type: "string" },
              press_enter: { type: "boolean" },
            },
            required: ["uid", "text"],
          },
          description: "Ordered list of {uid, text} entries.",
        },
      },
      required: ["seal", "entries"],
    },
  },
  {
    name: "press_key",
    description:
      `Dispatch a keyboard chord. Parses strings like "Enter", "Escape", "ArrowDown", "cmd+a", "ctrl+shift+p".

Use for: sending Enter to submit a form you just filled (often press_enter: true on fill is cleaner), Escape to close a modal, ArrowKeys to move inside a dropdown or focus trap, cmd/ctrl+A to select-all before typing.

Modifier aliases: alt/option, ctrl/control, cmd/meta/command, shift. Case-insensitive.`,
    inputSchema: {
      type: "object",
      properties: {
        chord: { type: "string", description: "A key name or modifier+key chord (e.g. \"Enter\", \"cmd+a\")." },
      },
      required: ["chord"],
    },
  },
  {
    name: "scroll",
    description:
      `Scroll a container (by uid) or the viewport (by raw x/y) via CDP wheel events.

Container-scoped: \`scroll({uid, deltaY: 500})\` scrolls inside the element at the uid's center. Viewport-scoped: \`scroll({x: 400, y: 400, deltaY: -500})\` scrolls the page at the given pixel. Set deltaX for horizontal scroll.

At least one of deltaX/deltaY must be non-zero — the dispatcher rejects zero-delta no-ops with an error instead of silently dispatching them.

Read-only — no permission prompt.`,
    inputSchema: {
      type: "object",
      properties: {
        uid: { type: "string", description: "Optional: scroll inside this element's container. When present, `seal` is REQUIRED." },
        seal: { type: "string", description: "Seal from the same take_snapshot as `uid`. Required only when `uid` is used." },
        x: { type: "number" },
        y: { type: "number" },
        deltaX: { type: "number" },
        deltaY: { type: "number" },
      },
    },
  },
  {
    name: "drag",
    description:
      `Drag one uid to another. Dispatches a pressed → moved → released sequence between the two elements' centers. Use for: Trello cards, Notion blocks, file-manager drag-drop zones, slider handles.

Permission-gated like click. Both uids must come from the current snapshot.`,
    inputSchema: {
      type: "object",
      properties: {
        from_uid: { type: "string" },
        to_uid: { type: "string" },
        seal: { type: "string", description: "Seal from the take_snapshot both uids came from. REQUIRED." },
        button: { type: "string", enum: ["left", "right", "middle"] },
        modifiers: {
          type: "object",
          properties: {
            alt: { type: "boolean" }, ctrl: { type: "boolean" },
            meta: { type: "boolean" }, shift: { type: "boolean" },
          },
        },
      },
      required: ["from_uid", "to_uid", "seal"],
    },
  },
  // ── Phase 3 navigation, waits, network/console, evaluate ─────
  {
    name: "navigate",
    description:
      `Navigate the active tab to a URL.

Permission-gated per domain on first use. javascript: URLs are blocked at the dispatcher boundary — for in-page execution use \`evaluate_script\` (always-ask gated).

After a successful navigate, the snapshot is invalidated automatically: any ref_N from a previous take_snapshot will fail closed with a stale-snapshot error. Call take_snapshot again to re-orient before the next uid-based call.

Pair with \`wait_for_network_idle\` or \`wait_for({text})\` if you need to gate the next action on the new page being ready.`,
    inputSchema: {
      type: "object",
      properties: {
        url: { type: "string", description: "Absolute URL to navigate to (https://…)." },
      },
      required: ["url"],
    },
  },
  {
    name: "open_tab",
    description:
      `Open a new tab in your Auto Browser session group and add it as a member. Returns its tabId.

The new tab is NOT focused — call \`switch_focus\` with the returned tabId to start driving it. The URL is screened against your safety policy: non-http(s) and blocklisted URLs are refused, and a domain that isn't on your allowlist is refused too (approve it first, or \`navigate\` to it on an existing tab). Requires the multi-tab (service-worker) agent.`,
    inputSchema: {
      type: "object",
      properties: { url: { type: "string", description: "Absolute http(s) URL to open." } },
      required: ["url"],
    },
  },
  {
    name: "list_tabs",
    description:
      `List the tabs in your Auto Browser session group — members only — each with its tabId, url, and title, plus which one is currently focused. You can only see and act on tabs you opened.`,
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "switch_focus",
    description:
      `Switch which member tab you are driving. Subsequent perceive/snapshot/action calls target the newly-focused tab. Fails if the tab isn't a member of your session — use \`list_tabs\` to see your tabs.`,
    inputSchema: {
      type: "object",
      properties: { tab_id: { type: "number", description: "tabId of a member tab (from list_tabs / open_tab)." } },
      required: ["tab_id"],
    },
  },
  {
    name: "close_tab",
    description:
      `Close a member tab you opened. You can't close the anchor tab (the tab the task started on) — end the task with \`task_complete\` instead.`,
    inputSchema: {
      type: "object",
      properties: { tab_id: { type: "number", description: "tabId of a member tab to close." } },
      required: ["tab_id"],
    },
  },
  {
    name: "go_back",
    description:
      `Go back one entry in the tab's session history. Errors if there is no previous entry.

Same snapshot-invalidation semantics as navigate.`,
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "go_forward",
    description:
      `Go forward one entry in the tab's session history. Errors if there is no next entry.

Same snapshot-invalidation semantics as navigate.`,
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "reload",
    description:
      `Reload the current page. Set \`hard: true\` for a cache-bypass reload (Cmd-Shift-R equivalent).

Same snapshot-invalidation semantics as navigate.`,
    inputSchema: {
      type: "object",
      properties: {
        hard: { type: "boolean", description: "Bypass the disk cache. Default false." },
      },
    },
  },
  {
    name: "wait_for",
    description:
      `Wait for visible text to appear on the page. Polls Runtime.evaluate against \`document.body.innerText.includes(<text>)\`.

Default timeout 5000ms; defaults are usually right. The text is JSON-escaped before splicing into the evaluation expression — no injection risk.

Use after a click/fill that triggers a re-render and you need to gate the next uid-based step on the new content being on screen. Re-snapshot AFTER wait_for resolves; the page's DOM has likely changed.`,
    inputSchema: {
      type: "object",
      properties: {
        text: { type: "string", description: "Substring of visible text to wait for." },
        timeout_ms: { type: "number", description: "Default 5000." },
        poll_ms: { type: "number", description: "Default 100." },
      },
      required: ["text"],
    },
  },
  {
    name: "wait_for_network_idle",
    description:
      `Wait until in-flight HTTP requests have been quiet for \`idle_ms\` continuously, or fail with a timeout.

Use after a click that triggers an XHR/fetch and you want to gate the next read on the response landing. Defaults: idle_ms=500, timeout_ms=10000.

Cheaper than wait_for if you only care about API completion (not visible content).`,
    inputSchema: {
      type: "object",
      properties: {
        idle_ms: { type: "number", description: "Continuous quiet window in ms. Default 500." },
        timeout_ms: { type: "number", description: "Hard cap. Default 10000." },
      },
    },
  },
  {
    name: "list_network_requests",
    description:
      `List recent HTTP requests captured by the per-tab observer. One row per round-trip with method/url/status/finishedAt.

Pagination via \`head_limit\` and \`offset\`; filter via the JSON-Pointer-ish helpers below isn't supported in v1 — fetch enough rows and filter client-side.

The observer captures up to ~200 most-recent requests; older requests are evicted.`,
    inputSchema: {
      type: "object",
      properties: {
        head_limit: { type: "number" },
        offset: { type: "number" },
      },
    },
    annotations: { untrustedContentHint: true },
  },
  {
    name: "get_network_request",
    description:
      `Fetch a single request by its observer-assigned id (from list_network_requests). Returns the full row.`,
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string" },
      },
      required: ["id"],
    },
    annotations: { untrustedContentHint: true },
  },
  {
    name: "read_console_messages",
    description:
      `Read recent console messages (page console.log/info/warn/error) and Chrome's own log entries (network errors, deprecation warnings, security violations).

Args from console calls are serialised — primitives keep their values; objects/functions show their type as \`[object Foo]\` / \`[function …]\` markers.

Pagination via head_limit / offset; filter via a custom client-side scan after fetching.`,
    inputSchema: {
      type: "object",
      properties: {
        head_limit: { type: "number" },
        offset: { type: "number" },
      },
    },
    annotations: { untrustedContentHint: true },
  },
  {
    name: "evaluate_script",
    description:
      `Run arbitrary JavaScript in the page's main world via CDP Runtime.evaluate. The most powerful tool, and the last resort. It interrupts the user for approval every time, so a call you did not need costs them a decision they should not have had to make.

STOP — check the HARD FLOOR before choosing this tool:
- Does ONE WebMCP tool already express the whole intent (\`book_table\`, \`place_order\`, \`login\`, \`search_product\`)? Use that tool. Never wrap a single atomic intent in a script.
- Does the intent need ≤4 distinct WebMCP calls? Use the atomic tools, one per turn. Small finite sequences stay atomic.
- Is the target reachable by a uid tool, navigation, or a WebMCP tool? Use that instead.
Only when ALL THREE are "no" is this tool correct. "It would be fewer turns" is NOT a reason — turns are cheap, approval prompts are not.

Legitimate cases, once past the floor:
1. Escape hatch — a required read/write isn't reachable via uid tools, navigation, or any WebMCP tool (Web Component internal state, page-exposed function, computed style).
2. Algorithmic loop over per-step WebMCP tools — the whole intent is N per-step calls where N is clearly many and unbounded or data-dependent (maze solve, bulk delete, 30-SKU cart fill, play N game turns). Genuine read-decide-loop logic, not a fixed short list. Call the page's own WebMCP tools from inside via \`(document.modelContext || navigator.modelContext).__autobrowser_webmcp_shim_v1_handle.execute(name, input)\` — each call still runs page-side validation.

Defaults: \`await_promise: true\` (await Promises before returning), \`return_by_value: true\` (JSON-serialise the result). Has a 15s built-in timeout to prevent hung scripts.

Runtime.evaluate rejects bare multi-statement programs — wrap multi-step bodies in an async IIFE: \`(async () => { /* … */ return result; })()\`. Always include:
- An explicit loop bound — prefer ~50 iterations, never more than 200. Resume via progress return is safer than pushing the 15s CDP timeout.
- Break-on-error so one bad step doesn't eat the budget.
- A SUMMARISED return value — counts + last-processed IDs + terminal state, not raw arrays of every step. \`{ deletedCount: 47, lastProcessedId: "nx_891", done: false }\` is right; \`{ deleted: [...47 items] }\` bloats the next turn's context. If the loop caps out short of done, the summary lets the next turn resume.

Returns { ok, type, value } or { error, line?, column? } for exceptions.`,
    inputSchema: {
      type: "object",
      properties: {
        expression: { type: "string", description: "JavaScript expression to evaluate." },
        intent: {
          type: "string",
          description:
            "REQUIRED. One or two plain sentences, written for a non-programmer, shown to the user in the approval prompt INSTEAD of the code. State (a) what the script will do, in terms of the user's task, and (b) why no atomic WebMCP or uid tool covers it. Example: \"Adds all 30 SKUs from the list to the cart by calling the page's add_to_cart tool in a loop. No atomic tool accepts more than one SKU.\" Do not describe the JavaScript itself — describe the effect.",
        },
        await_promise: { type: "boolean", description: "Default true." },
        timeout_ms: { type: "number", description: "Default 15000." },
      },
      required: ["expression", "intent"],
    },
    annotations: { untrustedContentHint: true },
  },
  // ── Phase 4 emulation + dialog handling ────────────────────
  {
    name: "set_viewport",
    description:
      `Override the tab's viewport dimensions via CDP Emulation.setDeviceMetricsOverride.

Use to test responsive layouts (\`mobile: true\`, deviceScaleFactor 2-3) or to force a known viewport so element coordinates are reproducible.

The override persists for the tab until you call \`clear_emulation\` or close the tab — it does NOT auto-reset on navigation. Permission-gated.`,
    inputSchema: {
      type: "object",
      properties: {
        width: { type: "number", description: "CSS pixels." },
        height: { type: "number", description: "CSS pixels." },
        deviceScaleFactor: { type: "number", description: "Default 1. Use 2-3 to emulate retina/HiDPI." },
        mobile: { type: "boolean", description: "Default false. Toggles mobile UA hints + touch event support." },
      },
      required: ["width", "height"],
    },
  },
  {
    name: "set_user_agent",
    description:
      `Override the User-Agent header (and optionally Accept-Language / navigator.platform) via CDP.

Use sparingly — UA spoofing can change page behavior in unexpected ways and some sites block on UA. The override persists until \`clear_emulation\` or tab close. Permission-gated.`,
    inputSchema: {
      type: "object",
      properties: {
        userAgent: { type: "string", description: "Full UA string to send." },
        acceptLanguage: { type: "string", description: "Optional Accept-Language override." },
        platform: { type: "string", description: "Optional navigator.platform override (e.g. \"MacIntel\")." },
      },
      required: ["userAgent"],
    },
  },
  {
    name: "clear_emulation",
    description:
      `Reset the tab's viewport and user-agent overrides to browser defaults.

Safe to call when no override was set (the underlying CDP commands no-op). Permission-gated for symmetry with set_viewport / set_user_agent.`,
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "handle_dialog",
    description:
      `Accept or dismiss a JavaScript dialog (alert, confirm, prompt, beforeunload).

\`accept\` MUST be an explicit boolean — there's no implicit default because dialog flows have meaningful branches. For \`window.prompt()\` responses, set \`promptText\` (only used when accepting).

If no dialog is currently open the call returns an actionable error: usually you need to trigger the dialog first (click the button that opens it) and then call handle_dialog.`,
    inputSchema: {
      type: "object",
      properties: {
        accept: { type: "boolean", description: "true to confirm, false to dismiss." },
        promptText: { type: "string", description: "Response for window.prompt(). Only used when accept is true." },
      },
      required: ["accept"],
    },
  },
  {
    name: "get_element_info",
    description:
      `Inspect one element's attributes, visibility, position, text. Address by uid from the most recent take_snapshot.

Pass the snapshot's \`seal\` alongside the uid — REQUIRED. The seal pins the uid to that snapshot; a stale-seal or stale-uid call returns a structured error pointing at take_snapshot rather than silently resolving to a different element on a later page.

Avoid calling on the same uid repeatedly — the result doesn't change until you act.`,
    inputSchema: {
      type: "object",
      properties: {
        uid: { type: "string", description: "Ref id from take_snapshot (e.g. \"ref_1_3\")." },
        seal: { type: "string", description: "Seal returned by the same take_snapshot the uid came from." },
      },
      required: ["uid", "seal"],
    },
  },
];

const EXTENSION_TOOL_NAMES = new Set(EXTENSION_TOOLS.map((t) => t.name));

// ── Generic DOM tool implementations ──────────────────────────
// These run in ISOLATED world but share DOM access with the page.

// Turndown instance for HTML → Markdown conversion (loaded via manifest)
const turndownService = typeof TurndownService !== "undefined"
  ? new TurndownService({ headingStyle: "atx", codeBlockStyle: "fenced", bulletListMarker: "-" })
  : null;

// Remove script, style, svg, noscript tags from conversion
if (turndownService) {
  turndownService.remove(["script", "style", "svg", "noscript", "iframe"]);
}

// (Phase 4 cleanup) The 7 selector-based dom* helpers and the SW-bridge
// getAccessibilityTree wrapper that lived here have been retired alongside
// the deprecation shims they backed. The agent-facing surface is now uid-
// based end-to-end; selectors and raw CDP a11y trees are not part of it.

let askIdCounter = 0;
// Pending askUser/askUserForm Promises register a canceller here so an
// out-of-band CANCEL_PENDING_ASK (e.g. user switched providers mid-ask)
// can resolve them immediately instead of waiting up to 120 s for the
// timeout. Without this, `acting` stays true and a subsequent USER_MESSAGE
// won't start a fresh ReAct loop.
const pendingAskCancelers = new Set();

function askUser({ question, options, allow_free_text }) {
  return new Promise((resolve) => {
    const id = "ask_" + ++askIdCounter;
    console.log(`[AutoBrowser] Asking user: "${question}" (id=${id}, ${options?.length || 0} options)`);

    let settled = false;
    let timeoutId;
    const settle = (value) => {
      if (settled) return;
      settled = true;
      chrome.runtime.onMessage.removeListener(handler);
      pendingAskCancelers.delete(cancel);
      clearTimeout(timeoutId);
      resolve(value);
    };
    const cancel = () => settle("(no answer — cancelled by provider switch or stop)");
    const handler = (msg) => {
      if (msg.type === "USER_ANSWER" && msg.payload?.id === id) {
        console.log(`[AutoBrowser] User answered: "${msg.payload.answer}"`);
        settle(msg.payload.answer);
      }
    };

    pendingAskCancelers.add(cancel);
    chrome.runtime.onMessage.addListener(handler);

    // Send to sidebar
    try {
      chrome.runtime.sendMessage({
        type: "ASK_USER",
        payload: { id, question, options: options || null, allow_free_text: !!allow_free_text },
      });
    } catch (e) {
      settle("(sidebar not open — could not ask user)");
    }

    // Timeout after 2 minutes
    timeoutId = setTimeout(() => settle("(no answer — user did not respond)"), 120000);
  });
}

/**
 * Multi-field variant of askUser. Presents a single form in the sidebar so
 * the user fills every field at once, rather than chaining N `ask_user` calls
 * (which is slow, lossy, and breaks on any reorder/back-edit). Resolves with
 * an object keyed by field.id.
 *
 * Same plumbing as askUser: send ASK_USER_FORM, listen for USER_ANSWER with
 * matching id, 2-minute timeout.
 */
function askUserForm({ title, fields }) {
  return new Promise((resolve) => {
    const id = "askform_" + ++askIdCounter;
    console.log(`[AutoBrowser] Asking user form: "${title}" (id=${id}, ${fields.length} fields)`);

    let settled = false;
    let timeoutId;
    const settle = (value) => {
      if (settled) return;
      settled = true;
      chrome.runtime.onMessage.removeListener(handler);
      pendingAskCancelers.delete(cancel);
      clearTimeout(timeoutId);
      resolve(value);
    };
    const cancel = () => settle("(no answer — cancelled by provider switch or stop)");
    const handler = (msg) => {
      if (msg.type === "USER_ANSWER" && msg.payload?.id === id) {
        console.log(`[AutoBrowser] User submitted form (id=${id})`);
        // answer is an object { fieldId: value } from the sidebar; fall back
        // to a stringified message if the user cancelled.
        settle(msg.payload.answer);
      }
    };

    pendingAskCancelers.add(cancel);
    chrome.runtime.onMessage.addListener(handler);

    try {
      chrome.runtime.sendMessage({
        type: "ASK_USER_FORM",
        payload: { id, title: title || "", fields },
      });
    } catch (e) {
      settle("(sidebar not open — could not ask user)");
    }

    timeoutId = setTimeout(() => settle("(no answer — user did not respond)"), 120000);
  });
}

// ── History summarization ────────────────────────────────────
// When history grows past the threshold, summarize old entries into
// a compact memory and keep only recent entries verbatim.

// Delegates to the shared compactHistory (src/orchestration/history-compaction.js)
// so the CS loop and the relocated SW loop run identical compaction logic.
async function maybeSummarizeHistory() {
  const { compaction } = await loadLLMModules();
  const out = await compaction.compactHistory({
    history: persistentHistory,
    memorySummary,
    budgetChars: HISTORY_BUDGET_CHARS,
    keepChars: HISTORY_KEEP_CHARS,
    fetchLLM,
  });
  if (out) {
    persistentHistory = out.history;
    memorySummary = out.memorySummary;
  }
}

// ── Status reporting ──────────────────────────────────────────

function sendStatus(status) {
  try {
    chrome.runtime.sendMessage({ type: "STATUS_UPDATE", payload: status });
  } catch {}
}

// ── Config & message handling ─────────────────────────────────

chrome.runtime.sendMessage({ type: "GET_CONFIG" }, (res) => {
  if (res) config = mergeConfig(config, res);
  const active = getActiveProviderConfig();
  console.log("[AutoBrowser] Config loaded:", {
    provider: config.provider,
    hasApiKey: !!active.apiKey,
    model: active.model,
  });
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  // Respond to PING so background knows we're alive
  if (msg.type === "PING") {
    sendResponse({ alive: true });
    return;
  }

  // ── Phase 1 SW-loop RPC server ────────────────────────────────────────────
  // When the relocated loop runs in the service worker, it drives THIS tab's
  // perception/DOM through these messages (the refmap can't leave the page).
  // Additive + inert in the shipping (in-CS loop) path: nothing sends these
  // unless the SW-loop is switched on, so the current behavior is unaffected.
  if (msg.type === "PERCEIVE") {
    handleTakeSnapshot(msg.payload || {}).then(sendResponse, (e) => sendResponse({ error: e.message }));
    return true;
  }
  if (msg.type === "RESOLVE_UID") {
    const { uid, seal } = msg.payload || {};
    // Enforce the snapshot seal before resolving so a stale {uid, seal} from a
    // prior snapshot can't mis-resolve against the current refmap.
    const sealErr = enforceSnapshotSeal("resolve_uid", { uid, seal });
    if (sealErr) {
      sendResponse(sealErr);
      return true;
    }
    loadPerceptionModules()
      .then((mods) => sendResponse(resolveUidWithMods(mods, uid)))
      .catch((e) => sendResponse({ error: e.message }));
    return true;
  }
  // The SW loop dispatches EVERY tool through here so the content script's
  // existing executeTool runs the full, tested action path — WebMCP routing,
  // the UID permission/approval/seal gate, nav, evaluate, waits, screenshots.
  if (msg.type === "EXECUTE_TOOL") {
    executeTool(msg.payload?.name, msg.payload?.args || {})
      .then((result) => sendResponse({ result }))
      .catch((e) => sendResponse({ result: { error: e.message } }));
    return true;
  }
  if (msg.type === "DISCOVER_TOOLS") {
    discoverTools().then((tools) => sendResponse({ tools }), (e) => sendResponse({ error: e.message }));
    return true;
  }
  if (msg.type === "EXECUTE_WEBMCP") {
    forwardToWebMCP(msg.payload?.name, msg.payload?.args || {}).then(
      sendResponse,
      (e) => sendResponse({ error: e.message }),
    );
    return true;
  }
  if (msg.type === "INVALIDATE_SNAPSHOT") {
    invalidateSnapshot(msg.payload?.reason || "sw");
    sendResponse({ ok: true });
    return;
  }
  if (msg.type === "PAGE_STATE") {
    sendResponse({ url: location.href, title: document.title });
    return;
  }
  if (msg.type === "PAGE_SIGNATURE") {
    sendResponse({ signature: getPageSignature() });
    return;
  }
  // The SW loop routes its LLM call here so the (page-context) ReAct prompt
  // builder + provider call stay in one place. The SW passes its own history.
  if (msg.type === "CALL_LLM") {
    const { tools, history, phase } = msg.payload || {};
    // Capture parse-failure metadata so the SW loop's fatal-parse short-circuit
    // can see it (mirrors cs-host's per-call capture); without it a fatal parse
    // failure crossing the RPC would be downgraded to an ordinary retry. Also
    // return the per-call thought text (native stream OR decision.thought, the
    // single canonical copy) so the SW host can reproduce the <thinking>-block
    // assistant-history contract that lives in content.js's lastCallThoughtText.
    let parseInfo = null;
    callReActLLM(tools || [], history || [], { phase: phase || "act", onParseFailure: (info) => { parseInfo = info; } })
      .then((decision) => sendResponse({ decision, parseInfo, thoughtText: lastCallThoughtText || decision?.thought || "" }))
      .catch((e) => sendResponse({ decision: null, parseInfo, thoughtText: "", error: e.message }));
    return true;
  }
  // Raw LLM primitive for the SW loop's cognitive subsystems (post-action
  // validator, recovery, history summarization). Unlike CALL_LLM, these build
  // their OWN prompts (validator/recovery/compaction system messages), so they
  // bypass callReActLLM and call fetchLLM directly — mirroring how the
  // content-script loop runs them in-page. JSON-safe options only (no callbacks).
  if (msg.type === "FETCH_LLM") {
    const { messages, options } = msg.payload || {};
    fetchLLM(messages || [], options || {})
      .then((result) => sendResponse({ result }))
      .catch((e) => sendResponse({ result: null, error: e.message }));
    return true;
  }
  // Post-action validation for the SW loop. Routes to the SAME adapter the
  // content-script loop uses — it owns the applicability gate (submit-shaped via
  // lastSnapshotText), the validator deps (live now()/waits/console), the LLM
  // call, and the validator_running/verdict status emission. The SW just hands it
  // the loop inputs and consumes the verdict.
  if (msg.type === "VALIDATE_ACTION") {
    const { decision, preState, toolMutated, resultIsError } = msg.payload || {};
    runPostActionValidatorIfApplicable({ decision, preState, toolMutated, resultIsError })
      .then((verdict) => sendResponse({ verdict: verdict ?? null }))
      .catch((e) => sendResponse({ verdict: null, error: e.message }));
    return true;
  }

  // Diagnostic only: USER_ANSWER is consumed by per-call listeners installed
  // by askUser(); this top-level handler just logs the arrival so we can spot
  // the case where the answer reaches the page but the askUser promise was
  // never set up (e.g. agent stopped between dispatching ASK_USER and the
  // answer coming back). Don't act on it here — askUser() owns the resolution.
  if (msg.type === "USER_ANSWER") {
    console.log(`[AutoBrowser] USER_ANSWER arrived at content script:`, msg.payload);
  }

  if (msg.type === "SET_CONFIG" || msg.type === "CONFIG_UPDATED") {
    config = mergeConfig(config, msg.payload || {});
  }

  // Mid-run arming/disarming of "Auto-approve this task" from the composer.
  // Set-only: it never resets per-turn state, so there's no ordering race with
  // the USER_MESSAGE that starts a turn (that message is the authoritative
  // per-turn source via payload.autoApproveTurn).
  if (msg.type === "SET_TURN_AUTO_APPROVE") {
    perTurnAutoApprove = !!msg.payload?.on;
    return;
  }

  // SW reports the main frame just navigated. Bump the refmap seal so any
  // ref_N the agent still holds in the conversation history fails closed —
  // the next uid-based call returns a stale-snapshot error pointing at
  // take_snapshot. Subframe navs don't reach here (SW filters them out).
  if (msg.type === "FRAME_NAVIGATED") {
    resetPerTurnState("frame_navigated");
    return;
  }

  // User sent a chat message → start or restart the agent
  if (msg.type === "USER_MESSAGE") {
    const userText = msg.payload?.text || "";
    const attachmentsRaw = Array.isArray(msg.payload?.attachments)
      ? msg.payload.attachments
      : [];
    const attachments = attachmentsRaw.map(decodeAttachmentDataUrl).filter(Boolean);
    console.log(
      "[AutoBrowser] User message:",
      userText,
      attachments.length > 0 ? `(+${attachments.length} attachment[s])` : "",
    );

    // Fresh user intent lifts the task-complete gate so auto-wakeups can fire
    // again for the new request. Do this BEFORE startAgent() so the first
    // reactLoop of the new task isn't gated.
    taskCompleted = false;
    // Also clear the runaway-wakeup safety rail so the new task gets a full
    // budget of MAX_CONSECUTIVE_WAKEUPS fresh invocations before tripping.
    consecutiveWakeups = 0;
    maxWakeupsAnnounced = false;
    // Per-turn perception state (refmap, grants, cached snapshot text) is
    // keyed to "one user instruction" — bump the seal now so any ref_N the
    // LLM still has in its history is invalidated before the new turn starts.
    resetPerTurnState("user_message");
    // Authoritative per-turn auto-approve for this turn. Armed in the composer
    // and carried on the message, so it's set atomically as the turn starts
    // (and reset whenever a later message arrives without the flag). Set AFTER
    // resetPerTurnState — which intentionally leaves it alone — and BEFORE
    // startAgent() so the turn's very first action already sees it.
    perTurnAutoApprove = !!msg.payload?.autoApproveTurn;
    resetWorkingMemory();

    // If this is a resumption (history already exists), push the new message
    // as a fresh user turn plus a system-reminder telling the model to resume
    // directly rather than echoing stale decisions.
    if (persistentHistory.length > 0) {
      queueReminder(
        "The user just sent a new instruction after a pause. Resume directly — do not recap what was happening, do not acknowledge the break. Reassess against the current tool list and act on the new instruction.",
      );
      pushUserMessage(userText, attachments);
    } else if (attachments.length > 0) {
      // Fresh conversation: still stash attachments in history so the first
      // ReAct call carries them. Text alone goes through `userInstruction`
      // in the environment block, but attachments need a real user turn.
      pushUserMessage(userText, attachments);
    }
    userInstruction = userText;

    // If polling, stop and restart with new instruction
    if (pollTimer) {
      stopPolling();
    }
    // If not currently in a ReAct step, start fresh
    if (!acting) {
      activeLoop = false;
      prevToolNames = "";
      startAgent();
    }
    // If acting (mid-ReAct), the new userInstruction will be picked up next step
  }

  // User clicked stop
  if (msg.type === "STOP_AGENT") {
    console.log("[AutoBrowser] STOP received — stopping all loops");
    stopped = true;
    stopPolling();
    activeLoop = false;
    acting = false;
    // Abort any in-flight LLM fetch so we don't wait for it to return.
    if (currentAbortCtl) {
      try { currentAbortCtl.abort(); } catch {}
    }
    // Drop any queued reminders — by the time the user re-engages, the
    // page state they referenced ("tools just changed", "new hand started")
    // is likely stale and would mislead the next turn.
    pendingReminders = [];
    // Clean slate for the next engagement. A USER_MESSAGE after STOP also
    // resets these, but zeroing here keeps state consistent with `disengaged`.
    taskCompleted = false;
    consecutiveWakeups = 0;
    maxWakeupsAnnounced = false;
    resetWorkingMemory();
    sendStatus({ state: "disengaged" });
  }

  // CANCEL_PENDING_ASK: sidebar fired CLEAR_PENDING_ASK after a provider
  // switch or other UI-side abandonment of the in-flight ask. Resolve all
  // pending askUser/askUserForm Promises so the orphaned reactLoop unwinds
  // immediately. Set `stopped = true` BEFORE triggering the cancellers so
  // the post-executeTool guard at the top of the action branch (
  // `if (stopped) return;`) short-circuits before sendStatus("tool_result")
  // fires — otherwise a stale {kind:"tool_result", tool:"ask_user", result:
  // {answer: sentinel}} would land in storage and pollute the chat-only
  // conversation. We deliberately do NOT emit a "disengaged" STATUS_UPDATE:
  // the sidebar has already moved on to chat-only mode, and a stray
  // setAgentBusy(false) from disengaged would override an in-progress
  // chat-only send.
  if (msg.type === "CANCEL_PENDING_ASK") {
    if (pendingAskCancelers.size > 0) {
      console.log(`[AutoBrowser] CANCEL_PENDING_ASK — cancelling ${pendingAskCancelers.size} pending ask(s)`);
      stopped = true;
      for (const cancel of [...pendingAskCancelers]) {
        try { cancel(); } catch {}
      }
    }
  }

  // Sidebar eraser button. Background always relays this on CLEAR_SESSION,
  // even when the agent wasn't busy (STOP_AGENT only fires in the busy path).
  // We own the conversation the model actually sees — persistentHistory and
  // memorySummary — so clearing storage + DOM without clearing these leaves
  // the model fully aware of the "cleared" turns on the next message.
  if (msg.type === "CLEAR_SESSION") {
    console.log("[AutoBrowser] CLEAR_SESSION — wiping in-memory conversation");
    // Belt-and-suspenders abort: if the clear happened mid-turn, STOP_AGENT
    // may race this message, and if it happened post-turn, STOP_AGENT never
    // arrives. Aborting here prevents an in-flight LLM response from landing
    // in pushAssistantMessage and re-populating the just-cleared history.
    stopped = true;
    stopPolling();
    activeLoop = false;
    acting = false;
    if (currentAbortCtl) {
      try { currentAbortCtl.abort(); } catch {}
    }
    persistentHistory = [];
    memorySummary = "";
    pendingReminders = [];
    // flushReminders() is the only other clearer of this latch, and it
    // early-returns when pendingReminders is empty — which is the state
    // we just put it in. Without resetting here, a boundary-armed latch
    // from the pre-clear session survives and forces a wasted LLM call
    // on the first poll after the next USER_MESSAGE.
    pendingBoundaryWakeup = false;
    taskCompleted = false;
    consecutiveWakeups = 0;
    maxWakeupsAnnounced = false;
    userInstruction = "";
    resetPerTurnState("clear_session");
    resetWorkingMemory();
  }
});

let userInstruction = ""; // latest user instruction for the LLM

// ── Agent lifecycle ──────────────────────────────────────────

async function startAgent() {
  stopped = false;
  activeLoop = true;
  consecutiveWaits = 0;
  prevPageSignature = getPageSignature();

  // Initial ReAct run triggered by user message
  const tools = await discoverTools();
  if (tools.length > 0) {
    acting = true;
    try {
      await reactLoop(tools);
    } catch (err) {
      console.error("[WebMCP] ReAct error:", err);
      sendStatus({ state: "error", message: err.message });
    } finally {
      acting = false;
    }
  }

  if (!stopped) {
    startPolling();
  } else {
    activeLoop = false;
  }
}

// ── Polling ───────────────────────────────────────────────────
function startPolling() {
  stopPolling();
  pollTimer = setInterval(pollForChanges, pollIntervalMs);
  // No status emit here — reactLoop always fires `turn_ended` immediately
  // before startPolling runs (see startAgent and pollForChanges finally),
  // and the sidebar derives "watching..." from that. Emitting polling here
  // would just cause a redundant back-to-back update.
  console.log(`[AutoBrowser] Polling started (${pollIntervalMs}ms)`);
}

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

let pollCount = 0;
let consecutiveWaits = 0; // Track how many polls with no change
let prevPageSignature = ""; // For non-WebMCP page change detection
const MAX_IDLE_POLLS = 60; // Disengage after this many unchanged polls

function getPageSignature() {
  return `${location.href}|${document.title}|${document.body?.children.length || 0}`;
}

async function pollForChanges() {
  if (acting) return;
  // Stop-hook gate: any registered policy (user_stopped, task_complete,
  // max_wakeups, …) can veto starting a new reactLoop. We still keep
  // polling ticking so lifecycle signals (USER_MESSAGE) can resume us —
  // we just skip the expensive reactLoop work while a hook says no.
  // Hooks that already emitted a terminal event (task_complete) don't
  // re-emit; those that detect a fresh condition (max_wakeups crossing
  // the cap) emit once here, then stay latched silently.
  const stop = checkStopHooks();
  if (stop) {
    if (stop.hook === "max_wakeups" && !maxWakeupsAnnounced) {
      maxWakeupsAnnounced = true;
      console.log("[WebMCP] Max consecutive wakeups hit — pausing auto-invocation");
      sendTurnEnded(stop.reason);
    }
    return;
  }

  const tools = await discoverTools();
  const toolNames = currentWebMCPToolKey(tools);
  const hasWebMCP = toolNames.length > 0;

  pollCount++;

  let shouldAct = false;

  let changeHint = "";

  if (hasWebMCP) {
    // WebMCP pages: trigger on tool set changes
    const toolsChanged = toolNames !== prevToolNames;
    if (toolsChanged) {
      // Tool-set changed ⇒ the page committed new state between turns;
      // any uid the agent held belongs to a previous DOM state.
      invalidateSnapshot("toolset_changed");
      console.log(`[WebMCP] Tools changed: [${prevToolNames}] → [${toolNames}]`);
      const prev = new Set(prevToolNames ? prevToolNames.split(",") : []);
      const curr = new Set(toolNames.split(",").filter(Boolean));
      const added = [...curr].filter((n) => !prev.has(n));
      const removed = [...prev].filter((n) => !curr.has(n));
      const parts = [];
      if (added.length) parts.push(`new: ${added.join(", ")}`);
      if (removed.length) parts.push(`gone: ${removed.join(", ")}`);
      // Tool-set change has two very different meanings:
      //  - tools ADDED → an action is now available (act now)
      //  - tools REMOVED (only) → your action window just closed — turn/hand
      //    ended or someone else is now up. Do NOT reason further about the
      //    unfinished situation; just end your turn.
      const onlyRemoved = removed.length > 0 && added.length === 0;
      if (onlyRemoved) {
        changeHint = `Page tool set changed (${parts.join("; ")}). Your action window just closed — your turn ended, someone else is acting, or the hand finished. Do not speculate about outcomes; end your turn now by returning {"done": true}. You'll be woken when a new action is available.`;
      } else {
        changeHint = `Page tool set changed (${parts.join("; ")}). The app is prompting action. Reassess against the current tool list and act.`;
      }
      prevToolNames = toolNames;
      shouldAct = true;
    }
  } else {
    // Non-WebMCP pages: trigger on page content changes (URL, title, DOM structure)
    const sig = getPageSignature();
    if (sig !== prevPageSignature) {
      // DOM shifted between turns without the agent acting (page navigated,
      // SPA route change, async render). Any uid the agent held is stale.
      invalidateSnapshot("page_changed");
      console.log(`[WebMCP] Page changed: ${prevPageSignature} → ${sig}`);
      changeHint = "Page content changed (URL, title, or DOM). Re-read the page if needed and continue the task.";
      prevPageSignature = sig;
      shouldAct = true;
    }
  }

  // Boundary wakeup: a `*_changed` context-invalidated event was queued but
  // the tool set didn't diff (same-tools-across-context case — e.g. new poker
  // hand exposing the same action tools as the prior). Without this trigger
  // the queued reminder would never be delivered and the agent would sit
  // idle until the page's own action timer fires. Reminders themselves carry
  // the change-hint text, so no synthetic hint is needed here.
  if (!shouldAct && pendingBoundaryWakeup) {
    console.log(`[WebMCP] Boundary wakeup — firing reactLoop with queued reminders (${pendingReminders.length})`);
    shouldAct = true;
  }

  if (!shouldAct) {
    consecutiveWaits++;
    if (pollCount === 1 || pollCount % 30 === 0) {
      console.log(`[WebMCP] Polling... (${pollCount} cycles, idle=${consecutiveWaits})`);
    }
    // Disengage heuristic: only on non-WebMCP pages. WebMCP pages have an
    // explicit "tell me when to act" contract via tool-set changes, so
    // idle-but-alive is the expected steady state — never give up.
    if (!hasWebMCP && consecutiveWaits >= MAX_IDLE_POLLS) {
      console.log("[WebMCP] Too many idle polls on non-WebMCP page — disengaging");
      stopPolling();
      sendStatus({ state: "agent_message", text: "No page changes detected for a while. I'll stop watching. Send me a message to resume." });
      sendStatus({ state: "disengaged" });
      activeLoop = false;
    }
    return;
  }

  consecutiveWaits = 0;
  consecutiveWakeups++;
  acting = true;
  stopPolling();

  // Tell the LLM what just changed so it doesn't echo a stale "wait" decision.
  // Queue so it gets wrapped into the next user message (tool result or user text).
  if (changeHint) queueReminder(changeHint);

  try {
    await reactLoop(tools);
  } catch (err) {
    console.error("[WebMCP] ReAct error:", err);
    sendStatus({ state: "error", message: err.message });
  } finally {
    acting = false;
    if (!stopped) startPolling();
  }
}

// Stringify with sorted keys at every level so dedup keys are stable
// regardless of the order the LLM emitted fields in.
function stableStringify(val) {
  if (val === null || typeof val !== "object") return JSON.stringify(val);
  if (Array.isArray(val)) return `[${val.map(stableStringify).join(",")}]`;
  const keys = Object.keys(val).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(val[k])}`).join(",")}}`;
}

// ── ReAct loop ───────────────────────────────────────────────
// LLM sees tools + conversation history, decides what to do.
// Loops until LLM ends the turn ({"done": true} or no tool call), then returns to polling.

/**
 * End-of-turn tool refresh (Claude Code pattern) — runs once per turn instead
 * of after every step. Updates `prevToolNames` so the next poll cycle doesn't
 * re-trigger reactLoop just because OUR own action changed the tool set. If
 * tools genuinely change later, polling will see it.
 */
async function refreshToolsForNextPoll() {
  if (stopped) return;
  try {
    const refreshed = await discoverTools();
    prevToolNames = currentWebMCPToolKey(refreshed);
  } catch { /* ignore */ }
}

// How many times we'll retry an unparseable LLM response within a single
// turn before bailing out. The retry reminder now includes the raw failed
// output + a classified reason + a truncation flag, which materially
// improves the model's chance of self-correcting — 3 attempts trades a
// slightly longer user-visible stall for a much better recovery rate.
const MAX_PARSE_FAILURES_PER_TURN = 3;

// Truncate a long string toward the head + tail, keeping the most useful
// signal (shape at the start, truncation point at the end) within a bounded
// token budget. Used for the retry reminder's raw-output echo.
// Parse-failure + fatal-failure copy lives in
// src/orchestration/failure-messages.js — react-loop defaults to it, so the
// SW loop (the default route, built with `config: {}`) gets the same text.

async function reactLoop(initialTools) {
  // Phase 0 — the ReAct control loop now lives in src/orchestration/react-loop.js
  // (runReactLoop), driven through a host built from this content script's own
  // functions + state. Same loop, extracted so Phase 1 can run it in the service
  // worker. The host obligations (per-call parse-failure capture, recovery key
  // mapping, the <thinking> prefix on persisted turns) are owned + tested in
  // cs-host.js; the control flow is characterization-tested in react-loop.test.js.
  const [{ runReactLoop }, { createContentScriptHost }, { isReadOnlyTool }] = await Promise.all([
    import(chrome.runtime.getURL("src/orchestration/react-loop.js")),
    import(chrome.runtime.getURL("src/orchestration/cs-host.js")),
    import(chrome.runtime.getURL("src/llm/read-only-tools.js")),
  ]);

  const host = createContentScriptHost({
    callReActLLM,
    getHistory: () => persistentHistory,
    recordParseFailureDiag: (info) => {
      try {
        // Bucket truncation separately from genuine syntax errors. Providers
        // already compute `truncated` from the finish reason, but folding it
        // into the generic reason made a starved token budget look identical
        // to a model emitting malformed JSON — the two need opposite fixes.
        const reason = info?.reason === "provider_http_error"
          ? `http:${info.status || "unknown"}`
          : info?.truncated
            ? `truncated:${info.finishReason || "unknown"}`
            : (info?.reason || "unknown");
        chrome.runtime
          .sendMessage({
            type: "RECORD_DIAG",
            payload: { kind: "parse_failure", reason },
          })
          .catch(() => {});
      } catch {
        /* runtime gone (extension reload) — nothing to report */
      }
    },
    runRecovery,
    getUrl: () => location.href,
    getTitle: () => document.title,
    isStopped: () => stopped,
    stop: () => {
      stopped = true;
      activeLoop = false;
      stopPolling();
    },
    markTaskComplete: () => {
      taskCompleted = true;
      pendingReminders = [];
      pendingBoundaryWakeup = false;
    },
    markDisengaged: () => sendStatus({ state: "disengaged" }),
    emitStatus: sendStatus,
    persistAssistant: (decision) => persistAssistantTurn(decision, lastCallThoughtText),
    pushAssistantMessage,
    executeTool,
    advisory: getWorkingMemoryAdvisory,
    recordMemory: recordDerivedMemory,
    pushToolResult,
    invalidateSnapshot,
    runValidator: runPostActionValidatorIfApplicable,
    queueReminder,
    flushReminders: flushPendingReminders,
    discoverTools,
    endTurn: sendTurnEnded,
    isReadOnly: isReadOnlyTool,
    isWebMCP: (tool) => currentWebMCPNames.has(tool),
    settle: () => new Promise((r) => setTimeout(r, 150)),
    refreshToolsForNextPoll,
    maybeSummarizeHistory,
  });

  return runReactLoop(host, {
    initialTools,
    maxSteps: Number.isFinite(config.maxSteps) && config.maxSteps > 0 ? config.maxSteps : 50,
    maxParseFailures: MAX_PARSE_FAILURES_PER_TURN,
    exitReasons: EXIT_REASONS,
    readDecisionPhase,
    readDecisionLabel,
    stableStringify,
  });
}

// ── LLM helpers ──────────────────────────────────────────────

function formatToolList(tools) {
  return tools
    .map((t) => {
      // Prefer a page-provided human `title` over the machine `name`
      // when rendering; keep `name` in parentheses so the model knows
      // what string to actually call. WebMCP page authors set title
      // for readable prompts.
      const heading = t.title && typeof t.title === "string" && t.title !== t.name
        ? `${t.title} (${t.name})`
        : t.name;
      let desc = `- ${heading}: ${t.description}`;
      // Surface readOnlyHint so the model knows this tool is a read and
      // can be used without worrying about commit semantics or permission
      // friction (today informational; future may gate permission flow).
      if (t.annotations && t.annotations.readOnlyHint === true) {
        desc += " [read-only]";
      }
      // Surface untrustedContentHint so the model treats the output as
      // page-derived and non-authoritative — important for tools that
      // return raw network/console/eval bytes that look like ground truth.
      if (t.annotations && t.annotations.untrustedContentHint === true) {
        desc += " [untrusted output]";
      }
      if (t.inputSchema?.properties) {
        const required = Array.isArray(t.inputSchema.required) ? new Set(t.inputSchema.required) : new Set();
        const params = Object.entries(t.inputSchema.properties)
          .map(([k, v]) => {
            const req = required.has(k) ? "*" : "";
            const enumStr = Array.isArray(v.enum) ? ` {${v.enum.map((x) => JSON.stringify(x)).join("|")}}` : "";
            return `${k}${req} (${v.type || "any"})${enumStr}: ${v.description || ""}`;
          })
          .join(", ");
        if (params) desc += ` | params: ${params}`;
      }
      return desc;
    })
    .join("\n");
}

/**
 * Shared LLM fetch with streaming support.
 * Tries streaming first for real-time display, falls back to non-streaming.
 */
/**
 * Unified entry point for all LLM calls (ReAct + compaction).
 *
 * Delegates to the LLM provider adapter selected by `config.provider`
 * ("openrouter" | "builtin-ai"). Every adapter fulfils the same contract —
 * parses JSON, streams cumulative tokens, respects the serial abort controller.
 *
 * @param {Array} messages   OpenAI-shaped chat messages (system first, then user/assistant turns).
 * @param {object} [opts]
 * @param {object} [opts.schema]   JSON Schema for response_format / responseConstraint. Omit for freeform text.
 * @param {boolean} [opts.rawText] When true, return the raw string instead of parsing JSON.
 */
// Cross-context status updates that carry a cumulative prefix are coalesced:
// the payload grows with every delta, so forwarding each one makes the traffic
// quadratic in token count. Trailing-edge, with an explicit flush so the final
// value is never dropped or delivered out of order.
const THOUGHT_UPDATE_MS = 50;

// Live updates carry only the tail. Coalescing alone bounds how OFTEN we send,
// not how MUCH: each message still held the whole prefix, so total transfer
// stayed quadratic in output length. The bubble only ever shows the end of the
// trace, so the intermediate messages do not need the rest — the complete text
// is sent once by flush(), which keeps the persisted record whole.
const THOUGHT_LIVE_TAIL = 4096;

// A TRANSPORT guard, not the durable policy. Deliberately far above
// per-tab-state's THOUGHT_TEXT_CAP so an oversize thought still arrives
// oversize and storage's own truncation marker fires — capping to that policy
// here would pre-empt the marker and show a cut trace as if it were complete.
// This is a content script, loaded by the manifest rather than bundled, so it
// cannot import the policy; keeping the two at different magnitudes means they
// answer different questions and cannot drift into disagreement.
const THOUGHT_TRANSPORT_CAP = 64 * 1024;

function coalesceStatus(intervalMs, emit) {
  let pending = null;
  let timer = null;
  const send = () => {
    timer = null;
    // An empty value is "nothing to say", not a status worth publishing.
    if (pending === null || pending === "") { pending = null; return; }
    const value = pending;
    pending = null;
    emit(value);
  };
  const push = (value) => {
    pending = value;
    if (timer === null) timer = setTimeout(send, intervalMs);
  };
  push.flush = (finalValue) => {
    if (timer !== null) { clearTimeout(timer); timer = null; }
    if (finalValue !== undefined) pending = finalValue;
    send();
  };
  return push;
}

async function fetchLLM(messages, { schema, rawText = false, thinkingMode, caller = "turn-root", onParseFailure, toolUse = null } = {}) {
  let mods;
  try {
    mods = await loadLLMModules();
  } catch {
    return null;
  }
  const providerId = config.provider || "openrouter";
  const providerConfig = getActiveProviderConfig();
  // Providers own their own wire format: they call normalizeFor* internally
  // using their own supportsModality probe. We hand them our internal shape
  // and trust the adapter to convert (see openrouter-provider.js / builtin-
  // ai-provider.js `toWireMessages`). This removes the fragile "check shape
  // here, check shape there" coupling that the code review flagged.
  const provider = mods.provider.getProvider(providerId, {
    ...providerConfig,
    model: providerConfig.model || DEFAULT_MODELS[providerId] || "",
  });

  // Reasoning arrives as the whole accumulated prefix on every delta, so an
  // unthrottled forward is quadratic in token count across the extension IPC
  // boundary. Coalescing keeps the cumulative shape the consumers expect while
  // making the traffic proportional to elapsed time instead of token count.
  // Two states, deliberately. The live preview carries only a tail, so
  // persisting it would leave a suffix as the durable record if the turn is torn
  // down mid-stream; the persister ignores tails and keeps only the final value.
  const emitThought = coalesceStatus(THOUGHT_UPDATE_MS, (text) =>
    sendStatus({ state: "stream_thought_tail", text }));
  // Whether THIS call produced reasoning. `lastCallThoughtText` is module-level
  // and only cleared by a root call, so without this a nested call's teardown
  // republishes its parent's thought, and a call with no reasoning at all
  // publishes an empty one — a blank row in the persisted record either way.
  let thoughtObserved = false;

  // Suppress stream-start/end status for nested calls (validator, recovery).
  // The sidebar's typing-bubble is a per-turn affordance — flashing it on/off
  // mid-step would add visual noise. Caller-aware status emit keeps the
  // step-row's existing busy state during the inner LLM call.
  const isNested = caller !== "turn-root";
  if (!isNested) sendStatus({ state: "stream_start" });

  // Single-in-flight invariant: the turn-root call OWNS currentAbortCtl;
  // nested calls (caller != "turn-root") REUSE it so a user STOP aborts
  // both the parent and the nested call atomically. This preserves the
  // "one in-flight LLM call per tab" invariant from PROJECT.md §6.
  if (!isNested) {
    currentAbortCtl = new AbortController();
  }
  const signal = currentAbortCtl ? currentAbortCtl.signal : undefined;

  // Resolve the thinking mode once per call. Caller (callReActLLM) may have
  // already supplied a mode that matches its prompt-cache partition; for
  // ad-hoc rawText calls (compaction) we resolve here using the same helper.
  const mode =
    thinkingMode ||
    mods.thinkingMode.resolveThinkingMode({ provider: providerId, config: providerConfig });

  // Reset the per-call thought capture only on the turn-root call. Nested
  // calls (validator, recovery) MUST NOT clobber the parent step's captured
  // thought — that would overwrite the navigator's reasoning in history with
  // the validator's reasoning.
  if (!isNested) lastCallThoughtText = "";

  try {
    const result = await provider.call({
      messages,
      schema,
      rawText,
      signal,
      // Not wired. The providers hand `onToken` the whole accumulated prefix on
      // every delta, so forwarding it made cross-context traffic quadratic in
      // token count — ~200M characters of structured clone for a 940 KB
      // response. Nothing consumed it: the sidebar's `stream_token` case is a
      // bare break and persist-status drops it as an ephemeral tick. A future
      // consumer should take deltas rather than prefixes.
      onToken: undefined,
      // Only forward the native channel to onThought when mode says so. In
      // "off" or "schema-thought" mode we do NOT surface raw provider
      // reasoning tokens — the user toggle is respected end-to-end. Nested
      // calls suppress the surface entirely so the navigator's thought
      // bubble isn't polluted by the validator's reasoning.
      onThought:
        !isNested && mode.native
          ? (text) => {
              const value = String(text || "");
              if (!value) return;
              thoughtObserved = true;
              lastCallThoughtText = value;
              emitThought(value.slice(-THOUGHT_LIVE_TAIL));
            }
          : undefined,
      thinking: modeToWireThinking(mode),
      onParseFailure,
      // Phase 1.1 — providers that support native tool-use (OpenRouter on
      // capable models, Gemini) switch to tools[] / functionDeclarations
      // when a non-empty manifest is passed. Others ignore it and fall
      // through to JSON-in-text. Decision shape is identical either way.
      toolUse,
    });
    // §5.2 (parse_failure_rate denominator) — record the LLM attempt
    // for any call that EXPECTED a parseable decision (rawText:false).
    // Fires regardless of outcome (success / null / parse-fail) so the
    // ratio with `parse_failures` reflects real reliability. Aborted
    // calls land in the catch below and are NOT counted — that's the
    // intended bias: user-driven stops shouldn't make the rate look
    // better than it is. Nested calls (validator/recovery) ARE counted
    // because they parse too and the eval harness wants their reliability.
    if (!rawText) reportLLMAttempt(providerId);
    // Schema-thought path: the model emitted `thought` in the parsed JSON.
    // Route it through the same status channel so the UI's thought bubble
    // updates from a single source. Fires once at parse time. Nested calls
    // skip this for the same reason as onThought above.
    if (
      !isNested &&
      result &&
      typeof result === "object" &&
      mode.schemaThoughtRequested &&
      typeof result.thought === "string" &&
      result.thought
    ) {
      // Recorded, not sent: the single publish in `finally` covers both the
      // native and schema paths, so this no longer emits the same text twice.
      thoughtObserved = true;
      lastCallThoughtText = result.thought;
    }
    return result;
  } catch (err) {
    if (err?.name === "AbortError") return null;
    console.error("[AutoBrowser] LLM call failed:", err);
    return null;
  } finally {
    // Publish the COMPLETE text once, before the end marker: the live updates
    // carried only a tail, and this is what the persisted record keeps. Ordered
    // before the marker so a late update cannot resurrect a stale thought, and
    // gated on this call having actually produced reasoning.
    emitThought.flush("");
    if (!isNested && thoughtObserved) {
      // `totalChars` travels with the prefix so the durable owner can state the
      // real omission. Without it storage measures only what survived transport
      // and under-reports by the slice, and the live view shows an unmarked
      // prefix while replay shows a marked one.
      sendStatus({
        state: "stream_thought",
        text: lastCallThoughtText.slice(0, THOUGHT_TRANSPORT_CAP),
        totalChars: lastCallThoughtText.length,
      });
    }
    if (!isNested) sendStatus({ state: "stream_end" });
    provider.dispose?.();
  }
}

// Fire-and-forget RECORD_DIAG with kind:"llm_attempt". Symmetric with
// the parseFailureCapture path — content script counts the attempt,
// service worker aggregates. Wrapped in try because the runtime can be
// gone (extension reload between turns) and we don't want a missing
// denominator to throw inside fetchLLM.
function reportLLMAttempt(provider) {
  try {
    chrome.runtime
      .sendMessage({
        type: "RECORD_DIAG",
        payload: { kind: "llm_attempt", provider },
      })
      .catch(() => {});
  } catch { /* runtime gone — nothing to report */ }
}

/**
 * Build a human-readable "now" string for the system prompt. Rebuilt on every
 * LLM call (see callReActLLM) so it can never go stale across long-running
 * conversations — even if the agent has been idle for hours or history has
 * been summarized, the next turn's system message carries a fresh anchor.
 *
 * Format targets LLM legibility: weekday + ISO date + local time + IANA zone
 * + UTC offset. The ISO date lets the model compute relative dates ("tomorrow"
 * = today + 1d) without ambiguity, while the weekday and zone give it human
 * context for scheduling-style reasoning.
 */
function formatNowForPrompt() {
  const d = new Date();
  // Drop the millisecond fragment — noise for a prompt anchor where
  // second-level precision is already far finer than anything the LLM
  // would reason about. "2026-04-15T19:23:04Z" vs "...:04.817Z".
  const iso = d.toISOString().replace(/\.\d{3}Z$/, "Z");
  let localStr = "";
  let zone = "";
  try {
    const fmt = new Intl.DateTimeFormat(undefined, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZoneName: "short",
    });
    localStr = fmt.format(d);
    zone = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
  } catch {
    localStr = d.toString();
  }
  // Offset in ±HH:MM (getTimezoneOffset returns minutes where +NY = -240,
  // so invert the sign for the conventional display).
  const offMin = -d.getTimezoneOffset();
  const sign = offMin >= 0 ? "+" : "-";
  const abs = Math.abs(offMin);
  const offStr = `${sign}${String(Math.floor(abs / 60)).padStart(2, "0")}:${String(abs % 60).padStart(2, "0")}`;
  const zonePart = zone ? `${zone}, UTC${offStr}` : `UTC${offStr}`;
  return `${localStr} (${zonePart}; ISO ${iso})`;
}

/** ReAct LLM call — full tool list + user instruction + history. */
async function callReActLLM(tools, history, { phase = "act", onParseFailure } = {}) {
  const pageUrl = location.href;
  const pageTitle = document.title;
  const derivedMemoryPrompt = await getDerivedMemoryPrompt();
  const providerId = config.provider || "openrouter";
  const providerConfig = getActiveProviderConfig();

  // Resolve thinking mode at call time. The static system prefix below is
  // identical across calls for a given (provider, mode-key) pair so prompt
  // caching still hits — the per-phase + per-mode "thought rule" rider goes
  // into the DYNAMIC environment message, not the static prefix.
  let mode = { native: false, schemaThoughtRequested: false };
  try {
    const mods = await loadLLMModules();
    mode = mods.thinkingMode.resolveThinkingMode({ provider: providerId, config: providerConfig });
  } catch { /* fetchLLM will resolve again on its own */ }

  // Separate WebMCP tools from built-in tools for the prompt.
  // `currentWebMCPNames` is the source of truth for which tools came from
  // the page's modelContext (set by discoverTools). Collisions with built-ins
  // were resolved there — the page version is the only one in `tools` for
  // that name, and routing goes to the page bridge.
  const webmcpTools = tools.filter((t) => currentWebMCPNames.has(t.name));
  const hasWebMCP = webmcpTools.length > 0;
  const builtInToolList = formatToolList(
    tools.filter((t) => !currentWebMCPNames.has(t.name)),
  );

  // PROMPT-CACHE ARCHITECTURE — everything that varies per-call (timestamp,
  // URL, title, user's free-text system prompt, WebMCP tool set) lives in
  // `environmentMsg` below as a separate user message. The `systemMessage`
  // string below is 100% static across calls for a given extension build,
  // so providers with prefix caching (OpenRouter→Anthropic, etc.) cache it
  // once and reuse it for the whole session instead of paying a cache miss
  // every ~second when the ISO timestamp ticks forward.
  //
  // Note: `builtInToolList` is also static — EXTENSION_TOOLS is a const,
  // and discoverTools always returns it unchanged — so it's safe inside
  // the cacheable prefix.
  const systemMessage = `You are a browser-automation agent operating under a TOOL PREFERENCE PROTOCOL.

Your job is not to confirm every step — it's to execute the user's stated intent with the fewest atomic actions, stopping only when the task is complete or genuinely ambiguous. Tool calls are cheap and reversible within a task; ask_user is expensive.

TOOL PREFERENCE PROTOCOL — read this before every tool call.

Two tool surfaces are available on every turn:
  (A) WEBMCP TOOLS — listed in the environment message below. Page-authored,
      semantic, atomic, server-validated. One call usually replaces a
      snapshot+click+fill chain. They are pre-bound by the page; they do
      NOT take uids and do NOT require take_snapshot.
  (B) BUILT-IN TOOLS — the generic CDP fallback (take_snapshot, click,
      fill, navigate, evaluate_script, …). Use only when no WebMCP tool
      covers the intent.

DECISION ORDER (apply on every turn before emitting a tool call):
  1. Read the WEBMCP TOOLS section of the environment message. For EACH
     tool, read BOTH its name AND its description + params. Does any
     tool cover the user's WHOLE stated intent in ONE call — "book a
     table," "place this order," "submit the listing," "log in"? If
     YES → call it. Stop here.
  1a. If the whole intent is algorithmic — many calls through per-step
     WebMCP tools, whether identical (bulk delete, 30-SKU cart fill) or
     read-then-decide in a loop (maze solve, play N game turns) — do NOT
     spend N LLM turns on it. Author ONE \`evaluate_script\` that drives
     the loop and calls the page's own shim via
     \`(document.modelContext || navigator.modelContext).__autobrowser_webmcp_shim_v1_handle.execute(name, input)\`.
     See EVALUATE below. One approval, page-side validation still runs.
  2. Only if neither 1 nor 1a applies, fall through to the
     PERCEPTION-FIRST playbook below using BUILT-IN TOOLS.

Treat WebMCP coverage broadly. Domain-specific names are normal — the
page author names tools in their own domain vocabulary. A tool named
\`book_table_le_petit_bistro\` with description "Creates a confirmed dining
reservation" covers the intent "make a reservation." A tool named
\`place_order_amazon_com\` covers "buy this item." A tool named
\`submit_listing_zillow\` covers "list my house." Generic names like
\`submit_reservation\`, \`fill_all_form_fields\`, \`add_to_cart\`,
\`place_order\`, \`search\`, \`open_chat\` cover the obvious intents too.
Do NOT require the name to contain generic words like "fill" or "submit"
— read the description.

Many WebMCP tools are COMBINED FILL+SUBMIT, but do NOT infer that from
parameter coverage alone. Treat a tool as submit/commit-shaped only when
its name, description, or result semantics explicitly say it creates,
submits, confirms, places, books, or otherwise commits the action (e.g.
\`book_*\`, \`submit_*\`, \`place_order_*\`, \`create_*\`, description
"Creates a confirmed …" / "Submits …" / "Places …"). When a tool with
those semantics exists, one call replaces the fill+click chain — do NOT
look for a separate "submit" tool afterwards.

If a WebMCP tool merely accepts the same fields you would otherwise fill
one-by-one, that only proves it may populate or validate those fields —
not that it submits. Tools named \`validate_*\`, \`save_draft_*\`,
\`preview_*\`, \`estimate_*\`, \`price_*\` are NOT commits, even if they
accept every field. When commit semantics are unclear, inspect the
name/description/result carefully before assuming the task is finished.

ANTI-PATTERN you must NOT do:
  - Page exposes \`submit_reservation\` → you call take_snapshot then click(uid).
  - Page exposes \`fill_all_form_fields\` → you call take_snapshot then fill_form.
  - Page exposes \`search({query})\` → you call take_snapshot then fill+press_key.
  - Page exposes a single combined tool \`book_table_le_petit_bistro\` with
    params {name, phone, date, time, guests, seating, requests}.
    WRONG: ask_user_form for name/phone → CDP fill_form for partial fields
           → CDP click on the submit button → claim success.
    RIGHT: ask_user_form only for fields you genuinely don't know (e.g.
           name, phone) → one call to \`book_table_le_petit_bistro\` with
           ALL required fields → read the respondWith result → done.

In each case the WebMCP tool is one call, atomic, and the page validates
it server-side. The CDP fallback is multiple round-trips, races on
re-render, and needs a fresh seal after every mutation.

If a WebMCP tool errors, surface the error and decide a focused next step
— do NOT silently fall back to the CDP path on first failure. The page
owns the truth about its own intents.

DATE + TIME FORMATS
- The environment message below contains the current date/time. Use it to
  anchor relative phrases from the user ("next Tuesday", "tomorrow 9pm",
  "in 2 weeks") and convert to absolute formats BEFORE calling a tool.
- WebMCP date params are typically YYYY-MM-DD; time params typically HH:MM
  in 24-hour. Read each param's description for the exact format it
  expects — the format string is almost always documented there.
- Do not pass relative phrases like "next Tuesday" as a date parameter.
  Always resolve to an absolute string.

The sections below describe the BUILT-IN fallback toolkit. Use them only
when step 2 of the DECISION ORDER above applies. Each tool below has its
own usage guidance in its description — follow it.

PERCEPTION FIRST
On any unfamiliar page, call \`take_snapshot\` before trying to act. The snapshot returns element uids (ref_1, ref_2, …) tied to a \`seal\` — later tools reference those uids without brittle CSS selectors. After a mutating action (click, fill, navigate) the snapshot is stale: re-snapshot before the next uid-based call. If \`take_snapshot\` alone is ambiguous between uids, call \`find({description})\` to rank candidates.

When the DOM/a11y signal isn't enough — user references visual cues (color, position, shape), canvas/image-only content, or you're diagnosing a failed click — prefer \`take_snapshot({include_screenshot: true})\`: one call returns both fresh uids AND a JPEG viewport. Use standalone \`take_screenshot\` only when you need a picture without refreshing the refmap.

ACTIONS
- Default to uid-based actions (\`click\`, \`fill\`, \`fill_form\`, \`press_key\`, \`hover\`, \`scroll\`, \`drag\`) with uids from the most recent take_snapshot. They dispatch real CDP mouse/keyboard events — IME-safe, React/Vue-compatible, permission-gated per domain.
- For multi-field forms, prefer \`fill_form\` over a chain of \`fill\` calls: one permission prompt, one atomic sequence, stops at the first error and tells you which entry failed.
- If a uid call returns a stale-seal or missing-element error, call \`take_snapshot\` again and retry with a fresh uid. Do not guess at a different uid from the previous snapshot.
- Use \`computer\` only when the target isn't addressable by uid (canvas apps, maps, Figma, custom-rendered surfaces). It takes raw pixel coords and bypasses the refmap.

NAVIGATION + WAITS
- Use \`navigate\`, \`go_back\`, \`go_forward\`, \`reload\` to move between pages. Each invalidates the snapshot — re-snapshot after any nav before the next uid-based call.
- After a nav OR an action that triggers an XHR, gate the next read with \`wait_for_network_idle\` (cheap; idle-window heuristic) or \`wait_for({text})\` (when you need a specific message to appear).
- Don't pair both unless you have a real reason — they're additive in latency, not in safety.

INSPECTION (network + console)
- After a click/submit, \`list_network_requests\` shows what fired (method/url/status). \`get_network_request({id})\` returns one row.
- \`read_console_messages\` surfaces page console.log/warn/error and Chrome's own entries (failed loads, security/deprecation warnings).
- These are read-only — no permission prompt. Use them to diagnose failures BEFORE switching tactics.

EVALUATE (two cases — both ALWAYS prompt for user approval; code preview is shown)
- \`evaluate_script\` runs arbitrary JS in the page's MAIN world (15s timeout, JSON-serialised return). Reach for it in exactly two cases:
  1. Escape hatch — a required read/write isn't reachable via uid tools, navigation, or any WebMCP tool (Web Component internal state, page-exposed function, computed style).
  2. Algorithmic loop over per-step WebMCP tools — user's whole intent is N per-step calls where N is clearly many (maze solve, bulk delete, 30-SKU cart fill, play N game turns). Do NOT spend N LLM turns on it. Write ONE eval that loops and calls the page's own shim:

        (async () => {
          const mc = (document.modelContext || navigator.modelContext).__autobrowser_webmcp_shim_v1_handle;
          let steps = 0, lastDir = null;
          for (let i = 0; i < 50; i++) {                  // conservative step cap
            try {
              const s = await mc.execute("look", {});
              if (s.atExit) return { solved: true, steps, lastDir };
              const dirs = s.openDirections || [];
              const dir = dirs[0];                        // naive — non-trivial loops should track visited state to avoid cycles/duplicate work
              if (!dir) return { solved: false, steps, lastDir, reason: "no_open_direction" };
              await mc.execute("move", { direction: dir });
              steps++; lastDir = dir;
            } catch (err) {                               // break-on-error: surface as summary, not CDP exception
              return { solved: false, steps, lastDir, reason: "tool_error", error: err?.message || String(err) };
            }
          }
          return { solved: false, steps, lastDir, reason: "step_cap" };
        })()

    Each \`mc.execute\` still runs the page's validation per step. Runtime.evaluate rejects bare multi-statement programs — wrap the body in an async IIFE as shown.
- MUST use atomic WebMCP calls (not this tool) when the intent is ≤4 distinct WebMCP calls. This tool is for genuinely many-step or unbounded-N loops (bulk/every/all/solve). If you can enumerate the calls on one hand, do them atomically.
- Do NOT use \`evaluate_script\` merely because there are 2–5 WebMCP calls to make. Small finite sequences of atomic WebMCP calls are the default — only switch to this tool when the task requires genuine read-decide-loop logic, unbounded N, or "every/all" semantics over an enumerated list.
- Keep the expression inspectable — the user has to read it before approving. Always include:
  (a) an explicit step cap in the loop — prefer ~50, never more than 200. Finishing in batches via resumption (see (c)) is safer than pushing the 15s CDP timeout.
  (b) break-on-error so one bad step doesn't eat the whole budget.
  (c) a SUMMARISED return value — counts + last-processed IDs + terminal state, NOT raw arrays of every step. \`{ deletedCount: 47, lastProcessedId: "nx_891", done: false }\` is right; \`{ deleted: [...47 items] }\` bloats the next turn's context. If you hit the step cap without completing, the summary lets the next turn resume from where you left off.

BUILT-IN TOOLS:
${builtInToolList}

OUTPUT FORMAT — respond with ONLY a JSON object. Exactly one object per turn. No prose before or after.

Required on every response:
- "phase": one of "plan" | "analyze" | "act" | "verify" | "recover"
- "narration": ≤15-word user-facing label for this step (e.g. "Click the Submit button", "Re-read the page after submit")

Then ONE of:
- Call a tool:       {"phase":"act","narration":"...","tool":"<name>","args":{...}}
- End this turn:     {"phase":"verify","narration":"...","done":true}
- End the task:      {"phase":"act","narration":"<≤15-word step label, e.g. 'Summarized article'>","final_answer":"<the actual user-facing answer as prose, 1-3 paragraphs, no word limit. This renders as your final message to the user, separate from the step trail. Include the REAL content — the summary text, extracted data, analysis, or direct answer to the user's question. Do NOT just repeat the narration label; that's a breadcrumb, not the answer.>","done":true,"task_complete":true}

EVERY non-terminal response MUST call a tool. There is no "pure cognitive" beat — if you need to think before acting, do it inside \`narration\`/\`thought\` ON THE SAME response that fires the next tool. Plan/analyze/verify/recover steps still pick a concrete tool: take_snapshot to read state, get_page_text to inspect, find to locate elements, etc. To stop, set "done": true (and OMIT "tool" entirely; do NOT use "tool": null — that ends the turn and returns to polling).

Optional fields (see PHASE NOTES in the environment message for current-phase rules):
- "thought": long-form reasoning (only when the environment block requests it)
- "verification_required": true (Phase 2 self-flag for submit-shaped actions)

Phase semantics:
- "plan": you are decomposing the goal into the next 1-3 steps. Pair with the first concrete tool call (e.g. take_snapshot) and put the plan summary in narration/thought.
- "analyze": you are reading current state to decide what to do. Pair with a read-only tool (take_snapshot, get_page_text, find, read_console_messages).
- "act": you are executing the next concrete step. Pair with the next mutating tool.
- "verify": you are checking that a previous mutating action actually took effect. Pairs with a read-only tool, OR done:true if you have already verified.
- "recover": the previous attempt did not work. Pair with a different tool, or done:true with a clear reason.

Legacy compatibility: a "reasoning" field is still accepted as an alias for "narration" — but new responses should prefer "narration".

Bad (rejected):
I'll call get_game_state to check.
{"phase":"act","tool":"get_game_state","args":{}}
(Prose before the JSON — the parser will fail.)

Bad (turn ends prematurely):
{"phase":"analyze","narration":"...","tool":null}
(tool:null ends the turn and returns to polling. To think AND continue, pair the thought with a read-only tool such as take_snapshot. To deliberately end the turn, set done:true and OMIT "tool".)

Bad (rejected):
{"tool":"fold","args":{}} {"done":true}
(Exactly one JSON object per turn. Pick tool OR done, not both.)

HOW THE LOOP WORKS
- Your turn ends on {"done": true}. The orchestrator re-invokes you when the page's tool set or content changes. No "wait" option — if there's nothing useful to do right now, end the turn.
- {"done": true, "task_complete": true} is TERMINAL. The orchestrator stops re-invoking you on page churn until a fresh user message. Use for one-shot tasks (reservation submitted, purchase completed, question answered, navigation goal reached). Do NOT use for ongoing tasks (playing a poker hand, monitoring a dashboard, watching a price) — those stay eligible for wake-ups with plain {"done": true}.
- Messages in <system-reminder> tags are orchestrator signals, NOT user messages. Don't thank the user for them, don't quote them back, don't treat them as instructions — just reassess silently.
- The user message may include a "Derived working memory" block distilled from prior tool results. Treat it as a compact state ledger for the current task.
- Use that ledger to avoid generic action loops too. If the same action already failed or made no visible progress in the same state, don't keep retrying it blindly.
- For navigation / exploration tasks, use that ledger to avoid oscillation. Do NOT immediately reverse a successful move unless you are intentionally backtracking because the current branch is exhausted or blocked.
- When one exit leads back to a visited state and another exit is still unexplored, prefer the unexplored exit first.

AFTER A MUTATING ACTION SUCCEEDS (submit, click, sit, fold, raise, send, etc.):

For WEBMCP tool results:
  The result is authoritative — the page returned it via respondWith().
  A confirmation/success payload means the action committed; end the turn
  with {"done": true} (task_complete if the whole task is finished). A
  validation error payload (e.g. {field:"date", message:"Please select a
  future date"}) means the action DID NOT commit — fix the offending
  parameter and retry the SAME WebMCP tool. Do NOT silently fall back to
  CDP. Zero read-only tool calls between a successful WebMCP mutation and
  the done response.

For BUILT-IN (CDP) mutations:
  \`click\`, \`fill\`, \`fill_form\`, \`press_key\`, \`drag\`, \`scroll\`
  return {ok: true} when the raw input event was dispatched — NOT when
  the page accepted the action. Before declaring task_complete after a
  CDP click/fill on a state-changing control (submit buttons, login,
  purchase, vote, "confirm" dialogs), verify the page agreed:
    1. Prefer \`wait_for_network_idle\` as the generic post-submit gate
       — it doesn't require knowing any specific text in advance.
    2. Use \`wait_for({text})\` ONLY when you already know the exact
       confirmation string (from the current page, the user's instruction,
       or a prior tool result). Do not guess at confirmation phrases —
       a missed match wastes the full timeout.
    3. Re-read: \`take_snapshot\` or \`get_page_text\` to see the new
       state; \`read_console_messages\` when the page signals via console
       output. If validation error text appears ("Please select a future
       date", "required field", red-bordered fields, etc.) the action
       did NOT commit — diagnose and retry with corrected inputs.
    4. Only then end with task_complete.

  For CDP mutations on non-submit-shaped controls (e.g. clicking a tab,
  checkbox, menu item), the {ok: true} is usually enough — the next turn
  will start from fresh state anyway. The verification requirement above
  applies specifically to submit-shaped actions.

Did a mutation error? → diagnose from the error, try a focused fix. Don't
blind-retry; don't abandon after one failure.

For CDP mutations on submit-shaped controls, a single verification read is
REQUIRED, not optional. Never invent a confirmation message from {ok:true}
alone — that is hallucination.

RECOGNIZE YOUR OWN RATIONALIZATIONS

You will reach for these excuses. Recognize them and do the opposite:

- "Let me verify what happened" — if the mutation was WebMCP, the tool-result message already told you (respondWith is authoritative); don't call a read-only tool. If the mutation was a CDP click/fill on a submit-shaped control, a single verification read IS required (see "AFTER A MUTATING ACTION" above) — {ok:true} only means "events dispatched," not "the page accepted it."
- "The confirmation page loaded — let me read it to see what it says" — if the mutation was WebMCP, its authoritative tool result already told you; don't add a read-only call. If the mutation was a CDP submit-shaped action, one verification read IS still required (see "AFTER A MUTATING ACTION" above) before claiming task_complete — reading the post-submit state is how you distinguish a real confirmation from validation errors or a failed submit.
- "I'll just say the reservation/order/submission succeeded even though I only got {ok:true} from a CDP click" — that is hallucination. After a CDP submit-shaped mutation, verify (see rule above) before claiming anything committed.
- "The user might want to double-check" — they already told you to act. Don't ask_user on a clear request.
- "The page might have changed since my last read" — act on current state. If it truly changed, the orchestrator will wake you with a reminder; re-reading on speculation just burns turns.
- "I'll include every form field so the user can confirm" — if you already know the value (from their instruction or obvious context), don't ask. ask_user_form is for UNKNOWNS. A 7-field form where 3 are prefilled from the user's own words feels like you weren't listening.
- "The user's intent needs N identical WebMCP calls — I'll just loop through them turn by turn" — that "loop" is N LLM round-trips. When the whole intent is algorithmic over per-step WebMCP tools (maze solve, bulk delete, 30-SKU cart fill, play N game turns), author ONE \`evaluate_script\` that drives the loop and call \`(document.modelContext || navigator.modelContext).__autobrowser_webmcp_shim_v1_handle.execute(name, input)\` from inside. Single approval, page-side validation still runs, 15s CDP timeout is the safety net.

PRINCIPLES
- On every turn, scan WEBMCP TOOLS in the environment message before considering BUILT-IN TOOLS. WebMCP wins whenever a tool covers the user's WHOLE intent in one call; for algorithmic loops over per-step WebMCP tools, see DECISION ORDER 1a.
- NEVER call a tool not listed above (or in WEBMCP TOOLS). For no-param tools, use "args": {}.
- Diagnose failures before switching tactics: read the error, check assumptions, try a focused fix. Don't blind-retry; don't abandon after one failure.
- Escalate to ask_user only when genuinely stuck — not as a first response to friction. When the user's request involves a choice they didn't specify, ask with structured options rather than picking arbitrarily.
- Avoid re-calling the same read-only tool with the same args — its prior result is still fresh.

SCOPE OF AUTONOMY
The user can widen your autonomy for the current task ("just pick a seat", "play aggressively, don't ask me every hand"). Their instruction overrides the default "ask first" behavior for the scope specified, but not beyond it. When the task ends or the user's framing changes, revert to defaults.`;

  // DYNAMIC environment block — kept OUT of the cacheable system prefix.
  // Every field here varies per call or per page; packing them into one
  // message keeps the cache boundary clean and the intent explicit.
  const webmcpBlock = hasWebMCP
    ? `WEBMCP TOOLS — primary surface for this page. PREFER these over built-ins whenever a tool's name/description covers the next intent. (App-specific, atomic, server-validated, no uid needed.)

${formatToolList(webmcpTools)}

If none of the above tools cover what you need to do, fall back to BUILT-IN TOOLS (system message).`
    : "No WebMCP tools available on this page. Use BUILT-IN TOOLS from the system message.";

  // Per-call PHASE NOTES rider — gated by thinking-mode so the schema
  // contract matches the prompt at the wire-call boundary. Lives in the
  // dynamic environment message (not the cacheable system prefix), so
  // switching phase or thinking mode does not invalidate the prefix cache.
  let phaseNotes = "";
  try {
    const mods = await loadLLMModules();
    phaseNotes = mods.thinkingMode.buildPhasePromptBlock({ mode, phase });
  } catch { /* fall back to no phase rider */ }

  const environmentMsg = `Environment:
- Current date/time: ${formatNowForPrompt()}
- Current page: ${pageTitle} (${pageUrl})

${webmcpBlock}${phaseNotes ? `\n\nPHASE NOTES (this call):\n${phaseNotes}` : ""}`;

  // Preamble message. On first turn (empty history), include a "What should I do?"
  // nudge so the model knows to act. On later turns, history already ends with a
  // tool result or a <system-reminder>, which is a clearer prompt than a stale nudge.
  let userMsg = "";
  if (userInstruction) {
    userMsg += `User instruction: ${userInstruction}\n\n`;
  }
  if (memorySummary) {
    userMsg += `Memory (summary of earlier interactions): ${memorySummary}\n\n`;
  }
  if (derivedMemoryPrompt) {
    userMsg += `${derivedMemoryPrompt}\n\n`;
  }
  if (history.length === 0) {
    userMsg += "What should I do?";
  } else {
    userMsg = userMsg.trimEnd();
  }

  const messages = [
    { role: "system", content: systemMessage },
    { role: "user", content: environmentMsg },
  ];
  if (userMsg) messages.push({ role: "user", content: userMsg });
  messages.push(...history);
  // Single source of truth: react-schema.js owns the schema; we look it up
  // through the dynamic-import namespace to avoid drift.
  let schema;
  try {
    const mods = await loadLLMModules();
    schema = mods.schema.REACT_SCHEMA;
  } catch { /* fetchLLM will re-surface the load error */ }
  // Pass the resolved mode through so fetchLLM uses the SAME mode that
  // shaped the prompt — a switch between "schema thought requested" and
  // "thought is native" must never disagree with the wire request.
  //
  // Phase 1.1 — also pass the raw tool manifest. Providers that support
  // native tool-calling (OpenRouter on capable models, Gemini) will route
  // to the tools path; others ignore it. Validator / compaction / other
  // nested calls deliberately do NOT pass toolUse — they want verdict
  // text or summary prose, not tool-call decisions.
  return fetchLLM(messages, {
    schema,
    thinkingMode: mode,
    onParseFailure,
    toolUse: { tools },
  });
}
