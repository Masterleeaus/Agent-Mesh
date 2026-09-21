import test from 'node:test';
import assert from 'node:assert/strict';
import { assessPublicReviewRequestEligibility, buildReviewRequestDedupeKey, MemoryReviewRequestLedger, CUSTOMER_CARE_REVIEW_REQUEST_CONTRACT } from '../titan-workforce/customer-care/review-request-eligibility.mjs';

const base=()=>({
  company_id:'co-1',customer_id:'cust-1',job_id:'job-1',channel:'sms',
  outcome_record:{verified:true,company_id:'co-1',customer_id:'cust-1',job_id:'job-1',status:'SATISFIED',evidence_ref:'evt:sat-1'},
  contact_preferences:{status:'GRANTED',allowed_channels:['sms']},customer_care_cases:[]
});
const ledger=()=>new MemoryReviewRequestLedger();

test('review request contract is company scoped and proposal only',()=>{
  assert.equal(CUSTOMER_CARE_REVIEW_REQUEST_CONTRACT.company_boundary,'company_id');
  assert.equal(CUSTOMER_CARE_REVIEW_REQUEST_CONTRACT.output_is_proposal_only,true);
  assert.equal(CUSTOMER_CARE_REVIEW_REQUEST_CONTRACT.sender_owner,'Titan Connect');
});

test('verified satisfactory outcome can propose review request',()=>{
  const r=assessPublicReviewRequestEligibility(base(),{ledger:ledger()});
  assert.equal(r.eligible,true);assert.equal(r.status,'PROPOSE_REVIEW_REQUEST');assert.equal(r.authority_granted,false);assert.equal(r.delivery_permitted,false);
});

test('unverified outcome is blocked',()=>{
  const x=base();x.outcome_record.verified=false;
  assert.equal(assessPublicReviewRequestEligibility(x,{ledger:ledger()}).reason,'verified_satisfactory_outcome_required');
});

test('non-satisfactory outcome is blocked',()=>{
  const x=base();x.outcome_record.status='NEUTRAL';
  assert.equal(assessPublicReviewRequestEligibility(x,{ledger:ledger()}).reason,'outcome_not_satisfactory');
});

test('open complaint suppresses public review request',()=>{
  const x=base();x.customer_care_cases=[{company_id:'co-1',case_id:'c1',customer_id:'cust-1',job_id:'job-1',state:'TRIAGED',sentiment:'NEGATIVE',issue_class:'QUALITY'}];
  const r=assessPublicReviewRequestEligibility(x,{ledger:ledger()});
  assert.equal(r.status,'SUPPRESSED_DISSATISFACTION');assert.ok(r.blockers.some(v=>v.includes('unresolved_case')));
});

test('resolved positive issue can be eligible',()=>{
  const x=base();x.customer_care_cases=[{company_id:'co-1',case_id:'c1',customer_id:'cust-1',job_id:'job-1',state:'RESOLVED',sentiment:'POSITIVE',issue_class:'QUALITY'}];
  assert.equal(assessPublicReviewRequestEligibility(x,{ledger:ledger()}).eligible,true);
});

test('latest negative sentiment suppresses even with satisfied outcome record',()=>{
  const x=base();x.latest_sentiment='NEGATIVE';
  assert.equal(assessPublicReviewRequestEligibility(x,{ledger:ledger()}).reason,'latest_negative_sentiment');
});

test('explicit unresolved dissatisfaction suppresses',()=>{
  const x=base();x.unresolved_dissatisfaction=true;
  assert.equal(assessPublicReviewRequestEligibility(x,{ledger:ledger()}).reason,'unresolved_dissatisfaction_flag');
});

test('cross-company outcome is blocked',()=>{
  const x=base();x.outcome_record.company_id='co-2';
  assert.equal(assessPublicReviewRequestEligibility(x,{ledger:ledger()}).reason,'cross_company_outcome_record');
});

test('cross-company case is rejected rather than ignored',()=>{
  const x=base();x.customer_care_cases=[{company_id:'co-2',case_id:'c2',customer_id:'cust-1',job_id:'job-1',state:'OPEN',sentiment:'NEGATIVE',issue_class:'QUALITY'}];
  assert.throws(()=>assessPublicReviewRequestEligibility(x,{ledger:ledger()}),/cross-company-case/);
});

test('missing consent blocks',()=>{
  const x=base();x.contact_preferences={status:'DENIED',allowed_channels:['sms']};
  assert.equal(assessPublicReviewRequestEligibility(x,{ledger:ledger()}).reason,'customer_contact_consent_missing');
});

test('unconsented channel blocks',()=>{
  const x=base();x.channel='email';
  assert.equal(assessPublicReviewRequestEligibility(x,{ledger:ledger()}).reason,'channel_not_consented');
});

test('duplicate public review request suppressed company/customer/job scope',()=>{
  const l=ledger();const x=base();
  assert.equal(assessPublicReviewRequestEligibility(x,{ledger:l}).eligible,true);
  const r=assessPublicReviewRequestEligibility(x,{ledger:l});assert.equal(r.status,'SUPPRESSED_DUPLICATE');assert.equal(l.size(),1);
});

test('dedupe key is company scoped',()=>{
  assert.equal(buildReviewRequestDedupeKey(base()),'co-1:cust-1:job-1:public_review_request');
});
