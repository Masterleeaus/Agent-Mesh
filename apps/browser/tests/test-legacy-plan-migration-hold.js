const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

const source = fs.readFileSync('src/lib/service-worker.js', 'utf8');
let codeeState = {
  plan_9: {
    plan: [
      { number: 1, text: 'first' },
      { number: 2, text: 'second' }
    ],
    stepIndex: 1,
    versions: ['2.0.3'],
    target: { title: 'Existing chat', provider: 'ChatGPT' }
  }
};
let promptCount = 0;
let lastUI = null;

const chrome = {
  sidePanel: { setPanelBehavior: async () => {} },
  runtime: {
    onMessage: { addListener() {} },
    sendMessage: async message => { if (message.action === 'UPDATE_UI') lastUI = message; }
  },
  alarms: { create() {}, onAlarm: { addListener() {} } },
  tabs: {
    query(_query, cb) { cb([]); },
    async sendMessage(_tabId, message) {
      if (message.action === 'SEND_PROMPT') promptCount += 1;
      return { ok: true, versions: ['2.0.3'] };
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
  const result = await context.handleContentReady(9, ['2.0.3']);
  assert.strictEqual(promptCount, 0,
    'legacy v2.0.3 plan state must not automatically resend or skip an uncertain step');
  assert.strictEqual(codeeState.plan_9.requiresRestart, true,
    'legacy state must be explicitly marked as requiring a clean restart');
  assert.strictEqual(result.requiresRestart, true);
  assert(lastUI && /restart/i.test(lastUI.status),
    'sidebar must receive a clear restart-required status for legacy plans');

  await context.handleZIPDetected(9, '2.0.4');
  assert.strictEqual(codeeState.plan_9.stepIndex, 1,
    'ZIPs must not advance a legacy plan that is held for restart');
  assert.strictEqual(promptCount, 0);

  console.log('legacy plan migration hold OK');
})().catch(error => {
  console.error(error);
  process.exit(1);
});
