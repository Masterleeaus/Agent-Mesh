'use strict';

const assert = require('node:assert/strict');
const path = require('node:path');

const events = [];
global.window = {
  dispatchEvent(event) { events.push(event); },
  fetch: async () => { throw new Error('Unexpected default fetch'); },
};
global.CustomEvent = class CustomEvent {
  constructor(type, init = {}) { this.type = type; this.detail = init.detail || {}; }
};
global.document = { querySelector() { return null; } };
Object.defineProperty(global, 'navigator', { value: { connection: null }, configurable: true });
global.localStorage = {
  values: new Map(),
  getItem(key) { return this.values.get(key) || null; },
  setItem(key, value) { this.values.set(key, String(value)); },
};
Object.defineProperty(global, 'crypto', { value: { randomUUID: () => '00000000-0000-4000-8000-000000000001' }, configurable: true });

require(path.resolve(__dirname, '../../resources/pwa/chatbot-pwa/sync/engine.js'));

async function testPaginatedBootstrap() {
  const calls = [];
  const applied = [];
  const acknowledged = [];
  const cursors = [];
  const completion = [];

  const responses = [
    {
      status: 200,
      body: { data: {
        session_uuid: 'session-1',
        changes: [{ sync_sequence: 1, entity_type: 'message', server_entity_id: 10 }],
        next_cursor: 1,
        has_more: true,
      } },
    },
    {
      status: 200,
      body: { data: {
        session_uuid: 'session-2',
        changes: [{ sync_sequence: 2, entity_type: 'message', server_entity_id: 11 }],
        next_cursor: 2,
        has_more: false,
      } },
    },
    { status: 200, body: { data: { acknowledged: 1 } } },
    { status: 200, body: { data: { acknowledged: 1 } } },
  ];

  // Responses are selected by endpoint so acknowledgements do not disturb page order.
  const bootstrapPages = responses.slice(0, 2);
  const fetch = async (url, init = {}) => {
    calls.push({ url, init });
    let response;
    if (url.includes('/sync/bootstrap')) response = bootstrapPages.shift();
    else if (url.includes('/sync/pull')) response = bootstrapPages.shift();
    else if (url.includes('/sync/acknowledge')) response = { status: 200, body: { data: { acknowledged: 1 } } };
    else throw new Error(`Unexpected URL ${url}`);
    return {
      ok: response.status >= 200 && response.status < 300,
      status: response.status,
      json: async () => response.body,
    };
  };

  const adapter = {
    async storeInboxChanges(changes) { applied.push(...changes); },
    async getPendingInboxChanges() { return applied.filter(item => !item.applied); },
    async applyServerChanges(changes) { changes.forEach(item => { item.applied = true; }); },
    async markInboxChangesApplied(sequences) { acknowledged.push(...sequences); },
    async setCursor(scope, cursor) { cursors.push([scope, cursor]); },
    async setBootstrapComplete(scope, complete) { completion.push([scope, complete]); },
  };

  const engine = new window.ChatbotSyncEngine(adapter, {
    deviceId: '00000000-0000-4000-8000-000000000002',
    fetch,
  });
  const result = await engine.bootstrap({ entities: ['message'], limit: 1 });

  assert.equal(result.bootstrapped_count, 2);
  assert.equal(result.next_cursor, 2);
  assert.equal(result.has_more, false);
  assert.deepEqual(cursors, [['message', 1], ['message', 2]]);
  assert.deepEqual(completion, [['message', true]]);
  assert.equal(calls.filter(call => call.url.includes('/sync/pull')).length, 1);
  assert.equal(calls.filter(call => call.url.includes('/sync/acknowledge')).length, 2);
  assert.ok(events.some(event => event.type === 'chatbot:sync-bootstrap-progress'));
  assert.ok(events.some(event => event.type === 'chatbot:sync-bootstrap-complete'));
}

async function testWeakConnectionLimits() {
  const outboxLimits = [];
  const adapter = {
    async isBootstrapComplete() { return true; },
    async getCursor() { return 0; },
    async getOutbox(options) { outboxLimits.push(options.limit); return []; },
    async setLastSuccessfulSync() {},
    async setCursor() {},
    async applyServerChanges() {},
  };
  const fetch = async (url) => {
    if (url.includes('/sync/status')) return { ok: true, status: 200, json: async () => ({ data: {} }) };
    if (url.includes('/sync/pull')) return { ok: true, status: 200, json: async () => ({ data: { changes: [], next_cursor: 0, has_more: false } }) };
    throw new Error(`Unexpected URL ${url}`);
  };
  const engine = new window.ChatbotSyncEngine(adapter, {
    deviceId: '00000000-0000-4000-8000-000000000003',
    fetch,
    connection: { effectiveType: '2g', saveData: false },
  });
  await engine.sync({ pushLimit: 100, pullLimit: 100 });
  assert.deepEqual(outboxLimits, [20]);
}

(async () => {
  await testPaginatedBootstrap();
  await testWeakConnectionLimits();
  console.log('sync-engine tests passed');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
