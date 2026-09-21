import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createJobsAgentRuntime} from '../titan-workforce/starter-agents/jobs/jobs-agent-runtime.mjs';
import {buildBookingExecutionPlan} from '../titan-workforce/starter-agents/booking/booking-orchestrator.mjs';
import {detectRebookingOpportunities} from '../titan-workforce/starter-agents/rebooking/rebooking-opportunity-detector.mjs';
import {buildDeterministicDueDateCandidate} from '../titan-workforce/starter-agents/rebooking/rebooking-due-date-candidates.mjs';
import {scoreRebookingRecommendation} from '../titan-workforce/starter-agents/rebooking/rebooking-recommendation-scoring.mjs';
import {buildRebookingResponseHandoff} from '../titan-workforce/starter-agents/rebooking/rebooking-response-handoff.mjs';

const company='cert-co';
const customer='cust-1';
const service='svc-1';
const runtime=createJobsAgentRuntime({clock:()=> '2026-09-09T00:00:00Z'});
function completedJob(){
 const field=runtime.buildFieldContext({company_id:company,job_id:'job-1',role:'field_worker',tasks:[{task_id:'t1',required:true,status:'done'}],checklist:[{item_id:'c1',required:true,completed:true}],equipment:[]});
 const ready=runtime.evaluateCompletion({company_id:company,job_id:'job-1',current_state:'completed',field_context:field,evidence:{checklist:[{item_id:'c1',required:true,completed:true}],evidence_attachment_ids:['ev-1']},exceptions:[],request_invoice:false},{evidence_policy:{require_checklist:true,min_attachments:1}});
 const care=runtime.buildCompletionHandoffs(ready,{company_id:company,job_id:'job-1',completion_ref:'done-1'}).find(x=>x.schema==='titan.zero.jobs.customer-care-handoff.v1');
 return {ready,care};
}
function opportunityFrom(source_type='COMPLETED_SERVICE', extra={}){
 const evidence={company_id:company,customer_id:customer,service_id:service,source_event_id:source_type==='CUSTOMER_CARE'?'care-1':'job-1',source_type,service_completed:source_type==='COMPLETED_SERVICE',issue_resolved:source_type==='CUSTOMER_CARE',consent:{known:true,permitted:true,opted_out:false,evidence_id:'consent-1'},provenance:{producer:source_type==='CUSTOMER_CARE'?'Customer Care Agent':'Jobs Agent',record_refs:['job-1'],observed_at:'2026-09-09T00:00:00Z'},...extra};
 const batch=detectRebookingOpportunities({company_id:company,evidence:[evidence]});
 assert.equal(batch.rejected_count,0);assert.equal(batch.opportunity_count,1);return batch.opportunities[0];
}
function recommendation(o){
 const due=buildDeterministicDueDateCandidate({company_id:company,customer_id:customer,service_id:service,opportunity_id:o.opportunity_id,timezone:'Australia/Melbourne',completed_date:'2026-08-10',as_of_date:'2026-09-09',configured_interval:{value:30,unit:'DAYS',evidence_ref:'cadence-1'}});
 return scoreRebookingRecommendation({company_id:company,opportunity:o,due_date_candidate:due,as_of_date:'2026-09-09',last_completed_date:'2026-08-10',dormancy_threshold_days:90,service_history_count:4,prior_completed_services:4,customer_signal:{recurring_interest:true}});
}

test('Merge42 Jobs completion remains authority neutral and exposes Customer Care handoff',()=>{const {ready,care}=completedJob();assert.equal(ready.ready,true);assert.ok(care);assert.equal(care.company_id,company);assert.equal(care.execution_permitted,false);assert.equal(care.authority_granted,false)});
test('verified completed-service evidence becomes one deterministic Rebooking opportunity',()=>{const o=opportunityFrom();assert.equal(o.source_type,'COMPLETED_SERVICE');assert.equal(o.state,'ELIGIBLE');assert.equal(o.company_id,company);assert.equal(o.execution_permitted,false);assert.equal(o.identity_is_authority,false)});
test('resolved Customer Care evidence can become Rebooking opportunity only after resolution',()=>{const o=opportunityFrom('CUSTOMER_CARE');assert.equal(o.source_type,'CUSTOMER_CARE');const bad=detectRebookingOpportunities({company_id:company,evidence:[{company_id:company,customer_id:customer,service_id:service,source_event_id:'care-bad',source_type:'CUSTOMER_CARE',issue_resolved:false,consent:{known:true,permitted:true},provenance:{producer:'Customer Care Agent'}}]});assert.equal(bad.opportunity_count,0);assert.equal(bad.rejected_count,1)});
test('Rebooking recommendation stays advisory and authority neutral',()=>{const r=recommendation(opportunityFrom());assert.equal(r.company_id,company);assert.equal(r.execution_permitted,false);assert.equal(r.grants_authority,false);assert.equal(r.identity_is_authority,false);assert.equal(r.model_may_override,false)});
test('explicit customer YES produces Booking review handoff only',()=>{const o=opportunityFrom();const r=recommendation(o);const h=buildRebookingResponseHandoff({company_id:company,opportunity:o,recommendation:r,response_event:{company_id:company,opportunity_id:o.opportunity_id,response_id:'resp-1',response_type:'YES',source_message_id:'msg-1',responded_at:'2026-09-09T10:00:00+10:00',verified:true,producer:'titan.channels.inbound.v1',requested_window:'Friday PM',evidence_ref:'msg-proof'}});assert.equal(h.state,'BOOKING_REVIEW_READY');assert.equal(h.booking_handoff.workflow,'titan-business-services/workflows/service_booking.json');assert.equal(h.booking_handoff.execution_permitted,false);assert.equal(h.creates_booking,false);assert.equal(h.grants_authority,false)});
test('Booking governed execution plan accepts Rebooking intent but still requires external authority',()=>{const o=opportunityFrom();const r=recommendation(o);const h=buildRebookingResponseHandoff({company_id:company,opportunity:o,recommendation:r,response_event:{company_id:company,opportunity_id:o.opportunity_id,response_id:'resp-2',response_type:'YES',source_message_id:'msg-2',responded_at:'2026-09-09T10:00:00+10:00',verified:true,producer:'titan.channels.inbound.v1'}});const p=buildBookingExecutionPlan({company_id:company,intent_id:h.response_handoff_id,correlation_id:'corr-1',idempotency_key:h.booking_handoff.idempotency_key,worker_id:'booking-agent'});assert.equal(p.direct_mutation,false);assert.equal(p.grants_authority,false);assert.equal(p.steps.find(x=>x.id==='confirm_booking').capability,'crm.appointment.create');assert.equal(p.steps.find(x=>x.id==='confirm_booking').requires_authority_decision,true)});
test('Booking refuses identity-as-authority even after explicit customer YES',()=>{assert.throws(()=>buildBookingExecutionPlan({company_id:company,intent_id:'i1',correlation_id:'c1',idempotency_key:'k1',identity_authorized:true}),/identity-cannot-grant-authority/)});
test('service_booking remains canonical company-scoped workflow',()=>{const x=JSON.parse(fs.readFileSync(new URL('../titan-business-services/workflows/service_booking.json',import.meta.url),'utf8'));assert.equal(x.wizard.capability,'crm.appointment.create');assert.ok(x.wizard.governance.required_context.includes('company_id'));assert.equal(x._titan_provenance.company_boundary,'company_id')});
test('cross-company evidence fails closed before Rebooking handoff',()=>{const b=detectRebookingOpportunities({company_id:company,evidence:[{company_id:'other',customer_id:customer,service_id:service,source_event_id:'x',source_type:'COMPLETED_SERVICE',service_completed:true,provenance:{producer:'Jobs Agent'}}]});assert.equal(b.opportunity_count,0);assert.equal(b.rejected_count,1);assert.match(b.rejected[0].reason,/cross-company/)});
test('final reconstructed chain never directly executes protected actions',()=>{const o=opportunityFrom();const r=recommendation(o);const h=buildRebookingResponseHandoff({company_id:company,opportunity:o,recommendation:r,response_event:{company_id:company,opportunity_id:o.opportunity_id,response_id:'resp-3',response_type:'YES',source_message_id:'msg-3',responded_at:'2026-09-09T10:00:00+10:00',verified:true,producer:'titan.channels.inbound.v1'}});for(const x of [o,r,h])assert.equal(x.execution_permitted,false);assert.equal(h.creates_booking,false)});
