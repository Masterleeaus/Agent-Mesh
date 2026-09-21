const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

const context = vm.createContext({ console, globalThis: {} });
context.globalThis = context;
vm.runInContext(fs.readFileSync('src/lib/connection-registry.js', 'utf8'), context, { filename: 'src/lib/connection-registry.js' });

assert(context.CodeeConnectionRegistry, 'CodeeConnectionRegistry must exist');
assert.deepStrictEqual(Array.from(context.CodeeConnectionRegistry.STATES), [
  'CONNECTED','DEGRADED','MISSING','AUTH_FAILED','DISABLED','RATE_LIMITED','UNAVAILABLE'
]);

const view = context.CodeeConnectionRegistry.build({
  generatedAt: '2026-08-20T09:00:00.000Z',
  aiProviders: [
    { id: 'cloud-ok', displayName: 'Cloud OK', lifecycle: 'FREE', probe: { ok: true, checkedAt: '2026-08-20T08:59:59Z' } },
    { id: 'cloud-auth', displayName: 'Cloud Auth', lifecycle: 'ACTIVE', probe: { ok: false, code: 'AUTH_FAILED', checkedAt: '2026-08-20T08:59:58Z' } },
    { id: 'local-ok', displayName: 'Local', lifecycle: 'LOCAL', probe: { ok: true, checkedAt: '2026-08-20T08:59:57Z' } }
  ],
  mcp: {
    runtimeInstalled: true,
    connections: [
      { id: 'mcp-ok', name: 'Titan One', enabled: true, tokenConfigured: true, probe: { ok: true, checkedAt: '2026-08-20T08:59:56Z' } },
      { id: 'mcp-off', name: 'Titan Disabled', enabled: false, tokenConfigured: true }
    ]
  },
  repositoryHost: { detected: true, probe: { ok: false, code: 'UNAVAILABLE', checkedAt: '2026-08-20T08:59:55Z' } },
  artifactHost: { detected: true, evidence: { verified: true, receiptId: 'artifact-receipt-1', checkedAt: '2026-08-20T08:59:54Z' } },
  browser: { registered: true, executionEnabled: false, reason: 'browser-execution-not-enabled' }
});

assert.strictEqual(view.schema, 'codee.connection.registry.v1');
assert.strictEqual(view.generatedAt, '2026-08-20T09:00:00.000Z');
assert.strictEqual(view.rows.length, 6);
const byId = id => view.rows.find(row => row.id === id);
assert.strictEqual(byId('ai.providers').state, 'DEGRADED');
assert.strictEqual(byId('ai.providers').connected, 1);
assert.strictEqual(byId('ai.providers').authFailed, 1);
assert.strictEqual(byId('ai.local').state, 'CONNECTED');
assert.strictEqual(byId('mcp').state, 'CONNECTED');
assert.strictEqual(byId('repository.host').state, 'UNAVAILABLE');
assert.strictEqual(byId('artifact.host').state, 'CONNECTED');
assert.strictEqual(byId('browser.runtime').state, 'UNAVAILABLE');
assert.strictEqual(byId('browser.runtime').healthy, false);
assert.strictEqual(view.summary.connected, 3);
assert(view.summary.degraded >= 1);
assert(!JSON.stringify(view).toLowerCase().includes('tokenconfigured'), 'connection registry must not expose credential metadata');
assert(!JSON.stringify(view).includes('artifact-receipt-1'), 'connection registry must not expose raw receipt IDs');

const presenceOnly = context.CodeeConnectionRegistry.build({
  aiProviders: [{ id: 'registered-only', displayName: 'Registered only', lifecycle: 'ACTIVE' }],
  repositoryHost: { detected: true },
  artifactHost: { detected: true },
  mcp: { runtimeInstalled: true, connections: [{ id: 'mcp-no-probe', enabled: true }] },
  browser: { registered: true, executionEnabled: true }
});
assert.strictEqual(presenceOnly.rows.find(row => row.id === 'ai.providers').state, 'DEGRADED');
assert.strictEqual(presenceOnly.rows.find(row => row.id === 'repository.host').state, 'DEGRADED');
assert.strictEqual(presenceOnly.rows.find(row => row.id === 'artifact.host').state, 'DEGRADED');
assert.strictEqual(presenceOnly.rows.find(row => row.id === 'mcp').state, 'DEGRADED');
assert.strictEqual(presenceOnly.rows.find(row => row.id === 'browser.runtime').state, 'DEGRADED');

console.log('Connection registry requires probe/evidence rather than object presence');
