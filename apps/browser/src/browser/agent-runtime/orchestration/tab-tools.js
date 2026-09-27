/**
 * Agent-facing tab tools — open_tab / list_tabs / switch_focus / close_tab.
 *
 * The confinement invariant lives here: every tool resolves the acting session
 * and may only create, focus, list, or close tabs in THAT session's group. The
 * agent is never handed `chrome.tabs.query({})`; `list_tabs` returns members
 * only, and focus/close are gated on `tabGroup.isMember`. `open_tab` is
 * domain-gated like `navigate` so it can't be used to reach a blocklisted site
 * the per-tab gate would have refused.
 *
 * Expected refusals return `{ error }` (the agent reads it as a tool result);
 * the tools never throw for a denied request. Factory over the tab-group manager
 * and chrome.tabs (DIP); tests inject fakes.
 */

const NOT_A_MEMBER = (tabId) =>
  `Tab ${tabId} is not part of this agent session — you can only act on tabs you ` +
  `opened. Use list_tabs to see them.`;

export function createTabTools({ tabGroup, tabsApi, checkUrl, askUser } = {}) {
  if (!tabGroup) throw new Error("createTabTools: tabGroup is required");
  if (!tabsApi) throw new Error("createTabTools: tabsApi is required");
  // Hard dependency, never defaulted: open_tab creates a tab OUTSIDE the
  // content-script permission path, so a missing/mis-wired URL gate must fail at
  // construction rather than silently letting the agent reach blocked sites.
  if (typeof checkUrl !== "function") {
    throw new Error("createTabTools: checkUrl is required (URL policy gate for open_tab)");
  }

  // Reject anything that isn't a real http(s) URL before consulting policy, so
  // the agent can't open javascript:/file:/chrome: targets or malformed strings.
  // Returns the same { decision, reason } shape as checkUrl.
  function screenUrl(url) {
    let parsed;
    try {
      parsed = new URL(url);
    } catch {
      return { decision: "deny", reason: "is not a valid URL" };
    }
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return { decision: "deny", reason: `uses an unsupported scheme (${parsed.protocol})` };
    }
    return checkUrl(url);
  }

  async function openTab(sessionId, url) {
    const record = tabGroup.getRecord(sessionId);
    if (!record) {
      return { error: "No active Auto Browser session to open a tab in." };
    }

    const verdict = screenUrl(url);
    if (verdict.decision === "deny") {
      return { error: `Blocked: ${url} ${verdict.reason}.` };
    }
    if (verdict.decision === "ask") {
      // No approval UI wired → same flat refusal as before this feature existed.
      if (typeof askUser !== "function") {
        return { error: `Blocked: ${url} ${verdict.reason}.` };
      }
      const approved = await askUser(record.anchorTabId, "open_tab", { url });
      if (!approved) {
        return { error: `Blocked: ${url} — you declined to open it.` };
      }
    }

    const tab = await tabsApi.create({ url, active: false, windowId: record.windowId });
    try {
      await tabGroup.addMember(sessionId, tab.id);
    } catch (err) {
      // Grouping failed even after retries — close the tab we just made rather
      // than strand it ungrouped and untouchable (close_tab is membership-gated).
      await tabsApi.remove(tab.id).catch(() => {});
      return { error: `Couldn't add the new tab to your session: ${err.message}` };
    }
    return { tabId: tab.id, url };
  }

  async function listTabs(sessionId) {
    const memberIds = tabGroup.getMembers(sessionId);
    const tabs = await Promise.all(
      memberIds.map(async (tabId) => {
        // A member tab closed mid-listing (onRemoved not yet processed) must not
        // reject the whole enumeration — degrade to a present-but-blank row.
        const tab = await tabsApi.get(tabId).catch(() => null);
        return { tabId, url: tab?.url ?? "", title: tab?.title ?? "" };
      }),
    );
    return { focusedTabId: tabGroup.getRecord(sessionId)?.focusedTabId, tabs };
  }

  async function switchFocus(sessionId, tabId) {
    if (!tabGroup.isMember(sessionId, tabId)) {
      return { error: NOT_A_MEMBER(tabId) };
    }
    await tabGroup.setFocus(sessionId, tabId);
    return { ok: true, focusedTabId: tabId };
  }

  async function closeTab(sessionId, tabId) {
    if (!tabGroup.isMember(sessionId, tabId)) {
      return { error: NOT_A_MEMBER(tabId) };
    }
    const record = tabGroup.getRecord(sessionId);
    if (record?.anchorTabId === tabId) {
      return { error: "Can't close the anchor tab; end the task with task_complete instead." };
    }
    try {
      await tabsApi.remove(tabId);
    } catch (err) {
      // Tab already gone is fine — we forget it anyway. Any other failure means
      // the tab may still be live, so keep membership and surface the error.
      if (!/no tab with id/i.test(err.message)) {
        return { error: `close_tab: ${err.message}` };
      }
    }
    // The tab is destroyed, so forget membership (no Chrome ungroup — that would
    // reject on an already-removed tab; see tab-group.forgetMember).
    await tabGroup.forgetMember(sessionId, tabId);
    return { ok: true };
  }

  return { openTab, listTabs, switchFocus, closeTab };
}
