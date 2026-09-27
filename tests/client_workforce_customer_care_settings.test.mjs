import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CUSTOMER_CARE_SETTINGS_CONTRACT,
  normalizeCustomerCareSettings,
  isCustomerCareChannelAllowed,
  evaluateCustomerCareSettingsForCase
} from '../titan-workforce/customer-care/customer-care-settings.mjs';

const base = { company_id: 'co-1', settings: {} };

test('settings contract remains company scoped and authority neutral', () => {
  assert.equal(CUSTOMER_CARE_SETTINGS_CONTRACT.company_boundary, 'company_id');
  assert.equal(CUSTOMER_CARE_SETTINGS_CONTRACT.shared_settings_registry_modified, false);
  const policy = normalizeCustomerCareSettings(base);
  assert.equal(policy.authority_granted, false);
  assert.equal(policy.execution_permitted, false);
});

test('defaults are bounded and severity SLA tightens', () => {
  const policy = normalizeCustomerCareSettings(base);
  assert.equal(policy.tone, 'EMPATHETIC');
  assert.ok(policy.response_sla_minutes.CRITICAL <= policy.response_sla_minutes.HIGH);
  assert.ok(policy.response_sla_minutes.HIGH <= policy.response_sla_minutes.MEDIUM);
  assert.ok(policy.response_sla_minutes.MEDIUM <= policy.response_sla_minutes.LOW);
});

test('custom tone, channels, SLA and contacts normalize safely', () => {
  const policy = normalizeCustomerCareSettings({
    company_id: 'co-1',
    settings: {
      tone: 'warm',
      response_sla_minutes: { LOW: 1000, MEDIUM: 300, HIGH: 60, CRITICAL: 10 },
      allowed_channels: ['email', 'whatsapp'],
      escalation_contacts: [{ contact_id: 'mgr-1', company_id: 'co-1', roles: ['manager', 'privacy'] }]
    }
  });
  assert.equal(policy.tone, 'WARM');
  assert.deepEqual(policy.allowed_channels, ['EMAIL', 'WHATSAPP']);
  assert.equal(policy.escalation_contacts[0].roles.includes('PRIVACY'), true);
});

test('legacy company boundary aliases are rejected', () => {
  assert.throws(() => normalizeCustomerCareSettings({ company_id: 'co-1', tenant_company_id: 'co-1', settings: {} }), /legacy company boundary/);
  assert.throws(() => normalizeCustomerCareSettings({ company_id: 'co-1', settings: { companyId: 'co-1' } }), /legacy company boundary/);
});

test('cross-company escalation contacts are rejected', () => {
  assert.throws(() => normalizeCustomerCareSettings({ company_id: 'co-1', settings: { escalation_contacts: [{ contact_id: 'x', company_id: 'co-2', roles: ['MANAGER'] }] } }), /cross-company/);
});

test('mandatory safety privacy and property damage escalation cannot be disabled', () => {
  assert.throws(() => normalizeCustomerCareSettings({ company_id: 'co-1', settings: { complaint_thresholds: { mandatory_issue_classes: ['SAFETY'] } } }), /cannot be disabled/);
});

test('manager threshold cannot be looser than human threshold', () => {
  assert.throws(() => normalizeCustomerCareSettings({ company_id: 'co-1', settings: { complaint_thresholds: { human_review_severity: 'CRITICAL', manager_review_severity: 'HIGH' } } }), /manager review threshold/);
});

test('SLA ordering cannot become slower for more severe cases', () => {
  assert.throws(() => normalizeCustomerCareSettings({ company_id: 'co-1', settings: { response_sla_minutes: { LOW: 60, MEDIUM: 120, HIGH: 30, CRITICAL: 10 } } }), /SLA must tighten/);
});

test('remediation settings cannot grant protected execution authority', () => {
  const policy = normalizeCustomerCareSettings({ company_id: 'co-1', settings: { remediation: { mode: 'PROPOSE_ONLY', allowed_proposals: ['APOLOGY', 'REFUND_REVIEW'] } } });
  assert.deepEqual(policy.remediation.allowed_proposals, ['APOLOGY', 'REFUND_REVIEW']);
  assert.deepEqual(policy.remediation.never_executable_by_customer_care, ['REFUND', 'CREDIT', 'FREE_REWORK', 'LEGAL_ADMISSION', 'SAFETY_COMMITMENT']);
  assert.equal(policy.execution_permitted, false);
});

test('review satisfactory-outcome safeguard cannot be disabled', () => {
  assert.throws(() => normalizeCustomerCareSettings({ company_id: 'co-1', settings: { review_timing: { require_satisfactory_outcome: false } } }), /cannot be disabled/);
});

test('review timing must be ordered', () => {
  assert.throws(() => normalizeCustomerCareSettings({ company_id: 'co-1', settings: { review_timing: { minimum_delay_minutes: 1000, maximum_delay_minutes: 500 } } }), /maximum delay/);
});

test('channel gate respects normalized allowed channels', () => {
  const policy = normalizeCustomerCareSettings({ company_id: 'co-1', settings: { allowed_channels: ['SMS', 'IN_APP'] } });
  assert.equal(isCustomerCareChannelAllowed(policy, 'sms'), true);
  assert.equal(isCustomerCareChannelAllowed(policy, 'email'), false);
});

test('case evaluation applies company-scoped SLA and review thresholds', () => {
  const policy = normalizeCustomerCareSettings({ company_id: 'co-1', settings: { complaint_thresholds: { human_review_severity: 'MEDIUM', manager_review_severity: 'HIGH' } } });
  const result = evaluateCustomerCareSettingsForCase(policy, { company_id: 'co-1', case_id: 'case-1', severity: 'HIGH', issue_class: 'QUALITY' });
  assert.equal(result.response_sla_minutes, policy.response_sla_minutes.HIGH);
  assert.equal(result.human_review_required, true);
  assert.equal(result.manager_review_required, true);
  assert.equal(result.execution_permitted, false);
});

test('mandatory privacy issue escalates regardless of severity threshold', () => {
  const policy = normalizeCustomerCareSettings(base);
  const result = evaluateCustomerCareSettingsForCase(policy, { company_id: 'co-1', severity: 'LOW', issue_class: 'PRIVACY' });
  assert.equal(result.human_review_required, true);
  assert.equal(result.manager_review_required, true);
});

test('cross-company settings application fails closed', () => {
  const policy = normalizeCustomerCareSettings(base);
  assert.throws(() => evaluateCustomerCareSettingsForCase(policy, { company_id: 'co-2', severity: 'LOW', issue_class: 'QUALITY' }), /cross-company/);
});
