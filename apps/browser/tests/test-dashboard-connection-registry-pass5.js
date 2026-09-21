const assert = require('assert');
const fs = require('fs');
const vm = require('vm');
const context = vm.createContext({ console, globalThis: {} });
context.globalThis = context;
vm.runInContext(fs.readFileSync('src/lib/dashboard-status.js', 'utf8'), context, { filename: 'src/lib/dashboard-status.js' });

const status = context.CodeeDashboardStatus.build({
  generatedAt: '2026-08-20T09:10:00Z',
  ai: { gatewayInstalled: true, providers: 1, activeProviders: 1, localProviders: 1, inferenceReady: true },
  browser: { registered: true, executionEnabled: false, contractOnly: 8 },
  repository: { registered: true, hostBridge: 'detected', backupPolicy: {} },
  mcp: { runtimeInstalled: true, connections: [{ id: 'one' }], pendingApprovals: [], receipts: [] },
  connections: {
    schema: 'codee.connection.registry.v1',
    rows: [
      { id: 'ai.providers', state: 'MISSING' },
      { id: 'ai.local', state: 'CONNECTED' },
      { id: 'mcp', state: 'AUTH_FAILED' },
      { id: 'repository.host', state: 'DEGRADED' },
      { id: 'artifact.host', state: 'CONNECTED' },
      { id: 'browser.runtime', state: 'UNAVAILABLE' }
    ],
    summary: { connected: 2, degraded: 1, authFailed: 1, unavailable: 1, missing: 1 }
  }
});

assert.strictEqual(status.ai.state, 'READY', 'connected local AI must make Dashboard AI ready even with no cloud provider');
assert.strictEqual(status.ai.localAvailable, true);
assert.strictEqual(status.infrastructure.mcp.state, 'ATTENTION');
assert.strictEqual(status.infrastructure.repositoryHost.state, 'DEGRADED');
assert.strictEqual(status.infrastructure.artifactHost.state, 'READY');
assert.strictEqual(status.infrastructure.browser.state, 'CONTRACT_ONLY');
assert.strictEqual(status.connections.schema, 'codee.connection.registry.v1');
assert.strictEqual(status.connections.summary.connected, 2);
console.log('Dashboard consumes canonical connection health without breaking local-only AI');
