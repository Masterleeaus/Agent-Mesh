'use strict';

const assert = require('assert');
const { BrowserModelRuntimeAdapter } = require('../src/intelligence/browser-model-runtime-adapter');
const { BrowserModelRuntimeDiagnostics } = require('../src/intelligence/browser-model-runtime-diagnostics');

(async () => {
  const rpc = {
    capabilities: async () => ({ offscreen: true }),
    request: async (_type, payload) => ({ request_id: payload.request_id, text: 'ok' }),
  };
  const resourceRouter = { profile: async () => ({ tier: 'webgpu', route_order: ['webgpu','wasm','cpu'] }) };
  const diagnostics = new BrowserModelRuntimeDiagnostics({ rpc, resourceRouter });
  const adapter = new BrowserModelRuntimeAdapter({ rpc, resourceRouter, diagnostics });

  const caps = await adapter.capabilities();
  assert.strictEqual(caps.diagnostics.health, 'healthy');
  assert.strictEqual(caps.diagnostics.selected_tier, 'webgpu');
  assert.strictEqual(caps.diagnostics.authority, false);

  const health = await adapter.health();
  assert.strictEqual(health.health, 'healthy');
  assert.strictEqual(health.execution_authority, false);

  console.log('PASS browser model diagnostics integration');
})().catch((error) => { console.error(error); process.exit(1); });
