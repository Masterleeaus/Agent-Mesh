import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MemoryComplaintIntakeLedger,
  createComplaintIntake,
  buildCustomerCareCaseFromComplaintIntake
} from '../titan-workforce/customer-care/complaint-intake.mjs';
import {
  buildGroundedCustomerCareContext,
  generateBoundedCustomerCareResponse,
  guardCustomerCareDraft
} from '../titan-workforce/customer-care/grounded-response.mjs';
import { triageCustomerCareCase } from '../titan-workforce/customer-care/customer-care-triage.mjs';
import {
  createCustomerCareHumanReview,
  decideCustomerCareHumanReview
} from '../titan-workforce/customer-care/customer-care-human-review.mjs';

function complaint(overrides = {}) {
  return {
    company_id: 'co-1', customer_id: 'cust-1', job_id: 'job-1', location_id: 'loc-1', invoice_id: 'inv-1', conversation_id: 'conv-1',
    source_event_type: 'complaint.received', source_event_id: 'evt-1', source_event_verified: true,
    issue_class: 'QUALITY', sentiment: 'NEGATIVE', severity: 'MEDIUM',
    evidence: [{ ref_id: 'msg-1', kind: 'conversation_message', content_hash: 'sha256:1' }],
    linked_records: {
      customer: { company_id: 'co-1', customer_id: 'cust-1' },
      job: { company_id: 'co-1', job_id: 'job-1' },
      location: { company_id: 'co-1', location_id: 'loc-1' },
      invoice: { company_id: 'co-1', invoice_id: 'inv-1' },
      conversation: { company_id: 'co-1', conversation_id: 'conv-1' }
    }, ...overrides
  };
}

function grounded(jobStatus = 'IN_PROGRESS') {
  return buildGroundedCustomerCareContext({
    company_id: 'co-1', customer_id: 'cust-1', job_id: 'job-1', invoice_id: 'inv-1', case_id: 'case-1', intent: 'ISSUE_RESPONSE',
    evidence_refs: ['msg-1'], records: {
      customer: { company_id: 'co-1', customer_id: 'cust-1', source_verified: true, display_name: 'Alex' },
      job: { company_id: 'co-1', job_id: 'job-1', customer_id: 'cust-1', source_verified: true, status: jobStatus },
      invoice: { company_id: 'co-1', invoice_id: 'inv-1', customer_id: 'cust-1', job_id: 'job-1', source_verified: true, status: 'ISSUED', total: 150, currency: 'AUD' }
    }
  });
}

test('angry customer receives bounded acknowledgement without retaliation or unapproved promise', () => {
  const ctx = grounded();
  const proposal = generateBoundedCustomerCareResponse(ctx);
  assert.match(proposal.response.text, /sorry|recorded|review/i);
  assert.doesNotMatch(proposal.response.text, /refund|credit|free rework|ban|terminate/i);
  assert.equal(proposal.response.mode, 'PROPOSAL_ONLY');
  assert.equal(proposal.authority_granted, false);
  assert.equal(proposal.execution_permitted, false);
});

test('false completion claim is blocked when verified job is still in progress', () => {
  const ctx = grounded('IN_PROGRESS');
  const guarded = guardCustomerCareDraft(ctx, 'The job has been completed and everything is finished.');
  assert.equal(guarded.allowed, false);
  assert.ok(guarded.blocked.includes('UNGROUNDED_JOB_COMPLETE'));
  assert.equal(guarded.send_permitted, false);
});

test('duplicate complaint returns original intake and does not fork source truth', () => {
  const ledger = new MemoryComplaintIntakeLedger();
  const first = createComplaintIntake(complaint());
  const second = createComplaintIntake(complaint({ evidence: [{ ref_id: 'later-msg', kind: 'conversation_message' }] }));
  assert.equal(ledger.record(first).duplicate, false);
  const duplicate = ledger.record(second);
  assert.equal(duplicate.duplicate, true);
  assert.deepEqual(duplicate.intake.evidence_refs, ['msg-1']);
});

test('safety issue escalates high with human safety and governance routes and no execution', () => {
  const careCase = buildCustomerCareCaseFromComplaintIntake(createComplaintIntake(complaint({ issue_class: 'SAFETY', severity: 'HIGH' })));
  const result = triageCustomerCareCase(careCase, { triage_evidence: [{ company_id: 'co-1', ref: 'msg-1', source_verified: true }] });
  assert.equal(result.severity, 'HIGH');
  assert.ok(result.routes.includes('safety'));
  assert.ok(result.routes.includes('governance'));
  assert.ok(result.routes.includes('human_reviewer'));
  assert.equal(result.execution_permitted, false);
});

test('refund request requires human approval and approval still does not execute refund', () => {
  const careCase = { ...buildCustomerCareCaseFromComplaintIntake(createComplaintIntake(complaint())), state: 'TRIAGED' };
  const proposal = { company_id: 'co-1', customer_id: 'cust-1', job_id: 'job-1', invoice_id: 'inv-1', proposal_type: 'REFUND', amount: 150, currency: 'AUD', reason_code: 'SERVICE_RECOVERY' };
  const review = createCustomerCareHumanReview(careCase, proposal, { proposer_worker_id: 'customer-care-worker' });
  assert.equal(review.state, 'WAITING');
  assert.equal(review.execution_permitted, false);
  const approved = decideCustomerCareHumanReview(review, { company_id: 'co-1', actor_type: 'HUMAN', approver_id: 'manager-1', decision: 'APPROVED', proposal });
  assert.equal(approved.approval_satisfied, true);
  assert.equal(approved.governed_execution_candidate, true);
  assert.equal(approved.execution_permitted, false);
  assert.equal(approved.authority_granted, false);
});

test('tool/source failure fails closed instead of inventing customer or job facts', () => {
  assert.throws(() => buildGroundedCustomerCareContext({
    company_id: 'co-1', customer_id: 'cust-1', job_id: 'job-1', intent: 'STATUS_UPDATE',
    records: { customer: { company_id: 'co-1', customer_id: 'cust-1', source_verified: false } }
  }), /unverified customer grounding rejected/);
});

test('cross-company evidence cannot leak through intake or grounded response', () => {
  const bad = complaint();
  bad.linked_records.customer = { company_id: 'co-2', customer_id: 'cust-1' };
  assert.throws(() => createComplaintIntake(bad), /cross-company customer link rejected/);
  assert.throws(() => buildGroundedCustomerCareContext({
    company_id: 'co-1', customer_id: 'cust-1', records: {
      customer: { company_id: 'co-2', customer_id: 'cust-1', source_verified: true }
    }
  }), /cross-company customer grounding rejected/);
});

test('model overpromise for refund credit or free rework is blocked before send', () => {
  const ctx = grounded();
  for (const text of [
    'We will refund the full amount today.',
    'We have applied a credit to your account.',
    'We will redo the service for free tomorrow.'
  ]) {
    const guarded = guardCustomerCareDraft(ctx, text);
    assert.equal(guarded.allowed, false, text);
    assert.equal(guarded.requires_human_review, true, text);
    assert.equal(guarded.send_permitted, false, text);
  }
});
