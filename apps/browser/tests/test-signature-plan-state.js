const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

const source = fs.readFileSync('src/lib/service-worker.js', 'utf8');
let codeeState = {
  plan_7: {
    stateVersion: 2,
    protocolMode: 'signature_v2',
    planId: 'plan-123',
    runId: 'run-abc',
    plan: [
      { number: 1, text: 'first' },
      { number: 2, text: 'second' }
    ],
    stepIndex: 0,
    versions: [],
    knownVersions: [],
    knownArtifactHashes: [],
    consumedArtifactHashes: [],
    dispatchStatus: 'awaiting_artifact',
    currentStepId: 'step-01',
    currentStepToken: 'token-01'
  }
};
const sent = [];

const chrome = {
  sidePanel: { setPanelBehavior: async () => {} },
  runtime: { onMessage: { addListener() {} }, sendMessage: async () => {} },
  alarms: { create() {}, onAlarm: { addListener() {} } },
  tabs: {
    query(_query, cb) { cb([]); },
    async sendMessage(tabId, message) {
      assert.strictEqual(tabId, 7);
      if (message.action === 'GET_PAGE_STATE') return { ok: true, versions: [], artifacts: [] };
      if (message.action === 'SEND_PROMPT') { sent.push(message); return { ok: true }; }
      return { ok: true };
    }
  },
  storage: {
    sync: { get: async () => ({}) },
    local: {
      get: async () => ({ codeeState: JSON.parse(JSON.stringify(codeeState)) }),
      set: async ({ codeeState: next }) => { codeeState = JSON.parse(JSON.stringify(next)); }
    }
  }
};

const context = {
  chrome,
  console: { log() {}, error() {}, warn() {} },
  setTimeout(fn) { fn(); return 1; },
  clearTimeout() {},
  Map, Set, Promise, Date, Math,
  crypto: { randomUUID: () => 'new-token-uuid' }
};
vm.runInNewContext(source, context);

const baseArtifact = {
  ready: true,
  protocolVersion: 2,
  planId: 'plan-123',
  runId: 'run-abc',
  stepId: 'step-01',
  stepToken: 'token-01',
  stepCompleted: 1,
  stepTotal: 2,
  status: 'completed',
  artifactId: 'artifact-1',
  zip: 'Build-v1.0.1.zip',
  type: 'cumulative',
  version: '1.0.1',
  parentSha256: 'N/A',
  sha256: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  zipSize: '1000',
  deltaSize: 'N/A',
  filesChanged: '2',
  tests: '10/10 PASS',
  verification: 'PASS',
  createdAt: '2026-08-15T18:27:00+10:00',
  nextAction: 'advance'
};

(async () => {
  assert.strictEqual(typeof context.handleArtifactDetected, 'function',
    'worker must expose signature artifact processing');

  await context.handleArtifactDetected(7, { ...baseArtifact, stepToken: 'wrong-token' });
  assert.strictEqual(codeeState.plan_7.stepIndex, 0,
    'wrong step token must never advance the plan');
  assert.strictEqual(sent.length, 0);

  await context.handleArtifactDetected(7, baseArtifact);
  assert.strictEqual(codeeState.plan_7.stepIndex, 1,
    'matching canonical artifact must advance exactly one step');
  assert(codeeState.plan_7.consumedArtifactHashes.includes(baseArtifact.sha256),
    'consumed SHA must be persisted for deduplication');
  assert.strictEqual(codeeState.plan_7.lastArtifactSha256, baseArtifact.sha256,
    'artifact SHA must become the expected parent for the next cumulative step');
  assert.strictEqual(sent.length, 1, 'next step must be dispatched once');
  assert.strictEqual(sent[0].stepNumber, 2);

  await context.handleArtifactDetected(7, baseArtifact);
  assert.strictEqual(codeeState.plan_7.stepIndex, 1,
    'duplicate artifact SHA must not advance twice');
  assert.strictEqual(sent.length, 1);

  console.log('signature plan state OK');
})().catch(error => { console.error(error); process.exit(1); });
