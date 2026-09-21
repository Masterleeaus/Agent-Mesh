'use strict';
const assert = require('assert');
const { BrowserModelRuntimeAdapter } = require('../src/intelligence/browser-model-runtime-adapter');
const { SessionWorkingMemory } = require('../src/intelligence/session-working-memory');

(async () => {
  const memory = new SessionWorkingMemory({ maxBytes: 100000 });
  const rpc = { request: async (_type, payload) => ({ request_id: payload.request_id, text: 'hello', model: 'local-test', confidence: 0.8 }) };
  const adapter = new BrowserModelRuntimeAdapter({ rpc, workingMemory: memory, now: () => 1234 });
  const out = await adapter.generate('hi', { sessionId: 'session-1', requestId: 'req-1' });
  assert.equal(out.authority, false);
  const items = memory.list('session-1', { tag: 'model-response' });
  assert.equal(items.length, 1);
  assert.equal(items[0].value.text, 'hello');
  assert.equal(items[0].provenance.request_id, 'req-1');
  assert.equal(items[0].authority, false);
  console.log('PASS test-browser-model-working-memory-integration');
})().catch((err) => { console.error(err); process.exit(1); });
