import assert from 'node:assert/strict';
import test from 'node:test';
import { auditInvoicingAuthority, INVOICING_AUTHORITY_AUDIT_SCHEMA } from '../titan-workforce/starter-agents/invoicing/invoicing-authority-audit.mjs';

test('requires company_id and never grants authority', () => {
  assert.throws(() => auditInvoicingAuthority(), /company_id is required/);
  const audit = auditInvoicingAuthority({company_id: 'co-a'});
  assert.equal(audit.schema, INVOICING_AUTHORITY_AUDIT_SCHEMA);
  assert.equal(audit.company_id, 'co-a');
  assert.equal(audit.authority.company_boundary, 'company_id');
  assert.equal(audit.authority.identity_grants_authority, false);
  assert.equal(audit.authority.authority_granted, false);
  assert.equal(audit.authority.execution_permitted, false);
  assert.equal(audit.authority.grants_authority, false);
});

test('reports canonical Titan invoice/payment/job ownership without creating parallel authority', () => {
  const audit = auditInvoicingAuthority({company_id: 'co-a'});
  assert.equal(audit.canonical.invoice_owner, 'Titan CRM revenue document authority');
  assert.match(audit.canonical.payment_owner, /Titan CRM receivable\/payment lifecycle/);
  assert.equal(audit.canonical.jobs_owner, 'Titan Field');
  assert.equal(audit.canonical.invoice_create_capability, 'crm.invoice.create');
  assert.equal(audit.canonical.payment_reconcile_capability, 'finance.payment.reconcile');
  assert.equal(audit.findings.canonical_invoice_owner_is_external_to_worker, true);
  assert.equal(audit.findings.canonical_payment_owner_is_external_to_worker, true);
});

test('blocks the audit readiness signal when invoice evidence is incomplete', () => {
  const audit = auditInvoicingAuthority({company_id: 'co-a', evidence: {job_completion: true, accepted_quote_or_terms: true}});
  assert.equal(audit.readiness, 'blocked_missing_evidence');
  assert.ok(audit.missing_evidence.includes('actual_time'));
  assert.ok(audit.missing_evidence.includes('actual_materials'));
  assert.ok(audit.missing_evidence.includes('tax_basis'));
  assert.ok(audit.missing_evidence.includes('invoice_provider'));
  assert.ok(audit.missing_evidence.includes('payment_provider'));
});

test('complete evidence remains authority-neutral and does not claim deterministic money support yet', () => {
  const evidence = Object.fromEntries(['job_completion','accepted_quote_or_terms','actual_time','actual_materials','tax_basis','invoice_provider','payment_provider'].map(k => [k, true]));
  const audit = auditInvoicingAuthority({company_id: 'co-a', evidence, connectors: {accounting: true, payment: true, messaging: true}});
  assert.equal(audit.readiness, 'evidence_complete_for_later_readiness_evaluation');
  assert.deepEqual(audit.missing_evidence, []);
  assert.equal(audit.findings.deterministic_exact_money_contract_verified, false);
  assert.equal(audit.authority.execution_permitted, false);
});

test('company isolation is explicit in independent audit envelopes', () => {
  const a = auditInvoicingAuthority({company_id: 'co-a'});
  const b = auditInvoicingAuthority({company_id: 'co-b'});
  assert.notEqual(a.company_id, b.company_id);
  assert.deepEqual(a.missing_evidence, b.missing_evidence);
});
