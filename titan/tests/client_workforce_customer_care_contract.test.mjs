import assert from 'node:assert/strict';
import test from 'node:test';
import {
  CUSTOMER_CARE_CONTRACT,
  assessCustomerCareEscalation,
  assessReviewEligibility,
  buildCustomerCareHandoff,
  createCustomerCareCase,
  transitionCustomerCareCase
} from '../titan-workforce/customer-care/customer-care-contract.mjs';

test('Pass 2 contract preserves company boundary and authority neutrality', () => {
  assert.equal(CUSTOMER_CARE_CONTRACT.company_boundary, 'company_id');
  assert.equal(CUSTOMER_CARE_CONTRACT.authority_rule, 'identity_does_not_grant_authority');
  assert.equal(CUSTOMER_CARE_CONTRACT.remediation.proposal_only_by_default, true);
  assert.ok(CUSTOMER_CARE_CONTRACT.remediation.never_self_authorized.includes('REFUND'));
});

test('case creation is company-scoped, structured, and fail-closed', () => {
  assert.throws(() => createCustomerCareCase({ customer_id: 'cust-1' }), /company_id is required/);
  const record = createCustomerCareCase({ company_id: 'co-1', customer_id: 'cust-1', job_id: 'job-1', sentiment: 'negative', issue_class: 'quality', evidence_refs: ['msg-1', 'msg-1'] });
  assert.equal(record.company_id, 'co-1');
  assert.equal(record.state, 'OPEN');
  assert.equal(record.sentiment, 'NEGATIVE');
  assert.equal(record.issue_class, 'QUALITY');
  assert.deepEqual(record.evidence_refs, ['msg-1']);
  assert.equal(record.authority_granted, false);
  assert.equal(record.execution_permitted, false);
});

test('case state machine rejects invalid transitions and preserves non-authority', () => {
  const open = createCustomerCareCase({ company_id: 'co-1', customer_id: 'cust-1' });
  assert.throws(() => transitionCustomerCareCase(open, 'CLOSED'), /invalid Customer Care transition/);
  const triaged = transitionCustomerCareCase(open, 'TRIAGED');
  const pending = transitionCustomerCareCase(triaged, 'PENDING_APPROVAL');
  assert.equal(pending.state, 'PENDING_APPROVAL');
  assert.equal(pending.execution_permitted, false);
});

test('safety, privacy, critical severity and financial remediation escalate', () => {
  const safety = createCustomerCareCase({ company_id: 'co-1', customer_id: 'cust-1', issue_class: 'SAFETY' });
  assert.deepEqual(assessCustomerCareEscalation(safety), { mandatory: true, approval_required: true, route: 'governance', authority_granted: false, execution_permitted: false });
  const ordinary = createCustomerCareCase({ company_id: 'co-1', customer_id: 'cust-2', issue_class: 'QUALITY' });
  assert.equal(assessCustomerCareEscalation(ordinary, 'REFUND_REVIEW').approval_required, true);
});

test('review eligibility blocks unresolved dissatisfaction', () => {
  const negative = createCustomerCareCase({ company_id: 'co-1', customer_id: 'cust-1', sentiment: 'NEGATIVE', issue_class: 'QUALITY' });
  const blocked = assessReviewEligibility(negative);
  assert.equal(blocked.eligible, false);
  assert.ok(blocked.blockers.includes('negative_sentiment'));
  assert.ok(blocked.blockers.includes('unresolved_case'));
  const positive = createCustomerCareCase({ company_id: 'co-1', customer_id: 'cust-2', sentiment: 'POSITIVE', issue_class: 'NONE' });
  const triaged = transitionCustomerCareCase(positive, 'TRIAGED');
  const resolved = transitionCustomerCareCase(triaged, 'RESOLVED');
  assert.equal(assessReviewEligibility(resolved).eligible, true);
});

test('handoffs are structured, company-scoped and never execute by themselves', () => {
  const record = createCustomerCareCase({ company_id: 'co-1', customer_id: 'cust-1', case_id: 'cc-1', job_id: 'job-1' });
  const handoff = buildCustomerCareHandoff(record, 'jobs', 'REWORK_REVIEW', { evidence_refs: ['photo-1'] });
  assert.equal(handoff.company_id, 'co-1');
  assert.equal(handoff.target, 'jobs');
  assert.equal(handoff.reason, 'REWORK_REVIEW');
  assert.equal(handoff.authority_granted, false);
  assert.equal(handoff.execution_permitted, false);
  assert.throws(() => buildCustomerCareHandoff(record, 'unknown', 'x'), /unsupported/);
});
