/**
 * Content-script host — adapts content.js's existing in-process functions into
 * the host contract runReactLoop expects, so the loop runs in the content script
 * exactly as before (Phase 0: extract + wire, same context, no relocation).
 *
 * Most methods are thin delegations (covered by runReactLoop's own tests). This
 * adapter OWNS four obligations the fidelity review flagged as easy to get wrong:
 *   - callLLM: reset the per-call parse-failure capture, thread onParseFailure
 *     into callReActLLM, and fire the parse-failure diagnostic — so
 *     lastParseFailureInfo() always reflects THIS call (not a stale prior one).
 *   - runRecovery: map the underlying snake_case {replan_steps} → {replanSteps}.
 *   - preState: read the live url/title.
 *
 * Factory over the injected content-script deps (DIP); tests pass fakes,
 * content.js passes its real functions/state accessors.
 */
const REQUIRED = [
  "callReActLLM", "getHistory", "runRecovery", "getUrl", "getTitle",
  "isStopped", "stop", "markTaskComplete", "markDisengaged", "emitStatus",
  "persistAssistant", "pushAssistantMessage", "executeTool", "advisory",
  "recordMemory", "pushToolResult", "invalidateSnapshot", "runValidator",
  "queueReminder", "flushReminders", "discoverTools", "endTurn", "isReadOnly",
  "isWebMCP", "settle", "refreshToolsForNextPoll", "maybeSummarizeHistory",
];

export function createContentScriptHost(deps = {}) {
  for (const name of REQUIRED) {
    if (typeof deps[name] !== "function") {
      throw new Error(`createContentScriptHost: ${name} is required`);
    }
  }
  const recordDiag = deps.recordParseFailureDiag ?? (() => {});

  // Per-call parse-failure capture (was a reactLoop-local closure in the
  // original). Reset before each call so a failure from a prior validator/
  // recovery LLM call can't be misread as this decision's.
  let parseInfo = null;

  async function callLLM({ tools, phase }) {
    parseInfo = null;
    const onParseFailure = (info) => {
      parseInfo = info;
      recordDiag(info);
    };
    return deps.callReActLLM(tools, deps.getHistory(), { phase, onParseFailure });
  }

  // planRecovery (via deps.runRecovery) already returns the loop shape
  // { replanSteps } | { abortReason } | null, so this is a thin pass-through.
  function runRecovery(trigger) {
    return deps.runRecovery({ trigger });
  }

  return {
    isStopped: deps.isStopped,
    stop: deps.stop,
    markTaskComplete: deps.markTaskComplete,
    markDisengaged: deps.markDisengaged,
    emitStatus: deps.emitStatus,
    callLLM,
    lastParseFailureInfo: () => parseInfo,
    persistAssistant: deps.persistAssistant,
    pushAssistantMessage: deps.pushAssistantMessage,
    dispatchTool: deps.executeTool, // CS executeTool already does WebMCP routing + the gate
    advisory: deps.advisory,
    recordMemory: deps.recordMemory,
    pushToolResult: deps.pushToolResult,
    invalidateSnapshot: deps.invalidateSnapshot,
    runValidator: deps.runValidator,
    runRecovery,
    queueReminder: deps.queueReminder,
    flushReminders: deps.flushReminders,
    discoverTools: deps.discoverTools,
    preState: () => ({ url: deps.getUrl(), title: deps.getTitle() }),
    endTurn: deps.endTurn,
    isReadOnly: deps.isReadOnly,
    isWebMCP: deps.isWebMCP,
    settle: deps.settle,
    refreshToolsForNextPoll: deps.refreshToolsForNextPoll,
    maybeSummarizeHistory: deps.maybeSummarizeHistory,
  };
}
