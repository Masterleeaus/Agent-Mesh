'use strict';

const assert = require('assert');
const { BrowserModelRuntimeAdapter } = require('../src/intelligence/browser-model-runtime-adapter');
const { BrowserModelFallbackRuntime } = require('../src/intelligence/browser-model-fallback-runtime');
const { BrowserModelResourceRouter } = require('../src/intelligence/browser-model-resource-router');
const { BrowserModelScheduler } = require('../src/intelligence/browser-model-scheduler');
const { SessionWorkingMemory } = require('../src/intelligence/session-working-memory');
const { ModelOutputVerifier } = require('../src/intelligence/model-output-verifier');
const { BrowserModelRuntimeDiagnostics } = require('../src/intelligence/browser-model-runtime-diagnostics');

async function expectReject(promise, code) {
  let caught;
  try { await promise; } catch (error) { caught = error; }
  assert(caught, `expected rejection ${code}`);
  assert.strictEqual(caught.code, code);
}

(async () => {
  const verifier = new ModelOutputVerifier();
  const memory = new SessionWorkingMemory({ maxItems: 3, maxBytes: 4096, maxItemBytes: 2048, ttlMs: 60000 });

  // Offline fixture: primary offscreen/RPC/WebGPU path healthy and advisory-only.
  const healthyRpc = {
    capabilities: async () => ({ offscreen: true, webgpu: true, local: true }),
    request: async (type, payload) => {
      assert.strictEqual(type, 'INTELLIGENCE_BROWSER_MODEL_GENERATE');
      return {
        request_id: payload.request_id,
        text: 'webgpu-ok',
        runtime: 'webgpu',
        confidence: 0.81,
        advisory_only: true,
        authority: false
      };
    }
  };
  const healthyRouter = new BrowserModelResourceRouter({ probe: { webgpu: true, wasm: true, cpu: true, memoryMb: 4096, logicalProcessors: 8 } });
  const healthyAdapter = new BrowserModelRuntimeAdapter({
    rpc: healthyRpc,
    resourceRouter: healthyRouter,
    outputVerifier: verifier,
    workingMemory: memory
  });
  const webgpu = await healthyAdapter.generate({ prompt: 'offline webgpu' }, { sessionId: 'matrix', requestId: 'webgpu-1' });
  assert.strictEqual(webgpu.text, 'webgpu-ok');
  assert.strictEqual(webgpu.authority, false);
  assert.strictEqual(webgpu.advisory_only, true);
  assert.strictEqual(webgpu.resource_profile.tier, 'webgpu');

  // WebGPU/offscreen unavailable -> local fallback WASM first.
  const fallback = new BrowserModelFallbackRuntime({
    wasm: { generate: async () => ({ text: 'wasm-ok', runtime: 'wasm', confidence: 0.72 }) },
    cpu: { generate: async () => ({ text: 'cpu-ok', runtime: 'cpu', confidence: 0.61 }) }
  });
  const unavailableRpc = {
    capabilities: async () => ({ offscreen: false, webgpu: false, local: false }),
    request: async () => { const e = new Error('offline'); e.code = 'ERR_OFFSCREEN_UNAVAILABLE'; throw e; }
  };
  const constrainedRouter = new BrowserModelResourceRouter({ probe: { webgpu: false, wasm: true, cpu: true, memoryMb: 1024, logicalProcessors: 4 } });
  const fallbackAdapter = new BrowserModelRuntimeAdapter({
    rpc: unavailableRpc,
    fallback,
    resourceRouter: constrainedRouter,
    outputVerifier: verifier
  });
  const wasm = await fallbackAdapter.generate({ prompt: 'offline fallback' }, { requestId: 'fallback-1' });
  assert.strictEqual(wasm.runtime, 'wasm');
  assert.strictEqual(wasm.authority, false);
  assert.strictEqual(wasm.resource_profile.tier, 'wasm');

  // Resource routing remains conservative under constrained device signals.
  const saverRouter = new BrowserModelResourceRouter({ probe: { webgpu: true, wasm: true, cpu: true, memoryMb: 2048, logicalProcessors: 8, batterySaver: true } });
  const constrained = await saverRouter.select();
  assert.notStrictEqual(constrained.order[0], 'webgpu');
  assert(constrained.profile.max_concurrent <= 1);

  // Provider-neutral scheduler fairness and cancellation operate offline.
  const scheduler = new BrowserModelScheduler({ maxConcurrent: 1, maxQueue: 8 });
  const order = [];
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  const p1 = scheduler.schedule({ requestId: 'a1', provider: 'alpha', task: async () => { order.push('a1'); await gate; return 1; } });
  const p2 = scheduler.schedule({ requestId: 'a2', provider: 'alpha', task: async () => { order.push('a2'); return 2; } });
  const p3 = scheduler.schedule({ requestId: 'b1', provider: 'beta', task: async () => { order.push('b1'); return 3; } });
  release();
  await Promise.all([p1, p2, p3]);
  assert.strictEqual(order[0], 'a1');
  assert.strictEqual(order[1], 'b1');

  const abort = new AbortController();
  abort.abort();
  await expectReject(scheduler.schedule({ requestId: 'cancelled', provider: 'beta', signal: abort.signal, task: async () => 1 }), 'ERR_BROWSER_MODEL_SCHEDULER_CANCELLED');

  // Verifier blocks model attempts to assert control-plane authority.
  assert.throws(() => verifier.verify({ text: 'no', authority: true }), /authority/i);
  assert.throws(() => verifier.verify({ text: 'no', canonical: true }), /authority/i);
  assert.throws(() => verifier.verify({ text: 'no', approved: true }), /authority/i);

  // Working memory is bounded and remains advisory.
  for (const [key, value] of [['one', 1], ['two', 2], ['three', 3], ['four', 4]]) {
    memory.put('matrix', {
      key,
      value: { text: String(value) },
      provenance: { source: 'offline-fixture' },
      tags: ['matrix']
    });
  }
  const snapshot = memory.list('matrix');
  assert(snapshot.length <= 3);
  assert(snapshot.every(item => item.authority === false && item.advisory_only === true));

  // Diagnostics can describe degraded runtime without becoming authoritative.
  const diagnostics = new BrowserModelRuntimeDiagnostics({
    resourceRouter: constrainedRouter,
    scheduler,
    workingMemory: memory,
    fallback,
    rpc: unavailableRpc,
    capability: { webgpu: false, wasm: true, cpu: true }
  });
  const report = await diagnostics.snapshot({ sessionId: 'matrix' });
  assert.strictEqual(report.authority, false);
  assert.strictEqual(report.advisory_only, true);
  assert(['healthy', 'degraded', 'unavailable'].includes(report.health));
  assert.strictEqual(report.selected_tier, 'wasm');

  // Plan Runner boundary: this lane exports no plan/canonical mutation authority.
  for (const value of [webgpu, wasm, report]) {
    assert.notStrictEqual(value.plan_advance, true);
    assert.notStrictEqual(value.mutation_authorized, true);
    assert.notStrictEqual(value.canonical, true);
    assert.notStrictEqual(value.authority, true);
  }

  console.log('PASS browser intelligence offline regression matrix');
})().catch(error => {
  console.error(error);
  process.exit(1);
});
