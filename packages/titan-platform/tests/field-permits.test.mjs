import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildTitanFieldPermit,
  fieldPermitCompletionGateMessage,
  permitBlocksWorkOrderCompletion,
} from '../.test-dist/field-permits.js';

const provenance={source:'fieldservicepro-donor-convergence',recorded_at:'2026-09-22T00:00:00.000Z',idempotency_key:'permit-1'};

test('failed inspection blocks completion without granting authority',()=>{
  const permit=buildTitanFieldPermit({
    permit_id:'permit-1',company_id:'company-1',work_order_id:'wo-1',
    permit_type:'electrical',state:'inspection_failed',expiry_date:'2027-01-01',
    inspections:[{inspection_id:'inspection-1',company_id:'company-1',permit_id:'permit-1',inspection_date:'2026-09-20',result:'failed',evidence_refs:['evidence/report-1'],provenance:{...provenance,idempotency_key:'inspection-1'}}],
    provenance,
  },{as_of:'2026-09-22'});
  assert.equal(permit.completion_blocked,true);
  assert.ok(permit.completion_blockers.includes('FAILED_INSPECTION_UNRESOLVED'));
  assert.equal(permit.automatic_work_order_transition,false);
  assert.equal(permit.grants_authority,false);
  assert.equal(permit.execution_permitted,false);
  assert.match(fieldPermitCompletionGateMessage([permit]),/block completion/);
});

test('passed current permit does not block completion',()=>{
  const permit=buildTitanFieldPermit({
    permit_id:'permit-2',company_id:'company-1',work_order_id:'wo-1',
    permit_type:'building',state:'inspection_passed',expiry_date:'2027-01-01',
    inspections:[{inspection_id:'inspection-2',company_id:'company-1',permit_id:'permit-2',inspection_date:'2026-09-21',result:'passed',provenance:{...provenance,idempotency_key:'inspection-2'}}],
    provenance:{...provenance,idempotency_key:'permit-2'},
  },{as_of:'2026-09-22'});
  assert.equal(permit.completion_blocked,false);
  assert.equal(fieldPermitCompletionGateMessage([permit]),null);
});

test('expired permits fail closed even if state was active',()=>{
  const result=permitBlocksWorkOrderCompletion({state:'active',expiry_date:'2026-09-01',as_of:'2026-09-22'});
  assert.equal(result.blocked,true);
  assert.ok(result.reasons.includes('PERMIT_EXPIRED'));
});

test('cross-company inspection and legacy tenant aliases are rejected',()=>{
  assert.throws(()=>buildTitanFieldPermit({
    permit_id:'permit-3',company_id:'company-1',work_order_id:'wo-1',permit_type:'plumbing',state:'inspection_required',
    inspections:[{inspection_id:'inspection-3',company_id:'company-2',permit_id:'permit-3',inspection_date:'2026-09-22',result:'scheduled',provenance:{...provenance,idempotency_key:'inspection-3'}}],
    provenance:{...provenance,idempotency_key:'permit-3'},
  }),/company_id must match/);
  assert.throws(()=>buildTitanFieldPermit({
    permit_id:'permit-4',company_id:'company-1',work_order_id:'wo-1',permit_type:'plumbing',state:'active',account_id:'legacy',provenance:{...provenance,idempotency_key:'permit-4'},
  }),/legacy tenant boundary/);
});
