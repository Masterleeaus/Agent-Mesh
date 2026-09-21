'use strict';
const assert = require('assert');
const { BrowserModelRuntimeAdapter } = require('../src/intelligence/browser-model-runtime-adapter');
const { BrowserModelFallbackRuntime } = require('../src/intelligence/browser-model-fallback-runtime');
const { BrowserModelResourceRouter } = require('../src/intelligence/browser-model-resource-router');

(async () => {
  let rpcCalls = 0;
  let wasmCalls = 0;
  const fallback = new BrowserModelFallbackRuntime({
    wasm: { generate: async (payload) => { wasmCalls++; return { request_id: payload.request_id, text: 'wasm-ok' }; } },
    cpu: { generate: async (payload) => ({ request_id: payload.request_id, text: 'cpu-ok' }) },
  });
  const lowMemRouter = new BrowserModelResourceRouter({ probe: async () => ({ webgpu: true, wasm: true, cpu: true, availableMemoryMb: 256 }) });
  const adapter = new BrowserModelRuntimeAdapter({
    rpc: { request: async () => { rpcCalls++; return { text: 'gpu-ok' }; } },
    fallback,
    resourceRouter: lowMemRouter,
    now: () => 1,
  });
  const response = await adapter.generate('hello', { requestId: 'r1' });
  assert.equal(response.text, 'wasm-ok');
  assert.equal(response.runtime, 'wasm');
  assert.equal(rpcCalls, 0);
  assert.equal(wasmCalls, 1);
  assert.equal(response.resource_profile.tier, 'wasm');

  const gpuRouter = new BrowserModelResourceRouter({ probe: async () => ({ webgpu: true, wasm: true, cpu: true, availableMemoryMb: 2048 }) });
  const gpuAdapter = new BrowserModelRuntimeAdapter({
    rpc: { request: async (type, payload) => { rpcCalls++; return { request_id: payload.request_id, text: 'gpu-ok', runtime: 'webgpu' }; } },
    fallback,
    resourceRouter: gpuRouter,
    now: () => 2,
  });
  const gpuResponse = await gpuAdapter.generate('hello', { requestId: 'r2' });
  assert.equal(gpuResponse.text, 'gpu-ok');
  assert.equal(gpuResponse.resource_profile.tier, 'webgpu');
  assert.equal(rpcCalls, 1);

  console.log('PASS browser model adaptive routing');
})().catch((error) => { console.error(error); process.exit(1); });
