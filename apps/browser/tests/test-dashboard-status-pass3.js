const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

const context = vm.createContext({ console, globalThis: {} });
context.globalThis = context;
vm.runInContext(fs.readFileSync('src/lib/dashboard-status.js', 'utf8'), context, { filename: 'src/lib/dashboard-status.js' });

assert(context.CodeeDashboardStatus, 'CodeeDashboardStatus must exist');

const status = context.CodeeDashboardStatus.build({
  generatedAt: '2026-08-20T08:00:00.000Z',
  plans: [
    { planId: 'plan-old', runId: 'run-old', dispatchStatus: 'complete', stepIndex: 1, plan: [{}, {}], completedAt: 100, artifactHistory: [{ artifactId: 'a-old', zip: 'old.zip', sha256: 'a'.repeat(64), createdAt: '2026-08-19T01:00:00Z' }] },
    { planId: 'plan-live', runId: 'run-live', dispatchStatus: 'awaiting_artifact', stepIndex: 2, plan: [{}, {}, {}, {}], lastDispatchedAt: 500, lastArtifactValidationReason: 'artifact-byte-verification', artifactHistory: [{ artifactId: 'a-live', zip: 'live.zip', sha256: 'b'.repeat(64), createdAt: '2026-08-20T07:00:00Z', verificationReceipt: { receiptId: 'receipt-1', verified: true } }] }
  ],
  ai: { gatewayInstalled: true, providers: 3, activeProviders: 1, localProviders: 1, models: 5, healthyModels: 2, inferenceReady: true },
  browser: { registered: true, implemented: 0, contractOnly: 8, executionEnabled: false },
  repository: { registered: true, settings: { enabled: true }, hostBridge: 'detected', backupPolicy: { createBackup: true, verifyBackup: true, verifyMutation: true, auditMutation: true }, latestAnalysis: { analyzedAt: '2026-08-20T06:00:00Z', inventory: { files: 471, extensionFiles: 21 }, git: { branch: 'main', clean: true }, project: { name: 'Codee', framework: 'Chrome MV3', runtime: 'JavaScript' } } },
  titanZero: { registered: true, settings: { enabled: true }, latestAnalysis: { project: { recognized: true } } },
  workforce: { registered: true, settings: { enabled: true }, counts: { managers: 14 }, dependencies: { providerGateway: true } },
  mcp: { runtimeInstalled: true, connections: [{ id: 'titan-1', enabled: true, tokenConfigured: true }], pendingApprovals: [{ approvalId: 'approval-1' }], receipts: [{ receiptId: 'mcp-r1', verified: true, createdAt: '2026-08-20T07:30:00Z' }] },
  artifactHost: { connected: true, source: 'mcp' },
  diagnostics: { warnings: 1, failures: 0 }
});

assert.strictEqual(status.schema, 'codee.dashboard.status.v1');
assert.strictEqual(status.plan.activeCount, 1);
assert.strictEqual(status.plan.current.planId, 'plan-live');
assert.strictEqual(status.plan.current.stepNumber, 3);
assert.strictEqual(status.plan.current.stepTotal, 4);
assert.strictEqual(status.artifact.zip, 'live.zip');
assert.strictEqual(status.artifact.verified, true);
assert.strictEqual(status.project.branch, 'main');
assert.strictEqual(status.project.files, 471);
assert.strictEqual(status.ai.state, 'READY');
assert.strictEqual(status.ai.localAvailable, true);
assert.strictEqual(status.infrastructure.mcp.state, 'ATTENTION');
assert.strictEqual(status.infrastructure.repositoryHost.state, 'READY');
assert.strictEqual(status.infrastructure.artifactHost.state, 'READY');
assert.strictEqual(status.infrastructure.browser.state, 'CONTRACT_ONLY');
assert.strictEqual(status.workforce.state, 'READY');
assert(status.attention.some(item => item.code === 'MCP_APPROVALS_PENDING'));
assert(status.attention.some(item => item.code === 'ARTIFACT_VERIFICATION_HELD'));
assert(!JSON.stringify(status).includes('tokenConfigured'), 'dashboard output must not expose credential metadata');

console.log('Dashboard status derives a bounded canonical operational summary');
