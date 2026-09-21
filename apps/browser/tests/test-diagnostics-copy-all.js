const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

const html = fs.readFileSync('src/sidebar/sidebar.html', 'utf8');
const js = fs.readFileSync('src/sidebar/sidebar.js', 'utf8');
const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));

assert(/id=["']diagnostics-copy-btn["']/.test(html), 'Diagnostics must include a Copy All button');
assert(/function\s+buildDiagnosticsClipboardText\b/.test(js), 'sidebar must build a complete diagnostics clipboard report');
assert(/async\s+function\s+copyAllDiagnostics\b/.test(js), 'sidebar must wire Copy All diagnostics');
assert(manifest.permissions.includes('clipboardWrite'), 'clipboardWrite permission must be declared for reliable extension clipboard writes');

const start = js.indexOf('function buildDiagnosticsClipboardText');
const end = js.indexOf('\nasync function copyAllDiagnostics', start);
assert(start >= 0 && end > start, 'clipboard formatter function must be extractable');
const functionSource = js.slice(start, end);
const context = { console };
vm.createContext(context);
vm.runInContext(`${functionSource}; this.buildDiagnosticsClipboardText = buildDiagnosticsClipboardText;`, context);

const report = {
  ok: true,
  overall: 'healthy',
  recommendation: 'Waiting for matching artifact.',
  tab: { id: 42, provider: 'chatgpt', title: 'AI SYSTEM ARCHITECT', liveIdentity: 'chatgpt:abc' },
  plan: {
    planId: 'plan-1', runId: 'run-1', stepNumber: 1, stepTotal: 33,
    dispatchStatus: 'awaiting_artifact', stepId: 'step-01', stepToken: 'token-1',
    stateRevision: 11, lastArtifactSha256: '', lastArtifactValidationReason: '', lastDispatchError: '',
    artifactVerificationMode: 'receipt_required', artifactValidationMode: 'strict_v216',
    logicalRetryCount: 1, deliveryRetryCount: 2, nextRetryAt: 123456
  },
  connection: {
    worker: true, contentScript: true, composer: true, contextValid: true,
    pageError: '', lastContentError: '', lastPromptError: '', lastPromptAcceptedAt: 123, scanCount: 7
  },
  recoveryAlarm: { ok: true, periodInMinutes: 1 },
  artifact: { visibleCount: 0, matchingCount: 0, evaluations: [] },
  storageHealth: { bytesInUse: 12345, planCount: 7, activePlans: 2, completedPlans: 5, compactedPlans: 3, artifactReceipts: 88, retention: { fullCompletedPlans: 20 } },
  checks: [{ name: 'worker', ok: true }, { name: 'artifact', ok: false, detail: 'waiting' }],
  events: [{ at: '2026-08-15T14:18:14.456Z', severity: 'success', type: 'step-submitted', details: { step: 1, stepToken: 'token-1' } }]
};

const text = context.buildDiagnosticsClipboardText(report, {
  version: '2.0.15',
  generatedAt: '2026-08-16T00:30:00+10:00'
});
for (const expected of [
  '# TITAN CODE Diagnostics Report',
  'Version: 2.0.15',
  'Overall: healthy',
  'Plan: plan-1',
  'Run: run-1',
  'Step: 1/33',
  'State: awaiting_artifact',
  'Token: token-1',
  'Artifact validation: strict_v216',
  'Logical retries: 1',
  'Delivery retries: 2',
  'Worker: OK',
  'Composer: FOUND',
  'Visible signatures: 0',
  '## Storage Health',
  'Bytes used: 12345',
  'Completed plans: 5',
  'Compacted plans: 3',
  'Artifact receipts: 88',
  'Full completed-plan retention: 20',
  'Recovery Log',
  'step-submitted',
  'Raw Snapshot',
  '"planId": "plan-1"'
]) assert(text.includes(expected), `clipboard report must include ${expected}`);

console.log('diagnostics Copy All report OK');
