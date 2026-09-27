const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

// Content-script cadence
const contentSource = fs.readFileSync('src/content-script.js', 'utf8');
let contentIntervalMs = null;
const contentContext = {
  console: { log() {}, error() {}, warn() {} },
  window: { location: { hostname: 'chatgpt.com' } },
  document: { querySelectorAll() { return []; }, querySelector() { return null; } },
  Event: class Event {},
  KeyboardEvent: class KeyboardEvent {},
  setTimeout() { return 1; },
  setInterval(fn, ms) { contentIntervalMs = ms; return 1; },
  clearInterval() {},
  chrome: {
    runtime: {
      id: 'test-extension',
      onMessage: { addListener() {} },
      sendMessage: async () => ({ ok: true })
    }
  }
};
vm.runInNewContext(contentSource, contentContext);
assert.strictEqual(contentIntervalMs, 60000,
  'content-script ZIP scan must run once per minute');

// Service-worker cadence
const workerSource = fs.readFileSync('src/lib/service-worker.js', 'utf8');
let alarmConfig = null;
const workerContext = {
  console: { log() {}, error() {}, warn() {} },
  setTimeout() { return 1; },
  Promise,
  chrome: {
    sidePanel: { setPanelBehavior: async () => {} },
    runtime: { onMessage: { addListener() {} }, sendMessage: async () => {} },
    alarms: {
      create(name, config) { if (name === 'ZIP_POLL') alarmConfig = config; },
      onAlarm: { addListener() {} }
    },
    tabs: { query(query, cb) { cb([]); }, sendMessage: async () => ({ ok: true }) },
    storage: {
      sync: { get: async () => ({}) },
      local: { get: async () => ({ codeeState: {} }), set: async () => {} }
    }
  }
};
vm.runInNewContext(workerSource, workerContext);
assert(alarmConfig, 'ZIP_POLL alarm must be registered');
assert.strictEqual(alarmConfig.periodInMinutes, 1,
  'service-worker sweep must run once per minute');

console.log('one-minute periodic cadence OK');
