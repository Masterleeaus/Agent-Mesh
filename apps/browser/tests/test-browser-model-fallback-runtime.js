'use strict';

const assert = require('assert');
const { BrowserModelFallbackRuntime } = require('../src/intelligence/browser-model-fallback-runtime');
const { BrowserModelRuntimeAdapter } = require('../src/intelligence/browser-model-runtime-adapter');

(async () => {
  const order = [];
  const fallback = new BrowserModelFallbackRuntime({
    wasm: { generate: async (payload) => { order.push('wasm'); return { request_id: payload.request_id, text: 'wasm result' }; } },
    cpu: { generate: async () => { order.push('cpu'); return { text: 'cpu result' }; } },
    capability: { threads: 4, simd: true },
  });
  const caps = await fallback.capabilities();
  assert.equal(caps.wasm, true);
  assert.equal(caps.cpu, true);
  assert.equal(caps.authority, false);

  const direct = await fallback.generate({ prompt: 'hello', request_id: 'f1' });
  assert.equal(direct.text, 'wasm result');
  assert.deepEqual(order, ['wasm']);
  assert.equal(direct.runtime, 'wasm');

  order.length = 0;
  const cpuFallback = new BrowserModelFallbackRuntime({
    wasm: { generate: async () => { order.push('wasm'); throw new Error('no wasm'); } },
    cpu: { generate: async (payload) => { order.push('cpu'); return { request_id: payload.request_id, text: 'cpu result' }; } },
  });
  const cpuResult = await cpuFallback.generate({ prompt: 'hello', request_id: 'f2' });
  assert.equal(cpuResult.text, 'cpu result');
  assert.deepEqual(order, ['wasm', 'cpu']);

  const adapter = new BrowserModelRuntimeAdapter({
    rpc: { request: async () => { const e = new Error('webgpu unavailable'); e.code = 'ERR_WEBGPU_UNAVAILABLE'; throw e; } },
    fallback: cpuFallback,
    now: () => 1,
  });
  const result = await adapter.generate('hello', { requestId: 'req-fallback' });
  assert.equal(result.text, 'cpu result');
  assert.equal(result.runtime, 'cpu');
  assert.equal(result.authority, false);

  const injected = new BrowserModelFallbackRuntime({
    wasm: { generate: async () => ({ text: 'bad', authority: true }) },
  });
  await assert.rejects(() => injected.generate({ prompt: 'hello' }), (error) => error.code === 'ERR_BROWSER_MODEL_FALLBACK_FAILED');

  const controller = new AbortController();
  controller.abort();
  await assert.rejects(() => fallback.generate({ prompt: 'hello' }, { signal: controller.signal }), (error) => error.code === 'ERR_BROWSER_MODEL_FALLBACK_CANCELLED');

  const unavailable = new BrowserModelFallbackRuntime();
  await assert.rejects(() => unavailable.generate({ prompt: 'hello' }), (error) => error.code === 'ERR_BROWSER_MODEL_FALLBACK_UNAVAILABLE');

  console.log('PASS browser model WASM/CPU fallback runtime');
})().catch((error) => { console.error(error); process.exit(1); });
