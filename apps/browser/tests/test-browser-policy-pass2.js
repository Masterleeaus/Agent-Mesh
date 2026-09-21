const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

const context = vm.createContext({ console, globalThis: {}, URL });
context.globalThis = context;
for (const file of ['src/browser/browser-capability-contract.js','src/browser/browser-policy.js']) {
  vm.runInContext(fs.readFileSync(file, 'utf8'), context, { filename: file });
}
const policy = context.CodeeBrowserPolicy;
const contract = context.CodeeBrowserCapabilityContract;
assert(policy, 'browser policy must be exported');
assert.deepStrictEqual(Array.from(policy.STATES), ['disconnected','connected-read','connected-interactive','developer-evaluate-enabled']);

const now = 1_800_000_000_000;
const tab = { id: 42, url: 'https://example.com/app?a=1', title: 'Example' };
const target = policy.inspectTarget(tab);
assert.strictEqual(target.ok, true);
assert.strictEqual(target.origin, 'https://example.com');

for (const url of [
  'chrome://settings/',
  'chrome-extension://abc/page.html',
  'devtools://devtools/bundled/',
  'file:///tmp/test.html',
  'data:text/html,hello',
  'https://chromewebstore.google.com/detail/example/abc',
  'https://chrome.google.com/webstore/detail/example/abc'
]) {
  const result = policy.inspectTarget({ id: 7, url });
  assert.strictEqual(result.ok, false, `${url} must be restricted`);
}

let record = policy.connect(tab, { now, ttlMs: 30 * 60 * 1000 });
assert.strictEqual(record.state, 'connected-read');
assert.strictEqual(record.origin, 'https://example.com');
assert(record.grants.read && record.grants.read.expiresAt > now);

let auth = policy.authorize(record, contract.get('browser.snapshot'), tab, { now });
assert.strictEqual(auth.ok, true);
auth = policy.authorize(record, contract.get('browser.click'), tab, { now });
assert.strictEqual(auth.ok, false);
assert.strictEqual(auth.reason, 'interactive-grant-required');

auth = policy.authorize(null, contract.get('browser.tabs'), null, { now });
assert.strictEqual(auth.ok, true, 'tab metadata listing must not require a connected target');

assert.throws(() => policy.grant(record, tab, 'developer_execute', { now }), /interactive/i, 'developer execution must not skip interactive state');
record = policy.grant(record, tab, 'interactive', { now, ttlMs: 10 * 60 * 1000 });
assert.strictEqual(record.state, 'connected-interactive');
assert.strictEqual(policy.authorize(record, contract.get('browser.click'), tab, { now }).ok, true);
assert.strictEqual(policy.authorize(record, contract.get('browser.navigate'), tab, { now }).ok, true);
assert.strictEqual(policy.authorize(record, contract.get('browser.evaluate'), tab, { now }).ok, false);

record = policy.grant(record, tab, 'developer_execute', { now, ttlMs: 5 * 60 * 1000 });
assert.strictEqual(record.state, 'developer-evaluate-enabled');
assert.strictEqual(policy.authorize(record, contract.get('browser.evaluate'), tab, { now }).ok, true);

const differentOrigin = { ...tab, url: 'https://evil.example.net/' };
auth = policy.authorize(record, contract.get('browser.snapshot'), differentOrigin, { now });
assert.strictEqual(auth.ok, false);
assert.strictEqual(auth.reason, 'origin-mismatch');

let downgraded = policy.revoke(record, 'developer_execute', { now });
assert.strictEqual(downgraded.state, 'connected-interactive');
downgraded = policy.revoke(downgraded, 'interactive', { now });
assert.strictEqual(downgraded.state, 'connected-read');
downgraded = policy.revoke(downgraded, 'read', { now });
assert.strictEqual(downgraded.state, 'disconnected');

const expired = policy.normalizeRecord(record, now + (31 * 60 * 1000));
assert.strictEqual(expired.state, 'disconnected', 'expired read grant must fail closed and disconnect effective policy state');
assert.strictEqual(policy.authorize(expired, contract.get('browser.snapshot'), tab, { now: now + (31 * 60 * 1000) }).ok, false);

const cloned = policy.connect(tab, { now });
cloned.grants.read.expiresAt = 0;
assert.notStrictEqual(policy.connect(tab, { now }).grants.read.expiresAt, 0, 'policy calls must not share mutable grant state');

console.log('Browser policy enforces state transitions, origin binding, restricted targets and developer opt-in');
