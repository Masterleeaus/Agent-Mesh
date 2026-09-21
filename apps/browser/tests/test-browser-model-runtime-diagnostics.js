'use strict';

const assert = require('assert');
const { BrowserModelRuntimeDiagnostics } = require('../src/intelligence/browser-model-runtime-diagnostics');

(async () => {
  let now = 1700000000000;
  const diagnostics = new BrowserModelRuntimeDiagnostics({
    now: () => now,
    resourceRouter: { profile: async () => ({ tier: 'wasm', route_order: ['wasm','cpu'], thermal_pressure: 'fair', battery_saver: false, advisory_only: true, authority: false }) },
    scheduler: { stats: () => ({ active: 1, queued: 2, max_concurrent: 1, max_queue: 64, advisory_only: true, authority: false }) },
    workingMemory: { snapshot: (sessionId) => ({ session_id: sessionId, item_count: 2, total_bytes: 200, max_bytes: 1000, advisory_only: true, authority: false }) },
    rpc: { capabilities: async () => ({ webgpu: false, offscreen: true }) },
    fallback: { capabilities: async () => ({ wasm: true, cpu: true }) },
    capability: async () => ({ browser_local: true }),
  });

  const snapshot = await diagnostics.snapshot({ sessionId: 'session-1' });
  assert.strictEqual(snapshot.health, 'healthy');
  assert.strictEqual(snapshot.selected_tier, 'wasm');
  assert.deepStrictEqual(snapshot.route_order, ['wasm','cpu']);
  assert.strictEqual(snapshot.scheduler.queued, 2);
  assert.strictEqual(snapshot.memory.session_id, 'session-1');
  assert.strictEqual(snapshot.advisory_only, true);
  assert.strictEqual(snapshot.authority, false);
  assert.strictEqual(snapshot.execution_authority, false);
  assert.strictEqual(snapshot.canonical_authority, false);
  assert.strictEqual(snapshot.observed_at_ms, now);

  const degraded = new BrowserModelRuntimeDiagnostics({
    resourceRouter: { profile: async () => ({ tier: 'cpu', route_order: ['cpu'] }) },
    scheduler: { stats: () => ({ queued: 4, max_queue: 4 }) },
  });
  const degradedSnapshot = await degraded.snapshot();
  assert.strictEqual(degradedSnapshot.health, 'degraded');
  assert.strictEqual(degradedSnapshot.pressure.queue_saturated, true);

  const unavailable = new BrowserModelRuntimeDiagnostics({
    resourceRouter: { profile: async () => { const e = new Error('no backend'); e.code='ERR_NONE'; throw e; } },
  });
  const unavailableSnapshot = await unavailable.snapshot();
  assert.strictEqual(unavailableSnapshot.health, 'unavailable');
  assert.strictEqual(unavailableSnapshot.backend_available, false);
  assert.strictEqual(unavailableSnapshot.errors[0].component, 'resource-router');

  console.log('PASS browser model runtime diagnostics');
})().catch((error) => { console.error(error); process.exit(1); });
