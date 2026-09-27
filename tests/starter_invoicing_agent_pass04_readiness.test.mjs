import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateInvoiceReadiness, readinessToContractInput } from '../titan-workforce/starter-agents/invoicing/invoice-readiness.mjs';
import { createInvoicingContract } from '../titan-workforce/starter-agents/invoicing/invoicing-contract.mjs';

const readyInput = () => ({
  company_id: 'co-1',
  job: { company_id: 'co-1', job_ref: 'job-1', status: 'completed', completion_ref: 'completion-1', request_invoice: true, evidence_attachment_refs: ['photo-1'] },
  commercial_terms: { company_id: 'co-1', accepted: true, accepted_terms_ref: 'terms-1', quote_or_contract_ref: 'quote-1', unapproved_variation_refs: [] },
  actuals: { company_id: 'co-1', actual_time_ref: 'time-1', actual_materials_ref: 'materials-zero-verified-1', actuals_ref: 'actuals-1' },
  evidence: { company_id: 'co-1', required: true, attachment_refs: ['photo-1'], unresolved_issue_refs: [] },
  tax: { company_id: 'co-1', tax_basis_ref: 'tax-rule-1' },
  pricing: { company_id: 'co-1', currency: 'aud', pricing_source_refs: ['pricebook-1'] },
  as_of: '2026-09-08T00:00:00+10:00'
});

test('complete verified billable job becomes ready without execution authority', () => {
  const r = evaluateInvoiceReadiness(readyInput());
  assert.equal(r.ready, true); assert.deepEqual(r.blockers, []);
  assert.equal(r.authority.execution_permitted, false); assert.equal(r.authority.grants_authority, false);
  assert.equal(r.calculation_basis.exact_money_certified, false);
});

test('job completion alone is insufficient without invoice/billable signal', () => {
  const i = readyInput(); i.job.request_invoice = false;
  const r = evaluateInvoiceReadiness(i);
  assert.equal(r.ready, false); assert.ok(r.blockers.includes('invoice_not_requested_or_billable'));
});

test('uncompleted or stale job fails closed', () => {
  const i = readyInput(); i.job.status = 'in_progress'; i.job.stale = true;
  const r = evaluateInvoiceReadiness(i);
  assert.ok(r.blockers.includes('job_not_completed')); assert.ok(r.blockers.includes('stale_job_state'));
});

test('accepted commercial terms are mandatory', () => {
  const i = readyInput(); i.commercial_terms.accepted = false; i.commercial_terms.status = 'draft';
  const r = evaluateInvoiceReadiness(i);
  assert.ok(r.blockers.includes('commercial_terms_not_accepted'));
});

test('actual time and actual materials references are mandatory, including explicit zero-material records', () => {
  const i = readyInput(); delete i.actuals.actual_time_ref; delete i.actuals.actual_materials_ref;
  const r = evaluateInvoiceReadiness(i);
  assert.ok(r.blockers.includes('actual_time_ref_missing')); assert.ok(r.blockers.includes('actual_materials_ref_missing'));
});

test('unapproved billable variation and unresolved evidence block invoicing', () => {
  const i = readyInput(); i.commercial_terms.unapproved_variation_refs = ['variation-9']; i.evidence.unresolved_issue_refs = ['damage-1'];
  const r = evaluateInvoiceReadiness(i);
  assert.ok(r.blockers.includes('unapproved_billable_variation')); assert.ok(r.blockers.includes('unresolved_job_evidence'));
});

test('tax and pricing provenance are required but no money is calculated', () => {
  const i = readyInput(); i.tax.tax_basis_ref = null; i.pricing.pricing_source_refs = [];
  const r = evaluateInvoiceReadiness(i);
  assert.ok(r.blockers.includes('tax_basis_ref_missing')); assert.ok(r.blockers.includes('pricing_source_ref_missing'));
  assert.equal('subtotal' in r.calculation_basis, false);
});

test('cross-company sources fail closed', () => {
  const i = readyInput(); i.actuals.company_id = 'co-2';
  const r = evaluateInvoiceReadiness(i);
  assert.deepEqual(r.blockers, ['company_boundary_mismatch']); assert.equal(r.ready, false);
});

test('ready result converts into existing Pass2 contract without creating financial authority', () => {
  const r = evaluateInvoiceReadiness(readyInput());
  const input = readinessToContractInput(r, { customer_ref: 'cust-1' });
  const c = createInvoicingContract(input);
  assert.equal(c.lifecycle.state, 'ready_for_draft');
  assert.equal(c.readiness, 'contract_ready_for_draft_evaluation');
  assert.equal(c.authority.execution_permitted, false);
});

test('blocked readiness cannot produce contract input', () => {
  const i = readyInput(); i.job.status = 'scheduled';
  assert.throws(() => readinessToContractInput(evaluateInvoiceReadiness(i)), /must be ready/);
});
