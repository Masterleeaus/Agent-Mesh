'use strict';
const assert = require('assert');
const { BrowserModelScheduler } = require('../src/intelligence/browser-model-scheduler');

async function main() {
  const order = [];
  let releaseFg;
  let releaseBg;
  const fgGate = new Promise((resolve) => { releaseFg = resolve; });
  const bgGate = new Promise((resolve) => { releaseBg = resolve; });
  const scheduler = new BrowserModelScheduler({
    maxConcurrent: 2,
    backgroundMaxConcurrent: 1,
    resourceBudget: { cpu: 2, memory_mb: 128, energy: 2 },
  });

  const bg1 = scheduler.schedule({
    requestId: 'bg1', background: true, resourceCost: { cpu: 1, memory_mb: 32, energy: 1 },
    task: async () => { order.push('bg1-start'); await bgGate; order.push('bg1-end'); return 'bg1'; },
  });
  const bg2 = scheduler.schedule({
    requestId: 'bg2', background: true, resourceCost: { cpu: 1, memory_mb: 32, energy: 1 },
    task: async () => { order.push('bg2'); return 'bg2'; },
  });
  const fg = scheduler.schedule({
    requestId: 'fg', background: false, priority: 0, resourceCost: { cpu: 1, memory_mb: 32, energy: 1 },
    task: async () => { order.push('fg-start'); await fgGate; order.push('fg-end'); return 'fg'; },
  });

  await new Promise((resolve) => setImmediate(resolve));
  assert.deepStrictEqual(order.slice(0, 2).sort(), ['bg1-start','fg-start'].sort());
  assert.strictEqual(scheduler.stats().active_background, 1);
  assert.strictEqual(scheduler.stats().queued_background, 1);

  releaseFg();
  await fg;
  await new Promise((resolve) => setImmediate(resolve));
  assert.strictEqual(order.includes('bg2'), false, 'second background task must wait for background slot');

  releaseBg();
  assert.deepStrictEqual(await Promise.all([bg1, bg2]), ['bg1','bg2']);
  assert.strictEqual(order[order.length - 1], 'bg2');
  console.log('PASS browser model scheduler resource fairness');
}
main().catch((err) => { console.error(err); process.exit(1); });
