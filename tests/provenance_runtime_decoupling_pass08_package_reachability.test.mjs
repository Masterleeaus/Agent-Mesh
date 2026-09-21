import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';

const j=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const audit=j('diagnostics/provenance/runtime-provenance-pass08-package-reachability-audit.json');
const index=j('titan-provenance/external-provenance-index.json');
const ledger=j('TITAN-TRUE-DELTA-DELETIONS.json');

test('Pass8 retirement is limited to the declared duplicate donor payload',()=>{
  assert.deepEqual(ledger.deleted,['workforce/donor/installed-client-workforce-master.json']);
  assert.equal(fs.existsSync('workforce/donor/installed-client-workforce-master.json'),false);
  assert.equal(fs.existsSync('titan-workforce/catalogue/installed-client-workforce-master.json'),true);
  assert.equal(audit.candidate_semantics.signed_marketplace_package_mutation,false);
});

test('Pass8 provenance index accounts for every reference without undeclared loss',()=>{
  const deleted=new Set(ledger.deleted);
  const missing=index.references.filter(r=>!fs.existsSync(r.original_path)&&!deleted.has(r.original_path));
  assert.equal(index.references.length,52);
  assert.deepEqual(missing,[]);
});

test('Pass8 donor retirement is backed by exact canonical-equivalence hash evidence',()=>{
  const ref=index.references.find(r=>r.original_path==='workforce/donor/installed-client-workforce-master.json');
  assert.ok(ref);
  assert.equal(ref.canonical_equivalent_path,'titan-workforce/catalogue/installed-client-workforce-master.json');
  assert.equal(sha(ref.canonical_equivalent_path),ref.sha256);
  assert.equal(ref.canonical_equivalent_sha256,ref.sha256);
});

test('Pass8 retains titan-agent history until durable external resolution exists',()=>{
  const history=index.references.filter(r=>r.original_path.startsWith('titan-agent/history/'));
  assert.ok(history.length>0);
  for(const ref of history){
    assert.equal(fs.existsSync(ref.original_path),true);
    assert.equal(ledger.deleted.includes(ref.original_path),false);
  }
});

test('Pass8 audit remains company-boundary and authority neutral',()=>{
  assert.equal(audit.company_boundary,'company_id only');
  assert.equal(audit.authority_change,false);
  assert.equal(audit.grants_authority,false);
});
