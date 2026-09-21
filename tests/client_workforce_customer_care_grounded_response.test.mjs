import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CUSTOMER_CARE_GROUNDED_RESPONSE_CONTRACT,
  buildGroundedCustomerCareContext,
  buildGroundedResponseProposal,
  generateBoundedCustomerCareResponse,
  guardCustomerCareDraft
} from '../titan-workforce/customer-care/grounded-response.mjs';

function input(overrides = {}) {
  return {
    company_id: 'co-1',
    case_id: 'case-1',
    customer_id: 'cust-1',
    job_id: 'job-1',
    invoice_id: 'inv-1',
    intent: 'STATUS_UPDATE',
    evidence_refs: ['conv:msg-1'],
    records: {
      customer: { company_id: 'co-1', customer_id: 'cust-1', display_name: 'Alex', source_verified: true },
      job: { company_id: 'co-1', job_id: 'job-1', customer_id: 'cust-1', status: 'COMPLETED', source_verified: true },
      invoice: { company_id: 'co-1', invoice_id: 'inv-1', customer_id: 'cust-1', job_id: 'job-1', status: 'ISSUED', total: 125, currency: 'AUD', source_verified: true }
    },
    ...overrides
  };
}

test('contract remains company scoped, proposal only and authority neutral', () => {
  assert.equal(CUSTOMER_CARE_GROUNDED_RESPONSE_CONTRACT.company_boundary, 'company_id');
  assert.equal(CUSTOMER_CARE_GROUNDED_RESPONSE_CONTRACT.output_mode, 'PROPOSAL_ONLY');
  assert.equal(CUSTOMER_CARE_GROUNDED_RESPONSE_CONTRACT.send_requires_separate_authority, true);
});

test('builds response only from verified matching Titan records', () => {
  const response = buildGroundedResponseProposal(input());
  assert.match(response.response.text, /linked job is completed/i);
  assert.match(response.response.text, /AUD 125\.00/);
  assert.equal(response.response.mode, 'PROPOSAL_ONLY');
  assert.equal(response.response.send_requires_authority, true);
  assert.equal(response.execution_permitted, false);
});

test('fails closed without verified customer grounding', () => {
  const data = input();
  data.records.customer.source_verified = false;
  assert.throws(() => buildGroundedCustomerCareContext(data), /unverified customer grounding/);
});

test('rejects cross-company customer, job and invoice grounding', () => {
  for (const kind of ['customer', 'job', 'invoice']) {
    const data = input();
    data.records[kind] = { ...data.records[kind], company_id: 'co-2' };
    assert.throws(() => buildGroundedCustomerCareContext(data), new RegExp(`cross-company ${kind} grounding`));
  }
});

test('rejects customer/job and invoice/job relationship mismatches', () => {
  let data = input();
  data.records.job = { ...data.records.job, customer_id: 'cust-other' };
  assert.throws(() => buildGroundedCustomerCareContext(data), /job customer grounding mismatch/);
  data = input();
  data.records.invoice = { ...data.records.invoice, job_id: 'job-other' };
  assert.throws(() => buildGroundedCustomerCareContext(data), /invoice job grounding mismatch/);
});

test('does not claim completion when job state is not verified complete', () => {
  const data = input();
  data.records.job = { ...data.records.job, status: 'IN_PROGRESS' };
  const response = buildGroundedResponseProposal(data);
  assert.doesNotMatch(response.response.text, /job is completed/i);
  assert.match(response.response.text, /status as IN_PROGRESS/);
});

test('guard blocks fabricated completion claim when record is not complete', () => {
  const data = input();
  data.records.job = { ...data.records.job, status: 'IN_PROGRESS' };
  const context = buildGroundedCustomerCareContext(data);
  const guard = guardCustomerCareDraft(context, 'Your job has been completed and everything is done.');
  assert.equal(guard.allowed, false);
  assert.deepEqual(guard.blocked, ['UNGROUNDED_JOB_COMPLETE']);
  assert.equal(guard.send_permitted, false);
});

test('guard permits a completion statement only when grounded in verified complete job state', () => {
  const context = buildGroundedCustomerCareContext(input());
  const guard = guardCustomerCareDraft(context, 'Our records show the job has been completed.');
  assert.equal(guard.allowed, true);
  assert.equal(guard.send_permitted, false);
});

test('guard blocks refund promises', () => {
  const context = buildGroundedCustomerCareContext(input());
  assert.deepEqual(guardCustomerCareDraft(context, 'We will process a refund today.').blocked, ['REFUND_PROMISE']);
  assert.deepEqual(guardCustomerCareDraft(context, 'I have approved your refund.').blocked, ['REFUND_PROMISE']);
});

test('guard blocks credit promises', () => {
  const context = buildGroundedCustomerCareContext(input());
  assert.deepEqual(guardCustomerCareDraft(context, 'We will apply a credit to your account.').blocked, ['CREDIT_PROMISE']);
});

test('guard blocks free-rework promises', () => {
  const context = buildGroundedCustomerCareContext(input());
  assert.deepEqual(guardCustomerCareDraft(context, 'We will redo the service for free.').blocked, ['FREE_REWORK_PROMISE']);
});

test('issue response acknowledges concern without promising remediation', () => {
  const data = input({ intent: 'ISSUE_RESPONSE' });
  const proposal = buildGroundedResponseProposal(data);
  assert.match(proposal.response.text, /team can review/i);
  assert.doesNotMatch(proposal.response.text, /refund|credit|free rework/i);
  assert.equal(proposal.execution_permitted, false);
});

test('generated proposal remains authority neutral even with grounded facts', () => {
  const context = buildGroundedCustomerCareContext(input());
  const proposal = generateBoundedCustomerCareResponse(context);
  assert.equal(proposal.authority_granted, false);
  assert.equal(proposal.execution_permitted, false);
  assert.equal(proposal.response.send_requires_authority, true);
});
