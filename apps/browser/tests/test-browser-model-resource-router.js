'use strict';
const assert = require('assert');
const { BrowserModelResourceRouter, deriveResourceProfile } = require('../src/intelligence/browser-model-resource-router');

(async () => {
  const gpu = deriveResourceProfile({ webgpu: true, wasm: true, cpu: true, availableMemoryMb: 2048, logicalProcessors: 8 });
  assert.equal(gpu.tier, 'webgpu');
  assert.deepEqual(gpu.route_order, ['webgpu', 'wasm', 'cpu']);
  assert.equal(gpu.max_concurrent, 1); // default bound remains conservative

  const lowMem = deriveResourceProfile({ webgpu: true, wasm: true, cpu: true, availableMemoryMb: 300, logicalProcessors: 4 });
  assert.equal(lowMem.tier, 'wasm');
  assert.deepEqual(lowMem.route_order, ['wasm', 'cpu']);

  const battery = deriveResourceProfile({ webgpu: true, wasm: true, cpu: true, availableMemoryMb: 4096, batterySaver: true });
  assert.equal(battery.tier, 'wasm');

  const thermal = deriveResourceProfile({ webgpu: true, wasm: true, cpu: true, availableMemoryMb: 4096, thermalPressure: 'critical' });
  assert.equal(thermal.tier, 'cpu');

  const router = new BrowserModelResourceRouter({ probe: async () => ({ webgpu: true, wasm: true, cpu: true, availableMemoryMb: 4096 }) });
  const selected = await router.select({ disableWebGpu: true });
  assert.deepEqual(selected.order, ['wasm', 'cpu']);
  assert.equal(selected.profile.authority, false);
  assert.equal(selected.profile.advisory_only, true);

  console.log('PASS browser model resource router');
})().catch((error) => { console.error(error); process.exit(1); });
