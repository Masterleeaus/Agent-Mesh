const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

const source = fs.readFileSync('src/lib/service-worker.js', 'utf8');
const step1Sha = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
let codeeState = {
  plan_7: {
    stateVersion: 2,
    protocolMode: 'signature_v2',
    planId: 'plan-reload',
    runId: 'run-reload',
    plan: [{ number: 1, text: 'first' }, { number: 2, text: 'second' }],
    stepIndex: 0,
    versions: [], knownVersions: [], knownArtifactHashes: [], consumedArtifactHashes: [], artifactHistory: [],
    dispatchStatus: 'awaiting_artifact',
    currentStepId: 'step-01', currentStepToken: 'token-reload'
  }
};
const sent = [];
const artifact = {
  ready: true, protocolVersion: 2, planId: 'plan-reload', runId: 'run-reload',
  stepId: 'step-01', stepToken: 'token-reload', stepCompleted: 1, stepTotal: 2,
  status: 'completed', artifactId: 'artifact-r', zip: 'Build-v1.0.1.zip', type: 'cumulative', version: '1.0.1',
  parentSha256: 'N/A', sha256: step1Sha, tests: '1/1 PASS', verification: 'PASS',
  createdAt: '2026-08-15T18:27:00+10:00', nextAction: 'advance'
};

const chrome = {
  sidePanel: { setPanelBehavior: async () => {} },
  runtime: { onMessage: { addListener() {} }, sendMessage: async () => {} },
  alarms: { create() {}, onAlarm: { addListener() {} } },
  tabs: {
    query(_q, cb) { cb([]); },
    async sendMessage(tabId, message) {
      assert.strictEqual(tabId, 7);
      if (message.action === 'GET_PAGE_STATE') return { ok: true, versions: ['1.0.1'], artifacts: [artifact] };
      if (message.action === 'SEND_PROMPT') { sent.push(message); return { ok: true }; }
      return { ok: true };
    }
  },
  storage: { sync: { get: async () => ({}) }, local: {
    get: async () => ({ codeeState: JSON.parse(JSON.stringify(codeeState)) }),
    set: async ({ codeeState: next }) => { codeeState = JSON.parse(JSON.stringify(next)); }
  }}
};
const context = { chrome, console: { log() {}, error() {}, warn() {} }, setTimeout(fn) { fn(); return 1; }, Map, Set, Promise, Date, Math,
  crypto: { randomUUID: () => 'retry-token' } };
vm.runInNewContext(source, context);

(async () => {
  await context.handleContentReady(7, ['1.0.1'], [artifact]);
  assert.strictEqual(codeeState.plan_7.stepIndex, 1, 'reload must reconcile matching signed artifact');
  assert.strictEqual(codeeState.plan_7.lastArtifactSha256, step1Sha);
  assert.strictEqual(codeeState.plan_7.dispatchStatus, 'awaiting_artifact');
  assert.strictEqual(sent.length, 1, 'reload reconciliation must dispatch next step once');
  assert.strictEqual(sent[0].stepNumber, 2);
  assert(sent[0].prompt.includes(`PARENT_SHA256: ${step1Sha}`), 'next prompt must carry prior SHA as expected parent');
  console.log('signature reload reconciliation OK');
})().catch(error => { console.error(error); process.exit(1); });
