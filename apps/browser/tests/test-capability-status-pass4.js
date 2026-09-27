const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

const context = vm.createContext({ console, globalThis: {} });
context.globalThis = context;
vm.runInContext(fs.readFileSync('src/lib/capability-status.js', 'utf8'), context, { filename: 'src/lib/capability-status.js' });

assert(context.CodeeCapabilityStatus, 'CodeeCapabilityStatus must exist');

const view = context.CodeeCapabilityStatus.build({
  registry: {
    capabilities: [
      { id: 'ai.gateway.status', title: 'AI Gateway', pack: 'codee-onboard-ai', readOnly: true, operationClass: 'READ', risk: 'low' },
      { id: 'browser.snapshot', title: 'Browser snapshot', pack: 'codee-browser-control-engine', operationClass: 'READ', risk: 'low', implementation: { status: 'contract_only', owner: 'browser-control-engine' } },
      { id: 'workforce.ai.request', title: 'AI request', pack: 'codee-managers-ai-workforce' }
    ],
    repositoryCapabilities: [
      { id: 'repository.search', pack: 'codee-repository-coding-intelligence' },
      { id: 'repository.host.write', pack: 'codee-repository-coding-intelligence' },
      { id: 'mcp.connections.list', pack: 'codee-repository-coding-intelligence' },
      { id: 'mcp.tool.call', pack: 'codee-repository-coding-intelligence' }
    ]
  },
  ai: { gatewayInstalled: false, inferenceReady: false },
  browser: { registered: true, implemented: 0, contractOnly: 1, executionEnabled: false },
  repository: {
    registered: true,
    settings: { enabled: true },
    hostBridge: 'not-installed',
    hostCapabilities: { repository: { writeFile: false, deleteFile: false, runCommand: false } }
  },
  workforce: { registered: true, settings: { enabled: true }, dependencies: { providerGateway: false, mcpRuntime: true, repositoryPack: true } },
  mcp: { runtimeInstalled: false, connections: 0 }
});

assert.strictEqual(view.schema, 'codee.capability.status.v1');
assert.strictEqual(view.total, 7);
assert.strictEqual(new Set(view.rows.map(row => row.id)).size, 7, 'capability IDs must be unique');

const byId = id => view.rows.find(row => row.id === id);
assert.strictEqual(byId('repository.search').readiness, 'READY');
assert.strictEqual(byId('repository.search').executionAvailable, true);
assert.strictEqual(byId('repository.host.write').readiness, 'HOST_REQUIRED');
assert.strictEqual(byId('repository.host.write').operationClass, 'WRITE');
assert.strictEqual(byId('repository.host.write').executionAvailable, false);
assert.strictEqual(byId('browser.snapshot').readiness, 'CONTRACT_ONLY');
assert.strictEqual(byId('browser.snapshot').executionAvailable, false);
assert.strictEqual(byId('workforce.ai.request').readiness, 'PROVIDER_REQUIRED');
assert.strictEqual(byId('ai.gateway.status').readiness, 'PROVIDER_REQUIRED');
assert.strictEqual(byId('mcp.tool.call').readiness, 'MCP_REQUIRED');
assert.strictEqual(byId('mcp.connections.list').readiness, 'MCP_REQUIRED');
assert(byId('mcp.tool.call').dependencies.includes('mcp.runtime'));
assert.strictEqual(byId('mcp.tool.call').risk, 'high');
assert(!JSON.stringify(view).toLowerCase().includes('token'), 'capability status must not expose credential metadata');
assert(view.summary.byReadiness.READY >= 1);
assert(view.summary.blocked >= 5);

const connected = context.CodeeCapabilityStatus.build({
  registry: { capabilities: [], repositoryCapabilities: [{ id: 'mcp.tool.call', pack: 'repo' }] },
  mcp: { runtimeInstalled: true, connections: 2 }
});
assert.strictEqual(connected.rows[0].readiness, 'READY');
assert.strictEqual(connected.rows[0].executionAvailable, true);

console.log('Capability status normalizes canonical registry records against runtime readiness');
