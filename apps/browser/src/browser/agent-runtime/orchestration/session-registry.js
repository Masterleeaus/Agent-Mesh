/**
 * Session registry — maps a driven tabId to its orchestrator session (UUID) and
 * owns the lifecycle the per-tab-state layer doesn't.
 *
 * The relocated loop keeps two stores: `per-tab-state` (the side-panel
 * transcript, keyed by tabId) and `session-state` (the orchestrator's resumable
 * history, keyed by a minted UUID). On tab close, only the former is cleaned up
 * by the existing `onRemoved`/`purgeGhosts` path — so without this registry the
 * UUID `session_v2_*` record AND the action-journal intents (also keyed by
 * sessionId) would leak forever, and a stale intent could be mis-resumed. On
 * prerender (`onReplaced`) the bound tabId is reassigned, so the session must
 * follow it and migrate its per-tab sub-state.
 *
 * Factory composing the merged session-state + action-journal modules (DIP).
 * `recoverSession(tabId)` is optional: when the in-memory map is empty (e.g. the
 * first message after an MV3 worker eviction), it lets ensureSession re-adopt a
 * sessionId whose tab group survived the restart instead of minting a fresh one
 * — so the durable transcript is reused and no duplicate group forms. Absent →
 * always mint (the original behavior).
 */
export function createSessionRegistry({ sessionStore, journal, recoverSession } = {}) {
  if (!sessionStore) throw new Error("createSessionRegistry: sessionStore is required");
  if (!journal) throw new Error("createSessionRegistry: journal is required");

  const byTab = new Map(); // tabId -> sessionId
  const bySession = new Map(); // sessionId -> bound tabId

  // Coalesce concurrent ensureSession(tabId) calls: the await on createSession()
  // is a window where a second caller would mint a SECOND UUID for the same tab.
  // Publish the in-flight creation so racing callers share one session.
  const pendingByTab = new Map(); // tabId -> Promise<sessionId>

  // Re-adopt a session whose group survived a worker restart, binding the tab
  // both ways, before a fresh UUID is minted. Synchronous + authoritative: only a
  // validated anchor-tab match returns an id (see background.js's recoverSession).
  // Every entry point that resolves "which session owns this tab" goes through
  // here so recovery is consistent — a message adopts it (ensureSession), a read
  // sees it (sessionFor), and a clear/close can tear it down (onTabRemoved). Once
  // bound, byTab short-circuits, so recovery is consulted only on the first touch.
  function adoptRecovered(tabId) {
    const recovered = recoverSession?.(tabId);
    if (!recovered) return undefined;
    byTab.set(tabId, recovered);
    bySession.set(recovered, tabId);
    return recovered;
  }

  function ensureSession(tabId) {
    const existing = byTab.get(tabId);
    if (existing) return Promise.resolve(existing);
    const inflight = pendingByTab.get(tabId);
    if (inflight) return inflight;

    const recovered = adoptRecovered(tabId);
    if (recovered) return Promise.resolve(recovered);

    const create = sessionStore
      .createSession()
      .then((sessionId) => {
        byTab.set(tabId, sessionId);
        bySession.set(sessionId, tabId);
        return sessionId;
      })
      .finally(() => pendingByTab.delete(tabId));
    pendingByTab.set(tabId, create);
    return create;
  }

  function sessionFor(tabId) {
    return byTab.get(tabId) ?? adoptRecovered(tabId);
  }

  function tabFor(sessionId) {
    return bySession.get(sessionId);
  }

  // Tab closed / conversation cleared → drop both UUID-keyed stores so nothing
  // leaks (and, critically, so a cleared session can't be re-adopted). Recover
  // first: after a worker eviction the map is empty but the durable session +
  // journal survive, and they must be deleted here or the next message resurrects
  // them. Resolve an in-flight creation too so a session minted mid-close isn't
  // orphaned.
  async function onTabRemoved(tabId) {
    const sessionId = byTab.get(tabId) ?? adoptRecovered(tabId) ?? (await pendingByTab.get(tabId));
    if (!sessionId) return;
    pendingByTab.delete(tabId);
    byTab.delete(tabId);
    bySession.delete(sessionId);
    await Promise.all([journal.clearSession(sessionId), sessionStore.deleteSession(sessionId)]);
  }

  // Prerender commit reassigned the tabId → the session follows it and its
  // per-tab sub-state (lastSeal / expectedOrigin) moves old → new. Resolve an
  // in-flight creation first (same as onTabRemoved): if onReplaced fires while
  // ensureSession(oldTabId) is still awaiting createSession(), reading byTab
  // alone would no-op, and ensureSession's .then would then bind the session to
  // the REMOVED tab — orphaning it. Awaiting the pending promise lets that .then
  // land first, so the delete/rebind below moves it onto the new tab.
  async function onTabReplaced(oldTabId, newTabId) {
    const sessionId = byTab.get(oldTabId) ?? (await pendingByTab.get(oldTabId));
    if (!sessionId) return;
    pendingByTab.delete(oldTabId);
    byTab.delete(oldTabId);
    byTab.set(newTabId, sessionId);
    bySession.set(sessionId, newTabId);
    // Non-atomic read→write→remove: a concurrent setPerTab on the OLD tabId
    // landing mid-migration would be lost. Safe in practice because a prerender
    // commit discards the old tab, so nothing else writes its sub-state after
    // this fires; if that ever changes, fold the move into one session-state
    // update() instead of composing three public calls.
    const sub = await sessionStore.getPerTab(sessionId, oldTabId);
    if (sub && Object.keys(sub).length > 0) {
      await sessionStore.setPerTab(sessionId, newTabId, sub);
    }
    await sessionStore.removeTab(sessionId, oldTabId);
  }

  return { ensureSession, sessionFor, tabFor, onTabRemoved, onTabReplaced };
}
