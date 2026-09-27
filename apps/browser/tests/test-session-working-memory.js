'use strict';
const assert = require('assert');
const { SessionWorkingMemory } = require('../src/intelligence/session-working-memory');

(function basicProvenanceAndAuthority() {
  let now = 1000;
  const memory = new SessionWorkingMemory({ now: () => now, maxItems: 3, maxBytes: 100000, ttlMs: 10000 });
  const saved = memory.put('session-1', {
    key: 'intent', value: { name: 'create_quote' },
    provenance: { source: 'browser-model', request_id: 'req-1', confidence: 0.91 },
    tags: ['intent', 'model'],
  });
  assert.equal(saved.authority, false);
  assert.equal(saved.advisory_only, true);
  assert.equal(saved.provenance.authority, false);
  assert.equal(saved.provenance.confidence, 0.91);
  assert.equal(memory.list('session-1', { tag: 'intent' }).length, 1);
})();

(function itemAndCountBounds() {
  let now = 0;
  const memory = new SessionWorkingMemory({ now: () => ++now, maxItems: 2, maxBytes: 100000, maxItemBytes: 1000 });
  memory.put('s', { key: 'a', value: '1', provenance: { source: 'test' } });
  memory.put('s', { key: 'b', value: '2', provenance: { source: 'test' } });
  memory.put('s', { key: 'c', value: '3', provenance: { source: 'test' } });
  assert.deepEqual(memory.list('s').map((x) => x.key), ['b', 'c']);
  assert.throws(() => memory.put('s', { key: 'huge', value: 'x'.repeat(5000), provenance: { source: 'test' } }), /exceeds/);
})();

(function ttlPruning() {
  let now = 0;
  const memory = new SessionWorkingMemory({ now: () => now, ttlMs: 100, maxBytes: 100000 });
  memory.put('s', { key: 'old', value: 1, provenance: { source: 'test' } });
  now = 101;
  assert.equal(memory.get('s', 'old'), null);
})();

(function replacementAndIsolation() {
  const memory = new SessionWorkingMemory({ maxBytes: 100000 });
  memory.put('a', { key: 'k', value: 1, provenance: { source: 'test' } });
  memory.put('a', { key: 'k', value: 2, provenance: { source: 'test' } });
  memory.put('b', { key: 'k', value: 9, provenance: { source: 'test' } });
  assert.equal(memory.get('a', 'k').value, 2);
  assert.equal(memory.get('b', 'k').value, 9);
  assert.equal(memory.snapshot('a').item_count, 1);
  assert.equal(memory.clear('a'), 1);
  assert.equal(memory.snapshot('a').item_count, 0);
})();

console.log('PASS test-session-working-memory');
