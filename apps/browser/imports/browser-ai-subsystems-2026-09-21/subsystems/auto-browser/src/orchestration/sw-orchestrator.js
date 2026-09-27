/**
 * Service-worker orchestrator — the Phase 1 entry points the background worker
 * calls once the ReAct loop lives in the SW. It ties the tested pieces together:
 *
 *   handleUserMessage(tabId, text) — resolve/mint the tab's session, build the
 *     loop host for it (the caller's buildHost wires react-loop's host from the
 *     action gate, provider router, persist-status, and the CS↔SW RPC
 *     transport), and run runReactLoop.
 *
 *   handleResume(tabId, overrides?) — after a worker death, ask the resume-
 *     planner what to do from the gathered journal intents / activeTurn marker /
 *     pendingAsk, and act on it: re-perceive re-runs the loop; await-answer /
 *     idle do nothing (the loop resumes when USER_ANSWER arrives, or there's
 *     nothing to resume). `overrides` let an explicit-consent caller force
 *     re-perceive independent of gathered evidence — see its call sites.
 *
 * The chrome.tabs.sendMessage transport, the real driver, and the merged modules
 * are all injected (DIP) so the composition is unit-testable; background.js binds
 * the real edges. This module owns only the wiring/branching logic.
 */
export function createOrchestrator({
  sessionRegistry,
  buildHost,
  runLoop,
  planResume,
  gatherResumeInputs,
  ensureSessionGroup, // optional: form the "Auto Browser" tab group at session start
  setWorking, // optional: drive the ⌛ ambient indicator on the group title
  onTaskComplete, // optional: dissolve the group when the turn reaches task_complete
  markTurnActive, // optional: durable resume evidence — a turn is live for this session
  clearTurnActive, // optional: clear that evidence — nothing survives this worker life
  onResumeStart, // optional: notify a re-perceive resume is starting (best-effort, not awaited)
  onError,
  config = {},
} = {}) {
  if (typeof sessionRegistry?.ensureSession !== "function" || typeof sessionRegistry?.sessionFor !== "function") {
    throw new Error("createOrchestrator: sessionRegistry with ensureSession/sessionFor is required");
  }
  for (const [name, fn] of Object.entries({ buildHost, runLoop, planResume })) {
    if (typeof fn !== "function") throw new Error(`createOrchestrator: ${name} is required`);
  }
  const gather = gatherResumeInputs ?? (async () => ({}));
  // Sessions whose tab group has been formed — ensure once per session.
  const groupedSessions = new Set();

  // Tabs with a live loop — prevents a second concurrent loop on one session
  // (the original content.js `if (!acting)` re-entry guard). Two loops would
  // both dispatch CDP actions and both write the same session history.
  const running = new Set();
  const runningHosts = new Map(); // tabId -> live host (so STOP can reach it)
  // Tabs mid-gather inside handleResume — reserved synchronously (same
  // discipline as `running` above) so a second concurrent handleResume (a wake
  // sweep racing an orphaned-Allow resume) can't also pass the busy check below.
  const resuming = new Set();
  // Tabs a caller (sw-loop-runtime.js's onTabRemoved) has flagged as mid-
  // teardown — held for the FULL duration of that teardown via
  // beginTeardown/endTeardown. handleResume must never start a turn while this
  // is set: reordering session-registry's own tabId->sessionId unbind earlier
  // isn't enough on its own, because sessionFor's adoptRecovered fallback can
  // RE-BIND the tab by consulting the tab-group authority, which is ALSO still
  // mid-teardown during the same async window — an explicit, independent guard
  // is the only thing that closes that race regardless of the other two
  // subsystems' own timing.
  const tearingDown = new Set();
  // buildHost is async (it hydrates the durable transcript), so a turn is marked
  // running BEFORE its host exists. Control that arrives in that window can't
  // reach a host yet, so it's parked here and applied the moment the host is
  // ready: messages to deliver, and a stop to honor (otherwise both are lost and
  // the loop would start as if nothing happened).
  const pendingMessages = new Map(); // tabId -> message[]
  const pendingStops = new Set(); // tabIds stopped mid-hydration

  // Hand a follow-up message to a live host: a reminder flags it as the latest
  // intent (mirrors the content-script mid-turn behavior) and pushUserMessage
  // flushes that reminder ahead of the new instruction.
  function deliverToHost(host, message) {
    host.queueReminder(
      "The user sent a new instruction after this turn started. Treat it as the latest user intent.",
    );
    host.pushUserMessage(message);
  }

  // Both group-lifecycle hooks are best-effort: a tabGroups failure must never
  // fail the turn itself (setWorking) or wedge the running guard (onTaskComplete).
  async function safeCall(fn, ...args) {
    if (!fn) return;
    try {
      await fn(...args);
    } catch {
      /* best-effort — a broadcast/Chrome failure here is not a turn failure */
    }
  }

  async function runTurn(sessionId, tabId, hostOpts) {
    running.add(tabId);
    // The ⌛ indicator is session-level ambient state, independent of whether
    // host construction succeeds — set it before buildHost so it's visible for
    // the full turn, including the hydration window.
    await safeCall(setWorking, sessionId, true);
    // Durable BEFORE buildHost — the evidence a resume needs must survive a
    // death that happens anywhere from here on, including during hydration.
    await safeCall(markTurnActive, sessionId, tabId, !!hostOpts?.resume);
    let host;
    try {
      // Inside the try so a hydration/storage failure in buildHost still runs the
      // finally cleanup + onError — otherwise the tab wedges "running" forever and
      // later messages enqueue into pendingMessages with no host to drain them.
      host = await buildHost({ sessionId, tabId, ...hostOpts });
      runningHosts.set(tabId, host);
      // A stop (direct Stop / CLEAR) that landed during hydration applies now —
      // skip the loop entirely rather than start it unstopped.
      if (pendingStops.has(tabId)) {
        host.stop?.();
        return;
      }
      // Drain anything that arrived during hydration so the first LLM call sees it.
      for (const message of pendingMessages.get(tabId) ?? []) deliverToHost(host, message);
      pendingMessages.delete(tabId);
      await runLoop(host, config);
    } catch (err) {
      // Isolate the failure: a throw must not wedge the tab "running" or bubble
      // raw to the message handler — surface it and always clear the guard.
      if (onError) onError(tabId, err);
    } finally {
      runningHosts.delete(tabId);
      await safeCall(setWorking, sessionId, false);
      // Completion, error, or stop — all mean "nothing about this turn survives
      // this worker life" — so the resume evidence clears on every exit path.
      await safeCall(clearTurnActive, sessionId);
      // The model reached done:true + task_complete:true this turn — dissolve
      // the tab group and forget it was ever formed, so the NEXT message
      // re-forms a fresh one rather than silently reusing a torn-down group.
      // This must finish BEFORE the `running` guard below is released: onTaskComplete
      // (tabGroup.teardown) unwinds asynchronously, and a follow-up message that's
      // free to call ensureSessionGroup while teardown is still mid-flight can win
      // the race against it — the group looks re-formed here but is deleted moments
      // later by the still-in-flight teardown, permanently desyncing groupedSessions
      // from the tab-group manager's own state.
      if (host?.isTaskComplete?.()) {
        groupedSessions.delete(sessionId);
        await safeCall(onTaskComplete, sessionId);
      }
      // Consume pendingStops only NOW, as the slot is released — not before the
      // awaited cleanup above. A Stop landing during that cleanup (running still
      // set, host already gone) re-adds the marker via stopTab; consuming it here
      // cancels the queued follow-up instead of letting the marker survive to
      // immediately stop the NEXT turn during its host construction.
      const stoppedDuringCleanup = pendingStops.delete(tabId);
      running.delete(tabId);
      // Replay whatever queued up while we were finishing (no host was left to
      // receive it, same buffering the hydration window above uses). Only the
      // most recent one matters — treat it as the latest intent, exactly like a
      // mid-turn follow-up already does via deliverToHost's reminder. A Stop
      // during cleanup cancels the replay — the user asked to stop, not continue.
      const queued = pendingMessages.get(tabId);
      pendingMessages.delete(tabId);
      if (!stoppedDuringCleanup && queued?.length) {
        await handleUserMessage(tabId, queued[queued.length - 1]);
      }
    }
  }

  // Stop the live SW loop for a tab (the user's Stop control). The host's
  // isStopped/stop flips the loopState flag the loop checks each step. If the
  // host is still hydrating, record the stop so runTurn honors it on host-ready
  // and drop any buffered messages for the now-cancelled turn.
  function stopTab(tabId) {
    const host = runningHosts.get(tabId);
    if (host) {
      host.stop?.();
      return;
    }
    if (running.has(tabId)) {
      pendingStops.add(tabId);
      pendingMessages.delete(tabId);
    }
  }

  async function handleUserMessage(tabId, message) {
    // Session resolution is part of turn startup: ensureSession → createSession
    // awaits a storage.set() that can reject (quota/runtime). Route that to
    // onError like any other turn failure and resolve — otherwise the
    // fire-and-forget caller in background.js leaves an unhandled rejection and
    // the user's turn vanishes with no panel/transcript trace.
    let sessionId;
    try {
      sessionId = await sessionRegistry.ensureSession(tabId);
    } catch (err) {
      if (onError) onError(tabId, err);
      return;
    }
    // Busy? A turn is already live, OR one is starting and still forming its
    // group (the run slot is reserved just below, before the awaited
    // ensureSessionGroup), OR a completed turn is still tearing its group down
    // (runTurn's finally holds the slot until teardown resolves). In every case,
    // hand the message to the live host or buffer it — never start a second loop.
    if (running.has(tabId)) {
      const host = runningHosts.get(tabId);
      if (host) {
        deliverToHost(host, message);
      } else {
        const queue = pendingMessages.get(tabId) ?? [];
        queue.push(message);
        pendingMessages.set(tabId, queue);
      }
      return;
    }
    // Reserve the run slot SYNCHRONOUSLY, before the awaited ensureSessionGroup —
    // otherwise two rapid messages both observe running===false, both await group
    // setup, and both call runTurn, producing two concurrent loops for one tab.
    // runTurn re-adds it (idempotent) and its finally is the sole release point.
    running.add(tabId);
    // Form the session's tab group (anchor = this tab) once, before the first
    // turn — so open_tab has a group to join. Best-effort: a grouping failure
    // degrades to single-tab (the agent can still drive the anchor) rather than
    // sinking the turn, so it isn't added to groupedSessions and will retry.
    if (ensureSessionGroup && !groupedSessions.has(sessionId)) {
      try {
        await ensureSessionGroup(sessionId, tabId);
        groupedSessions.add(sessionId);
      } catch {
        /* non-fatal — proceed single-tab; retry on the next message */
      }
    }
    await runTurn(sessionId, tabId, { message });
  }

  // overrides let an explicit-consent caller (an orphaned open_tab approval the
  // user just answered "Allow" to) force re-perceive independent of whatever
  // gather turns up — spread over the gathered inputs before planResume, so
  // e.g. `{pendingAsk: null, hasActiveTurn: true}` overrides a still-persisted
  // (but already being cleared) pendingAsk that would otherwise plan
  // await-answer forever. `gather` returning `null` (not `{}`) is a categorical
  // veto that overrides can never cross: it means the runtime-specific gather
  // determined there is NOTHING to resume (e.g. no durable session record at
  // all) — a fact the generic orchestrator has no other way to see, so a null
  // result short-circuits to idle BEFORE the override merge, not after it.
  async function handleResume(tabId, overrides = {}) {
    // Checked FIRST, before even resolving a sessionId: a teardown in flight
    // for this tab means there is nothing safe to resume, and querying the
    // registry at all is pointless (sessionFor's own adoptRecovered fallback
    // would just re-bind against state the teardown is actively unwinding).
    if (tearingDown.has(tabId)) return { action: "idle", reason: "A teardown is in progress for this tab." };
    const sessionId = sessionRegistry.sessionFor(tabId);
    if (!sessionId) return { action: "idle", reason: "No session for this tab." };
    if (running.has(tabId) || resuming.has(tabId)) return { action: "idle", reason: "A turn is already running." };
    // Reserved synchronously, before the awaited gather — mirrors
    // handleUserMessage's running.add above (same race, same fix).
    resuming.add(tabId);
    try {
      const inputs = await gather(sessionId, tabId, overrides);
      if (inputs === null) return { action: "idle", reason: "Nothing to resume for this session." };
      const plan = planResume({ ...inputs, ...overrides });
      // All three re-checks are synchronous with runTurn's own running.add (no
      // await between here and there), so none of these windows can reopen:
      //   - running: a user message that landed during gather already claimed
      //     the slot and started its own turn — freshest intent wins; resume
      //     backs off rather than double-looping.
      //   - tearingDown: a teardown that BEGAN while gather was in flight —
      //     caught here even though the initial check above missed it.
      //   - sessionFor: a CLEAR_SESSION that landed during gather unbound the
      //     registry — resume must abort rather than drive a cleared session.
      if (
        plan.action === "re-perceive" &&
        !running.has(tabId) &&
        !tearingDown.has(tabId) &&
        sessionRegistry.sessionFor(tabId) === sessionId
      ) {
        safeCall(onResumeStart, tabId, plan); // best-effort notice, not awaited
        await runTurn(sessionId, tabId, { resume: plan });
      }
      return plan;
    } catch (err) {
      // Mirror handleUserMessage's ensureSession isolation: gather (journal /
      // session-state reads) can reject — never let that escape as an
      // unhandled rejection or leave the tab wedged for the next message.
      if (onError) onError(tabId, err);
      return { action: "idle", reason: "Resume inputs could not be gathered." };
    } finally {
      resuming.delete(tabId);
    }
  }

  // Held by a caller (sw-loop-runtime.js's onTabRemoved) for the full duration
  // of a tab/session teardown, so handleResume can never start a turn against
  // a tab mid-removal — see the tearingDown Set's own comment above for why a
  // synchronous, independent guard is required here (not just reordering).
  function beginTeardown(tabId) {
    tearingDown.add(tabId);
  }
  function endTeardown(tabId) {
    tearingDown.delete(tabId);
  }

  return { handleUserMessage, handleResume, stopTab, beginTeardown, endTeardown };
}
