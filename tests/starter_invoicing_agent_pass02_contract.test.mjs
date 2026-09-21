import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createInvoicingContract,
  evaluateInvoicingTransition,
  INVOICING_LIFECYCLE_STATES,
  INVOICING_EXCEPTION_CODES
} from '../titan-workforce/starter-agents/invoicing/invoicing-contract.mjs';

const complete = () => ({
  company_id: 'company-a',
  job_ref: 'job-1',
  customer_ref: 'customer-1',
  evidence: {
    job_completion_ref: 'completion-1',
    accepted_terms_ref: 'quote-accepted-1',
    actual_time_ref: 'time-1',
    actual_materials_ref: 'materials-1',
    tax_basis_ref: 'tax-1'
  },
  calculation_basis: {
    currency: 'aud',
    pricing_source_refs: ['pricebook-1'],
    quote_or_contract_ref: 'quote-1',
    actuals_ref: 'actuals-1',
    tax_basis_ref: 'tax-1',
    exact_money_certified: false
  }
});

test('requires company_id and preserves company-only boundary', () => {
  assert.throws(() => createInvoicingContract({}), /company_id/);
  const contract = createInvoicingContract(complete());
  assert.equal(contract.company_id, 'company-a');
  assert.equal(contract.authority.company_boundary, 'company_id');
});

test('defines draft/review/send/payment lifecycle without granting authority', () => {
  const contract = createInvoicingContract(complete());
  for (const state of ['draft', 'review_pending', 'approved', 'issued', 'partially_paid', 'paid', 'overdue', 'exception', 'voided']) {
    assert.ok(INVOICING_LIFECYCLE_STATES.includes(state));
  }
  assert.equal(contract.lifecycle.worker_may_mutate_canonical_financial_state, false);
  assert.equal(contract.authority.identity_grants_authority, false);
  assert.equal(contract.authority.execution_permitted, false);
});

test('blocks draft readiness when invoice evidence is missing', () => {
  const input = complete();
  input.evidence.actual_materials_ref = null;
  const contract = createInvoicingContract(input);
  assert.equal(contract.readiness, 'blocked');
  assert.ok(contract.blockers.includes('missing_evidence:actual_materials_ref'));
});

test('blocks readiness when calculation provenance is incomplete', () => {
  const input = complete();
  input.calculation_basis.pricing_source_refs = [];
  const contract = createInvoicingContract(input);
  assert.equal(contract.readiness, 'blocked');
  assert.ok(contract.blockers.includes('calculation_basis_incomplete'));
});

test('cross-company transition attempts fail closed', () => {
  const contract = createInvoicingContract(complete());
  const result = evaluateInvoicingTransition(contract, 'issued', { company_id: 'company-b', authority: true, external_reference: 'provider-1' });
  assert.deepEqual(result, {
    allowed: false,
    reason: 'company_boundary_mismatch',
    authority_required: false,
    execution_permitted: false
  });
});

test('protected financial states require existing Titan authority and still do not execute', () => {
  const contract = createInvoicingContract(complete());
  const denied = evaluateInvoicingTransition(contract, 'issued', { company_id: 'company-a' });
  assert.equal(denied.allowed, false);
  assert.equal(denied.reason, 'existing_titan_authority_required');

  const eligible = evaluateInvoicingTransition(contract, 'issued', { company_id: 'company-a', authority: true, external_reference: 'invoice-provider-123' });
  assert.equal(eligible.allowed, true);
  assert.equal(eligible.execution_permitted, false);
  assert.equal(eligible.proposed_state, 'issued');
});

test('issued transition requires an idempotency/external provider reference', () => {
  const contract = createInvoicingContract(complete());
  const result = evaluateInvoicingTransition(contract, 'issued', { company_id: 'company-a', authority: true });
  assert.equal(result.allowed, false);
  assert.equal(result.reason, 'external_reference_required');
});

test('exception path is structured, recoverable and blocking', () => {
  assert.ok(INVOICING_EXCEPTION_CODES.includes('provider_unavailable'));
  const contract = createInvoicingContract({
    ...complete(),
    lifecycle_state: 'exception',
    exception: { code: 'provider_unavailable', detail: 'accounting connector offline', recoverable: true }
  });
  assert.equal(contract.exception.code, 'provider_unavailable');
  assert.equal(contract.exception.recoverable, true);
  assert.ok(contract.blockers.includes('exception:provider_unavailable'));
});

test('exact-money certification is represented but not falsely asserted in Pass 2', () => {
  const contract = createInvoicingContract(complete());
  assert.equal(contract.calculation_basis.exact_money_certified, false);
});
