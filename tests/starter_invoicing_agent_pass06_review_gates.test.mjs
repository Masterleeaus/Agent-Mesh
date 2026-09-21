import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateExactInvoice } from '../titan-workforce/starter-agents/invoicing/exact-money.mjs';
import { evaluateInvoiceReviewGate, applyInvoiceReviewDecision, reviewGateToContractReview } from '../titan-workforce/starter-agents/invoicing/invoice-review-gates.mjs';

const exact = (overrides={}) => calculateExactInvoice({
  company_id:'co-1', currency:'AUD',
  line_items:[{company_id:'co-1',line_ref:'labour',pricing_source_ref:'price-labour',quantity:'1',unit_amount_minor:'10000',discount:overrides.line_discount || {}}],
  invoice_discount: overrides.invoice_discount || null,
  tax: overrides.tax || {mode:'exclusive',rate_bps:'1000'},
  provenance:{pricing_source_refs:['price-labour'],tax_basis_ref:'gst-rule',quote_or_contract_ref:'quote-1',actuals_ref:'actuals-1'}
});

const base = () => ({company_id:'co-1', exact_money_result:exact(), policy:{high_value_threshold_minor:'20000',quote_variance_review_bps:'1000',allowed_tax_modes:['exclusive','zero','exempt'],allowed_tax_rate_bps:['1000']}});

test('no-risk invoice needs no review and still grants no authority',()=>{ const g=evaluateInvoiceReviewGate(base()); assert.equal(g.review_required,false); assert.equal(g.review.state,'not_required'); assert.equal(g.authority.execution_permitted,false); });

test('high-value invoices require scoped review',()=>{ const i=base(); i.policy.high_value_threshold_minor='10000'; const g=evaluateInvoiceReviewGate(i); assert.equal(g.review_required,true); assert.ok(g.review.reasons.includes('high_value_invoice')); assert.ok(g.review.required_approval_scopes.includes('high_value_invoice')); });

test('quote variance is computed with integer basis points and triggers beyond threshold',()=>{ const i=base(); i.quoted_total_minor='9000'; const g=evaluateInvoiceReviewGate(i); assert.equal(g.review_required,true); assert.ok(BigInt(g.details.quote_variance_bps)>1000n); assert.ok(g.review.reasons.includes('quote_variance_exceeds_threshold')); });

test('manual discounts require review when signalled and preserve discount provenance',()=>{ const i=base(); i.exact_money_result=exact({line_discount:{amount_minor:'500',basis_ref:'discount-approved'}}); i.signals={manual_discount:true}; const g=evaluateInvoiceReviewGate(i); assert.ok(g.review.reasons.includes('manual_or_policy_discount_review')); assert.deepEqual(g.details.discount_basis_refs,['discount-approved']); });

test('credit requests require review and exact integer credit amount',()=>{ const i=base(); i.signals={credit_requested:true,credit_minor:'250'}; const g=evaluateInvoiceReviewGate(i); assert.equal(g.details.credit_minor,'250'); assert.ok(g.review.required_approval_scopes.includes('credit_or_adjustment')); });

test('unusual tax or override requires review',()=>{ const i=base(); i.signals={tax_override:true}; const g=evaluateInvoiceReviewGate(i); assert.ok(g.review.reasons.includes('unusual_or_overridden_tax')); assert.equal(g.details.tax.tax_basis_ref,'gst-rule'); });

test('incomplete readiness evidence cannot bypass reviewer gate',()=>{ const i=base(); i.readiness={company_id:'co-1',ready:false,blockers:['actual_materials_ref_missing']}; const g=evaluateInvoiceReviewGate(i); assert.ok(g.review.reasons.includes('incomplete_invoice_evidence')); assert.deepEqual(g.details.readiness_blockers,['actual_materials_ref_missing']); });

test('post-calculation edits require immutable edit reference',()=>{ const i=base(); i.signals={post_calculation_edit:true}; assert.throws(()=>evaluateInvoiceReviewGate(i),/edit_ref/); i.signals.edit_ref='edit-42'; const g=evaluateInvoiceReviewGate(i); assert.equal(g.details.edit_ref,'edit-42'); assert.ok(g.review.reasons.includes('post_calculation_edit_requires_review')); });

test('cross-company gate and readiness both fail closed',()=>{ const i=base(); i.company_id='co-2'; assert.throws(()=>evaluateInvoiceReviewGate(i),/company_boundary_mismatch/); const j=base(); j.readiness={company_id:'co-2',ready:true}; assert.throws(()=>evaluateInvoiceReviewGate(j),/company_boundary_mismatch/); });

test('review decisions require external references but never grant execution authority',()=>{ const i=base(); i.policy.high_value_threshold_minor='10000'; const g=evaluateInvoiceReviewGate(i); assert.throws(()=>applyInvoiceReviewDecision(g,{company_id:'co-1',decision:'approved'}),/reviewer_ref/); const d=applyInvoiceReviewDecision(g,{company_id:'co-1',decision:'approved',reviewer_ref:'user-7',decision_ref:'approval-9',reason:'manager approved'}); assert.equal(d.review.state,'approved'); assert.equal(d.authority.authority_granted,false); assert.equal(d.authority.execution_permitted,false); assert.deepEqual(reviewGateToContractReview(d),{state:'approved',reviewer_ref:'user-7',reason:'manager approved'}); });
