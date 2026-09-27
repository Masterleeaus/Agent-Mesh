'use strict';
const assert = require('assert');
const { BrowserModelScheduler } = require('../src/intelligence/browser-model-scheduler');

async function main() {
  const order = [];
  let release;
  const firstGate = new Promise((resolve) => { release = resolve; });
  const scheduler = new BrowserModelScheduler({ maxConcurrent: 1, maxQueue: 8, maxWaitMs: 10000 });

  const a = scheduler.schedule({ requestId: 'a', provider: 'alpha', task: async () => { order.push('a-start'); await firstGate; order.push('a-end'); return 'a'; } });
  const b = scheduler.schedule({ requestId: 'b', provider: 'alpha', task: async () => { order.push('b'); return 'b'; } });
  const c = scheduler.schedule({ requestId: 'c', provider: 'beta', task: async () => { order.push('c'); return 'c'; } });
  assert.strictEqual(scheduler.stats().active, 1);
  assert.strictEqual(scheduler.stats().queued, 2);
  release();
  assert.deepStrictEqual(await Promise.all([a,b,c]), ['a','b','c']);
  assert.deepStrictEqual(order, ['a-start','a-end','c','b']);

  const controller = new AbortController();
  let release2;
  const gate2 = new Promise((resolve) => { release2 = resolve; });
  const d = scheduler.schedule({ requestId: 'd', provider: 'alpha', task: async () => { await gate2; return 'd'; } });
  const e = scheduler.schedule({ requestId: 'e', provider: 'beta', signal: controller.signal, task: async () => 'e' });
  controller.abort();
  await assert.rejects(e, (err) => err && err.code === 'ERR_BROWSER_MODEL_SCHEDULER_CANCELLED');
  release2();
  assert.strictEqual(await d, 'd');

  await assert.rejects(
    scheduler.schedule({ requestId: 'x', task: null }),
    (err) => err && err.code === 'ERR_BROWSER_MODEL_SCHEDULER_INPUT'
  );
  console.log('PASS browser model scheduler');
}
main().catch((err) => { console.error(err); process.exit(1); });
