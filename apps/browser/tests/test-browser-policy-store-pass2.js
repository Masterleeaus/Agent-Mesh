const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

function storageArea(memory) {
  return {
    async get(keys) {
      const out = {};
      for (const key of Array.isArray(keys) ? keys : [keys]) if (Object.prototype.hasOwnProperty.call(memory, key)) out[key] = JSON.parse(JSON.stringify(memory[key]));
      return out;
    },
    async set(values) { Object.assign(memory, JSON.parse(JSON.stringify(values))); },
    async remove(keys) { for (const key of Array.isArray(keys) ? keys : [keys]) delete memory[key]; }
  };
}

const sessionMemory = {};
const localMemory = {};
const context = vm.createContext({ console, globalThis: {}, URL, chrome: { storage: { session: storageArea(sessionMemory), local: storageArea(localMemory) } } });
context.globalThis = context;
for (const file of ['src/browser/browser-capability-contract.js','src/browser/browser-policy.js','src/browser/browser-policy-store.js']) {
  vm.runInContext(fs.readFileSync(file, 'utf8'), context, { filename: file });
}
const store = context.CodeeBrowserPolicyStore;
const contract = context.CodeeBrowserCapabilityContract;
assert(store, 'browser policy store must be exported');

(async () => {
  const tab = { id: 9, url: 'https://example.com/path', title: 'Example' };
  const connected = await store.connect(tab, { ttlMs: 60_000 });
  assert.strictEqual(connected.record.state, 'connected-read');
  assert(Object.keys(sessionMemory).length > 0, 'temporary browser grants must use extension session storage');
  assert.strictEqual(Object.keys(localMemory).length, 0, 'temporary grants must not be written to extension local storage');

  await Promise.all([
    store.grant(tab, 'interactive', { ttlMs: 60_000 }),
    store.get(tab.id),
    store.list()
  ]);
  const interactive = await store.get(tab.id);
  assert.strictEqual(interactive.record.state, 'connected-interactive');

  const readAuth = await store.authorize('browser.snapshot', tab, contract.get('browser.snapshot'));
  assert.strictEqual(readAuth.ok, true);
  const evalAuth = await store.authorize('browser.evaluate', tab, contract.get('browser.evaluate'));
  assert.strictEqual(evalAuth.ok, false);

  await store.grant(tab, 'developer_execute', { ttlMs: 1000 });
  const evaluate = await store.authorize('browser.evaluate', tab, contract.get('browser.evaluate'));
  assert.strictEqual(evaluate.ok, true);

  const events = await store.audit(20);
  assert(events.some(row => row.action === 'connect'));
  assert(events.some(row => row.action === 'grant' && row.grant === 'developer_execute'));

  const mismatch = await store.authorize('browser.snapshot', { ...tab, url: 'https://different.example/' }, contract.get('browser.snapshot'));
  assert.strictEqual(mismatch.ok, false);
  assert.strictEqual(mismatch.reason, 'origin-mismatch');

  await store.disconnect(tab.id, { reason: 'test' });
  const gone = await store.get(tab.id);
  assert.strictEqual(gone.record, null);
  assert((await store.audit(20)).some(row => row.action === 'disconnect'));

  console.log('Browser policy store persists temporary grants in extension-owned session storage with serialized audit-safe mutations');
})().catch(error => { console.error(error); process.exit(1); });
