/**
 * buildHost — composes the service-worker host for one ReAct turn. This is the
 * wiring background.js instantiates (default ON; `swLoop:false` opts back out)
 * to run the loop in the worker.
 *
 * The composition:
 *   - The session has an ANCHOR tab (where the side panel lives) and a moving
 *     FOCUS tab (the tab the agent is currently driving — anchor at first, moved
 *     by switch_focus/open_tab). Status persists to the ANCHOR (so the panel
 *     shows it); all page-targeted RPCs (perceive / resolve / page-state /
 *     EXECUTE_TOOL / CALL_LLM / VALIDATE_ACTION / FETCH_LLM) target the CURRENT
 *     FOCUS via getFocus(), re-evaluated per call. With no tabController (single
 *     tab) getFocus() is just the anchor — Phase-1 behavior, unchanged.
 *   - dispatchTool splits: the 4 tab tools (open/list/switch/close) call
 *     chrome.tabs/tabGroups, which a content script can't, so they run in the SW
 *     via the tabController; every other tool routes to the focused content
 *     script's executeTool (EXECUTE_TOOL RPC — the complete, tested action path:
 *     WebMCP routing, the UID permission/approval/snapshot-seal gate, nav,
 *     evaluate, waits). The SW does NOT re-implement page-action gating.
 *   - loop history/flags + the DOM-free collaborators = the injected loopState.
 *
 * Factory over the raw subsystems (DIP); background.js supplies the real
 * chrome.tabs.sendMessage / per-tab-state / tab-group.
 */
import { createServiceWorkerHost } from "./sw-host.js";

const REQUIRED = ["sendToTab", "makeCallLLM", "makeLoopState"];

// Tab tools the page-classifier (isReadOnly) calls read-only — because they
// don't touch the focused DOM — but which mutate BROWSER state and so still
// need recovery journaling: open_tab (tabs.create) and close_tab (tabs.remove).
// list_tabs is a pure read; switch_focus only moves a pointer that re-perceive
// re-establishes, so neither needs an unknown-outcome intent.
const RECOVERY_MUTATING_TAB_TOOLS = new Set(["open_tab", "close_tab"]);

// The reminder a resume turn seeds instead of a user message — the model sees
// its own dangling tool-call (if any) at the transcript tail plus this note,
// and must re-perceive rather than assume or blindly repeat. Pure + exported
// so it's independently testable; never throws on a malformed resume/intent.
export function buildResumeReminder(resume = {}) {
  const tools = (resume?.unreplayable ?? [])
    .map((intent) => intent?.action?.tool)
    .filter(Boolean);
  const unknownOutcomeClause = tools.length
    ? `Your last dispatched action (${tools.join(", ")}) has an UNKNOWN outcome — it may or may not have taken effect. Do not assume it ran, and do not blindly repeat it. `
    : "";
  return (
    "This turn was interrupted mid-task (the browser suspended the agent) and is now resuming. " +
    unknownOutcomeClause +
    "The conversation above is the task so far. First re-perceive the current page state " +
    "(e.g. take_snapshot) to find out what actually happened, then continue the task. " +
    "If the task is already complete, end the turn with done and task_complete."
  );
}

export function createBuildHost(deps = {}) {
  for (const name of REQUIRED) {
    if (typeof deps[name] !== "function") throw new Error(`createBuildHost: ${name} is required`);
  }
  if (!deps.statusPersister?.persist) throw new Error("createBuildHost: statusPersister is required");

  async function buildHost({ sessionId, tabId, message, resume }) {
    // tabId is the ANCHOR (the panel-bound tab). The current FOCUS is the group's
    // focused tab, falling back to the anchor before a group exists / in single-
    // tab mode. Re-evaluated per call so a mid-turn switch_focus retargets.
    const getFocus = () => deps.tabController?.getFocus(sessionId) ?? tabId;
    const rpc = (type, payload = {}) => deps.sendToTab(getFocus(), type, payload);

    // loopState owns the SW conversation history; the LLM caller reads it live,
    // so it's built per-tab against loopState.getHistory. Async: it hydrates the
    // durable session transcript before the first LLM call. getFocus lets the
    // validator / recovery / compaction LLM calls target the focused tab too.
    // resume is passed through so makeLoopState can guard a resume-with-no-
    // durable-record turn (the session was cleared between gather and here).
    const loopState = await deps.makeLoopState({
      sessionId,
      tabId,
      getFocus,
      resume,
      emitStatus: (s) => deps.statusPersister.persist(tabId, s), // status → anchor (panel)
    });
    // Seed the user's instruction into the loop's history — otherwise the prompt
    // (built CS-side from this history) has no idea what the user asked. A
    // resume turn has no user message (the interruption is why it's running),
    // so it seeds a reminder instead — react-loop's frozen step-0
    // flushReminders delivers it as a <system-reminder>, never a fake message
    // (that would misrepresent "the user's latest intent").
    if (message) loopState.pushUserMessage(message);
    else if (resume) loopState.queueReminder(buildResumeReminder(resume));
    const callLLM = deps.makeCallLLM(getFocus, loopState.getHistory);

    // Tab tools run in the SW (they need chrome.tabs/tabGroups); every other tool
    // → the focused content script's executeTool (complete, gated path).
    const runTool = (tool, args) =>
      deps.tabController?.isTabTool(tool)
        ? deps.tabController.handleTabTool(sessionId, tool, args)
        : rpc("EXECUTE_TOOL", { name: tool, args }).then((r) => r?.result);

    // journal/isReadOnly are OPTIONAL: write-ahead evidence for resume, not a
    // replay log — planResume only ever re-perceives after an interruption,
    // never replays. A tool needs journaling when it isn't page-read-only OR is
    // a recovery-mutating tab tool (see the constant above — page-read-only ≠
    // recovery-side-effect-free).
    function needsJournal(tool) {
      if (typeof deps.isReadOnly !== "function") return false;
      return !deps.isReadOnly(tool) || RECOVERY_MUTATING_TAB_TOOLS.has(tool);
    }
    async function dispatchTool(tool, args) {
      if (!deps.journal || !needsJournal(tool)) return runTool(tool, args);
      // Write-ahead: the intent MUST be durable before the action can commit.
      // Awaiting begin() only buys that guarantee if a begin() failure blocks
      // the dispatch — otherwise a death in the ensuing window leaves no
      // unknown-outcome evidence and the resumed model could repeat the action.
      // A non-executed action is always safe (never a double-action), so fail
      // CLOSED here; react-loop.js turns the throw into a tool error the model
      // can react to. complete() stays best-effort — conservatively retaining an
      // intent is safe (re-perceive, never replay), and clearTurnActive + the
      // gather TTL bound how long a stale intent survives.
      let key;
      try {
        key = await deps.journal.begin({ sessionId, tabId, action: { tool, args } });
      } catch (err) {
        throw new Error(`Couldn't record the action intent for recovery, so it was not dispatched: ${err.message}`);
      }
      try {
        return await runTool(tool, args);
      } finally {
        await deps.journal.complete(key).catch(() => {});
      }
    }

    return createServiceWorkerHost({
      tabId,
      rpc,
      actionGate: { dispatchTool },
      callLLM,
      persistStatus: deps.statusPersister.persist,
      loopState,
    });
  }

  return buildHost;
}
