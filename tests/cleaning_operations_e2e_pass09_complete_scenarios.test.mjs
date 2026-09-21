import test from 'node:test';
import assert from 'node:assert/strict';
import {
 planAcceptedQuoteToBooking,planConfirmedBookingToJob,planCleaningJobExecutionContext,planCleaningJobCompletion,planCleaningInvoiceReadiness,planCleaningServiceContinuity
} from '../titan-business-services/runtime/customer-quote-flow.mjs';

const company_id='co-scenario';
const correlation_id='corr-e2e';
const quoteBase={company_id,quote_id:'q-1',quote_status:'accepted',customer_id:'cust-1',correlation_id,duplicate_check:{company_id,checked:true,source_ref:'crm:booking-search:q-1'},service_context:{company_id,service_id:'svc-clean',location_id:'loc-1'},booking_context:{company_id,requested_start:'2026-09-10T09:00:00+10:00',requested_end:'2026-09-10T11:00:00+10:00'}};
const bookingJob={company_id,booking_id:'b-1',booking_status:'confirmed',quote_ref:'q-1',customer_id:'cust-1',service_id:'svc-clean',property_id:'prop-1',correlation_id,booking_context:{company_id,address:'1 Clean St'},scheduling_context:{company_id,appointment_id:'a-1',scheduled_start:'2026-09-10T09:00:00+10:00',scheduled_end:'2026-09-10T11:00:00+10:00'},dispatch_context:{company_id,dispatch_id:'d-1',worker_ids:['w-1']}};
const execBase={company_id,job_id:'j-1',work_order_id:'wo-1',booking_ref:'b-1',quote_ref:'q-1',customer_id:'cust-1',correlation_id,job_receipt:{company_id,authoritative:true,source_ref:'crm:job:j-1'},site_context:{company_id,property_id:'prop-1'},checklist:[{company_id,task_id:'t-1',label:'Kitchen',required:true,state:'complete',source_ref:'scope:q-1'}],site_instructions:[{company_id,instruction_id:'i-1',instruction:'Use side gate',source_ref:'customer:i-1',customer_confirmed:true}],hazards:[{company_id,hazard_id:'h-1',description:'Wet tile',severity:'low',observed:true,source_ref:'site:h-1',controls:['signage']}],evidence_requirements:[{company_id,requirement_id:'before',kind:'photo',stage:'before',required:true,satisfied:true,evidence_refs:['photo:before'],source_ref:'scope:q-1'},{company_id,requirement_id:'after',kind:'photo',stage:'after',required:true,satisfied:true,evidence_refs:['photo:after'],source_ref:'scope:q-1'}]};

function completionFrom(exec, exceptions=[]) { return planCleaningJobCompletion({company_id,job_id:'j-1',work_order_id:'wo-1',booking_ref:'b-1',quote_ref:'q-1',correlation_id,job_receipt:execBase.job_receipt,current_state:'qa_ready',field_context:{context:{tasks:[{task_id:'t-1',required:true,status:'done'}],checklist:[{item_id:'t-1',required:true,completed:true}],equipment:[]}},execution_context:exec.execution_context,exceptions,request_invoice:true}); }

test('owner/customer/workforce happy path retains references from accepted quote through payment readiness',()=>{
 const booking=planAcceptedQuoteToBooking(quoteBase); assert.equal(booking.state,'booking_ready'); assert.equal(booking.continuity.quote_ref,'q-1');
 const job=planConfirmedBookingToJob(bookingJob); assert.equal(job.state,'work_order_proposal_ready'); assert.equal(job.next.assignment.assignment_performed,false);
 const exec=planCleaningJobExecutionContext(execBase); assert.equal(exec.state,'execution_context_ready'); assert.equal(exec.execution_context.site_instructions[0].customer_confirmed,true);
 const completion=completionFrom(exec); assert.equal(completion.state,'completion_proposal_ready'); assert.deepEqual(completion.qa.evidence_refs,['photo:before','photo:after']);
 const inv=planCleaningInvoiceReadiness({company_id,job_id:'j-1',customer_id:'cust-1',correlation_id,completion_plan:completion,invoice_context:{line_items:[{description:'Clean',amount:100}],subtotal:100,tax:10,total:110,due_date:'2026-09-17',payment_method:'payid',send_to_customer:true},invoice_receipt:{company_id,authoritative:true,invoice_id:'inv-1',job_id:'j-1',source_ref:'crm:inv-1'}});
 assert.equal(inv.state,'invoice_created_payment_reconciliation_ready'); assert.equal(inv.payment.authority,'user_only'); assert.equal(inv.restrictions.payment_state_mutated,false);
});

test('workforce evidence failure blocks owner completion and customer invoice progression',()=>{
 const exec=planCleaningJobExecutionContext({...execBase,evidence_requirements:execBase.evidence_requirements.map(x=>x.requirement_id==='after'?{...x,satisfied:false,evidence_refs:[]}:x)});
 const completion=completionFrom(exec); assert.equal(completion.state,'completion_qa_blocked'); assert.ok(completion.qa.blockers.some(x=>String(x).includes('AFTER_EVIDENCE')));
 assert.throws(()=>planCleaningInvoiceReadiness({company_id,job_id:'j-1',customer_id:'cust-1',correlation_id,completion_plan:completion,invoice_context:{line_items:[{description:'Clean',amount:100}]}}),/not ready/i);
});

test('duplicate booking and duplicate invoice truth suppress repeated customer commitments',()=>{
 const booking=planAcceptedQuoteToBooking({...quoteBase,duplicate_check:{company_id,checked:true,source_ref:'crm:booking-search:q-1',existing_booking_id:'b-existing'}}); assert.equal(booking.state,'booking_duplicate_suppressed'); assert.equal(booking.next,null);
 const exec=planCleaningJobExecutionContext(execBase); const completion=completionFrom(exec);
 const inv=planCleaningInvoiceReadiness({company_id,job_id:'j-1',customer_id:'cust-1',correlation_id,completion_plan:completion,invoice_context:{line_items:[{description:'Clean',amount:100}],subtotal:100,total:100,due_date:'2026-09-17'},duplicate_check:{company_id,authoritative:true,existing_invoice_id:'inv-existing'}});
 assert.equal(inv.state,'invoice_readiness_blocked'); assert.ok(inv.invoice.blockers.includes('AUTHORITATIVE_INVOICE_ALREADY_EXISTS'));
});

test('customer lifecycle change remains governed across reschedule, cancellation and rework',()=>{
 const receipt={company_id,authoritative:true,booking_id:'b-1',appointment_id:'a-1',provider:'calendar',provider_booking_id:'pb-1',provider_revision:'r1',source_ref:'crm:booking:b-1'};
 const res=planCleaningServiceContinuity({company_id,correlation_id,action:'reschedule',booking_receipt:receipt,provider_revision:'r2',requested_start:'2026-09-11T09:00:00+10:00',requested_end:'2026-09-11T11:00:00+10:00'}); assert.equal(res.restrictions.reschedule_performed,false);
 const cancel=planCleaningServiceContinuity({company_id,correlation_id,action:'cancel',booking_receipt:receipt,provider_revision:'r2'}); assert.equal(cancel.next.human_review_required,true); assert.equal(cancel.restrictions.cancellation_performed,false);
 const rework=planCleaningServiceContinuity({company_id,correlation_id,action:'rework',job_receipt:{company_id,authoritative:true,job_id:'j-1',work_order_id:'wo-1',source_ref:'crm:job:j-1'},rework_context:{company_id,exception_id:'rw-1',summary:'Missed area',evidence_refs:['photo:missed']}}); assert.equal(rework.state,'rework_authority_review_required'); assert.equal(rework.restrictions.rework_started,false);
});

test('cross-company contamination fails closed at multiple surfaces',()=>{
 assert.throws(()=>planConfirmedBookingToJob({...bookingJob,dispatch_context:{company_id:'other'}}),/cross-company/);
 assert.throws(()=>planCleaningJobExecutionContext({...execBase,site_context:{company_id:'other'}}),/cross-company/);
});
