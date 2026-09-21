import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateExactInvoice, exactMoneyToCalculationBasis } from '../titan-workforce/starter-agents/invoicing/exact-money.mjs';

const input = () => ({
  company_id:'co-1', currency:'aud',
  line_items:[
    {company_id:'co-1',line_ref:'labour-1',pricing_source_ref:'pricebook-labour',quantity:'2',unit_amount_minor:'12500'},
    {company_id:'co-1',line_ref:'materials-1',pricing_source_ref:'materials-actual',quantity:'3',unit_amount_minor:'1999',discount:{rate_bps:'1000',basis_ref:'discount-approved-1'}}
  ],
  invoice_discount:{amount_minor:'500',basis_ref:'contract-discount-1'},
  tax:{mode:'exclusive',rate_bps:'1000'},
  provenance:{pricing_source_refs:['pricebook-labour','materials-actual'],tax_basis_ref:'gst-rule-1',quote_or_contract_ref:'quote-1',actuals_ref:'actuals-1'}
});

test('calculates deterministic minor-unit totals with no binary floats',()=>{
  const r=calculateExactInvoice(input());
  assert.equal(r.arithmetic.binary_float_used,false);
  assert.equal(r.totals.subtotal_after_line_discounts_minor,'30397');
  assert.equal(r.totals.invoice_discount_minor,'500');
  assert.equal(r.totals.taxable_base_minor,'29897');
  assert.equal(r.totals.tax_minor,'2990');
  assert.equal(r.totals.total_minor,'32887');
});

test('basis-point discounts and tax use explicit half-up rounding',()=>{
  const i=input(); i.line_items=[{line_ref:'x',pricing_source_ref:'p',quantity:'1',unit_amount_minor:'5',discount:{rate_bps:'1000',basis_ref:'d'}}]; i.invoice_discount=null; i.tax={mode:'exclusive',rate_bps:'1000'}; i.provenance.pricing_source_refs=['p'];
  const r=calculateExactInvoice(i);
  assert.equal(r.line_items[0].discount_minor,'1');
  assert.equal(r.totals.tax_minor,'0');
  assert.equal(r.totals.total_minor,'4');
});

test('rejects floating-point monetary inputs',()=>{
  const i=input(); i.line_items[0].unit_amount_minor=12.5;
  assert.throws(()=>calculateExactInvoice(i),/safe integer/);
});

test('rejects cross-company line items',()=>{
  const i=input(); i.line_items[0].company_id='co-2';
  assert.throws(()=>calculateExactInvoice(i),/company_boundary_mismatch/);
});

test('requires pricing and tax provenance',()=>{
  const i=input(); i.provenance.pricing_source_refs=[];
  assert.throws(()=>calculateExactInvoice(i),/pricing_source_refs/);
  const j=input(); j.provenance.tax_basis_ref=null;
  assert.throws(()=>calculateExactInvoice(j),/tax_basis_ref/);
});

test('rejects duplicate line references to prevent duplicate billing',()=>{
  const i=input(); i.line_items.push({...i.line_items[0]});
  assert.throws(()=>calculateExactInvoice(i),/duplicate_line_ref/);
});

test('discount requires approval provenance and cannot exceed base',()=>{
  const i=input(); delete i.line_items[1].discount.basis_ref;
  assert.throws(()=>calculateExactInvoice(i),/basis_ref/);
  const j=input(); j.invoice_discount={amount_minor:'999999',basis_ref:'d'};
  assert.throws(()=>calculateExactInvoice(j),/cannot exceed/);
});

test('supports zero and exempt tax without inventing a rate',()=>{
  for (const mode of ['zero','exempt']) { const i=input(); i.tax={mode}; const r=calculateExactInvoice(i); assert.equal(r.totals.tax_minor,'0'); assert.equal(r.tax.rate_bps,'0'); }
});

test('certified result maps into Pass2 calculation basis with reconciliation proof',()=>{
  const basis=exactMoneyToCalculationBasis(calculateExactInvoice(input()));
  assert.equal(basis.exact_money_certified,true); assert.equal(basis.calculation_engine_ref,'titan-invoicing-exact-money-v1'); assert.equal(basis.reconciliation.line_sum_matches_subtotal,true);
});

test('calculation never grants financial execution authority',()=>{
  const r=calculateExactInvoice(input());
  assert.equal(r.authority.execution_permitted,false); assert.equal(r.authority.grants_authority,false); assert.equal(r.authority.canonical_mutation_permitted,false);
});
