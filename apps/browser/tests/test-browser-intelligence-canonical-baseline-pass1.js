'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const ledger = JSON.parse(fs.readFileSync(path.join(root, 'docs/onboard-intelligence/CANONICAL-BASELINE.json'), 'utf8'));
const baseline = require('../src/intelligence/baseline.js').getProgramBaseline();

assert.strictEqual(ledger.schemaVersion, 1);
assert.strictEqual(ledger.baselineVersion, JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8')).version);
assert.strictEqual(ledger.program, 'Codee Browser Intelligence');
assert.ok(Number.isInteger(ledger.pass) && ledger.pass >= 1, 'baseline pass must advance monotonically');
assert.deepStrictEqual(ledger.statusVocabulary, ['COMPLETE', 'PARTIAL', 'CONTRACT_ONLY', 'DEAD', 'DUPLICATE', 'MISSING']);
assert.ok(Array.isArray(ledger.subsystems) && ledger.subsystems.length >= 20);
assert.strictEqual(new Set(ledger.subsystems.map((x) => x.id)).size, ledger.subsystems.length, 'subsystem ids must be unique');
for (const item of ledger.subsystems) {
  assert.ok(ledger.statusVocabulary.includes(item.status), `invalid status: ${item.id}`);
  assert.ok(Array.isArray(item.evidence), `missing evidence array: ${item.id}`);
  assert.ok(typeof item.next === 'string' && item.next.length > 0, `missing next action: ${item.id}`);
}
assert.strictEqual(baseline.primaryRuntime, 'browser');
assert.deepStrictEqual(baseline.optionalAccelerators, ['ollama']);
assert.strictEqual(baseline.authorityModel, 'advisory-ai-governed-effects');
assert.ok(ledger.invariants.some((x) => /multi-conversation/i.test(x)));
assert.ok(ledger.invariants.some((x) => /self-authorize/i.test(x)));
console.log('PASS browser intelligence canonical baseline pass 1');
