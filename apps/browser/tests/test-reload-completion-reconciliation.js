const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

const source = fs.readFileSync('src/lib/service-worker.js', 'utf8');
let codeeState = {
  plan_7: {
    stateVersion: 2,
    planId: 'reload-race-plan',
    plan: [
      { number: 1, text: 'first' },
      { number: 2, text: 'second' }
    ],
    stepIndex: 0,
    versions: [],
    knownVersions: ['1.0.0'],
    dispatchStatus: 'awaiting_zip',
    lastDispatchedStep: 0
  }
};
const sentPrompts = [];

const chrome = {
  sidePanel: { setPanelBehavior: async () => {} },
  runtime: {
    onMessage: { addListener() {} },
    sendMessage: async () => {}
  },
  alarms: { create() {}, onAlarm: { addListener() {} } },
  tabs: {
    query(_query, cb) { cb([]); },
    async sendMessage(tabId, message) {
      assert.strictEqual(tabId, 7);
      if (message.action === 'GET_PAGE_STATE') {
        return { ok: true, versions: ['1.0.0', '1.0.1'] };
      }
      if (message.action === 'SEND_PROMPT') {
        sentPrompts.push(message);
        return { ok: true };
      }
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
  Map,
  Set,
  Promise,
  Date,
  Math
};

vm.runInNewContext(source, context);

(async () => {
  // Exact regression: Step 1 was delivered and completed, but the user refreshed
  // before the one-minute content-script poll emitted ZIP_DETECTED.
  await context.handleContentReady(7, ['1.0.0', '1.0.1']);

  assert.strictEqual(codeeState.plan_7.stepIndex, 1,
    'reload handshake must reconcile an unseen ZIP for an already-delivered step');
  assert.strictEqual(codeeState.plan_7.dispatchStatus, 'awaiting_zip',
    'after reconciliation, Step 2 must be positively delivered and await its output');
  assert.deepStrictEqual(codeeState.plan_7.versions, ['1.0.1'],
    'the unseen Step 1 ZIP must be recorded as completed output');
  assert(codeeState.plan_7.knownVersions.includes('1.0.1'),
    'the reconciled ZIP must become part of the persisted baseline');
  assert.strictEqual(sentPrompts.length, 1,
    'reconciliation must send exactly one next-step prompt');
  assert.strictEqual(sentPrompts[0].stepNumber, 2,
    'reload must continue with Step 2, not resend Step 1');

  console.log('reload completion reconciliation OK');
})().catch(error => {
  console.error(error);
  process.exit(1);
});
