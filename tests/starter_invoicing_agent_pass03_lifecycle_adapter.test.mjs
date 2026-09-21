import test from 'node:test';
import assert from 'node:assert/strict';
import { projectCanonicalInvoiceLifecycle, lifecycleProjectionToContractPatch } from '../titan-workforce/starter-agents/invoicing/invoice-lifecycle-adapter.mjs';

const base = {
  company_id: 'co-1', invoice_ref: 'inv-9', status: 'sent', approval_status: 'approved',
  issued_date: '2026-08-01T00:00:00Z', due_date: '2026-08-31T00:00:00Z', currency: 'aud',
  total_ref: 'money:inv-9:total', amount_paid_ref: 'money:inv-9:paid', balance_due_ref: 'money:inv-9:balance'
};

test('maps donor-compatible sent semantics to Titan worker issued projection without authority', () => {
  const out = projectCanonicalInvoiceLifecycle({ company_id: 'co-1', canonical_invoice: base, as_of: '2026-08-15T00:00:00Z' });
  assert.equal(out.projection.lifecycle_state, 'issued');
  assert.equal(out.projection.review_state, 'approved');
  assert.equal(out.authority.execution_permitted, false);
  assert.equal(out.authority.canonical_mutation_permitted, false);
  assert.equal(out.financial_refs.exact_money_values_copied, false);
});

test('maps partial and paid lifecycle semantics', () => {
  const partial = projectCanonicalInvoiceLifecycle({ company_id: 'co-1', canonical_invoice: {...base, status: 'partial'}, as_of: '2026-08-15T00:00:00Z' });
  const paid = projectCanonicalInvoiceLifecycle({ company_id: 'co-1', canonical_invoice: {...base, status: 'paid'}, as_of: '2026-09-15T00:00:00Z' });
  assert.equal(partial.projection.lifecycle_state, 'partially_paid');
  assert.equal(paid.projection.lifecycle_state, 'paid');
});

test('infers overdue as a projection only and does not mutate canonical state', () => {
  const out = projectCanonicalInvoiceLifecycle({ company_id: 'co-1', canonical_invoice: base, as_of: '2026-09-15T00:00:00Z' });
  assert.equal(out.projection.lifecycle_state, 'overdue');
  assert.equal(out.projection.overdue_inferred_from_due_date, true);
  assert.equal(out.source.canonical_status, 'sent');
});

test('preserves void semantics and never marks paid/void invoices overdue', () => {
  const out = projectCanonicalInvoiceLifecycle({ company_id: 'co-1', canonical_invoice: {...base, status: 'void'}, as_of: '2026-09-15T00:00:00Z' });
  assert.equal(out.projection.lifecycle_state, 'voided');
  assert.equal(out.projection.overdue_inferred_from_due_date, false);
});

test('fails closed across company boundary', () => {
  const out = projectCanonicalInvoiceLifecycle({ company_id: 'co-2', canonical_invoice: base });
  assert.equal(out.accepted, false);
  assert.equal(out.reason, 'company_boundary_mismatch');
  assert.equal(out.authority.execution_permitted, false);
});

test('unknown canonical status becomes exception with blocker', () => {
  const out = projectCanonicalInvoiceLifecycle({ company_id: 'co-1', canonical_invoice: {...base, status: 'mystery'}, as_of: '2026-08-15T00:00:00Z' });
  assert.equal(out.projection.lifecycle_state, 'exception');
  assert.ok(out.blockers.includes('canonical_status_unmapped'));
});

test('unmapped approval status fails toward pending review', () => {
  const out = projectCanonicalInvoiceLifecycle({ company_id: 'co-1', canonical_invoice: {...base, approval_status: 'mystery'}, as_of: '2026-08-15T00:00:00Z' });
  assert.equal(out.projection.review_state, 'pending');
  assert.ok(out.blockers.includes('approval_status_unmapped'));
});

test('contract patch carries references and projection state but no execution authority', () => {
  const out = projectCanonicalInvoiceLifecycle({ company_id: 'co-1', canonical_invoice: base, as_of: '2026-08-15T00:00:00Z' });
  const patch = lifecycleProjectionToContractPatch(out);
  assert.equal(patch.company_id, 'co-1');
  assert.equal(patch.invoice_ref, 'inv-9');
  assert.equal(patch.lifecycle_state, 'issued');
  assert.equal(patch.authority.execution_permitted, false);
});
