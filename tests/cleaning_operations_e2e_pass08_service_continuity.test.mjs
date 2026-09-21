import test from 'node:test';
import assert from 'node:assert/strict';
import {planCleaningServiceContinuity,CLEANING_SERVICE_CONTINUITY_SCHEMA} from '../titan-business-services/runtime/customer-quote-flow.mjs';

const booking={company_id:'co-1',authoritative:true,booking_id:'b-1',appointment_id:'a-1',provider:'calendar',provider_booking_id:'pb-1',provider_revision:'r1',source_ref:'crm:booking:b-1'};
const job={company_id:'co-1',authoritative:true,job_id:'j-1',work_order_id:'wo-1',source_ref:'crm:job:j-1'};

test('Pass 8 builds recurring due booking proposals through existing recurrence runtime without execution authority',()=>{
 const r=planCleaningServiceContinuity({company_id:'co-1',correlation_id:'c-1',action:'recurring',now:86400000,recurrence_context:{company_id:'co-1',schedule_id:'fortnightly',frequency:'DAILY',start_at:86400000,work_ref:'service:clean'}});
 assert.equal(r.schema,CLEANING_SERVICE_CONTINUITY_SCHEMA);assert.equal(r.state,'recurring_instances_proposal_ready');assert.equal(r.recurrence.due.due_count,1);assert.equal(r.next.capability,'crm.appointment.create');assert.equal(r.next.due_instances[0].requires_fresh_authority_evaluation,true);assert.equal(r.restrictions.booking_creation_performed,false);
});

test('Pass 8 recurring schedule does not silently replay or execute protected effects',()=>{
 const r=planCleaningServiceContinuity({company_id:'co-1',correlation_id:'c-2',action:'recurring',now:10*86400000,recurrence_context:{company_id:'co-1',schedule_id:'daily',frequency:'DAILY',start_at:86400000,work_ref:'service:clean',catch_up_limit:1,max_instances:100}});
 assert.ok(r.recurrence.due.due_count<=2);assert.equal(r.next.automatic_booking_creation,false);assert.equal(r.authority_neutral,true);
});

test('Pass 8 produces reschedule reconciliation event instead of mutating booking',()=>{
 const r=planCleaningServiceContinuity({company_id:'co-1',correlation_id:'c-3',action:'reschedule',booking_receipt:booking,provider_revision:'r2',requested_start:'2026-09-10T09:00:00+10:00',requested_end:'2026-09-10T11:00:00+10:00'});
 assert.equal(r.state,'reschedule_reconciliation_required');assert.equal(r.reconciliation_event.kind,'rescheduled');assert.equal(r.reconciliation_event.direct_mutation,false);assert.equal(r.restrictions.reschedule_performed,false);
});

test('Pass 8 cancellation is explicit reconciliation and human review, never direct cancel',()=>{
 const r=planCleaningServiceContinuity({company_id:'co-1',correlation_id:'c-4',action:'cancel',booking_receipt:booking,provider_revision:'r2'});
 assert.equal(r.state,'cancellation_reconciliation_required');assert.equal(r.reconciliation_event.kind,'cancelled');assert.equal(r.next.human_review_required,true);assert.equal(r.restrictions.cancellation_performed,false);
});

test('Pass 8 rework is a Jobs exception and remains blocked without authority review',()=>{
 const r=planCleaningServiceContinuity({company_id:'co-1',correlation_id:'c-5',action:'rework',job_receipt:job,rework_context:{company_id:'co-1',exception_id:'rw-1',summary:'Missed bathroom detail',evidence_refs:['ev-1']}});
 assert.equal(r.state,'rework_authority_review_required');assert.equal(r.exception.type,'rework');assert.equal(r.exception.blocks_completion,true);assert.equal(r.resolution.reason,'AUTHORITY_REQUIRED');assert.equal(r.restrictions.rework_started,false);
});

test('Pass 8 authorised rework still emits proposal only and does not mutate job',()=>{
 const r=planCleaningServiceContinuity({company_id:'co-1',correlation_id:'c-6',action:'rework',job_receipt:job,authority_verified:true,rework_context:{company_id:'co-1',exception_id:'rw-2',evidence_refs:['ev-2']}});
 assert.equal(r.state,'rework_proposal_ready');assert.equal(r.resolution.status,'READY');assert.equal(r.resolution.proposal_only,true);assert.equal(r.next.capability,'crm.work_order.update');assert.equal(r.restrictions.work_order_mutation_performed,false);
});

test('Pass 8 rejects cross-company receipts and legacy tenant boundaries',()=>{
 assert.throws(()=>planCleaningServiceContinuity({company_id:'co-1',correlation_id:'c-7',action:'cancel',booking_receipt:{...booking,company_id:'co-2'},provider_revision:'r2'}),/cross-company/);
 assert.throws(()=>planCleaningServiceContinuity({company_id:'co-1',tenant_id:'bad',correlation_id:'c-7',action:'recurring',recurrence_context:{company_id:'co-1',schedule_id:'x',frequency:'ONCE',start_at:1,work_ref:'x'}}),/legacy tenant/);
});

test('Pass 8 requires authoritative source receipts for booking and job lifecycle changes',()=>{
 assert.throws(()=>planCleaningServiceContinuity({company_id:'co-1',correlation_id:'c-8',action:'cancel',booking_receipt:{...booking,authoritative:false},provider_revision:'r2'}),/authoritative/);
 assert.throws(()=>planCleaningServiceContinuity({company_id:'co-1',correlation_id:'c-8',action:'rework',job_receipt:{...job,source_ref:null}}),/authoritative/);
});
