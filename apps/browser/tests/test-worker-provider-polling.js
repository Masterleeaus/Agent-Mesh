const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

const source = fs.readFileSync('src/lib/service-worker.js', 'utf8');
let lastQuery = null;

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
    query(query, cb) { lastQuery = query; cb([]); },
    sendMessage: async () => {}
  },
  storage: {
    sync: { get: async () => ({}) },
    local: { get: async () => ({ codeeState: {} }), set: async () => {} }
  }
};

const context = {
  chrome,
  console: { log() {}, error() {}, warn() {} },
  setTimeout() { return 1; },
  Promise
};

vm.runInNewContext(source, context);
context.checkForZIPsOnAllTabs();

assert(lastQuery, 'worker must query open provider tabs during polling');
assert(Array.isArray(lastQuery.url), 'worker polling URL query must include both provider URL patterns');
assert(lastQuery.url.includes('*://chatgpt.com/*'), 'worker must poll ChatGPT tabs');
assert(lastQuery.url.includes('*://claude.ai/*'), 'worker must poll Claude tabs');

console.log('worker provider polling OK');
