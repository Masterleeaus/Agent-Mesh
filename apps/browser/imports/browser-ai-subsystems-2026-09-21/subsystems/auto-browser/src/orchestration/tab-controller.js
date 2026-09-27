/**
 * Tab controller — the session's tab/focus facade for the SW loop. Bundles the
 * tab-group membership authority and the agent tab tools so:
 *   - the SW host can recognise the 4 tab tools (isTabTool) and route them to
 *     the SW (handleTabTool) instead of the focused content script — they call
 *     chrome.tabs/tabGroups, which a content script can't reach;
 *   - the host can ask which tab is focused NOW (getFocus) to re-target its
 *     page RPCs (perceive / act / call-LLM) as the agent moves focus;
 *   - the runtime can manage the group lifecycle (ensureSessionGroup on the
 *     first message; setWorking as the ⌛ turn-in-progress indicator;
 *     teardownSession on anchor-tab close / session clear / task_complete; and
 *     forgetClosedMember when the user closes a non-anchor member tab).
 *
 * Pure composition over the injected tab-group manager + tab tools (DIP); the
 * chrome.tabs/tabGroups edges live in those modules. background.js binds them.
 */

const TAB_TOOLS = new Set(["open_tab", "list_tabs", "switch_focus", "close_tab"]);

export function createTabController({ tabGroup, tabTools } = {}) {
  if (!tabGroup) throw new Error("createTabController: tabGroup is required");
  if (!tabTools) throw new Error("createTabController: tabTools is required");

  const isTabTool = (name) => TAB_TOOLS.has(name);

  function handleTabTool(sessionId, tool, args = {}) {
    switch (tool) {
      case "open_tab":
        return tabTools.openTab(sessionId, args.url);
      case "list_tabs":
        return tabTools.listTabs(sessionId);
      case "switch_focus":
        return tabTools.switchFocus(sessionId, args.tab_id);
      case "close_tab":
        return tabTools.closeTab(sessionId, args.tab_id);
      default:
        return Promise.resolve({ error: `Unknown tab tool: ${tool}` });
    }
  }

  return {
    isTabTool,
    handleTabTool,
    // The current focus (or undefined before the group is ensured — the host
    // falls back to its bound anchor tab).
    getFocus: (sessionId) => tabGroup.getFocus(sessionId),
    ensureSessionGroup: (sessionId, opts) => tabGroup.ensureGroup(sessionId, opts),
    teardownSession: (sessionId) => tabGroup.teardown(sessionId),
    // The ⌛ ambient "agent is working" indicator on the group title.
    setWorking: (sessionId, working) => tabGroup.setWorking(sessionId, working),
    // Prerender commit reassigned a member's tabId — keep the membership authority
    // (anchor/focus/members) following it so getFocus() doesn't dangle.
    replaceTab: (oldTabId, newTabId) => tabGroup.replaceTab(oldTabId, newTabId),
    // A member tab the USER closed (not via close_tab): forget it so focus + the
    // member list don't dangle on a dead tab. No-op for the anchor (the session
    // teardown path owns that) or a non-member.
    forgetClosedMember: (tabId) => {
      const sessionId = tabGroup.findGroupByTab(tabId);
      if (!sessionId) return Promise.resolve();
      if (tabGroup.getRecord(sessionId)?.anchorTabId === tabId) return Promise.resolve();
      return tabGroup.forgetMember(sessionId, tabId);
    },
  };
}
