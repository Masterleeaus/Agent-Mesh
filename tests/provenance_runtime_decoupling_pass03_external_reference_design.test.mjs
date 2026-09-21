import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const root=process.env.TITAN_DELTA_ROOT || process.cwd();
const idx=JSON.parse(fs.readFileSync(path.join(root,'titan-provenance/external-provenance-index.json'),'utf8'));
const schema=JSON.parse(fs.readFileSync(path.join(root,'titan-provenance/contracts/external-provenance-reference.schema.json'),'utf8'));
const cls=JSON.parse(fs.readFileSync(path.join(root,'diagnostics/provenance/runtime-provenance-retention-classification.json'),'utf8'));

test('external index covers every retirement candidate exactly once',()=>{
 const candidates=cls.target_artifacts.filter(x=>x.retirement_candidate);
 assert.equal(idx.reference_count,candidates.length);
 assert.equal(new Set(idx.references.map(x=>x.original_path)).size,candidates.length);
 assert.deepEqual(new Set(idx.references.map(x=>x.original_path)),new Set(candidates.map(x=>x.path)));
});
test('references are content addressed and carry no embedded evidence bytes',()=>{
 for(const r of idx.references){
  assert.equal(r.logical_locator,`provenance://sha256/${r.sha256}`);
  assert.equal(r.runtime_packaged,false);
  assert.equal(r.resolution_required_for_audit,true);
  assert.equal(r.external_storage_binding,null);
 }
});
test('canonical workforce runtime catalogue is explicitly retained',()=>{
 assert.ok(idx.canonical_runtime_assets_retained.includes('titan-workforce/catalogue/installed-client-workforce-master.json'));
 assert.ok(!idx.references.some(x=>x.original_path==='titan-workforce/catalogue/installed-client-workforce-master.json'));
});
test('design is not activated before durable evidence bindings exist',()=>{
 assert.equal(idx.status,'DESIGN_ONLY_NOT_RUNTIME_ACTIVE');
 assert.equal(idx.resolution_contract.external_storage_binding_required_before_retirement,true);
 assert.equal(idx.resolution_contract.runtime_fallback_to_historical_payload,false);
});
test('reference schema makes hash and audit resolution mandatory',()=>{
 assert.ok(schema.required.includes('sha256'));
 assert.ok(schema.required.includes('resolution_required_for_audit'));
 assert.equal(schema.properties.runtime_packaged.const,false);
});
