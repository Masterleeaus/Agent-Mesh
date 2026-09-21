/**
 * SW-loop router — the routing DECISIONS (and their swLoopReady / groupHydrated
 * gating) that decide whether/how the service-worker ReAct loop handles a
 * message, extracted out of background.js's onMessage handler.
 *
 * This is the "thin edge": logic that used to live inline in the message
 * handler with no unit-test net, and that PR reviews kept having to hand-trace —
 * the {swLoop:false} kill-switch cold-window gate, the orphaned open_tab
 * approval adopt→resume→grant-clear chain, and the wake-time resume sweep.
 * Pulling it behind a DIP factory (background.js supplies the real promises,
 * the flag getter, the runtime, and the per-tab-state / approval helpers) makes
 * every gate and ordering directly testable with fake promises + spies.
 *
 * Two async prerequisites gate everything, both supplied as already-created
 * promises:
 *   - swLoopReady:  resolves once the `swLoop` flag has been read from storage,
 *     so the SW-vs-CS decision is never made against the default-true flag in
 *     the cold-worker window (a {swLoop:false} user's first message / Stop must
 *     not be captured by the SW loop). isSwLoopEnabled() is read only AFTER it.
 *   - groupHydrated: resolves once the tab-group authority has re-adopted any
 *     restart-surviving groups, so a first message's session recovery sees them.
 */
export function createSwLoopRouter({
  swLoopReady,
  groupHydrated,
  isSwLoopEnabled,
  shouldPersist,
  getRuntime,
  relayToTab,
  readTabState,
  clearPendingAsk,
  notifyError,
  resolveApprovalAnswer,
  grantOnce,
  clearGrants,
  adoptOrphanedApproval,
  expireOrphanedApproval,
} = {}) {
  // Route a USER_MESSAGE / STOP_AGENT to the SW loop or the content-script loop.
  // Returns whether it took ownership (a persisted tab): false means the caller
  // should fall through to its plain content-script relay (incognito etc.). The
  // SW-vs-CS choice itself waits on swLoopReady so the kill-switch is honored
  // even in the cold-worker window.
  function routeUserMessageOrStop(msg, tabId) {
    if (!Number.isInteger(tabId) || !shouldPersist(tabId)) return false;
    // Image/audio attachments are decoded into live provider parts ONLY by the
    // content-script USER_MESSAGE handler; the SW loop's history is text-only,
    // so attachment-bearing turns always take the CS loop.
    const hasAttachments =
      msg.type === "USER_MESSAGE" &&
      Array.isArray(msg.payload?.attachments) &&
      msg.payload.attachments.length > 0;
    swLoopReady
      .then(() => {
        if (!isSwLoopEnabled() || hasAttachments) {
          relayToTab(tabId, msg);
          return;
        }
        if (msg.type === "USER_MESSAGE") {
          // Wait for group re-adoption before the FIRST message resolves its
          // session, so recoverSession re-adopts the restart-surviving session
          // instead of minting a fresh one. Once settled (the warm case) both
          // gates are immediate microtasks.
          return groupHydrated.then(() =>
            getRuntime().handleUserMessage(tabId, msg.payload?.text || ""),
          );
        }
        getRuntime().stopTab(tabId); // STOP reaches the live SW loop
      })
      .catch(() => {});
    return true;
  }

  // A SW-side open_tab approval answer (id "approve-<tab>-<uuid>"). Its outcome
  // (from the injected resolveApprovalAnswer, i.e. swAskUser.resolveAnswer):
  //   "resolved"/"stale" — the live resolver handled it (or a newer prompt is
  //     pending); nothing more to do here.
  //   "orphaned" — the parked turn died with an evicted worker, so there's no
  //     live resolver. "Don't allow" → fail-closed expiry. "Allow" → adopt the
  //     chip (clear it + one-shot grant for the exact action) and resume the
  //     turn; the grant is scoped to THAT resume attempt (cleared when it
  //     settles — see the .finally), so an unconsumed grant can't auto-allow a
  //     later, unrelated turn's exact-same open_tab within the TTL.
  function routeApproveAnswer(tabId, id, answer) {
    const outcome = resolveApprovalAnswer(tabId, id, answer);
    if (outcome !== "orphaned") return Promise.resolve();
    if (answer !== "Allow") {
      return expireOrphanedApproval(tabId, id, { readState: readTabState, clearPendingAsk, notify: notifyError }).catch(
        () => {},
      );
    }
    return adoptOrphanedApproval(tabId, id, { readState: readTabState, clearPendingAsk, grantOnce })
      .then((adopted) => {
        if (!adopted) return; // stale answer to a since-replaced prompt — untouched, nothing granted
        return swLoopReady
          .then(() => {
            if (!isSwLoopEnabled()) return;
            return groupHydrated.then(() =>
              getRuntime()
                .handleResume(tabId, { pendingAsk: null, hasActiveTurn: true })
                .then((plan) => {
                  if (plan?.action !== "re-perceive") {
                    notifyError(tabId, "The interrupted task couldn't be resumed — resend your request to continue.");
                  }
                }),
            );
          })
          .finally(() => clearGrants(tabId));
      })
      .catch(() => {});
  }

  // Wake-time auto-resume: offer each re-adopted anchor to handleResume. The
  // caller has already awaited swLoopReady (so isSwLoopEnabled is settled) and
  // groupHydrated (so `adopted` is the re-adopted record set). Every
  // stale/answered/no-evidence case short-circuits inside handleResume itself.
  function runWakeResumeSweep(adopted) {
    if (!isSwLoopEnabled()) return;
    for (const record of adopted ?? []) {
      const anchorTabId = record?.anchorTabId;
      if (!Number.isInteger(anchorTabId) || !shouldPersist(anchorTabId)) continue;
      getRuntime().handleResume(anchorTabId).catch(() => {});
    }
  }

  // CLEAR_SESSION's SW-loop side: stop the live loop and drop the durable
  // session so a cleared conversation can't be resurrected. Gated on swLoopReady
  // (the settled flag) + groupHydrated so onTabRemoved's recoverSession sees the
  // re-adopted group and tears it down even when the clear lands before any
  // message this worker life.
  function routeClearSessionTeardown(tabId, stopAgent) {
    return swLoopReady
      .then(() => {
        if (!isSwLoopEnabled()) return;
        if (stopAgent) getRuntime().stopTab(tabId);
        return groupHydrated.then(() => getRuntime().onTabRemoved(tabId));
      })
      .catch(() => {});
  }

  return { routeUserMessageOrStop, routeApproveAnswer, runWakeResumeSweep, routeClearSessionTeardown };
}
