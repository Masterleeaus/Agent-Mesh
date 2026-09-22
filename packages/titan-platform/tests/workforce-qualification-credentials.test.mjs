import test from 'node:test';import assert from 'node:assert/strict';
import {buildTitanQualificationCredential,buildTitanJobQualificationRequirement,deriveCredentialState,assessWorkerQualification} from '../.test-dist/workforce-qualification-credentials.js';
const provenance={source:'fieldservicepro-donor-convergence',recorded_at:'2026-09-22T00:00:00.000Z',idempotency_key:'cred-1'};
const base={credential_id:'cred-1',company_id:'c1',worker_id:'worker-1',qualification_tag:'electrical-license',credential_type:'trade_license',credential_name:'Electrical licence',issue_date:'2025-01-01',expiry_date:'2026-10-10',administrative_state:'active',renewal_reminder_days:30,evidence_refs:['document/licence-1'],provenance};

test('credential expiry is derived without mutating authority state',()=>{
 const c=buildTitanQualificationCredential(base,{as_of:'2026-09-22'});assert.equal(c.computed_state,'expiring_soon');assert.equal(c.days_until_expiry,18);assert.equal(c.valid,true);assert.equal(c.renewal_due,true);assert.equal(c.automatic_status_mutation,false);assert.equal(c.execution_permitted,false);
});
test('expired suspended and revoked credentials are invalid',()=>{
 assert.equal(deriveCredentialState({administrative_state:'active',expiry_date:'2026-09-01',as_of:'2026-09-22'}).valid,false);
 assert.equal(deriveCredentialState({administrative_state:'suspended',expiry_date:'2027-01-01',as_of:'2026-09-22'}).valid,false);
 assert.equal(deriveCredentialState({administrative_state:'revoked',as_of:'2026-09-22'}).valid,false);
});
test('job requirements remain qualification constraints not assignment authority',()=>{
 const r=buildTitanJobQualificationRequirement({requirement_id:'r1',company_id:'c1',job_type:'electrical-switchboard',qualification_tag:'electrical-license',mandatory:true,provenance});
 assert.equal(r.automatic_assignment,false);assert.equal(r.grants_authority,false);
});
test('qualification assessment uses valid tags and never assigns automatically',()=>{
 const valid=buildTitanQualificationCredential({...base,expiry_date:'2027-10-10'},{as_of:'2026-09-22'});
 const a=assessWorkerQualification({company_id:'c1',required_tags:['electrical-license','working-at-heights'],credentials:[valid]});
 assert.equal(a.eligible,false);assert.deepEqual(a.missing_or_invalid_tags,['working-at-heights']);assert.equal(a.automatic_assignment,false);assert.equal(a.qualification_bypass_permitted,false);
});
test('cross-company and legacy boundaries fail closed',()=>{
 const other=buildTitanQualificationCredential({...base,company_id:'c2',expiry_date:'2027-10-10'},{as_of:'2026-09-22'});
 assert.throws(()=>assessWorkerQualification({company_id:'c1',required_tags:['electrical-license'],credentials:[other]}),/company_id must match/);
 assert.throws(()=>buildTitanQualificationCredential({...base,account_id:'legacy'}),/legacy tenant boundary/);
});
test('credential evidence is normalized and required evidence fails closed',()=>{
 const c=buildTitanQualificationCredential({...base,evidence_refs:['document/licence-1','document/licence-1']},{as_of:'2026-09-22'});
 assert.deepEqual(c.evidence_refs,['document/licence-1']);
 assert.throws(()=>buildTitanQualificationCredential({...base,is_required:true,evidence_refs:[]},{as_of:'2026-09-22'}),/requires at least one evidence_ref/);
});
