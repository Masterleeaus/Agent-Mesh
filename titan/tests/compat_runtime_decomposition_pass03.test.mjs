import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
const root=process.cwd();
const map=JSON.parse(fs.readFileSync('titan-runtime/compat-decomposition/pass03/EQUIVALENCE-MAP.json','utf8'));
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
test('Pass3 equivalence map is bound to Merge46 and does not modify compat bundles',()=>{
 assert.equal(map.manager_baseline.merge,46);
 assert.equal(map.policy.wholesale_replacement_allowed,false);
 for (const x of map.compat_bundles){ assert.equal(x.modified_in_pass3,false); assert.equal(sha(x.path),x.sha256); }
});
test('exact reuse candidates exist and required exports are present',()=>{
 const exact=map.candidates.filter(x=>x.status==='EXACT_REUSE_CANDIDATE');
 assert.ok(exact.length>=7);
 for(const x of exact){ assert.equal(x.source,'manager_merge_46'); assert.deepEqual(x.missing_required_exports,[]); assert.equal(sha(x.path),x.sha256); }
});
test('partial equivalence is not promoted to exact parity',()=>{
 const partial=map.candidates.filter(x=>x.status==='PARTIAL_EQUIVALENCE');
 assert.ok(partial.length>=4);
 assert.ok(partial.every(x=>x.status!=='EXACT_REUSE_CANDIDATE'));
});
test('Retriever-native work remains external and unmerged',()=>{
 const ext=map.candidates.filter(x=>x.status==='EXTERNAL_IN_PROGRESS');
 assert.equal(ext.length,2);
 assert.ok(ext.every(x=>x.source==='builder_3_live_delta_pass04_unmerged'));
 assert.ok(ext.every(x=>x.merge_policy.includes('do_not_vendor')));
});
test('unproven domains remain explicitly unproven',()=>{
 assert.ok(map.domain_summary.search.includes('NO_EXACT_NATIVE_EQUIVALENT_PROVEN_IN_PASS3'));
 assert.ok(map.domain_summary.media.includes('NO_EXACT_NATIVE_EQUIVALENT_PROVEN_IN_PASS3'));
});
