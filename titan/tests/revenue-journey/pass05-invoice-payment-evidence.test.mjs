import test from 'node:test';
import assert from 'node:assert/strict';
import { buildRevenueJourneyCorrelation } from '../../packages/.tmp-revenue-journey-build/revenue-journey-correlation.js';
import { buildInvoicePaymentJourneyEvidence, assertInvoicePaymentEvidenceReplay } from '../../packages/.tmp-revenue-journey-build/invoice-payment-evidence.js';

const correlation = buildRevenueJourneyCorrelation({
  company_id: 'c1', correlation_id: 'corr-1', lead_id: 'lead-1', opportunity_id: 'opp-1', quote_id: 'quote-1', booking_id: 'booking-1', job_id: 'job-1', provenance: { producer: 'test' },
});
const base = {
  company_id: 'c1', correlation, invoice_id: 'inv-1', invoice_state: 'issued', invoice_source_domain: 'crm.invoices', invoice_source_ref: 'invoice:inv-1',
  amount_total: 1000, amount_paid: 0, amount_refunded: 0,
  provenance: { producer: 'finance-sync', source_event_id: 'evt-1', observed_at: '2026-09-13T02:00:00Z' }, evidence: ['job:job-1'],
};

test('open invoice preserves job as upstream commercial origin and remains projection-only', () => {
  const x = buildInvoicePaymentJourneyEvidence(base);
  assert.equal(x.outcome, 'open');
  assert.deepEqual(x.upstream_origin, { stage: 'job', entity_id: 'job-1' });
  assert.equal(x.invoice.canonical_owner, 'Titan CRM revenue document authority');
  assert.equal(x.governance.may_move_money, false);
  assert.equal(x.governance.may_mutate_entities, false);
});

test('partial and overdue lifecycle outcomes derive only from canonical observations', () => {
  const partial = buildInvoicePaymentJourneyEvidence({ ...base, invoice_state: 'partially_paid', payment_id: 'pay-1', payment_state: 'partial', payment_source_domain: 'finance.payments', payment_source_ref: 'payment:pay-1', amount_paid: 400 });
  assert.equal(partial.outcome, 'partial');
  assert.equal(partial.amounts.outstanding, 600);
  const overdue = buildInvoicePaymentJourneyEvidence({ ...base, invoice_state: 'overdue' });
  assert.equal(overdue.outcome, 'overdue');
});

test('failed and refunded payments do not void invoice or execute money movement', () => {
  const failed = buildInvoicePaymentJourneyEvidence({ ...base, payment_id: 'pay-1', payment_state: 'failed', payment_source_domain: 'finance.payments', payment_source_ref: 'payment:pay-1' });
  assert.equal(failed.outcome, 'failed');
  assert.equal(failed.lifecycle_observation.semantics.failed_payment_does_not_void_invoice, true);
  const refunded = buildInvoicePaymentJourneyEvidence({ ...base, invoice_state: 'paid', payment_id: 'pay-1', payment_state: 'refunded', payment_source_domain: 'finance.payments', payment_source_ref: 'payment:pay-1', amount_paid: 1000, amount_refunded: 1000 });
  assert.equal(refunded.outcome, 'refunded');
  assert.equal(refunded.governance.may_refund, false);
});

test('reconciled requires settled payment plus explicit reconciliation evidence', () => {
  assert.throws(() => buildInvoicePaymentJourneyEvidence({ ...base, payment_id: 'pay-1', payment_state: 'settled', payment_source_domain: 'finance.payments', payment_source_ref: 'payment:pay-1', amount_paid: 1000, outcome: 'reconciled' }), /reconciliation-verification-required/);
  assert.throws(() => buildInvoicePaymentJourneyEvidence({ ...base, payment_id: 'pay-1', payment_state: 'failed', payment_source_domain: 'finance.payments', payment_source_ref: 'payment:pay-1', reconciliation_verified: true, reconciliation_evidence_ref: 'recon:1' }), /reconciliation-requires-settled-payment/);
  const x = buildInvoicePaymentJourneyEvidence({ ...base, invoice_state: 'paid', payment_id: 'pay-1', payment_state: 'settled', payment_source_domain: 'finance.payments', payment_source_ref: 'payment:pay-1', amount_paid: 1000, reconciliation_verified: true, reconciliation_evidence_ref: 'recon:1', outcome: 'reconciled' });
  assert.equal(x.outcome, 'reconciled');
  assert.equal(x.payment.reconciliation_verified, true);
  assert.equal(x.evidence_refs.includes('recon:1'), true);
});

test('wrong source domains, cross-company correlations and missing upstream origin fail closed', () => {
  assert.throws(() => buildInvoicePaymentJourneyEvidence({ ...base, invoice_source_domain: 'finance.payments' }), /invoice-source-domain-mismatch/);
  assert.throws(() => buildInvoicePaymentJourneyEvidence({ ...base, payment_id: 'pay-1', payment_state: 'partial', payment_source_domain: 'crm.invoices', payment_source_ref: 'payment:pay-1' }), /payment-source-domain-mismatch/);
  assert.throws(() => buildInvoicePaymentJourneyEvidence({ ...base, company_id: 'c2' }), /cross-company-correlation/);
  const noOrigin = buildRevenueJourneyCorrelation({ company_id: 'c1', correlation_id: 'corr-x', provenance: { producer: 'test' } });
  assert.throws(() => buildInvoicePaymentJourneyEvidence({ ...base, correlation: noOrigin }), /commercial-origin-required/);
});

test('same invoice/payment observation replays deterministically', () => {
  const input = { ...base, invoice_state: 'partially_paid', payment_id: 'pay-1', payment_state: 'partial', payment_source_domain: 'finance.payments', payment_source_ref: 'payment:pay-1', amount_paid: 250 };
  const a = buildInvoicePaymentJourneyEvidence(input);
  const b = buildInvoicePaymentJourneyEvidence(input);
  assert.equal(assertInvoicePaymentEvidenceReplay(a, b), true);
});
