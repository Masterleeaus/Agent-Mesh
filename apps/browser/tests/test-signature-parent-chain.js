const fs = require('fs');
const vm = require('vm');
const assert = require('assert');
const source = fs.readFileSync('src/lib/service-worker.js', 'utf8');
const parent = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const child = 'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc';
let codeeState = { plan_7: {
  stateVersion: 2, protocolMode: 'signature_v2', planId: 'plan-chain', runId: 'run-chain',
  plan: [{ number: 1, text: 'first' }, { number: 2, text: 'second' }], stepIndex: 1,
  versions: ['1.0.0'], knownVersions: [], knownArtifactHashes: [], consumedArtifactHashes: [parent], artifactHistory: [],
  lastArtifactSha256: parent, dispatchStatus: 'awaiting_artifact', currentStepId: 'step-02', currentStepToken: 'token-02'
}};
const chrome = {
  sidePanel: { setPanelBehavior: async () => {} }, runtime: { onMessage: { addListener() {} }, sendMessage: async () => {} },
  alarms: { create() {}, onAlarm: { addListener() {} }, }, tabs: { query(_q, cb) { cb([]); }, sendMessage: async () => ({ ok: true }) },
  storage: { sync: { get: async () => ({}) }, local: { get: async () => ({ codeeState: JSON.parse(JSON.stringify(codeeState)) }), set: async ({ codeeState: next }) => { codeeState = JSON.parse(JSON.stringify(next)); } } }
};
const context = { chrome, console: { log() {}, error() {}, warn() {} }, setTimeout() { return 1; }, Map, Set, Promise, Date, Math,
  crypto: { randomUUID: () => 'uuid' } };
vm.runInNewContext(source, context);
const make = parentSha256 => ({ ready: true, protocolVersion: 2, planId: 'plan-chain', runId: 'run-chain', stepId: 'step-02', stepToken: 'token-02', stepCompleted: 2, stepTotal: 2, status: 'completed', artifactId: 'child', zip: 'Child-v1.0.1.zip', type: 'cumulative', version: '1.0.1', parentSha256, sha256: child, tests: '2/2 PASS', verification: 'PASS', createdAt: '2026-08-15T18:27:00+10:00', nextAction: 'advance' });
(async () => {
  await context.handleArtifactDetected(7, make('dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd'));
  assert.strictEqual(codeeState.plan_7.stepIndex, 1, 'wrong parent SHA must hold current step');
  assert.strictEqual(codeeState.plan_7.dispatchStatus, 'awaiting_artifact');
  await context.handleArtifactDetected(7, make(parent));
  assert.strictEqual(codeeState.plan_7.dispatchStatus, 'complete', 'matching parent chain must allow final completion');
  assert(codeeState.plan_7.consumedArtifactHashes.includes(child));
  console.log('signature parent chain OK');
})().catch(error => { console.error(error); process.exit(1); });
