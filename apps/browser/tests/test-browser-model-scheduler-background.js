'use strict';
const assert = require('assert');
const { BrowserModelScheduler } = require('../src/intelligence/browser-model-scheduler');

async function main() {
  const sleeps = [];
  let online = true;
  const scheduler = new BrowserModelScheduler({
    maxConcurrent: 2,
    backgroundMaxConcurrent: 1,
    resourceBudget: { cpu: 4, memory_mb: 256, energy: 4 },
    retryBaseMs: 10,
    retryMaxMs: 20,
    sleep: async (ms) => { sleeps.push(ms); },
    online: () => online,
  });

  let attempts = 0;
  const retryResult = await scheduler.schedule({
    requestId: 'retry-local',
    background: true,
    resourceCost: { cpu: 1, memory_mb: 32, energy: 1 },
    maxRetries: 2,
    task: async (ctx) => {
      attempts += 1;
      assert.strictEqual(ctx.authority, false);
      if (attempts < 3) {
        const err = new Error('temporary');
        err.retryable = true;
        throw err;
      }
      return 'ok';
    },
  });
  assert.strictEqual(retryResult, 'ok');
  assert.strictEqual(attempts, 3);
  assert.deepStrictEqual(sleeps, [10, 20]);

  await assert.rejects(
    scheduler.schedule({ requestId: 'too-big', resourceCost: { cpu: 5, memory_mb: 32, energy: 1 }, task: async () => true }),
    (err) => err && err.code === 'ERR_BROWSER_MODEL_SCHEDULER_RESOURCE_BUDGET'
  );

  online = false;
  await assert.rejects(
    scheduler.schedule({ requestId: 'network-offline', requiresNetwork: true, allowOffline: false, task: async () => true }),
    (err) => err && err.code === 'ERR_BROWSER_MODEL_SCHEDULER_OFFLINE'
  );

  const localOffline = await scheduler.schedule({
    requestId: 'local-offline',
    requiresNetwork: false,
    allowOffline: true,
    task: async (ctx) => ctx.offline,
  });
  assert.strictEqual(localOffline, true);

  await new Promise((resolve) => setImmediate(resolve));
  const stats = scheduler.stats();
  assert.strictEqual(stats.active, 0);
  assert.strictEqual(stats.queued, 0);
  assert.strictEqual(stats.offline, true);
  assert.strictEqual(stats.authority, false);
  assert.strictEqual(stats.resource_budget.cpu, 4);
  assert.strictEqual(stats.resources_used.cpu, 0);

  console.log('PASS browser model scheduler background');
}
main().catch((err) => { console.error(err); process.exit(1); });
