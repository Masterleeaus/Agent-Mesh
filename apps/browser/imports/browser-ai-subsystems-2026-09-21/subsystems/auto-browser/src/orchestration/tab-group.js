/**
 * Tab-group manager — the single authority for "which tabs the agent owns".
 *
 * Each agent task runs inside a dedicated Chrome tab group ("Auto Browser")
 * that isolates the agent's tabs from the user's own tabs. This module owns
 * that group's lifecycle: create / colour / title it, track membership, drive
 * the ⌛ working indicator, and tear the group down (ungroup — never delete the
 * user's tabs) when the task ends.
 *
 * Membership is the load-bearing safety boundary: the background action
 * chokepoint asks `isMember(sessionId, tabId)` before dispatching ANY action,
 * so the agent can never drive, navigate, or close a tab outside its own group.
 * That check must be synchronous and authoritative, so the in-memory maps here
 * are the source of truth; chrome.storage is only a durability mirror.
 *
 * Architecture: factory over chrome.tabs / chrome.tabGroups (DIP), mirroring
 * src/cdp/driver.js. Production wraps the real chrome APIs; tests inject fakes.
 */

export const GROUP_TITLE = "Auto Browser";
export const WORKING_PREFIX = "⌛ ";

// Single chrome.storage.local key holding every persistable session's group
// metadata, so the worker can re-adopt its groups after an unexpected restart.
export const GROUP_STORAGE_KEY = "auto_group_sessions";

// chrome.tabGroups.Color values, curated to visually distinct hues and assigned
// round-robin so concurrent sessions are easy to tell apart. "grey" is omitted
// because it reads as a disabled/neutral group rather than an active agent one.
export const SESSION_GROUP_COLORS = [
  "blue",
  "green",
  "purple",
  "cyan",
  "pink",
  "orange",
  "red",
  "yellow",
];

// Chrome intermittently rejects chrome.tabs.group with "Tabs cannot be edited
// right now" in the brief window just after chrome.tabs.create. Retry a handful
// of times before surfacing the failure so a freshly opened tab still lands in
// the group instead of being orphaned in the user's tab strip.
const DEFAULT_REGROUP_ATTEMPTS = 5;
const DEFAULT_REGROUP_BACKOFF_MS = 250;

/**
 * @param {object} opts
 * @param {object} opts.tabsApi       chrome.tabs (needs group/ungroup/create/remove/query) or a fake.
 * @param {object} opts.tabGroupsApi  chrome.tabGroups (needs update/get) or a fake.
 * @param {() => number} [opts.now]   Clock injection for deterministic timestamps.
 * @param {(ms: number) => Promise<void>} [opts.sleep]  Backoff injection for retry tests.
 * @param {number} [opts.regroupAttempts]
 * @param {() => void} [opts.onChange]  Notified after any mutation a panel would
 *   need to re-render for (membership, focus, working state, lifecycle). Never
 *   awaited and never allowed to affect the caller — see notifyChange() below.
 */
export function createTabGroupManager({
  tabsApi,
  tabGroupsApi,
  storage,
  now = () => Date.now(),
  sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  regroupAttempts = DEFAULT_REGROUP_ATTEMPTS,
  onChange = () => {},
} = {}) {
  if (!tabsApi) {
    throw new Error("createTabGroupManager: tabsApi is required (pass chrome.tabs or a fake)");
  }
  if (!tabGroupsApi) {
    throw new Error("createTabGroupManager: tabGroupsApi is required (pass chrome.tabGroups or a fake)");
  }
  if (!storage) {
    throw new Error("createTabGroupManager: storage is required (pass chrome.storage.local or a fake)");
  }

  if (regroupAttempts < 1) {
    throw new Error("createTabGroupManager: regroupAttempts must be >= 1");
  }

  const groups = new Map(); // sessionId -> GroupRecord
  const tabIndex = new Map(); // tabId -> sessionId (reverse lookup + O(1) membership)
  let colorCursor = 0;

  // All persistence funnels through one promise chain on a single storage key so
  // concurrent mutations serialize and never clobber each other's snapshot. The
  // chain's tail is kept alive past a rejection (so one failed write doesn't
  // wedge all future writes), but each caller still receives the un-caught write
  // promise so a real storage failure surfaces instead of being swallowed —
  // mirrors enqueue() in src/session/per-tab-state.js.
  let storageChain = Promise.resolve();
  function persistAll() {
    const snapshot = {};
    for (const [sessionId, record] of groups) {
      if (record.incognito) continue; // no-trace invariant
      snapshot[sessionId] = { ...record, memberTabIds: [...record.memberTabIds] };
    }
    // An empty snapshot means no persistable sessions remain (last teardown, or
    // an incognito-only worker) — remove the key entirely rather than leaving a
    // `{}` trace behind.
    const write = storageChain.then(() =>
      Object.keys(snapshot).length === 0
        ? storage.remove(GROUP_STORAGE_KEY)
        : storage.set({ [GROUP_STORAGE_KEY]: snapshot }),
    );
    storageChain = write.catch(() => {});
    notifyChange();
    return write;
  }

  // Fire the panel-notification hook. Synchronous and exception-isolated: the
  // group data is already committed in memory by the time this runs, so a
  // broadcast failure (or an absent onChange) must never reject persistAll's
  // promise or otherwise affect the caller.
  function notifyChange() {
    try {
      onChange();
    } catch {
      /* a failing notification must not corrupt state or propagate */
    }
  }

  // Prefer a colour no live session is using so concurrent (and re-adopted)
  // groups stay visually distinct; only once all colours are taken do we wrap
  // round-robin. Computing from the live set (not a bare counter) keeps colours
  // collision-free even after hydrate() re-adopts sessions on a worker restart.
  function pickColor() {
    const inUse = new Set([...groups.values()].map((record) => record.color));
    const free = SESSION_GROUP_COLORS.find((color) => !inUse.has(color));
    if (free) return free;
    const color = SESSION_GROUP_COLORS[colorCursor % SESSION_GROUP_COLORS.length];
    colorCursor += 1;
    return color;
  }

  // Single writer for both membership structures so they never disagree. A tab
  // can belong to exactly one session: if it was already owned elsewhere, evict
  // it from that owner first, otherwise the old record keeps a phantom member
  // that a later teardown would wrongly ungroup.
  function registerMember(record, tabId) {
    const priorSessionId = tabIndex.get(tabId);
    if (priorSessionId && priorSessionId !== record.sessionId) {
      const prior = groups.get(priorSessionId);
      if (prior) prior.memberTabIds = prior.memberTabIds.filter((id) => id !== tabId);
    }
    if (!record.memberTabIds.includes(tabId)) record.memberTabIds.push(tabId);
    tabIndex.set(tabId, record.sessionId);
  }

  function requireRecord(sessionId, op) {
    const record = groups.get(sessionId);
    if (!record) throw new Error(`${op}: no group for session "${sessionId}"`);
    return record;
  }

  async function groupWithRetry(groupOpts) {
    let lastError;
    for (let attempt = 0; attempt < regroupAttempts; attempt += 1) {
      try {
        return await tabsApi.group(groupOpts);
      } catch (err) {
        lastError = err;
        if (attempt < regroupAttempts - 1) await sleep(DEFAULT_REGROUP_BACKOFF_MS);
      }
    }
    throw lastError;
  }

  async function ensureGroup(sessionId, { anchorTabId, windowId, incognito = false }) {
    const existing = groups.get(sessionId);
    if (existing) {
      if (existing.anchorTabId !== anchorTabId) {
        console.warn(
          `[tab-group] ensureGroup(${sessionId}): ignoring new anchor ${anchorTabId}; ` +
            `session already anchored to ${existing.anchorTabId}.`,
        );
      }
      return existing;
    }

    const chromeGroupId = await tabsApi.group({ tabIds: [anchorTabId] });
    const color = pickColor();
    await tabGroupsApi.update(chromeGroupId, { title: GROUP_TITLE, color });

    const ts = now();
    const record = {
      sessionId,
      chromeGroupId,
      windowId,
      anchorTabId,
      memberTabIds: [],
      focusedTabId: anchorTabId,
      color,
      title: GROUP_TITLE,
      working: false,
      incognito,
      createdAt: ts,
      updatedAt: ts,
    };
    registerMember(record, anchorTabId);
    groups.set(sessionId, record);
    await persistAll();
    return record;
  }

  async function addMember(sessionId, tabId) {
    const record = requireRecord(sessionId, "addMember");
    await groupWithRetry({ tabIds: [tabId], groupId: record.chromeGroupId });
    registerMember(record, tabId);
    record.updatedAt = now();
    await persistAll();
    return record;
  }

  // Drop a tab from membership with NO Chrome call — for a tab that is already
  // being destroyed (close_tab, a future tabs.onRemoved handler). Ungrouping an
  // already-removed tab rejects with "No tab with id", so destroyers must forget,
  // not ungroup.
  function forgetMember(sessionId, tabId) {
    const record = groups.get(sessionId);
    if (!record) return Promise.resolve();
    record.memberTabIds = record.memberTabIds.filter((id) => id !== tabId);
    if (tabIndex.get(tabId) === sessionId) tabIndex.delete(tabId);
    // Never leave focus pointing at a non-member — a downstream "act on the
    // focused tab" would otherwise target a tab outside the group.
    if (record.focusedTabId === tabId) {
      record.focusedTabId = record.memberTabIds[0] ?? null;
    }
    record.updatedAt = now();
    return persistAll();
  }

  // Eject a STILL-LIVE tab from the group (Chrome ungroup) and forget it — keeps
  // the tab open but out of the agent's group. For a tab being closed, use
  // forgetMember instead.
  async function removeMember(sessionId, tabId) {
    if (!groups.has(sessionId)) return;
    await tabsApi.ungroup([tabId]);
    await forgetMember(sessionId, tabId);
  }

  function isMember(sessionId, tabId) {
    return tabIndex.get(tabId) === sessionId;
  }

  function findGroupByTab(tabId) {
    return tabIndex.get(tabId);
  }

  function getMembers(sessionId) {
    const record = groups.get(sessionId);
    return record ? [...record.memberTabIds] : [];
  }

  // Throws synchronously for a non-member (so the action chokepoint gets a fast
  // guard) and returns the persistence promise so callers that need the focus to
  // survive a worker restart can await it.
  function setFocus(sessionId, tabId) {
    const record = requireRecord(sessionId, "setFocus");
    if (!isMember(sessionId, tabId)) {
      throw new Error(`setFocus: tab ${tabId} is not a member of session "${sessionId}"`);
    }
    record.focusedTabId = tabId;
    record.updatedAt = now();
    return persistAll();
  }

  function getFocus(sessionId) {
    return groups.get(sessionId)?.focusedTabId;
  }

  // The group title doubles as an ambient "agent is working" indicator that's
  // visible even when the side panel is closed. Computed from the base title so
  // repeated calls can never stack the prefix.
  async function setWorking(sessionId, working) {
    const record = requireRecord(sessionId, "setWorking");
    if (record.working === working) return;
    const title = working ? `${WORKING_PREFIX}${GROUP_TITLE}` : GROUP_TITLE;
    // Flip in-memory state only AFTER Chrome accepts the title change. If the
    // update throws, the record stays unchanged so a retry actually re-issues it
    // rather than being short-circuited by the idempotency guard.
    await tabGroupsApi.update(record.chromeGroupId, { title });
    record.working = working;
    record.title = title;
    record.updatedAt = now();
    notifyChange(); // setWorking doesn't persist, so it needs its own notify call
  }

  // Dissolve the group on task end. We UNGROUP rather than delete so the user's
  // tabs (and any the agent opened) survive as loose tabs — closing a user's
  // work without asking would be a hostile surprise.
  async function teardown(sessionId) {
    const record = groups.get(sessionId);
    if (!record) return;
    // Ungroup per member, each guarded. On a real tabs.onRemoved the anchor (or
    // any member) may already be gone, and chrome.tabs.ungroup rejects the WHOLE
    // batch if any id is missing — which would both strand the live members
    // grouped AND (the throw escaping) skip the map/storage cleanup below, leaking
    // a dead session. Per-member catch frees the live tabs and keeps cleanup
    // unconditional.
    await Promise.all(record.memberTabIds.map((tabId) => tabsApi.ungroup([tabId]).catch(() => {})));
    for (const tabId of record.memberTabIds) {
      if (tabIndex.get(tabId) === sessionId) tabIndex.delete(tabId);
    }
    groups.delete(sessionId);
    await persistAll();
  }

  // Re-adopt persisted groups after a service-worker restart — but ONLY tabs
  // still live in their recorded group and window. chrome.storage.local outlives
  // a full browser restart, after which Chrome reuses tab and group ids, so a
  // persisted id alone can't be trusted to point at the agent's tab. Validating
  // each id against the caller-supplied live tab snapshot (chrome.tabs.query)
  // keeps the membership authority from ever authorizing an unrelated user tab,
  // and cleanly distinguishes a worker revival (tabs still grouped → re-adopt)
  // from a cold browser start (ids reused/regrouped → drop). A session whose
  // anchor is no longer live in its group is dropped entirely. `liveTabs` is a
  // [{ id, groupId, windowId }, ...] array. background.js additionally clears
  // GROUP_STORAGE_KEY on chrome.runtime.onStartup as belt-and-suspenders.
  // @returns the re-adopted records (copies — same discipline as getRecord, never
  // hand out the authority by reference) so a caller (the wake-time resume sweep)
  // can enumerate exactly which sessions survived without a second query.
  async function hydrate(liveTabs = []) {
    const data = await storage.get(GROUP_STORAGE_KEY);
    const persisted = data?.[GROUP_STORAGE_KEY] ?? {};
    const liveById = new Map(liveTabs.map((tab) => [tab.id, tab]));
    const adopted = [];

    for (const [sessionId, record] of Object.entries(persisted)) {
      const validMembers = (record.memberTabIds ?? []).filter((tabId) => {
        const tab = liveById.get(tabId);
        return tab && tab.groupId === record.chromeGroupId && tab.windowId === record.windowId;
      });
      if (!validMembers.includes(record.anchorTabId)) continue;

      // Keep the prior focus only if it survived pruning, else repoint to a
      // surviving member (validMembers is non-empty — the anchor is in it) so
      // focus never dangles on a non-member, the same invariant forgetMember and
      // removeMember enforce.
      const focusedTabId = validMembers.includes(record.focusedTabId)
        ? record.focusedTabId
        : validMembers[0];
      const rebuilt = { ...record, memberTabIds: [], focusedTabId, working: false, title: GROUP_TITLE };
      groups.set(sessionId, rebuilt);
      for (const tabId of validMembers) registerMember(rebuilt, tabId);
      // Strip any ⌛ left behind by a turn the restart interrupted.
      await tabGroupsApi.update(record.chromeGroupId, { title: GROUP_TITLE });
      adopted.push({ ...rebuilt, memberTabIds: [...rebuilt.memberTabIds] });
    }
    // Persist the pruned snapshot so dropped/partial sessions don't linger.
    await persistAll();
    return adopted;
  }

  // Read-only snapshot for the action handlers and the side-panel UI. Returns a
  // copy so callers can never mutate the membership authority by reference.
  function getRecord(sessionId) {
    const record = groups.get(sessionId);
    if (!record) return undefined;
    return { ...record, memberTabIds: [...record.memberTabIds] };
  }

  // Prerender commit (chrome.tabs.onReplaced) reassigned a member's tabId. The
  // membership authority must follow it or getFocus()/isMember keep pointing at
  // the removed id and the next page RPC targets a dead tab. Migrate anchor /
  // focus / member list / reverse index together.
  function replaceTab(oldTabId, newTabId) {
    const sessionId = tabIndex.get(oldTabId);
    if (!sessionId) return Promise.resolve();
    const record = groups.get(sessionId);
    if (!record) return Promise.resolve();
    record.memberTabIds = record.memberTabIds.map((id) => (id === oldTabId ? newTabId : id));
    tabIndex.delete(oldTabId);
    tabIndex.set(newTabId, sessionId);
    if (record.anchorTabId === oldTabId) record.anchorTabId = newTabId;
    if (record.focusedTabId === oldTabId) record.focusedTabId = newTabId;
    record.updatedAt = now();
    return persistAll();
  }

  return {
    ensureGroup,
    addMember,
    removeMember,
    forgetMember,
    isMember,
    findGroupByTab,
    getMembers,
    setFocus,
    getFocus,
    setWorking,
    teardown,
    replaceTab,
    hydrate,
    getRecord,
  };
}
