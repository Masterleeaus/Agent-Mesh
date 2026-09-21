const assert = require('assert');

(async () => {
  const { planResume } = await import('../src/browser/agent-runtime/orchestration/resume-planner.js');
  const { createActionJournal, ACTION_JOURNAL_KEY } = await import('../src/browser/agent-runtime/orchestration/action-journal.js');
  const { createSessionRegistry } = await import('../src/browser/agent-runtime/orchestration/session-registry.js');

  const unknown = [{ key: 'intent-1', sessionId: 's1', action: { tool: 'click' } }];
  const recovery = planResume({ pendingIntents: unknown, pendingAsk: { id: 'ask' }, hasActiveTurn: true });
  assert.strictEqual(recovery.action, 're-perceive');
  assert.deepStrictEqual(recovery.unreplayable, unknown, 'unknown-outcome mutations must never be replayed');

  assert.strictEqual(planResume({ pendingAsk: { id: 'ask' } }).action, 'await-answer');
  assert.strictEqual(planResume({ hasActiveTurn: true }).action, 're-perceive');
  assert.strictEqual(planResume({}).action, 'idle');

  const state = {};
  const storage = {
    async get(key) { return { [key]: state[key] }; },
    async set(values) { Object.assign(state, structuredClone(values)); }
  };
  let seq = 0;
  const journal = createActionJournal({ storage, now: () => 1234, randomUUID: () => `intent-${++seq}` });
  const key = await journal.begin({ sessionId: 's1', tabId: 7, action: { tool: 'click', args: { ref: 'A' } } });
  assert.strictEqual(key, 'intent-1');
  assert.strictEqual(state[ACTION_JOURNAL_KEY][key].status, 'dispatched', 'intent must be durable before mutation');
  assert.strictEqual((await journal.pendingFor('s1')).length, 1);
  await journal.complete(key);
  assert.strictEqual((await journal.pendingFor('s1')).length, 0, 'completed action must clear its intent');

  const unknownKey = await journal.begin({ sessionId: 's1', tabId: 7, action: { tool: 'submit', args: {} } });
  assert.strictEqual((await journal.pendingFor('s1')).length, 1, 'unknown mutation evidence must survive until recovery resolves it');
  await journal.abandon(unknownKey);
  assert.strictEqual((await journal.pendingFor('s1')).length, 0, 'safe recovery may explicitly retire unknown mutation evidence');

  const sessions = new Map();
  let created = 0;
  const sessionStore = {
    async createSession() { const id = `session-${++created}`; sessions.set(id, {}); return id; },
    async deleteSession(id) { sessions.delete(id); },
    async getPerTab() { return {}; },
    async setPerTab() {},
    async removeTab() {}
  };
  const cleared = [];
  const registry = createSessionRegistry({
    sessionStore,
    journal: { async clearSession(id) { cleared.push(id); } },
    recoverSession: tabId => tabId === 99 ? 'recovered-99' : undefined
  });

  const [a, b] = await Promise.all([registry.ensureSession(7), registry.ensureSession(7)]);
  assert.strictEqual(a, b, 'concurrent session creation must coalesce');
  assert.strictEqual(created, 1);
  assert.strictEqual(registry.sessionFor(99), 'recovered-99', 'restart-surviving session must be re-adopted');
  await registry.onTabRemoved(7);
  assert.deepStrictEqual(cleared, [a]);
  assert.strictEqual(sessions.has(a), false, 'tab teardown must remove durable session');

  console.log('Agent runtime convergence: resume safety, write-ahead journal, and session recovery validated');
})().catch(error => {
  console.error(error);
  process.exit(1);
});
