'use strict';
const assert = require('assert');
const { BrowserModelRuntimeAdapter } = require('../src/intelligence/browser-model-runtime-adapter');
const { BrowserModelScheduler } = require('../src/intelligence/browser-model-scheduler');

async function main() {
  const seen = [];
  const scheduler = new BrowserModelScheduler({ maxConcurrent: 1 });
  const adapter = new BrowserModelRuntimeAdapter({
    scheduler,
    rpc: {
      request: async (_type, payload) => {
        seen.push(payload.request_id);
        return { request_id: payload.request_id, text: 'ok', authority: false };
      },
    },
  });
  const result = await adapter.generate('hello', { requestId: 'sched-1', provider: 'test', priority: 2 });
  assert.strictEqual(result.text, 'ok');
  assert.deepStrictEqual(seen, ['sched-1']);
  assert.strictEqual(scheduler.stats().active, 0);
  assert.strictEqual(result.authority, false);
  console.log('PASS browser model scheduler integration');
}
main().catch((err) => { console.error(err); process.exit(1); });
