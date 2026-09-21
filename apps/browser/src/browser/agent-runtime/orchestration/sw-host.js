/**
 * Service-worker host — the SW-side mirror of cs-host.js. Builds the host
 * runReactLoop drives when the loop runs in the service worker (Phase 1).
 *
 * The split: perception + DOM ops the refmap can't leave the page (perceive,
 * resolveCoords, discoverTools, invalidateSnapshot, askUser) become RPCs to the
 * driven tab's content script; the action path is the injected
 * `actionGate.dispatchTool` (build-sw-host wires it to the content script's
 * existing executeTool); status persistence is the shared status persister; the
 * LLM call is the already-provider-routed `callLLM`; and the loop-control flags +
 * per-turn collaborators live in SW-resident `loopState`.
 *
 * Factory over injected collaborators (DIP) so the routing is unit-tested; the
 * real chrome.tabs.sendMessage transport, driver, and merged modules are bound
 * in background.js's buildHost (the thin, browser-verified edge).
 */
const LOOP_STATE_METHODS = [
  "isStopped", "stop", "markTaskComplete", "markDisengaged", "lastParseFailureInfo",
  "persistAssistant", "pushAssistantMessage", "pushUserMessage", "advisory", "recordMemory",
  "pushToolResult", "runValidator", "runRecovery", "queueReminder", "flushReminders",
  "isReadOnly", "isWebMCP", "endTurn", "refreshToolsForNextPoll", "maybeSummarizeHistory",
];

export function createServiceWorkerHost({ tabId, rpc, actionGate, callLLM, persistStatus, loopState } = {}) {
  if (typeof rpc !== "function") throw new Error("createServiceWorkerHost: rpc is required");
  if (typeof actionGate?.dispatchTool !== "function") throw new Error("createServiceWorkerHost: actionGate.dispatchTool is required");
  if (typeof callLLM !== "function") throw new Error("createServiceWorkerHost: callLLM is required");
  if (typeof persistStatus !== "function") throw new Error("createServiceWorkerHost: persistStatus is required");
  if (!loopState) throw new Error("createServiceWorkerHost: loopState is required");
  for (const m of LOOP_STATE_METHODS) {
    if (typeof loopState[m] !== "function") throw new Error(`createServiceWorkerHost: loopState.${m} is required`);
  }

  // Perception/DOM ops the refmap pins to the page → RPC to the tab's CS.
  const perceive = (opts = {}) => rpc("PERCEIVE", opts);
  const resolveCoords = (uid, seal) => rpc("RESOLVE_UID", { uid, seal });
  // content.js answers DISCOVER_TOOLS with { tools: [...] }, or { error } when
  // discovery itself failed; the loop needs the bare array (it calls
  // tools.some/map). Normalize the envelope here, and surface the CS's own
  // error — mislabeling it as a malformed envelope hides the real cause.
  const discoverTools = async () => {
    const res = await rpc("DISCOVER_TOOLS", {});
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.tools)) return res.tools;
    if (typeof res?.error === "string" && res.error) {
      throw new Error(`DISCOVER_TOOLS failed in the content script: ${res.error}`);
    }
    throw new Error("DISCOVER_TOOLS returned an invalid tool list");
  };
  const invalidateSnapshot = (reason) => rpc("INVALIDATE_SNAPSHOT", { reason });
  const preState = () => rpc("PAGE_STATE", {});
  const settle = () => new Promise((r) => setTimeout(r, 150));

  // The injected callLLM returns { decision, parseInfo, thoughtText } from the
  // CALL_LLM RPC. Capture parseInfo per call (→ lastParseFailureInfo, so the
  // loop's fatal-parse short-circuit works) and the per-call thought text (→
  // persistAssistant, so the SW history reproduces content.js's <thinking>-block
  // contract). Both mirror cs-host, which owns these in the page.
  let lastParseInfo = null;
  let lastThoughtText = "";
  const routedCallLLM = async (input) => {
    lastParseInfo = null;
    lastThoughtText = "";
    const out = await callLLM(input);
    if (out && typeof out === "object" && ("decision" in out || "parseInfo" in out)) {
      lastParseInfo = out.parseInfo ?? null;
      lastThoughtText = out.thoughtText || out.decision?.thought || "";
      return out.decision ?? null;
    }
    return out; // back-compat: a bare decision
  };

  return {
    // RPC-routed
    perceive,
    resolveCoords,
    discoverTools,
    invalidateSnapshot,
    preState,
    settle,
    // delegations
    dispatchTool: (tool, args) => actionGate.dispatchTool(tool, args),
    emitStatus: (s) => persistStatus(tabId, s),
    callLLM: routedCallLLM,
    // SW-resident loop state + per-turn collaborators. lastParseFailureInfo is
    // owned here (captured per callLLM) rather than by loopState, since the
    // parse failure surfaces through the CALL_LLM RPC, not SW-side parsing.
    isStopped: loopState.isStopped,
    stop: loopState.stop,
    markTaskComplete: loopState.markTaskComplete,
    markDisengaged: loopState.markDisengaged,
    lastParseFailureInfo: () => lastParseInfo,
    // Inject the captured per-call thought (the SW analogue of content.js's
    // lastCallThoughtText) so persistAssistant strips it from the JSON and
    // re-feeds it as a single capped <thinking> block.
    persistAssistant: (decision) => loopState.persistAssistant(decision, lastThoughtText),
    pushAssistantMessage: loopState.pushAssistantMessage,
    pushUserMessage: loopState.pushUserMessage,
    advisory: loopState.advisory,
    recordMemory: loopState.recordMemory,
    pushToolResult: loopState.pushToolResult,
    runValidator: loopState.runValidator,
    runRecovery: loopState.runRecovery,
    queueReminder: loopState.queueReminder,
    flushReminders: loopState.flushReminders,
    isReadOnly: loopState.isReadOnly,
    isWebMCP: loopState.isWebMCP,
    endTurn: loopState.endTurn,
    refreshToolsForNextPoll: loopState.refreshToolsForNextPoll,
    maybeSummarizeHistory: loopState.maybeSummarizeHistory,
    // Optional — NOT in LOOP_STATE_METHODS. Single SW-only consumer (the
    // orchestrator's dissolve-on-task_complete check); making it required would
    // force every loopState fake in the test suite to grow a method it doesn't
    // otherwise need.
    isTaskComplete: loopState.isTaskComplete ?? (() => false),
  };
}
