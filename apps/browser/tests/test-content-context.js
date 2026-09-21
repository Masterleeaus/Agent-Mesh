const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

const source = fs.readFileSync('src/content-script.js', 'utf8');
let intervalCleared = false;
let scheduledHandler = null;

const context = {
  console: { log() {}, error() {}, warn() {} },
  window: { location: { hostname: 'chatgpt.com' } },
  document: {
    querySelectorAll() {
      return [{ textContent: 'Build complete: Codee-v2.0.2.zip' }];
    },
    querySelector() { return null; }
  },
  Event: class Event {},
  KeyboardEvent: class KeyboardEvent {},
  setTimeout(fn) { return 1; },
  setInterval(fn) { scheduledHandler = fn; return 42; },
  clearInterval(id) { if (id === 42) intervalCleared = true; },
  chrome: {
    runtime: {
      id: 'test-extension',
      onMessage: { addListener() {} },
      sendMessage() {
        throw new Error('Extension context invalidated.');
      }
    }
  }
};

assert.doesNotThrow(() => vm.runInNewContext(source, context),
  'content script must not throw when the extension context is invalidated during initial ZIP scan');
assert(intervalCleared,
  'content script must stop its polling interval after extension context invalidation');
assert.strictEqual(typeof scheduledHandler, 'function', 'polling callback should still be registered before invalidation is detected');

console.log('content-context invalidation handling OK');
