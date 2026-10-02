import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { generateReadinessSnapshot } from '../generate-readiness-snapshot.mjs';
const audit=JSON.parse(readFileSync('tests/e2e/certification/release-readiness.audit.json','utf8'));
test('snapshot is deterministic and never equates source inspection with certification',()=>{
 const a=generateReadinessSnapshot(audit);const b=generateReadinessSnapshot({...audit,subsystems:[...audit.subsystems].reverse()});
 assert.deepEqual(a,b);assert.equal(a.subsystems.length,28);assert.equal(a.production_eligibility,'DENIED_MISSING_EVIDENCE');
 assert.ok(a.subsystems.every(row=>row.test_evidence.status==='NOT_RUN'&&row.runtime_evidence.status==='UNKNOWN'));
 assert.ok(a.subsystems.every(row=>row.sources.every(source=>/^sha256:[a-f0-9]{64}$/.test(source.content_hash))));
 assert.deepEqual(a.related_evidence,['tests/e2e/certification/critical-path-matrix.generated.json']);
});
test('rejects audit promotion, duplicate rows and missing source evidence',()=>{
 for(const mutate of [x=>x.production_eligibility='ELIGIBLE',x=>x.subsystems.push(x.subsystems[0]),x=>x.subsystems[0].assessment_status='CERTIFIED',x=>x.subsystems[0].implementation_paths=['missing.ts'],x=>x.subsystems[0].test_evidence.status='PASS']){
 const input=structuredClone(audit);mutate(input);assert.throws(()=>generateReadinessSnapshot(input));
 }
});
