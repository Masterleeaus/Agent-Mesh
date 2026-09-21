import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluateSchedulingBatch} from '../../../titan-workforce/starter-agents/scheduling/scheduling-adversarial-batch.mjs';
import {projectSchedulingBatchObservations,summarizeSchedulingMetrics} from '../../../titan-workforce/starter-agents/scheduling/scheduling-observability.mjs';
import {buildSchedulingApprovalEscalation} from '../../../titan-workforce/starter-agents/scheduling/scheduling-approval-escalation.mjs';
import {buildOfflineJobMutation,detectJobRevisionConflict} from '../../../titan-workforce/starter-agents/jobs/jobs-offline-sync.mjs';

const capacity={schema:'titan.workforce.workload-capacity.v1',company_id:'c1',worker_capacity:[{worker_id:'w1',available_units:4,capacity_units:4,utilization:0,state:'AVAILABLE'}]};
const skills={schema:'titan.workforce.skill-capability-registry.v1',company_id:'c1',worker_capabilities:[{worker_id:'w1',capability_id:'cleaning.standard',proficiency:3,verification_state:'VERIFIED'}]};
const availability=[{company_id:'c1',worker_id:'w1',windows:[{starts_at:'2026-09-08T00:00:00Z',ends_at:'2026-09-09T00:00:00Z'}]}];
const job={company_id:'c1',schedule_intent_id:'s1',work_item_id:'j1',requested_window:{starts_at:'2026-09-08T10:00:00Z',ends_at:'2026-09-08T11:00:00Z'},required_capacity_units:1,required_capabilities:['cleaning.standard']};
const base=(extra={})=>({company_id:'c1',batch_id:'p11',jobs:[job],capacity_snapshot:capacity,skill_registry:skills,availability,existing_assignments:[],...extra});

test('replay state is company-scoped and cross-company evidence fails closed',()=>{
 assert.throws(()=>evaluateSchedulingBatch(base({replay_state:{company_id:'c2',current_revision:5,applied_operation_ids:[]},job_replay:[{company_id:'c1',work_item_id:'j1',operation_id:'op1',base_revision:5}]})),/cross-company-replay-state-denied/);
});

test('already-applied replay suppresses a new worker recommendation instead of surfacing ready work',()=>{
 const r=evaluateSchedulingBatch(base({replay_state:{company_id:'c1',current_revision:5,applied_operation_ids:['op1']},job_replay:[{company_id:'c1',work_item_id:'j1',operation_id:'op1',base_revision:5}]}));
 const rec=r.recommendations[0];
 assert.equal(rec.replay_disposition,'ALREADY_APPLIED');
 assert.deepEqual(rec.recommended_worker_ids,[]);
 assert.equal(rec.recommendation_suppressed,true);
 assert.equal(rec.suppression_reason,'DUPLICATE_REPLAY');
 assert.equal(rec.requires_human_review,false);
 assert.ok(rec.reason_codes.includes('DUPLICATE_REPLAY'));
 const events=projectSchedulingBatchObservations(r,{company_id:'c1',correlation_id:'p11-corr',operation_id:'p11-op',observed_at:100});
 const recommendationEvent=events.find(e=>e.event_type.startsWith('scheduling.recommendation.'));
 assert.equal(recommendationEvent.event_type,'scheduling.recommendation.suppressed');
 assert.equal(recommendationEvent.payload.recommended_worker_count,0);
 const metrics=summarizeSchedulingMetrics(events,'c1');
 assert.equal(metrics.duplicate_replay,1);
 assert.equal(metrics.suppressed,1);
 assert.equal(metrics.ready,0);
});

test('stale replay remains review-only through observability and cannot become execution authority',()=>{
 const r=evaluateSchedulingBatch(base({replay_state:{company_id:'c1',current_revision:6,applied_operation_ids:[]},job_replay:[{company_id:'c1',work_item_id:'j1',operation_id:'op2',base_revision:5}]}));
 const rec=r.recommendations[0];
 assert.equal(rec.replay_disposition,'STALE_REVISION');
 assert.equal(rec.requires_human_review,true);
 const events=projectSchedulingBatchObservations(r,{company_id:'c1',correlation_id:'stale-corr',operation_id:'stale-op',observed_at:200});
 assert.ok(events.some(e=>e.event_type==='scheduling.recommendation.review_required'));
 assert.ok(events.every(e=>e.authority_effect===false&&e.grants_authority===false));
});

test('canonical authority ALLOW remains governed submission only and never executes scheduling',()=>{
 const recommendation={schema:'titan.scheduling.cleaning-recommendation.v1',company_id:'c1',schedule_intent_id:'s1',work_item_id:'j1',status:'READY_FOR_GOVERNED_ASSIGNMENT',unmet_requirements:[]};
 const packet=buildSchedulingApprovalEscalation({company_id:'c1',operation_id:'op-auth',action_id:'act-auth',risk_level:'low'},recommendation,{company_id:'c1',operation_id:'op-auth',action_id:'act-auth',authority_decision_id:'ad1',decision:'ALLOW',reason_codes:[]});
 assert.equal(packet.status,'READY_FOR_GOVERNED_SUBMISSION');
 assert.equal(packet.requires_command_bus,true);
 assert.equal(packet.execution_permitted,false);
 assert.equal(packet.authority_granted,false);
 assert.equal(packet.grants_authority,false);
});

test('Jobs remains canonical job mutation/revision owner at the Scheduling boundary',()=>{
 const mutation=buildOfflineJobMutation({company_id:'c1',job_id:'j1',operation_id:'jobs-op',base_revision:3,payload:{scheduling_reference:{schedule_intent_id:'s1'}}});
 assert.equal(mutation.schema,'titan.zero.jobs.offline-mutation.v1');
 assert.equal(mutation.authority_granted,false);
 assert.equal(mutation.execution_permitted,false);
 const conflict=detectJobRevisionConflict({company_id:'c1',job_id:'j1',operation_id:'jobs-op',base_revision:3,current_revision:4,current_operation_ids:[]});
 assert.equal(conflict.disposition,'STALE_REVISION');
 assert.equal(conflict.conflict,true);
});
