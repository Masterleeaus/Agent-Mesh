/**
 * Per-turn CDP session state. Not a singleton — callers own the instance,
 * which lets tests create fresh ones and lets the service worker track state
 * per attached tab.
 *
 * Fields:
 *   tabId          — the tab the debugger is attached to for this turn
 *   currentOrigin  — the origin captured at the last snapshot; compared by
 *                    url-drift.js before every mutating action
 *   refmapSeal     — token identifying the refmap revision the content script
 *                    currently holds; mismatch means "Re-snapshot" is required
 *   startedAt      — epoch ms when the turn began; for diagnostics only
 */

export function createSession() {
  return {
    tabId: null,
    currentOrigin: null,
    refmapSeal: null,
    startedAt: null,
  };
}

export function resetSession(session) {
  session.tabId = null;
  session.currentOrigin = null;
  session.refmapSeal = null;
  session.startedAt = null;
}
