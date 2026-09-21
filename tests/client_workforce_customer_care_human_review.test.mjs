import test from 'node:test';
import assert from 'node:assert/strict';
import {createCustomerCareCase,transitionCustomerCareCase} from '../titan-workforce/customer-care/customer-care-contract.mjs';
import {CUSTOMER_CARE_HUMAN_REVIEW_CONTRACT,buildCustomerCareReviewRequirements,createCustomerCareHumanReview,decideCustomerCareHumanReview,buildCustomerCareApprovalHandoff} from '../titan-workforce/customer-care/customer-care-human-review.mjs';

const triaged=(over={})=>transitionCustomerCareCase(createCustomerCareCase({company_id:'co-1',case_id:'case-1',customer_id:'cust-1',job_id:'job-1',invoice_id:'inv-1',issue_class:'QUALITY',severity:'MEDIUM',...over}),'TRIAGED');

test('contract preserves company boundary and never grants execution authority',()=>{
  assert.equal(CUSTOMER_CARE_HUMAN_REVIEW_CONTRACT.company_boundary,'company_id');
  assert.equal(CUSTOMER_CARE_HUMAN_REVIEW_CONTRACT.approval_is_not_execution_authority,true);
  assert.deepEqual(CUSTOMER_CARE_HUMAN_REVIEW_CONTRACT.never_unlocked_by_customer_care_review,['LEGAL_ADMISSION','SAFETY_COMMITMENT']);
});

test('refund creates pending human approval and keeps refund blocked',()=>{
  const r=createCustomerCareHumanReview(triaged(),{proposal_type:'REFUND',amount:42,currency:'AUD',invoice_id:'inv-1'},{review_id:'r1',proposer_worker_id:'worker-1'});
  assert.equal(r.review_class,'REFUND');assert.equal(r.state,'WAITING');assert.equal(r.case_state_projection,'PENDING_APPROVAL');
  assert.equal(r.protected_effects_remain_blocked,true);assert.equal(r.execution_permitted,false);
});

test('credit and free rework require human review',()=>{
  assert.equal(buildCustomerCareReviewRequirements(triaged(),{proposal_type:'CREDIT'}).mandatory,true);
  assert.equal(buildCustomerCareReviewRequirements(triaged(),{proposal_type:'FREE_REWORK',job_id:'job-1'}).mandatory,true);
});

test('safety and legal proposals require legal/safety review and never unlock commitment here',()=>{
  const c=triaged({issue_class:'SAFETY',severity:'HIGH'});
  const r=createCustomerCareHumanReview(c,{proposal_type:'SAFETY_COMMITMENT'},{review_id:'s1'});
  assert.equal(r.review_class,'LEGAL_SAFETY');
  const d=decideCustomerCareHumanReview(r,{company_id:'co-1',actor_type:'HUMAN',approver_id:'manager-1',decision:'APPROVED'});
  assert.equal(d.never_unlocked_by_customer_care_review,true);assert.equal(d.governed_execution_candidate,false);assert.equal(d.execution_permitted,false);
});

test('abusive interaction gets mandatory human review without automatic punitive action',()=>{
  const req=buildCustomerCareReviewRequirements(triaged(),{proposal_type:'STATUS_UPDATE',abusive_interaction:true});
  assert.equal(req.review_class,'ABUSIVE_INTERACTION');assert.equal(req.mandatory,true);assert.equal(req.execution_permitted,false);
});

test('high-value customer gets review but no automatic financial authority',()=>{
  const r=createCustomerCareHumanReview(triaged(),{proposal_type:'MANAGER_CALLBACK',high_value_customer:true},{review_id:'hv1'});
  assert.equal(r.review_class,'HIGH_VALUE_CUSTOMER');assert.equal(r.execution_permitted,false);assert.equal(r.authority_granted,false);
});

test('human approval of refund only creates governed execution candidate',()=>{
  const r=createCustomerCareHumanReview(triaged(),{proposal_type:'REFUND',amount:42,currency:'AUD'},{review_id:'r2',proposer_worker_id:'worker-1'});
  const d=decideCustomerCareHumanReview(r,{company_id:'co-1',actor_type:'HUMAN',approver_id:'manager-1',decision:'APPROVED'});
  assert.equal(d.approval_satisfied,true);assert.equal(d.governed_execution_candidate,true);assert.equal(d.execution_authorization_required,true);
  assert.equal(d.authority_granted,false);assert.equal(d.execution_permitted,false);
});

test('AI or worker identity cannot approve',()=>{
  const r=createCustomerCareHumanReview(triaged(),{proposal_type:'CREDIT'},{review_id:'r3'});
  assert.throws(()=>decideCustomerCareHumanReview(r,{company_id:'co-1',actor_type:'AI',approver_id:'agent',decision:'APPROVED'}),/human-decision-required/);
});

test('separation of duties prevents proposer self approval',()=>{
  const r=createCustomerCareHumanReview(triaged(),{proposal_type:'FREE_REWORK'},{review_id:'r4',proposer_worker_id:'worker-1'});
  assert.throws(()=>decideCustomerCareHumanReview(r,{company_id:'co-1',actor_type:'HUMAN',approver_id:'worker-1',decision:'APPROVED'}),/separation-of-duties/);
});

test('cross-company decision is rejected',()=>{
  const r=createCustomerCareHumanReview(triaged(),{proposal_type:'REFUND'},{review_id:'r5'});
  assert.throws(()=>decideCustomerCareHumanReview(r,{company_id:'co-2',actor_type:'HUMAN',approver_id:'manager',decision:'APPROVED'}),/cross-company/);
});

test('proposal drift invalidates approval',()=>{
  const p={proposal_type:'REFUND',amount:42,currency:'AUD'};
  const r=createCustomerCareHumanReview(triaged(),p,{review_id:'r6'});
  assert.throws(()=>decideCustomerCareHumanReview(r,{company_id:'co-1',actor_type:'HUMAN',approver_id:'manager',decision:'APPROVED',proposal:{...p,amount:84}}),/proposal-drift/);
});

test('proposal linkage cannot cross company or mismatch canonical case ids',()=>{
  assert.throws(()=>createCustomerCareHumanReview(triaged(),{proposal_type:'REFUND',company_id:'co-2'}),/cross-company-proposal/);
  assert.throws(()=>createCustomerCareHumanReview(triaged(),{proposal_type:'REFUND',invoice_id:'inv-x'}),/invoice_id-mismatch/);
});

test('rejection never becomes execution candidate',()=>{
  const r=createCustomerCareHumanReview(triaged(),{proposal_type:'REFUND'},{review_id:'r7'});
  const d=decideCustomerCareHumanReview(r,{company_id:'co-1',actor_type:'HUMAN',approver_id:'manager',decision:'REJECTED'});
  assert.equal(d.approval_satisfied,false);assert.equal(d.governed_execution_candidate,false);assert.equal(d.execution_permitted,false);
});

test('approval handoff is governance scoped and authority neutral',()=>{
  const r=createCustomerCareHumanReview(triaged(),{proposal_type:'CREDIT'},{review_id:'r8'});
  const d=decideCustomerCareHumanReview(r,{company_id:'co-1',actor_type:'HUMAN',approver_id:'manager',decision:'APPROVED'});
  const h=buildCustomerCareApprovalHandoff(d);
  assert.equal(h.target,'governance');assert.equal(h.purpose,'GOVERNED_EXECUTION_EVALUATION');assert.equal(h.approval_is_not_execution_authority,true);assert.equal(h.execution_permitted,false);
});
