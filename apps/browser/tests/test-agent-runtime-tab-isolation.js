const assert = require('assert');

(async () => {
  const { createTabGroupManager, SESSION_GROUP_COLORS } =
    await import('../src/browser/agent-runtime/orchestration/tab-group.js');

  assert.deepStrictEqual(SESSION_GROUP_COLORS, ['blue', 'grey'],
    'Titan Code tab groups must stay within restrained deep-blue/slate branding');

  const stored = {};
  const groups = new Map();
  let nextGroup = 10;
  const tabs = new Map([
    [1, { id: 1, windowId: 100, groupId: -1 }],
    [2, { id: 2, windowId: 100, groupId: -1 }],
    [3, { id: 3, windowId: 200, groupId: -1 }],
  ]);
  const tabsApi = {
    async get(id) { return tabs.get(id); },
    async group({ tabIds, groupId }) {
      const gid = groupId ?? nextGroup++;
      for (const id of tabIds) tabs.get(id).groupId = gid;
      return gid;
    },
    async ungroup(ids) { for (const id of ids) if (tabs.has(id)) tabs.get(id).groupId = -1; }
  };
  const tabGroupsApi = { async update(id, patch) { groups.set(id, { ...(groups.get(id) || {}), ...patch }); } };
  const storage = {
    async get(key) { return { [key]: stored[key] }; },
    async set(v) { Object.assign(stored, structuredClone(v)); },
    async remove(key) { delete stored[key]; }
  };

  const manager = createTabGroupManager({ tabsApi, tabGroupsApi, storage, sleep: async () => {} });
  await manager.ensureGroup('s1', { anchorTabId: 1, windowId: 100 });
  await manager.addMember('s1', 2);
  assert(manager.isMember('s1', 2), 'same-window tab must join the session');

  await assert.rejects(
    () => manager.addMember('s1', 3),
    /outside session .* window/,
    'cross-window tab must never join the session authority'
  );
  assert(!manager.isMember('s1', 3), 'rejected cross-window tab must not become authorized');

  await assert.rejects(
    () => manager.ensureGroup('s2', { anchorTabId: 3, windowId: 100 }),
    /not in window/,
    'anchor/window mismatch must fail closed'
  );

  console.log('Agent runtime Pass 19: per-session Chrome-window isolation validated');
})().catch(error => { console.error(error); process.exit(1); });
