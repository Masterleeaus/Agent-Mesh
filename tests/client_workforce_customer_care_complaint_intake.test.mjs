import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CUSTOMER_CARE_COMPLAINT_INTAKE_CONTRACT,
  MemoryComplaintIntakeLedger,
  buildComplaintIntakeDedupeKey,
  buildCustomerCareCaseFromComplaintIntake,
  createComplaintIntake
} from '../titan-workforce/customer-care/complaint-intake.mjs';

function base(overrides = {}) {
  return {
    company_id: 'co-1',
    customer_id: 'cust-1',
    job_id: 'job-1',
    location_id: 'loc-1',
    invoice_id: 'inv-1',
    conversation_id: 'conv-1',
    source_event_type: 'complaint.received',
    source_event_id: 'evt-complaint-1',
    source_event_verified: true,
    issue_class: 'QUALITY',
    sentiment: 'NEGATIVE',
    severity: 'MEDIUM',
    evidence: [
      { ref_id: 'msg-ref-1', kind: 'conversation_message', channel: 'sms', message_id: 'm-1', content_hash: 'sha256:abc' },
      { ref_id: 'photo-ref-1', kind: 'attachment' }
    ],
    linked_records: {
      customer: { company_id: 'co-1', customer_id: 'cust-1' },
      job: { company_id: 'co-1', job_id: 'job-1' },
      location: { company_id: 'co-1', location_id: 'loc-1' },
      invoice: { company_id: 'co-1', invoice_id: 'inv-1' },
      conversation: { company_id: 'co-1', conversation_id: 'conv-1' }
    },
    ...overrides
  };
}

test('complaint intake contract stays company-scoped and authority neutral', () => {
  assert.equal(CUSTOMER_CARE_COMPLAINT_INTAKE_CONTRACT.company_boundary, 'company_id');
  assert.equal(CUSTOMER_CARE_COMPLAINT_INTAKE_CONTRACT.output_is_authority_neutral, true);
});

test('creates structured complaint intake with linked customer/job/location/invoice/conversation evidence', () => {
  const intake = createComplaintIntake(base());
  assert.equal(intake.company_id, 'co-1');
  assert.equal(intake.customer_id, 'cust-1');
  assert.equal(intake.job_id, 'job-1');
  assert.equal(intake.location_id, 'loc-1');
  assert.equal(intake.invoice_id, 'inv-1');
  assert.equal(intake.conversation_id, 'conv-1');
  assert.deepEqual(intake.evidence_refs, ['msg-ref-1', 'photo-ref-1']);
  assert.equal(intake.evidence[0].immutable, true);
  assert.equal(intake.authority_granted, false);
  assert.equal(intake.execution_permitted, false);
});

test('converts complaint intake into existing Customer Care case contract without inventing authority', () => {
  const customerCase = buildCustomerCareCaseFromComplaintIntake(createComplaintIntake(base()));
  assert.equal(customerCase.schema, 'titan.workforce.customer-care.case.v1');
  assert.equal(customerCase.state, 'OPEN');
  assert.equal(customerCase.customer_id, 'cust-1');
  assert.equal(customerCase.invoice_id, 'inv-1');
  assert.deepEqual(customerCase.evidence_refs, ['msg-ref-1', 'photo-ref-1']);
  assert.equal(customerCase.execution_permitted, false);
});

test('rejects unverified complaint events', () => {
  assert.throws(() => createComplaintIntake(base({ source_event_verified: false })), /unverified complaint source event/);
});

test('rejects unsupported source events', () => {
  assert.throws(() => createComplaintIntake(base({ source_event_type: 'job.completed' })), /unsupported Customer Care complaint intake event/);
});

test('fails closed when conversation evidence is missing', () => {
  assert.throws(() => createComplaintIntake(base({ evidence: [] })), /at least one evidence reference/);
});

test('rejects cross-company linked source records', () => {
  const input = base();
  input.linked_records.invoice = { company_id: 'co-2', invoice_id: 'inv-1' };
  assert.throws(() => createComplaintIntake(input), /cross-company invoice link rejected/);
});

test('rejects mismatched linked job identity', () => {
  const input = base();
  input.linked_records.job = { company_id: 'co-1', job_id: 'job-other' };
  assert.throws(() => createComplaintIntake(input), /job link id mismatch rejected/);
});

test('deduplicates exact evidence descriptors without mutating source truth', () => {
  const duplicate = { ref_id: 'msg-ref-1', kind: 'conversation_message', channel: 'sms', message_id: 'm-1', content_hash: 'sha256:abc' };
  const intake = createComplaintIntake(base({ evidence: [duplicate, duplicate, 'other-ref'] }));
  assert.equal(intake.evidence.length, 2);
  assert.deepEqual(intake.evidence_refs, ['msg-ref-1', 'other-ref']);
});

test('dedupe key is company scoped and ledger returns original intake for duplicate source event', () => {
  const first = createComplaintIntake(base());
  const second = createComplaintIntake(base({ evidence: ['later-ref'] }));
  const ledger = new MemoryComplaintIntakeLedger();
  assert.equal(buildComplaintIntakeDedupeKey(first), first.dedupe_key);
  assert.equal(ledger.record(first).duplicate, false);
  const duplicate = ledger.record(second);
  assert.equal(duplicate.duplicate, true);
  assert.equal(duplicate.intake.evidence_refs[0], 'msg-ref-1');
  assert.notEqual(first.dedupe_key, buildComplaintIntakeDedupeKey({ company_id: 'co-2', source_event_id: first.source_event_id }));
});

test('rejects authority-bearing intake when building Customer Care case', () => {
  const intake = { ...createComplaintIntake(base()), execution_permitted: true };
  assert.throws(() => buildCustomerCareCaseFromComplaintIntake(intake), /authority-bearing complaint intake rejected/);
});
