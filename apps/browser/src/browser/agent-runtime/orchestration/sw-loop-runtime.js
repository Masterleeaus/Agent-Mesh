/**
 * SW loop runtime — the top-level composition that lets background.js run the
 * ReAct loop in the service worker with a single call (default ON; the
 * `swLoop` storage flag is a kill-switch, not an opt-in). It wires the tested
 * pieces together from injected primitives:
 *
 *   session-registry  ← sessionStore + journal
 *   buildHost         ← sendToTab (RPC) + callLLM + statusPersister + a per-tab
 *                       loopState that wires the cognitive subsystems
 *                       (working-memory advisory/record, the validator) to the
 *                       real modules with SW-reachable deps. Tool dispatch and the
 *                       LLM call route back into the content script's existing,
 *                       tested executeTool / callReActLLM via RPC — the SW
 *                       orchestrates the loop without re-porting the action path.
 *   orchestrator      ← sessionRegistry + buildHost + the loop + resume-planner
 *
 * Recovery is intentionally minimal for now (an escalation ends the turn rather
 * than replanning — safe, not a stub of the safety path); isWebMCP is treated as
 * "not a page tool" in the SW (the gate still applies the full CDP policy).
 *
 * Factory over primitives (DIP); tests fake the loop, background.js supplies the
 * real chrome.tabs.sendMessage / driver / providers / per-tab-state.
 */
import { createOrchestrator } from "./sw-orchestrator.js";
import { createBuildHost } from "./build-sw-host.js";
import { createSessionRegistry } from "./session-registry.js";
import { createSwLoopState } from "./sw-loop-state.js";
import { planResume } from "./resume-planner.js";

const REQUIRED = [
  "sendToTab", "callLLM", "fetchLLM", "makeWorkingMemory", "runValidator",
  "isReadOnly", "runLoop",
];

// Resume-evidence policy (gatherResumeInputs below). Automatic (wake-time)
// resume is capped on both freshness and attempt count so a turn that keeps
// dying doesn't retry forever; an explicit-consent resume (the orphaned-Allow
// path's overrides) bypasses both — see gatherResumeInputs.
export const RESUME_TTL_MS = 10 * 60_000;
export const MAX_RESUME_ATTEMPTS = 2;

export function createSwLoopRuntime(deps = {}) {
  for (const name of REQUIRED) {
    if (typeof deps[name] !== "function") throw new Error(`createSwLoopRuntime: ${name} is required`);
  }
  if (!deps.statusPersister?.persist) throw new Error("createSwLoopRuntime: statusPersister is required");
  if (!deps.sessionStore || !deps.journal) throw new Error("createSwLoopRuntime: sessionStore + journal are required");
  // Fail loud if the store is missing a method the loop calls — otherwise (e.g.)
  // a missing `update` only surfaces as a swallowed post-turn compaction failure.
  for (const m of ["read", "appendTurn", "update"]) {
    if (typeof deps.sessionStore[m] !== "function") {
      throw new Error(`createSwLoopRuntime: sessionStore.${m} is required`);
    }
  }

  // recoverSession (optional) lets ensureSession re-adopt a session whose tab
  // group survived a worker restart instead of minting a fresh UUID — background
  // supplies it from the (hydrated) tab-group authority. Absent → always mint.
  const sessionRegistry = createSessionRegistry({
    sessionStore: deps.sessionStore,
    journal: deps.journal,
    recoverSession: deps.recoverSession,
  });

  const now = deps.now ?? (() => Date.now());

  // getFocus() returns the currently-focused member tab (anchor in single-tab
  // mode). Page-targeted RPCs (validator, recovery/compaction LLM) use it so they
  // hit the tab the agent is driving, not a stale anchor.
  async function makeLoopState({ sessionId, tabId, getFocus = () => tabId, emitStatus, resume }) {
    const wm = deps.makeWorkingMemory();
    // Hydrate the durable LLM history (survives turn boundaries + worker death);
    // every subsequent entry is appended back to the same session transcript.
    const record = await deps.sessionStore.read(sessionId);
    if (resume && !record) {
      // Belt-and-suspenders vs the gather-to-build race: a CLEAR_SESSION landing
      // between handleResume's gather (which saw a record) and this hydration
      // deleted it. A resume turn must never drive an empty-context turn on a
      // cleared session — surface it as a turn failure (the orchestrator's
      // onError) instead.
      throw new Error("Resume turn: no durable session record — the session may have been cleared.");
    }
    return createSwLoopState({
      initialHistory: Array.isArray(record?.transcript) ? record.transcript : [],
      initialMemorySummary: typeof record?.memorySummary === "string" ? record.memorySummary : "",
      emitStatus,
      // Fire-and-forget from pushHistory; swallow so a storage hiccup can't reject
      // into the live turn (the in-memory history is the turn's source of truth).
      persistTurn: (entry) => deps.sessionStore.appendTurn(sessionId, entry).catch(() => {}),
      advisory: (tool, args) => wm.advisory(tool, args),
      recordMemory: (tool, args, result, isError) => wm.record(tool, args, result, isError),
      // Post-action validation routes to the content script's adapter
      // (VALIDATE_ACTION RPC). Gate on toolMutated/!error here so read-only and
      // errored tools don't pay an RPC round-trip just to get null (the adapter
      // would reject them anyway).
      runValidator: (input) =>
        input?.toolMutated && !input?.resultIsError ? deps.runValidator(getFocus(), input) : Promise.resolve(null),
      // Raw-LLM primitive (FETCH_LLM RPC) for sw-loop-state's history-owning
      // cognitive subsystems (recovery, summarization), which build their own
      // prompts rather than the ReAct prompt. Targets the focused tab.
      fetchLLM: (messages, options) => deps.fetchLLM(getFocus(), messages, options),
      isReadOnly: deps.isReadOnly,
      isWebMCP: () => false,
      // Persist a compaction: rewrite the durable transcript to the kept tail +
      // store the summary, so the next turn hydrates the bounded version. Swallow
      // so a storage hiccup can't reject post-turn compaction.
      persistCompaction: (toKeep, summary) =>
        deps.sessionStore
          .update(sessionId, (rec) => {
            rec.transcript = toKeep;
            rec.memorySummary = summary;
          })
          .catch(() => {}),
      refreshPollBaseline: async () => {},
    });
  }

  const buildHost = createBuildHost({
    sendToTab: deps.sendToTab,
    // The LLM call routes to the content script's existing callReActLLM (via the
    // CALL_LLM RPC, passing the SW's live history) — faithful prompt-building
    // without re-porting it, until call-react.js is extracted.
    makeCallLLM: (getFocus, getHistory) => ({ tools, phase }) =>
      deps.callLLM({ tabId: getFocus(), tools, phase, history: getHistory() }),
    statusPersister: deps.statusPersister,
    makeLoopState,
    tabController: deps.tabController, // multi-tab focus + tab-tool routing (optional)
    // Write-ahead journal evidence for resume (both already REQUIRED runtime
    // deps). isReadOnly already classifies tab tools read-only, so they're
    // naturally unjournaled — re-perceive covers them, they never hit CDP.
    journal: deps.journal,
    isReadOnly: deps.isReadOnly,
  });

  // Durable resume evidence, written before buildHost and cleared on every exit
  // path (see sw-orchestrator.js's runTurn) — an activeTurn marker on the
  // session_v2_ record. resumeAttempts is INCREMENTED on a resume start, never
  // reset, so the attempt cap below actually terminates a crash loop.
  function markTurnActive(sessionId, tabId, isResume) {
    return deps.sessionStore.update(sessionId, (rec) => {
      rec.activeTurn = {
        tabId,
        startedAt: now(),
        resumeAttempts: isResume ? (rec.activeTurn?.resumeAttempts ?? 0) + 1 : 0,
      };
    });
  }
  async function clearTurnActive(sessionId) {
    // Clear only the turn marker here. Pending journal entries may represent
    // mutations whose outcomes are UNKNOWN because the worker died after
    // dispatch but before complete(). They must survive worker reconstruction
    // until a resumed loop re-perceives; clearing them here would erase the
    // evidence that prevents a blind replay.
    await deps.sessionStore.update(sessionId, (rec) => { delete rec.activeTurn; }).catch(() => {});
  }

  async function resolveUnknownIntents(sessionId, intents = []) {
    // Retire exactly the evidence the resume planner handed to this turn. Newer
    // intents created by the resumed loop are never swept accidentally.
    for (const intent of intents) {
      if (intent?.sessionId !== sessionId || !intent?.key) continue;
      await deps.journal.abandon(intent.key).catch(() => {});
    }
  }

  // What handleResume acts on. `overrides` (explicit user consent — the
  // orphaned-Allow path) bypass the freshness/attempt-cap policy that guards
  // AUTOMATIC (wake-time) resume, but NEVER bypass the record check: a session
  // whose durable record is gone (cleared, or a stale re-adopted group whose
  // record never survived) must stay idle even under explicit consent — there
  // is nothing to resume it FROM.
  async function gatherResumeInputs(sessionId, tabId, overrides = {}) {
    const record = await deps.sessionStore.read(sessionId);
    // null (not {}) is a categorical veto the orchestrator honors BEFORE
    // merging overrides — a session with no durable record can never be
    // resumed, not even by explicit consent (there is nothing to resume it
    // FROM). See sw-orchestrator.js's handleResume for the other half.
    if (!record) return null;
    if (overrides.hasActiveTurn === true) {
      return { pendingIntents: await deps.journal.pendingFor(sessionId) };
    }
    const active = record.activeTurn ?? null;
    if (!active) return {}; // no interruption evidence — a stray journal intent alone is inert by design
    const pendingAsk = deps.readTabState ? (await deps.readTabState(tabId))?.pendingAsk ?? null : null;
    if (pendingAsk) return { pendingAsk }; // parked on a human — the staleness clock is suspended
    if (now() - active.startedAt > RESUME_TTL_MS) return {}; // stale — leave inert, no cleanup churn
    if ((active.resumeAttempts ?? 0) >= MAX_RESUME_ATTEMPTS) {
      // Give up LOUDLY and ONCE: clear the evidence so a constantly-waking SW
      // doesn't re-notify on every future wake, then surface through onError.
      await deps.sessionStore.update(sessionId, (rec) => { delete rec.activeTurn; }).catch(() => {});
      await deps.journal.clearSession(sessionId).catch(() => {});
      deps.onError?.(
        tabId,
        new Error("Couldn't resume the interrupted task after repeated attempts — send a new message to continue."),
      );
      return {};
    }
    return { pendingIntents: await deps.journal.pendingFor(sessionId), hasActiveTurn: true };
  }

  const orchestrator = createOrchestrator({
    sessionRegistry,
    buildHost,
    runLoop: deps.runLoop,
    planResume,
    gatherResumeInputs,
    config: deps.config ?? {},
    // Form the "Auto Browser" tab group at session start (anchor = the panel
    // tab). Optional — absent in single-tab mode. background.js resolves the
    // anchor's window/incognito and delegates to the tab-group manager.
    ensureSessionGroup: deps.ensureSessionGroup,
    // The ⌛ working indicator and dissolve-on-task_complete are both driven by
    // the tab-group authority, so they're sourced from the same optional
    // tabController as ensureSessionGroup/teardownSession — absent together in
    // single-tab mode, present together once a group exists to reflect state on.
    setWorking: deps.tabController ? (sessionId, working) => deps.tabController.setWorking(sessionId, working) : undefined,
    onTaskComplete: deps.tabController ? (sessionId) => deps.tabController.teardownSession(sessionId) : undefined,
    markTurnActive,
    clearTurnActive,
    resolveUnknownIntents,
    onResumeStart: deps.onResumeStart,
    // Surface a turn that fails OUTSIDE the loop's own status reporting — a
    // durable-hydration (sessionStore.read) or runLoop throw the orchestrator
    // catches. Optional: undefined just means the failure is silently cleaned up
    // (createOrchestrator guards the call). background.js wires notifySidebarError.
    onError: deps.onError,
  });

  // Surface the registry's lifecycle cleanup so background.js can wire it to
  // chrome.tabs.onRemoved/onReplaced — otherwise the UUID session record + the
  // action-journal intents leak on tab close.
  async function onTabRemoved(tabId) {
    // Held for this function's FULL duration, synchronously, before anything
    // else: a concurrent handleResume (wake sweep or orphaned-Allow) must never
    // start a turn while this tab is mid-teardown. Reordering the registry's own
    // unbind earlier isn't sufficient on its own — sessionFor's adoptRecovered
    // fallback can RE-BIND the tab by consulting the tab-group authority, which
    // is ALSO still mid-teardown during this same async window (teardownSession
    // below). This guard is independent of both, so it holds regardless of
    // either subsystem's own timing.
    orchestrator.beginTeardown(tabId);
    try {
      // Stop next: a CLEAR_SESSION can land without stopAgent (the panel
      // believes the agent is idle after an eviction it never saw), but a
      // wake-time resume may have already started a live turn. That turn must
      // not keep running past the clear — stopTab is a no-op if nothing is
      // running/hydrating for this tab.
      orchestrator.stopTab(tabId);
      // The registry maps only the ANCHOR tab → session. If this is the anchor,
      // dissolve the whole group (ungroup, not delete). If it's a non-anchor
      // member the user closed, just forget it so getFocus()/list_tabs don't
      // dangle on a dead tab (without this, the next page RPC would target a
      // closed tab).
      const anchorSession = sessionRegistry.sessionFor(tabId);
      if (deps.tabController) {
        if (anchorSession) {
          await deps.tabController.teardownSession(anchorSession).catch(() => {});
        } else {
          await deps.tabController.forgetClosedMember(tabId).catch(() => {});
        }
      }
      await sessionRegistry.onTabRemoved(tabId);
    } finally {
      orchestrator.endTeardown(tabId);
    }
  }

  // Prerender commit reassigned the tabId → migrate BOTH the session registry
  // (UUID session + per-tab sub-state) AND the tab-group authority (anchor / focus
  // / members), or getFocus() keeps returning the removed tab and the next turn's
  // PERCEIVE/EXECUTE_TOOL/CALL_LLM RPCs target a dead tab.
  async function onTabReplaced(oldTabId, newTabId) {
    if (deps.tabController) {
      await deps.tabController.replaceTab(oldTabId, newTabId).catch(() => {});
    }
    await sessionRegistry.onTabReplaced(oldTabId, newTabId);
  }

  return {
    ...orchestrator,
    onTabRemoved,
    onTabReplaced,
  };
}
