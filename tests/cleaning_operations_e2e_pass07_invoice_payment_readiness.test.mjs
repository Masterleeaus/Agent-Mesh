import test from 'node:test';
import assert from 'node:assert/strict';
import {planCleaningJobCompletion,planCleaningInvoiceReadiness,CLEANING_INVOICE_READINESS_SCHEMA} from '../titan-business-services/runtime/customer-quote-flow.mjs';

const completion = planCleaningJobCompletion({
  company_id:'co-1',job_id:'job-1',correlation_id:'corr-1',
  job_receipt:{company_id:'co-1',authoritative:true,source_ref:'crm:job-1'},
  execution_context:{company_id:'co-1',checklist:[{company_id:'co-1',task_id:'c1',required:true,completed:true,source_ref:'ctx:c1'}],evidence_requirements:[
    {company_id:'co-1',requirement_id:'before',stage:'before',required:true,evidence_refs:['before-1'],source_ref:'ctx:e1'},
    {company_id:'co-1',requirement_id:'after',stage:'after',required:true,evidence_refs:['after-1'],source_ref:'ctx:e2'}]},
  field_context:{context:{tasks:[],checklist:[],equipment:[]}},exceptions:[],request_invoice:true
});
const invoiceContext={line_items:[{description:'Clean',amount:100}],subtotal:100,tax:10,total:110,due_date:'2026-09-16',payment_method:'payid',send_to_customer:true};

test('Pass 7 builds CRM invoice proposal from QA-ready completed cleaning job',()=>{
 const r=planCleaningInvoiceReadiness({company_id:'co-1',job_id:'job-1',customer_id:'cust-1',correlation_id:'corr-1',completion_plan:completion,invoice_context:invoiceContext});
 assert.equal(r.schema,CLEANING_INVOICE_READINESS_SCHEMA);assert.equal(r.state,'invoice_proposal_ready');assert.equal(r.invoice.capability,'crm.invoice.create');assert.equal(r.invoice.proposal_permitted,true);assert.equal(r.payment.ready,false);assert.equal(r.authority_neutral,true);
});

test('Pass 7 suppresses duplicate invoice proposals on authoritative duplicate evidence',()=>{
 const r=planCleaningInvoiceReadiness({company_id:'co-1',job_id:'job-1',customer_id:'cust-1',correlation_id:'corr-1',completion_plan:completion,invoice_context:invoiceContext,duplicate_check:{company_id:'co-1',authoritative:true,existing_invoice_id:'inv-existing'}});
 assert.equal(r.state,'invoice_readiness_blocked');assert.equal(r.invoice.proposal_permitted,false);assert.ok(r.invoice.blockers.includes('AUTHORITATIVE_INVOICE_ALREADY_EXISTS'));
});

test('Pass 7 blocks incomplete invoice inputs without mutating finance state',()=>{
 const r=planCleaningInvoiceReadiness({company_id:'co-1',job_id:'job-1',customer_id:'cust-1',correlation_id:'corr-1',completion_plan:completion,invoice_context:{line_items:[]}});
 assert.equal(r.state,'invoice_readiness_blocked');assert.ok(r.invoice.blockers.includes('INVOICE_INPUTS_INCOMPLETE'));assert.equal(r.restrictions.invoice_creation_performed,false);assert.equal(r.restrictions.payment_state_mutated,false);
});

test('Pass 7 exposes payment reconciliation only after authoritative invoice receipt',()=>{
 const r=planCleaningInvoiceReadiness({company_id:'co-1',job_id:'job-1',customer_id:'cust-1',correlation_id:'corr-1',completion_plan:completion,invoice_context:invoiceContext,invoice_receipt:{company_id:'co-1',authoritative:true,invoice_id:'inv-1',job_id:'job-1',source_ref:'crm:inv-1'}});
 assert.equal(r.state,'invoice_created_payment_reconciliation_ready');assert.equal(r.invoice.proposal_permitted,false);assert.equal(r.payment.ready,true);assert.equal(r.payment.capability,'finance.payment.reconcile');assert.equal(r.payment.authority,'user_only');
});

test('Pass 7 rejects cross-company and unauthoritative invoice receipts',()=>{
 assert.throws(()=>planCleaningInvoiceReadiness({company_id:'co-1',job_id:'job-1',customer_id:'cust-1',correlation_id:'corr-1',completion_plan:completion,invoice_context:invoiceContext,invoice_receipt:{company_id:'co-2',authoritative:true,invoice_id:'inv-1',source_ref:'crm:inv-1'}}),/cross-company/);
 assert.throws(()=>planCleaningInvoiceReadiness({company_id:'co-1',job_id:'job-1',customer_id:'cust-1',correlation_id:'corr-1',completion_plan:completion,invoice_context:invoiceContext,invoice_receipt:{company_id:'co-1',authoritative:false,invoice_id:'inv-1',source_ref:'crm:inv-1'}}),/authoritative/);
});

test('Pass 7 rejects completion plans that are not QA ready',()=>{
 assert.throws(()=>planCleaningInvoiceReadiness({company_id:'co-1',job_id:'job-1',customer_id:'cust-1',correlation_id:'corr-1',completion_plan:{...completion,state:'completion_qa_blocked'},invoice_context:invoiceContext}),/not ready/);
});
