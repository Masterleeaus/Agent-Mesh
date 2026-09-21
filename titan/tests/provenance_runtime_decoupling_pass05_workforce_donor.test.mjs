import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
const readJson=(p)=>JSON.parse(fs.readFileSync(p,'utf8'));
const sha=(p)=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const donor='workforce/donor/installed-client-workforce-master.json';
const canonical='titan-workforce/catalogue/installed-client-workforce-master.json';

test('retained canonical catalogue is the runtime bundle metadata source',()=>{
  const raw=fs.readFileSync('titan-modules/bundles/cleaning-workforce.bundle.json','utf8');
  assert.ok(raw.includes(`"source": "${canonical}"`));
  assert.ok(raw.includes(`"historical_source": "${donor}"`));
});

test('signed marketplace envelope remains canonical rather than being mutated without re-signing',()=>{
  const audit=readJson('diagnostics/provenance/workforce-donor-runtime-decoupling-pass05.json');
  assert.equal(audit.signed_marketplace_package_preserved,true);
  const envelope=readJson('titan-modules/marketplace/packages/cleaning-workforce.package.json');
  assert.ok(envelope.signature?.value);
  assert.equal(envelope.payload?.schema,'titan-module-bundle/v1');
});

test('donor lineage is bound to identical retained canonical bytes',()=>{
  const idx=readJson('titan-provenance/external-provenance-index.json');
  const ref=idx.references.find(r=>r.original_path===donor);
  assert.ok(ref);
  assert.equal(ref.canonical_equivalent_path,canonical);
  assert.equal(ref.sha256,sha(canonical));
  assert.equal(ref.canonical_equivalent_sha256,sha(canonical));
  assert.equal(ref.retirement_status,'RUNTIME_DUPLICATE_SAFE_TO_RETIRE_AUDIT_REFERENCE_RETAINED');
});

test('Manager deletion ledger retires only the duplicate donor path',()=>{
  const ledger=readJson('TITAN-TRUE-DELTA-DELETIONS.json');
  assert.ok(ledger.deleted.includes(donor));
  assert.ok(!ledger.deleted.includes(canonical));
});

test('canonical catalogue remains authoritative and populated',()=>{
  const catalogue=readJson(canonical);
  assert.ok(Array.isArray(catalogue.roles));
  assert.ok(catalogue.roles.length>=100);
});

test('decoupling does not introduce legacy tenant boundaries',()=>{
  const corpus=['titan-provenance/external-provenance-index.json','diagnostics/provenance/workforce-donor-runtime-decoupling-pass05.json'].map(p=>fs.readFileSync(p,'utf8')).join('\n');
  assert.ok(!corpus.includes('tenant_company_id'));
});
