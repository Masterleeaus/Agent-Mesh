import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MemoryCustomerCareTriggerLedger,
  evaluatePostJobSatisfactionTrigger
} from '../titan-workforce/customer-care/post-job-satisfaction-trigger.mjs';
import {
  createComplaintIntake,
  buildCustomerCareCaseFromComplaintIntake
} from '../titan-workforce/customer-care/complaint-intake.mjs';
import {
  transitionCustomerCareCase
} from '../titan-workforce/customer-care/customer-care-contract.mjs';
import {
  buildGroundedCustomerCareContext,
  generateBoundedCustomerCareResponse
} from '../titan-workforce/customer-care/grounded-response.mjs';
import { triageCustomerCareCase } from '../titan-workforce/customer-care/customer-care-triage.mjs';
import {
  createCustomerCareHumanReview,
  decideCustomerCareHumanReview,
  buildCustomerCareApprovalHandoff
} from '../titan-workforce/customer-care/customer-care-human-review.mjs';
import {
  MemoryReviewRequestLedger,
  assessPublicReviewRequestEligibility
} from '../titan-workforce/customer-care/review-request-eligibility.mjs';
import {
  MemoryResolvedServiceHandoffLedger,
  buildResolvedServiceHandoff
} from '../titan-workforce/customer-care/resolved-service-handoff.mjs';

const COMPANY='co-cert', CUSTOMER='cust-cert', JOB='job-cert', LOCATION='loc-cert', INVOICE='inv-cert';

function complaint(overrides={}) {
  return {
    company_id: COMPANY, customer_id: CUSTOMER, job_id: JOB, location_id: LOCATION, invoice_id: INVOICE, conversation_id: 'conv-cert',
    source_event_type: 'complaint.received', source_event_id: 'evt-complaint-cert', source_event_verified: true,
    issue_class: 'QUALITY', sentiment: 'NEGATIVE', severity: 'MEDIUM',
    evidence: [{ ref_id: 'msg-cert', kind: 'conversation_message', content_hash: 'sha256:cert' }],
    linked_records: {
      customer: { company_id: COMPANY, customer_id: CUSTOMER },
      job: { company_id: COMPANY, job_id: JOB },
      location: { company_id: COMPANY, location_id: LOCATION },
      invoice: { company_id: COMPANY, invoice_id: INVOICE },
      conversation: { company_id: COMPANY, conversation_id: 'conv-cert' }
    },
    ...overrides
  };
}

function grounded() {
  return buildGroundedCustomerCareContext({
    company_id: COMPANY, customer_id: CUSTOMER, job_id: JOB, invoice_id: INVOICE, case_id: 'case-cert', intent: 'ISSUE_RESPONSE',
    evidence_refs: ['msg-cert'],
    records: {
      customer: { company_id: COMPANY, customer_id: CUSTOMER, source_verified: true, display_name: 'Alex' },
      job: { company_id: COMPANY, job_id: JOB, customer_id: CUSTOMER, source_verified: true, status: 'COMPLETED' },
      invoice: { company_id: COMPANY, invoice_id: INVOICE, customer_id: CUSTOMER, job_id: JOB, source_verified: true, status: 'ISSUED', total: 150, currency: 'AUD' }
    }
  });
}

test('certifies post-job trigger -> complaint -> grounded response -> triage lifecycle with authority neutral throughout', () => {
  const trigger = evaluatePostJobSatisfactionTrigger({
    company_id: COMPANY, customer_id: CUSTOMER, job_id: JOB, channel: 'sms', customer_local_hour: 14,
    quiet_hours: { enabled: true, start_hour: 22, end_hour: 7 },
    contact_preferences: { status: 'GRANTED', allowed_channels: ['sms'] },
    source_event: { type: 'job.completed', event_id: 'evt-job-cert', source_record: { verified: true, owner: 'Titan Field', company_id: COMPANY, job_id: JOB } }
  }, { ledger: new MemoryCustomerCareTriggerLedger() });
  assert.equal(trigger.status, 'PROPOSE_OUTREACH');
  assert.equal(trigger.authority_granted, false);
  assert.equal(trigger.execution_permitted, false);

  const intake = createComplaintIntake(complaint());
  const careCase = buildCustomerCareCaseFromComplaintIntake(intake);
  assert.equal(careCase.state, 'OPEN');
  assert.equal(careCase.authority_granted, false);

  const response = generateBoundedCustomerCareResponse(grounded());
  assert.equal(response.response.mode, 'PROPOSAL_ONLY');
  assert.equal(response.execution_permitted, false);

  const triage = triageCustomerCareCase(careCase, { triage_evidence: [{ company_id: COMPANY, ref: 'msg-cert', source_verified: true }] });
  assert.equal(triage.triaged_case.state, 'TRIAGED');
  assert.equal(triage.execution_permitted, false);
  assert.equal(triage.grants_authority, false);
});

test('certifies refund approval remains governance evidence and never Customer Care execution authority', () => {
  const open = buildCustomerCareCaseFromComplaintIntake(createComplaintIntake(complaint()));
  const triaged = transitionCustomerCareCase(open, 'TRIAGED');
  const proposal = { company_id: COMPANY, customer_id: CUSTOMER, job_id: JOB, invoice_id: INVOICE, proposal_type: 'REFUND', amount: 150, currency: 'AUD', reason_code: 'SERVICE_RECOVERY' };
  const review = createCustomerCareHumanReview(triaged, proposal, { proposer_worker_id: 'customer-care-cert' });
  const approved = decideCustomerCareHumanReview(review, { company_id: COMPANY, actor_type: 'HUMAN', approver_id: 'manager-cert', decision: 'APPROVED', proposal });
  const handoff = buildCustomerCareApprovalHandoff(approved);
  assert.equal(approved.approval_satisfied, true);
  assert.equal(approved.governed_execution_candidate, true);
  assert.equal(approved.execution_permitted, false);
  assert.equal(approved.authority_granted, false);
  assert.equal(handoff.target, 'governance');
  assert.equal(handoff.approval_is_not_execution_authority, true);
});

test('certifies resolved satisfactory recovery can propose neutral review and structured rebooking/sales/jobs handoffs without source mutation', () => {
  const open = buildCustomerCareCaseFromComplaintIntake(createComplaintIntake(complaint({ sentiment: 'NEUTRAL' })));
  const triaged = transitionCustomerCareCase(open, 'TRIAGED');
  const resolved = transitionCustomerCareCase(triaged, 'RESOLVED');
  const recovered = { ...resolved, sentiment: 'POSITIVE', evidence_refs: ['msg-cert','resolution-cert'] };

  const review = assessPublicReviewRequestEligibility({
    company_id: COMPANY, customer_id: CUSTOMER, job_id: JOB, channel: 'sms',
    outcome_record: { verified: true, company_id: COMPANY, customer_id: CUSTOMER, job_id: JOB, status: 'RESOLVED_SATISFACTORY', evidence_ref: 'resolution-cert' },
    customer_care_cases: [recovered], latest_sentiment: 'POSITIVE', unresolved_dissatisfaction: false,
    contact_preferences: { status: 'GRANTED', allowed_channels: ['sms'] }
  }, { ledger: new MemoryReviewRequestLedger() });
  assert.equal(review.eligible, true);
  assert.equal(review.status, 'PROPOSE_REVIEW_REQUEST');
  assert.equal(review.sender_owner, 'Titan Connect');
  assert.equal(review.execution_permitted, false);

  for (const [target, reason] of [['jobs','SERVICE_EXCEPTION'],['rebooking','SATISFIED_REPEAT_OPPORTUNITY'],['sales','EXPANSION_SIGNAL']]) {
    const h = buildResolvedServiceHandoff({
      company_id: COMPANY, case_record: recovered, target, reason, outcome_satisfactory: true, evidence_refs: ['resolution-cert'],
      customer_record: { company_id: COMPANY, customer_id: CUSTOMER },
      job_record: { company_id: COMPANY, job_id: JOB },
      location_record: { company_id: COMPANY, location_id: LOCATION },
      invoice_record: { company_id: COMPANY, invoice_id: INVOICE }
    });
    assert.equal(h.target, target);
    assert.equal(h.source_records_authoritative, true);
    assert.equal(h.overwrite_source_records, false);
    assert.equal(h.direct_mutation, false);
    assert.equal(h.execution_permitted, false);
    const ledger = new MemoryResolvedServiceHandoffLedger();
    assert.equal(ledger.record(h).duplicate, false);
    assert.equal(ledger.record(h).duplicate, true);
  }
});

test('certifies unresolved dissatisfaction and cross-company evidence fail closed across final timeline gates', () => {
  const open = buildCustomerCareCaseFromComplaintIntake(createComplaintIntake(complaint()));
  const review = assessPublicReviewRequestEligibility({
    company_id: COMPANY, customer_id: CUSTOMER, job_id: JOB, channel: 'sms',
    outcome_record: { verified: true, company_id: COMPANY, customer_id: CUSTOMER, job_id: JOB, status: 'SATISFIED' },
    customer_care_cases: [open],
    contact_preferences: { status: 'GRANTED', allowed_channels: ['sms'] }
  }, { ledger: new MemoryReviewRequestLedger() });
  assert.equal(review.eligible, false);
  assert.match(review.status, /SUPPRESSED|BLOCKED/);
  assert.throws(() => buildResolvedServiceHandoff({
    company_id: COMPANY, case_record: { ...open, state: 'RESOLVED', sentiment: 'POSITIVE', evidence_refs: ['msg-cert'] }, target: 'rebooking', reason: 'SATISFIED_REPEAT_OPPORTUNITY', outcome_satisfactory: true,
    customer_record: { company_id: 'co-other', customer_id: CUSTOMER }
  }), /cross-company-customer/);
});
