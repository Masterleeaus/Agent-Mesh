const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

const source = fs.readFileSync('src/lib/service-worker.js', 'utf8');
const chrome = {
  sidePanel: { setPanelBehavior: async () => {} },
  runtime: { onMessage: { addListener() {} }, sendMessage: async () => {} },
  alarms: { create() {}, onAlarm: { addListener() {} } },
  tabs: { query(_q, cb) { cb([]); }, sendMessage: async () => ({ ok: true }) },
  storage: {
    sync: { get: async () => ({}) },
    local: { get: async () => ({ codeeState: {} }), set: async () => {} }
  }
};
const context = {
  chrome,
  console: { log() {}, error() {}, warn() {} },
  setTimeout() { return 1; },
  Map, Set, Promise, Date, Math,
  crypto: { randomUUID: () => 'uuid' }
};
vm.runInNewContext(source, context);

const state = {
  protocolMode: 'signature_v2',
  planId: 'plan-A',
  runId: 'run-A',
  plan: [{ number: 1, text: 'Build the feature' }],
  stepIndex: 0,
  currentStepId: 'step-01',
  currentStepToken: 'token-01',
  lastArtifactSha256: null
};
const prompt = context.buildPrompt(state);
for (const required of [
  'CODEE_ARTIFACT',
  'PROTOCOL_VERSION: 2',
  'PLAN_ID: plan-A',
  'RUN_ID: run-A',
  'STEP_ID: step-01',
  'STEP_TOKEN: token-01',
  'STEP_COMPLETED: 1',
  'STEP_TOTAL: 1',
  'STATUS: completed',
  'PARENT_SHA256: N/A',
  'NEXT_ACTION: advance',
  'CODEE_ARTIFACT_READY'
]) {
  assert(prompt.includes(required), `signature prompt contract must include ${required}`);
}

console.log('signature prompt contract OK');
