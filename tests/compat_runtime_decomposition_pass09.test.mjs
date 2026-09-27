import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';

const read=p=>fs.readFileSync(p,'utf8');
const json=p=>JSON.parse(read(p));
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const ledger=json('titan-runtime/compat-decomposition/pass09/RETIREMENT-LEDGER.json');
const manifest=json('titan-runtime/compat-decomposition/pass09/CHUNK-MANIFEST.json');
const metrics=json('titan-runtime/compat-decomposition/pass09/SIZE-STARTUP-METRICS.json');

test('Pass9 refuses retirement while compatibility monoliths remain live reachable',()=>{
  assert.equal(ledger.decision,'NO_RETIREMENT');
  assert.deepEqual(ledger.retired,[]);
  for(const e of ledger.retained){ assert.equal(e.zero_live_reachability,false); assert.equal(e.retirement,'BLOCKED_RETAIN'); assert.ok(fs.existsSync(e.path)); }
});

test('content monolith remains production reachable from manifest and chatTab',()=>{
  const m=json('manifest.json');
  assert.ok((m.content_scripts||[]).some(x=>(x.js||[]).includes('titan-zero-chat-content.compat.js')));
  assert.ok(read('chatTab.html').includes('titan-zero-chat-content.compat.js'));
});

test('background and runtime monoliths remain production reachable',()=>{
  assert.ok(read('compatibility/monica/background-runtime-boundary.mjs').includes("titan-zero-chat-background.compat.js"));
  assert.ok(read('monicaPopup.html').includes('titan-zero-chat-runtime.compat.js'));
});

test('semantic chunk manifest mirrors live protected hashes without retiring source evidence',()=>{
  for(const e of manifest.protected_monoliths){ assert.equal(sha(e.path),e.sha256); }
  for(const e of manifest.chunks){ assert.equal(sha(e.path),e.sha256); }
  assert.match(manifest.protected_hash_migration,/original protected runtime evidence remains authoritative/i);
});

test('Pass9 makes no false physical size or startup reduction claim',()=>{
  assert.equal(metrics.retired_monolith_bytes,0);
  assert.equal(metrics.physical_payload_reduction_bytes,0);
  assert.equal(metrics.startup_gain_claim,'NONE_YET_FROM_MONOLITH_RETIREMENT');
  assert.equal(metrics.monolith_bytes_total,47933157);
});
