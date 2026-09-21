import test from 'node:test';
import assert from 'node:assert/strict';
import { buildInvoiceIssueSendProposal, evaluateInvoiceIssueSendDispatch, recordInvoiceIssueSendReceipt } from '../titan-workforce/starter-agents/invoicing/invoice-issue-send.mjs';

const company_id = 'co-1';
const readiness = { schema:'titan.workforce.starter.invoicing.readiness.v1', company_id, ready:true };
const exact_money = { schema:'titan.workforce.starter.invoicing.exact-money.v1', company_id, exact_money_certified:true, calculation_engine_ref:'calc-1', currency:'AUD', totals:{total_minor:'11000'} };
const review_gate = { schema:'titan.workforce.starter.invoicing.review-gates.v1', company_id, review:{state:'approved', decision_ref:'approval-1'} };
const contract = { schema:'titan.workforce.starter.invoicing.contract.v1', company_id, invoice_ref:'inv-1', blockers:[] };
const tools = {
  invoice:{capability:'crm.invoice.create', provider_ref:'Titan CRM', verified:true, command_bus_required:true},
  send:{capability:'crm.invoice.send', provider_ref:'Titan CRM / Titan Connect', verified:true, command_bus_required:true}
};
function proposal(extra={}) { return buildInvoiceIssueSendProposal({company_id, contract, readiness, exact_money, review_gate, canonical_invoice:{invoice_ref:'inv-1',company_id}, delivery:{recipient_ref:'customer-email-ref-1', channel:'email', attachment_ref:'invoice-pdf-ref-1'}, tools, ...extra}); }

test('creates deterministic issue/send identity without execution authority', () => {
  const a=proposal(), b=proposal();
  assert.equal(a.identity.content_hash,b.identity.content_hash);
  assert.equal(a.identity.operation_id,b.identity.operation_id);
  assert.equal(a.identity.idempotency_key,b.identity.idempotency_key);
  assert.equal(a.authority.execution_permitted,false);
  assert.equal(a.authority.direct_provider_send_permitted,false);
  assert.equal(a.dispatch.command_bus_dispatch_eligible,false);
});
test('content-changing recipient changes operation identity', () => {
  const a=proposal(); const b=proposal({delivery:{recipient_ref:'customer-email-ref-2',channel:'email',attachment_ref:'invoice-pdf-ref-1'}});
  assert.notEqual(a.identity.content_hash,b.identity.content_hash);
});
test('unverified financial tool fails closed', () => {
  assert.throws(()=>proposal({tools:{...tools,invoice:{...tools.invoice,verified:false}}}),/invoice_tool_not_verified/);
});
test('unverified messaging tool fails closed', () => {
  assert.throws(()=>proposal({tools:{...tools,send:{...tools.send,verified:false}}}),/send_tool_not_verified/);
});
test('review must be cleared before proposal', () => {
  assert.throws(()=>proposal({review_gate:{...review_gate,review:{state:'pending'}}}),/invoice_review_not_cleared/);
});
test('cross-company canonical invoice fails closed', () => {
  assert.throws(()=>proposal({canonical_invoice:{invoice_ref:'inv-1',company_id:'co-2'}}),/company_boundary_mismatch/);
});
test('dispatch requires verified external authority receipt', () => {
  const p=proposal(); const d=evaluateInvoiceIssueSendDispatch(p,{company_id});
  assert.equal(d.allowed,false); assert.equal(d.reason,'verified_authority_receipt_required'); assert.equal(d.execution_permitted,false);
});
test('verified authority permits command-bus eligibility but not worker execution', () => {
  const p=proposal(); const d=evaluateInvoiceIssueSendDispatch(p,{company_id,authority_receipt:{company_id,verified:true,status:'approved',receipt_ref:'auth-1'}});
  assert.equal(d.allowed,true); assert.equal(d.command_bus_dispatch_eligible,true); assert.equal(d.execution_permitted,false);
});
test('existing successful same operation prevents duplicate send', () => {
  const p=proposal(); const d=evaluateInvoiceIssueSendDispatch(p,{company_id,authority_receipt:{company_id,verified:true,status:'approved',receipt_ref:'auth-1'},existing_receipts:[{company_id,operation_id:p.identity.operation_id,status:'sent',receipt_ref:'send-1'}]});
  assert.equal(d.allowed,false); assert.equal(d.reason,'duplicate_send_prevented');
});
test('provider receipt must match operation identities exactly', () => {
  const p=proposal();
  const r=recordInvoiceIssueSendReceipt(p,{company_id,operation_id:p.identity.operation_id,idempotency_key:p.identity.idempotency_key,external_reference_key:p.identity.external_reference_key,status:'sent',receipt_ref:'receipt-1',provider_ref:'Titan Connect',provider_message_ref:'msg-1'});
  assert.equal(r.status,'sent'); assert.equal(r.canonical_invoice_mutated_by_worker,false); assert.equal(r.authority.execution_permitted,false);
  assert.throws(()=>recordInvoiceIssueSendReceipt(p,{company_id,operation_id:'wrong',idempotency_key:p.identity.idempotency_key,external_reference_key:p.identity.external_reference_key,status:'sent',receipt_ref:'r',provider_ref:'p'}),/receipt_operation_id_mismatch/);
});
