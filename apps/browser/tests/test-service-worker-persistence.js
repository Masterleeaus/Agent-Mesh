const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

const source = fs.readFileSync('src/lib/service-worker.js', 'utf8');
let codeeState = {
  plan_7: {
    stateVersion: 2,
    planId: 'persist-plan-7',
    plan: [{ number: 1, text: 'first' }, { number: 2, text: 'second' }],
    stepIndex: 0,
    versions: ['2.0.1'],
    knownVersions: ['2.0.1'],
    dispatchStatus: 'awaiting_zip'
  }
};
const sentTabMessages = [];

const chrome = {
  sidePanel: { setPanelBehavior: async () => {} },
  runtime: {
    onMessage: { addListener() {} },
    sendMessage: async () => {}
  },
  alarms: {
    create() {},
    onAlarm: { addListener() {} }
  },
  tabs: {
    query(_query, cb) { cb([]); },
    async sendMessage(tabId, message) {
      if (message.action === 'GET_PAGE_STATE') {
        return { ok: true, versions: ['2.0.1', '2.0.2'] };
      }
      if (message.action === 'SEND_PROMPT') {
        sentTabMessages.push({ tabId, message });
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
  await context.handleZIPDetected(7, '2.0.2');

  assert.deepStrictEqual(codeeState.plan_7.versions, ['2.0.1', '2.0.2'],
    'ZIP history must be persisted with the plan in chrome.storage.local');
  assert(codeeState.plan_7.knownVersions.includes('2.0.2'),
    'handled ZIP must also become part of the known page baseline');
  assert.strictEqual(codeeState.plan_7.stepIndex, 1,
    'plan should move to the next current step after a new ZIP is persisted');
  assert.strictEqual(codeeState.plan_7.dispatchStatus, 'awaiting_zip',
    'next step should be armed only after prompt delivery is acknowledged');
  assert.strictEqual(sentTabMessages.length, 1,
    'new ZIP should send exactly one next-step prompt');

  await context.handleZIPDetected(7, '2.0.2');
  assert.strictEqual(sentTabMessages.length, 1,
    'a duplicate ZIP version after worker restart/page reload must not advance the plan again');

  console.log('service-worker persistence OK');
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
