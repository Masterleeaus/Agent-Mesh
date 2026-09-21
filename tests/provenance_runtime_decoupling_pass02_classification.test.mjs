import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const candidateRoot=process.env.TITAN_CANDIDATE_ROOT || process.cwd();
const deltaRoot=process.env.TITAN_DELTA_ROOT || process.cwd();
const classification=JSON.parse(fs.readFileSync(path.join(deltaRoot,'diagnostics/provenance/runtime-provenance-retention-classification.json'),'utf8'));
const sha256=(p)=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');

test('classifies all 51 history payloads as externalizable evidence, never runtime-required',()=>{
  const history=classification.target_artifacts.filter(x=>x.path.startsWith('titan-agent/history/'));
  assert.equal(history.length,51);
  assert.ok(history.every(x=>x.classification==='externalizable-evidence'));
});

test('canonical workforce catalogue remains runtime-required while donor duplicate is test-only',()=>{
  const canonical=classification.target_artifacts.find(x=>x.path==='titan-workforce/catalogue/installed-client-workforce-master.json');
  const donor=classification.target_artifacts.find(x=>x.path==='workforce/donor/installed-client-workforce-master.json');
  assert.equal(canonical.classification,'runtime-required');
  assert.equal(canonical.retirement_candidate,false);
  assert.equal(donor.classification,'test-only');
  assert.equal(donor.retirement_candidate,true);
  assert.equal(canonical.sha256,donor.sha256);
});

test('recorded hashes match candidate bytes or exact canonical-equivalent retirement evidence',()=>{
  const ledger=JSON.parse(fs.readFileSync(path.join(deltaRoot,'TITAN-TRUE-DELTA-DELETIONS.json'),'utf8'));
  const index=JSON.parse(fs.readFileSync(path.join(deltaRoot,'titan-provenance/external-provenance-index.json'),'utf8'));
  for(const item of classification.target_artifacts){
    const p=path.join(candidateRoot,item.path);
    if(fs.existsSync(p)){
      assert.equal(sha256(p),item.sha256,item.path);
      continue;
    }
    assert.ok(ledger.deleted.includes(item.path),`missing unretired evidence: ${item.path}`);
    const ref=index.references.find(r=>r.original_path===item.path);
    assert.ok(ref?.canonical_equivalent_path,`missing canonical equivalence: ${item.path}`);
    const canonical=path.join(candidateRoot,ref.canonical_equivalent_path);
    assert.ok(fs.existsSync(canonical),`missing retained canonical equivalent: ${item.path}`);
    assert.equal(sha256(canonical),item.sha256,item.path);
    assert.equal(ref.canonical_equivalent_sha256,item.sha256,item.path);
  }
});

test('reference consumers are classified without inventing runtime dependency',()=>{
  const counts=classification.summary.reference_consumer_class_counts;
  assert.equal(counts['runtime-required'],3);
  assert.equal(counts['test-only'],4);
  assert.equal(counts['reconstruction-only'],7);
  assert.equal(counts['runtime-contract-metadata'],4);
});

test('Pass2 performs classification only',()=>{
  assert.match(classification.findings.join(' '),/No deletion or runtime rewiring/);
});
