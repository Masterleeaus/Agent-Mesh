/**
 * Group-scoped blocklist sweep — belt-and-suspenders defense for multi-tab
 * sessions. The CS-side per-action gate (src/safety/permission-manager.js
 * decide()) only fires on a MUTATING tool call, so a BACKGROUND member tab
 * (one the agent opened via open_tab but isn't currently focused on) can sit
 * on a blocked domain indefinitely without ever tripping it — nothing calls a
 * tool there. This sweep instead listens to every tab's navigation and, the
 * moment ANY member of an agent session lands on a blocked host, pauses the
 * WHOLE session — not just the tab that navigated.
 *
 * Factory over the pieces needed to do that without re-deriving them:
 *   - findGroupByTab / getRecord: the tab-group membership authority's own
 *     read API (a non-member tab is ignored — O(1), safe for a
 *     browser-global chrome.tabs.onUpdated listener).
 *   - isBlockedHost(hostname): the safety policy's blocklist check, already
 *     curried with the current policy so this module stays policy-agnostic.
 *   - stopSession(anchorTabId): halts the live SW loop. Takes the ANCHOR, not
 *     the navigating tab — the orchestrator's runningHosts map (and stopTab)
 *     is keyed by the anchor tabId, never a member's.
 *   - notify(anchorTabId, message): surfaces the pause to the panel — the
 *     anchor is where the panel/conversation lives.
 */
export function createGroupNavSweep({ findGroupByTab, getRecord, isBlockedHost, stopSession, notify } = {}) {
  if (typeof findGroupByTab !== "function") throw new Error("createGroupNavSweep: findGroupByTab is required");
  if (typeof getRecord !== "function") throw new Error("createGroupNavSweep: getRecord is required");
  if (typeof isBlockedHost !== "function") throw new Error("createGroupNavSweep: isBlockedHost is required");
  if (typeof stopSession !== "function") throw new Error("createGroupNavSweep: stopSession is required");
  if (typeof notify !== "function") throw new Error("createGroupNavSweep: notify is required");

  function handleNavigation(tabId, url) {
    const sessionId = findGroupByTab(tabId);
    if (!sessionId) return; // not an agent-owned tab — nothing to sweep

    let hostname;
    try {
      hostname = new URL(url).hostname;
    } catch {
      return; // unparseable URL — nothing to check against the blocklist
    }
    if (!isBlockedHost(hostname)) return;

    // The session could have been torn down between findGroupByTab and here
    // (both are synchronous, but this guards a future async gap defensively).
    const record = getRecord(sessionId);
    if (!record) return;

    stopSession(record.anchorTabId);
    notify(record.anchorTabId, `Stopped: an agent tab navigated to a blocked site (${hostname}).`);
  }

  return { handleNavigation };
}
