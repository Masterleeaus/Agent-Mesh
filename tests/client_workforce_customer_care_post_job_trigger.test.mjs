import assert from 'node:assert/strict';
import test from 'node:test';
import {
  MemoryCustomerCareTriggerLedger,
  POST_JOB_SATISFACTION_TRIGGER_CONTRACT,
  buildPostJobSatisfactionDedupeKey,
  evaluatePostJobSatisfactionTrigger
} from '../titan-workforce/customer-care/post-job-satisfaction-trigger.mjs';

function event(type = 'job.completed', overrides = {}) {
  const owner = type === 'invoice.issued' ? 'Titan CRM' : 'Titan Field';
  return {
    type,
    event_id: `${type}-evt-1`,
    source_record: {
      verified: true,
      owner,
      company_id: 'co-1',
      job_id: 'job-1',
      ...(type === 'invoice.issued' ? { invoice_id: 'inv-1' } : {}),
      ...overrides
    }
  };
}

function input(overrides = {}) {
  return {
    company_id: 'co-1',
    customer_id: 'cust-1',
    job_id: 'job-1',
    source_event: event(),
    contact_preferences: { status: 'GRANTED', allowed_channels: ['sms', 'email'] },
    channel: 'sms',
    customer_local_hour: 14,
    quiet_hours: { enabled: true, start_hour: 21, end_hour: 8 },
    ...overrides
  };
}

test('Pass 3 trigger is company-scoped, proposal-only, and accepts only verified completion/invoice events', () => {
  assert.equal(POST_JOB_SATISFACTION_TRIGGER_CONTRACT.company_boundary, 'company_id');
  assert.equal(POST_JOB_SATISFACTION_TRIGGER_CONTRACT.output_is_proposal_only, true);
  const result = evaluatePostJobSatisfactionTrigger(input(), { ledger: new MemoryCustomerCareTriggerLedger() });
  assert.equal(result.status, 'PROPOSE_OUTREACH');
  assert.equal(result.eligible, true);
  assert.equal(result.authority_granted, false);
  assert.equal(result.execution_permitted, false);
});

test('unverified, wrong-owner, mismatched-job, and cross-company source records fail closed', () => {
  const ledger = new MemoryCustomerCareTriggerLedger();
  assert.equal(evaluatePostJobSatisfactionTrigger(input({ source_event: event('job.completed', { verified: false }) }), { ledger }).reason, 'unverified_source_record');
  assert.equal(evaluatePostJobSatisfactionTrigger(input({ source_event: event('job.completed', { owner: 'Titan CRM' }) }), { ledger }).reason, 'wrong_source_owner');
  assert.equal(evaluatePostJobSatisfactionTrigger(input({ source_event: event('job.completed', { job_id: 'job-other' }) }), { ledger }).reason, 'job_source_mismatch');
  assert.equal(evaluatePostJobSatisfactionTrigger(input({ source_event: event('job.completed', { company_id: 'co-2' }) }), { ledger }).reason, 'cross_company_source_record');
});

test('invoice-issued source requires verified Titan CRM invoice evidence', () => {
  const ledger = new MemoryCustomerCareTriggerLedger();
  const ok = evaluatePostJobSatisfactionTrigger(input({ source_event: event('invoice.issued') }), { ledger });
  assert.equal(ok.status, 'PROPOSE_OUTREACH');
  const bad = input({ customer_id: 'cust-2', job_id: 'job-2', source_event: event('invoice.issued', { job_id: 'job-2', invoice_id: '' }) });
  assert.throws(() => evaluatePostJobSatisfactionTrigger(bad, { ledger: new MemoryCustomerCareTriggerLedger() }), /invoice_id is required/);
});

test('consent and allowed channel are mandatory', () => {
  const noConsent = evaluatePostJobSatisfactionTrigger(input({ contact_preferences: { status: 'REVOKED', allowed_channels: ['sms'] } }), { ledger: new MemoryCustomerCareTriggerLedger() });
  assert.equal(noConsent.reason, 'customer_contact_consent_missing');
  const wrongChannel = evaluatePostJobSatisfactionTrigger(input({ channel: 'whatsapp' }), { ledger: new MemoryCustomerCareTriggerLedger() });
  assert.equal(wrongChannel.reason, 'channel_not_consented');
});

test('quiet hours defer outreach without consuming duplicate key', () => {
  const ledger = new MemoryCustomerCareTriggerLedger();
  const deferred = evaluatePostJobSatisfactionTrigger(input({ customer_local_hour: 23 }), { ledger });
  assert.equal(deferred.status, 'DEFERRED_QUIET_HOURS');
  assert.equal(deferred.next_local_hour, 8);
  assert.equal(ledger.size(), 0);
  const later = evaluatePostJobSatisfactionTrigger(input({ customer_local_hour: 9 }), { ledger });
  assert.equal(later.status, 'PROPOSE_OUTREACH');
  assert.equal(ledger.size(), 1);
});

test('duplicate suppression spans completion and invoice events for the same company/customer/job purpose', () => {
  const ledger = new MemoryCustomerCareTriggerLedger();
  const first = evaluatePostJobSatisfactionTrigger(input(), { ledger });
  assert.equal(first.status, 'PROPOSE_OUTREACH');
  const second = evaluatePostJobSatisfactionTrigger(input({ source_event: event('invoice.issued') }), { ledger });
  assert.equal(second.status, 'SUPPRESSED_DUPLICATE');
  assert.equal(ledger.size(), 1);
});

test('dedupe key is company-isolated and missing company_id fails closed', () => {
  assert.equal(buildPostJobSatisfactionDedupeKey({ company_id: 'co-1', customer_id: 'cust-1', job_id: 'job-1' }), 'co-1:cust-1:job-1:post_job_satisfaction');
  assert.notEqual(buildPostJobSatisfactionDedupeKey({ company_id: 'co-2', customer_id: 'cust-1', job_id: 'job-1' }), buildPostJobSatisfactionDedupeKey({ company_id: 'co-1', customer_id: 'cust-1', job_id: 'job-1' }));
  assert.throws(() => evaluatePostJobSatisfactionTrigger({ ...input(), company_id: '' }, { ledger: new MemoryCustomerCareTriggerLedger() }), /company_id is required/);
});
