const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

const source = fs.readFileSync('src/lib/service-worker.js', 'utf8');

let codeeState = {
  plan_7: {
    stateVersion: 2,
    planId: 'plan-7',
    plan: [
      { number: 1, text: 'first' },
      { number: 2, text: 'second' }
    ],
    stepIndex: 0,
    versions: [],
    knownVersions: [],
    dispatchStatus: 'pending_send'
  }
};

let failStep2Dispatch = false;
const sentPrompts = [];
const uiMessages = [];

const chrome = {
  sidePanel: { setPanelBehavior: async () => {} },
  runtime: {
    onMessage: { addListener() {} },
    sendMessage: async (message) => { uiMessages.push(message); }
  },
  alarms: {
    create() {},
    onAlarm: { addListener() {} }
  },
  tabs: {
    query(_query, cb) { cb([]); },
    async sendMessage(tabId, message) {
      assert.strictEqual(tabId, 7);
      if (message.action === 'GET_PAGE_STATE') {
        return { ok: true, versions: ['1.0.0'] };
      }
      if (message.action === 'SEND_PROMPT') {
        sentPrompts.push(message);
        if (message.stepNumber === 2 && failStep2Dispatch) {
          return { ok: false, error: 'composer unavailable' };
        }
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
  clearTimeout() {},
  Map,
  Set,
  Promise,
  Date,
  Math
};

vm.runInNewContext(source, context);

(async () => {
  // Reproduction: an old ZIP discovered while Step 1 was never delivered must NOT advance.
  await context.handleZIPDetected(7, '1.0.0');
  assert.strictEqual(codeeState.plan_7.stepIndex, 0,
    'old ZIP discovered while prompt is pending must not advance Step 1');
  assert.strictEqual(codeeState.plan_7.dispatchStatus, 'pending_send');
  assert.strictEqual(sentPrompts.length, 0,
    'pending plan must not dispatch because a ZIP was detected');

  // Fresh content script after reload reports what already exists, then retries the pending step.
  await context.handleContentReady(7, ['1.0.0']);
  assert.strictEqual(codeeState.plan_7.stepIndex, 0,
    'reload must still be on Step 1');
  assert.strictEqual(codeeState.plan_7.dispatchStatus, 'awaiting_zip',
    'successful retry should arm ZIP completion only after Step 1 is delivered');
  assert.deepStrictEqual(codeeState.plan_7.knownVersions, ['1.0.0'],
    'pre-existing ZIPs must be baselined before retrying Step 1');
  assert.strictEqual(sentPrompts.length, 1);
  assert.strictEqual(sentPrompts[0].stepNumber, 1,
    'reload retry must send Step 1, not Step 2');

  // The baseline ZIP must remain ignored even after delivery is armed.
  await context.handleZIPDetected(7, '1.0.0');
  assert.strictEqual(codeeState.plan_7.stepIndex, 0);
  assert.strictEqual(sentPrompts.length, 1);

  // A genuinely new ZIP completes Step 1. Simulate Step 2 delivery failing.
  failStep2Dispatch = true;
  await context.handleZIPDetected(7, '1.0.1');
  assert.strictEqual(codeeState.plan_7.stepIndex, 1,
    'new ZIP should complete Step 1 and move current state to Step 2');
  assert.deepStrictEqual(codeeState.plan_7.versions, ['1.0.1']);
  assert(codeeState.plan_7.knownVersions.includes('1.0.1'));
  assert.strictEqual(codeeState.plan_7.dispatchStatus, 'pending_send',
    'failed Step 2 delivery must remain pending instead of pretending it was sent');
  assert.strictEqual(sentPrompts.length, 2);
  assert.strictEqual(sentPrompts[1].stepNumber, 2);

  // Another ZIP appearing during the failed delivery cannot skip Step 2.
  await context.handleZIPDetected(7, '1.0.2');
  assert.strictEqual(codeeState.plan_7.stepIndex, 1,
    'ZIPs while Step 2 is pending must not advance to Step 3');
  assert.deepStrictEqual(codeeState.plan_7.versions, ['1.0.1']);

  // Reload and reconnect retries exactly Step 2.
  failStep2Dispatch = false;
  await context.handleContentReady(7, ['1.0.0', '1.0.1', '1.0.2']);
  assert.strictEqual(codeeState.plan_7.stepIndex, 1);
  assert.strictEqual(codeeState.plan_7.dispatchStatus, 'awaiting_zip');
  assert.strictEqual(sentPrompts.length, 3);
  assert.strictEqual(sentPrompts[2].stepNumber, 2,
    'reconnect must retry the still-pending Step 2');
  assert(codeeState.plan_7.knownVersions.includes('1.0.2'),
    'ZIPs observed during the disconnect must be baselined before retry');

  console.log('plan delivery state machine OK');
})().catch(error => {
  console.error(error);
  process.exit(1);
});
