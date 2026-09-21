import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CUSTOMER_CARE_TRIAGE_CONTRACT,
  triageCustomerCareCase
} from '../titan-workforce/customer-care/customer-care-triage.mjs';

function careCase(overrides = {}) {
  return {
    schema: 'titan.workforce.customer-care.case.v1',
    company_id: 'co-1',
    case_id: 'case-1',
    customer_id: 'cust-1',
    job_id: 'job-1',
    location_id: 'loc-1',
    invoice_id: 'inv-1',
    conversation_id: 'conv-1',
    state: 'OPEN',
    sentiment: 'NEGATIVE',
    issue_class: 'QUALITY',
    severity: 'LOW',
    evidence_refs: ['conv:msg-1'],
    authority_granted: false,
    execution_permitted: false,
    ...overrides
  };
}

const evidence = [{ company_id: 'co-1', ref: 'conv:msg-1', source_verified: true }];

test('contract is company scoped, deterministic and authority neutral', () => {
  assert.equal(CUSTOMER_CARE_TRIAGE_CONTRACT.company_boundary, 'company_id');
  assert.equal(CUSTOMER_CARE_TRIAGE_CONTRACT.deterministic_only, true);
  assert.equal(CUSTOMER_CARE_TRIAGE_CONTRACT.output_mode, 'TRIAGE_PROPOSAL_ONLY');
});

test('routine case becomes TRIAGED without escalation', () => {
  const result = triageCustomerCareCase(careCase(), { triage_evidence: evidence });
  assert.equal(result.category, 'STANDARD');
  assert.equal(result.severity, 'LOW');
  assert.equal(result.urgency, 'INFO');
  assert.equal(result.escalation_required, false);
  assert.equal(result.triaged_case.state, 'TRIAGED');
});

test('emergency signal is CRITICAL and routes to safety, governance and human review', () => {
  const result = triageCustomerCareCase(careCase(), {
    signals: { immediate_danger: true }, triage_evidence: evidence
  });
  assert.equal(result.category, 'EMERGENCY');
  assert.equal(result.severity, 'CRITICAL');
  assert.equal(result.urgency, 'CRITICAL');
  assert.equal(result.immediate_human_attention, true);
  assert.ok(result.routes.includes('safety'));
  assert.ok(result.routes.includes('governance'));
  assert.ok(result.routes.includes('human_reviewer'));
});

test('safety complaint is at least HIGH and mandatory governance escalation', () => {
  const result = triageCustomerCareCase(careCase({ issue_class: 'SAFETY' }), { triage_evidence: evidence });
  assert.equal(result.category, 'SAFETY');
  assert.equal(result.severity, 'HIGH');
  assert.equal(result.urgency, 'HIGH');
  assert.ok(result.routes.includes('safety'));
  assert.ok(result.routes.includes('governance'));
});

test('suspected privacy breach is HIGH and active exposure becomes CRITICAL', () => {
  let result = triageCustomerCareCase(careCase({ issue_class: 'PRIVACY' }), {
    signals: { suspected_privacy_breach: true }, triage_evidence: evidence
  });
  assert.equal(result.severity, 'HIGH');
  assert.ok(result.routes.includes('privacy'));
  result = triageCustomerCareCase(careCase({ issue_class: 'PRIVACY' }), {
    signals: { privacy_exposure_active: true }, triage_evidence: evidence
  });
  assert.equal(result.severity, 'CRITICAL');
  assert.equal(result.immediate_human_attention, true);
});

test('ordinary payment attention is MEDIUM and routes to finance plus human review', () => {
  const result = triageCustomerCareCase(careCase({ issue_class: 'BILLING' }), {
    signals: { payment_failed_or_overdue: true }, triage_evidence: evidence
  });
  assert.equal(result.category, 'PAYMENT');
  assert.equal(result.severity, 'MEDIUM');
  assert.equal(result.urgency, 'HIGH');
  assert.ok(result.routes.includes('finance'));
  assert.ok(result.routes.includes('human_reviewer'));
});

test('unauthorized payment or chargeback threat escalates HIGH and includes governance', () => {
  for (const signals of [{ unauthorized_payment: true }, { chargeback_threat: true }]) {
    const result = triageCustomerCareCase(careCase({ issue_class: 'BILLING' }), { signals, triage_evidence: evidence });
    assert.equal(result.severity, 'HIGH');
    assert.ok(result.routes.includes('finance'));
    assert.ok(result.routes.includes('governance'));
  }
});

test('property damage is HIGH and governed', () => {
  const result = triageCustomerCareCase(careCase({ issue_class: 'PROPERTY_DAMAGE' }), { triage_evidence: evidence });
  assert.equal(result.category, 'PROPERTY_DAMAGE');
  assert.equal(result.severity, 'HIGH');
  assert.ok(result.routes.includes('governance'));
});

test('cross-company or unverified triage evidence fails closed', () => {
  assert.throws(() => triageCustomerCareCase(careCase(), {
    triage_evidence: [{ company_id: 'co-2', ref: 'x', source_verified: true }]
  }), /cross-company triage evidence/);
  assert.throws(() => triageCustomerCareCase(careCase(), {
    triage_evidence: [{ company_id: 'co-1', ref: 'x', source_verified: false }]
  }), /unverified triage evidence/);
});

test('invalid lifecycle state cannot be silently triaged', () => {
  assert.throws(() => triageCustomerCareCase(careCase({ state: 'CLOSED' }), { triage_evidence: evidence }), /requires OPEN or TRIAGED/);
});

test('triage never grants authority or permits protected effects', () => {
  const result = triageCustomerCareCase(careCase({ issue_class: 'SAFETY' }), { triage_evidence: evidence });
  assert.equal(result.authority_granted, false);
  assert.equal(result.execution_permitted, false);
  assert.equal(result.grants_authority, false);
  assert.equal(result.protected_effects_remain_blocked, true);
  assert.equal(result.triaged_case.authority_granted, false);
});
