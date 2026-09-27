import test from 'node:test';
import assert from 'node:assert/strict';
import {buildAssignmentOfflineEnvelope,reconcileAssignmentRestart} from '../titan-workforce/scheduling/assignment-offline-restart-runtime.mjs';
const proposal={assignment_id:'a1',company_id:'company-a',work_item_id:'job-1',worker_id:'w1',eligibility_checks:[],ranking_factors:{},decision_state:'proposed',revision:4,grants_authority:false};
const assigned={...proposal,decision_state:'assigned',revision:5};
const receipt={company_id:'company-a',assignment_id:'a1',acceptance_id:'accept-1',authority_decision_ref:'auth-77',accepted_at:'2026-09-09T01:00:00Z',revision:5,idempotency_key:'accept:a1:5'};
test('recovered proposal always returns to review and cannot become assigned by replay',()=>{
 const envelope=buildAssignmentOfflineEnvelope({company_id:'company-a',assignment_decision:proposal});
 const r=reconcileAssignmentRestart({company_id:'company-a',envelope,current_assignment_revision:4,current_assignment_state:'proposed'});
 assert.equal(r.recovered_state,'RECOVERED_PROPOSAL_REVIEW_REQUIRED');assert.equal(r.proposal_promoted_to_assigned,false);assert.equal(r.automatic_effect_replay,false);assert.equal(r.execution_permitted,false);
});
test('accepted assignment requires acceptance receipt and recovery is evidence-only',()=>{
 assert.throws(()=>buildAssignmentOfflineEnvelope({company_id:'company-a',assignment_decision:assigned}),/receipt-required/);
 const envelope=buildAssignmentOfflineEnvelope({company_id:'company-a',assignment_decision:assigned,acceptance_receipt:receipt});
 const r=reconcileAssignmentRestart({company_id:'company-a',envelope,current_assignment_revision:5,current_assignment_state:'assigned'});
 assert.equal(r.recovered_state,'ACCEPTED_ASSIGNMENT_EVIDENCE_RECOVERED');assert.equal(r.replay_outcome,'REVIEW_REQUIRED');assert.equal(r.accepted_state_manufactured,false);
});
test('duplicate accepted replay is an idempotent no-op',()=>{
 const envelope=buildAssignmentOfflineEnvelope({company_id:'company-a',assignment_decision:assigned,acceptance_receipt:receipt});
 const r=reconcileAssignmentRestart({company_id:'company-a',envelope,current_assignment_revision:5,current_assignment_state:'assigned',applied_idempotency_keys:['accept:a1:5']});
 assert.equal(r.recovered_state,'ACCEPTED_ASSIGNMENT_ALREADY_APPLIED');assert.equal(r.replay_outcome,'NOOP_ALREADY_APPLIED');assert.equal(r.duplicate_idempotency_key,true);
});
test('newer authoritative revision blocks stale accepted recovery',()=>{
 const envelope=buildAssignmentOfflineEnvelope({company_id:'company-a',assignment_decision:assigned,acceptance_receipt:receipt});
 const r=reconcileAssignmentRestart({company_id:'company-a',envelope,current_assignment_revision:6,current_assignment_state:'assigned'});
 assert.equal(r.recovered_state,'BLOCKED_STALE_ACCEPTED_REVISION');assert.ok(r.blockers.includes('NEWER_ASSIGNMENT_REVISION_EXISTS'));
});
test('assigned-state divergence requires review rather than effect replay',()=>{
 const envelope=buildAssignmentOfflineEnvelope({company_id:'company-a',assignment_decision:assigned,acceptance_receipt:receipt});
 const r=reconcileAssignmentRestart({company_id:'company-a',envelope,current_assignment_revision:5,current_assignment_state:'proposed'});
 assert.equal(r.recovered_state,'REVIEW_ACCEPTED_STATE_DIVERGENCE');assert.equal(r.effect_replay_allowed,false);
});
test('company and legacy tenant boundaries fail closed',()=>{
 const envelope=buildAssignmentOfflineEnvelope({company_id:'company-a',assignment_decision:proposal});
 assert.throws(()=>reconcileAssignmentRestart({company_id:'company-b',envelope}),/cross-company/);
 assert.throws(()=>buildAssignmentOfflineEnvelope({company_id:'company-a',tenant_company_id:'legacy',assignment_decision:proposal}),/legacy-tenant-boundary/);
});
test('acceptance revision mismatch and acceptance on proposal are rejected',()=>{
 assert.throws(()=>buildAssignmentOfflineEnvelope({company_id:'company-a',assignment_decision:assigned,acceptance_receipt:{...receipt,revision:4}}),/revision-mismatch/);
 assert.throws(()=>buildAssignmentOfflineEnvelope({company_id:'company-a',assignment_decision:proposal,acceptance_receipt:receipt}),/requires-assigned-state|revision-mismatch/);
});
