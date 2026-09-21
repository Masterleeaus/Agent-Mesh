import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluateSchedulingBatch} from '../../../titan-workforce/starter-agents/scheduling/scheduling-adversarial-batch.mjs';
import {projectSchedulingBatchObservations,summarizeSchedulingMetrics,buildSchedulingTrace} from '../../../titan-workforce/starter-agents/scheduling/scheduling-observability.mjs';

const capacity={schema:'titan.workforce.workload-capacity.v1',company_id:'c1',worker_capacity:[{worker_id:'w1',available_units:4,capacity_units:4,utilization:0,state:'AVAILABLE'}]};
const skills={schema:'titan.workforce.skill-capability-registry.v1',company_id:'c1',worker_capabilities:[{worker_id:'w1',capability_id:'cleaning.standard',proficiency:3,verification_state:'VERIFIED'}]};
const availability=[{company_id:'c1',worker_id:'w1',windows:[{starts_at:'2026-09-08T00:00:00Z',ends_at:'2026-09-09T00:00:00Z'}]}];
const job=(id='j1')=>({company_id:'c1',schedule_intent_id:`s-${id}`,work_item_id:id,requested_window:{starts_at:'2026-09-08T10:00:00Z',ends_at:'2026-09-08T11:00:00Z'},required_capacity_units:1,required_capabilities:['cleaning.standard']});

function batch(extra={}){return evaluateSchedulingBatch({company_id:'c1',batch_id:'b1',jobs:[job()],capacity_snapshot:capacity,skill_registry:skills,availability,existing_assignments:[],...extra});}

test('projects Scheduling evidence into the shared Titan observability contract without authority',()=>{
 const events=projectSchedulingBatchObservations(batch(),{company_id:'c1',correlation_id:'corr-1',operation_id:'op-1',observed_at:100});
 assert.equal(events.length,2);
 for(const e of events){assert.equal(e.schema,'titan.observability.v1');assert.equal(e.company_id,'c1');assert.equal(e.component,'scheduling-agent');assert.equal(e.correlation_id,'corr-1');assert.equal(e.operation_id,'op-1');assert.equal(e.authority_effect,false);assert.equal(e.grants_authority,false);}
 assert.equal(events[0].event_type,'scheduling.batch.evaluated');
 assert.equal(events[1].event_type,'scheduling.recommendation.ready');
});

test('reason codes are operator-safe and source objects or secrets are not copied into payloads',()=>{
 const b=batch({existing_assignments:[{company_id:'c1',assignment_id:'a1',work_item_id:'old',worker_id:'w1',requested_window:{starts_at:'2026-09-08T09:30:00Z',ends_at:'2026-09-08T10:30:00Z'},token:'secret'}]});
 const events=projectSchedulingBatchObservations(b,{company_id:'c1',correlation_id:'corr-2',operation_id:'op-2',observed_at:200,token:'do-not-copy',authorization:'Bearer secret'});
 const rec=events.find(e=>e.event_type==='scheduling.recommendation.review_required');
 assert.ok(rec);assert.ok(rec.payload.reason_codes.includes('INSUFFICIENT_NONCONFLICTING_WORKERS'));
 const text=JSON.stringify(events);assert.equal(text.includes('do-not-copy'),false);assert.equal(text.includes('Bearer secret'),false);assert.equal(text.includes('secret'),false);
});

test('metrics summarize company-scoped Scheduling observations and remain authority-neutral',()=>{
 const ready=projectSchedulingBatchObservations(batch(),{company_id:'c1',correlation_id:'corr-a',operation_id:'op-a',observed_at:10});
 const reviewBatch=batch({replay_state:{current_revision:5,applied_operation_ids:[]},job_replay:[{company_id:'c1',work_item_id:'j1',operation_id:'replay-1',base_revision:4}]});
 const review=projectSchedulingBatchObservations(reviewBatch,{company_id:'c1',correlation_id:'corr-b',operation_id:'op-b',observed_at:20});
 const m=summarizeSchedulingMetrics([...ready,...review],'c1');
 assert.equal(m.batches,2);assert.equal(m.recommendations,2);assert.equal(m.ready,1);assert.equal(m.review_required,1);assert.equal(m.stale_revision,1);assert.equal(m.grants_authority,false);assert.equal(m.authority_effect,false);
});

test('trace is deterministic, ordered and preserves causation without granting authority',()=>{
 const events=projectSchedulingBatchObservations(batch(),{company_id:'c1',correlation_id:'corr-t',operation_id:'op-t',causation_id:'root-1',observed_at:300});
 const trace=buildSchedulingTrace(events,{company_id:'c1',correlation_id:'corr-t'});
 assert.equal(trace.events.length,2);assert.equal(trace.events[0].event_type,'scheduling.batch.evaluated');assert.equal(trace.events[1].causation_id,trace.events[0].event_id);assert.equal(trace.grants_authority,false);
 assert.deepEqual(trace.events.map(e=>e.event_id),buildSchedulingTrace([...events].reverse(),{company_id:'c1',correlation_id:'corr-t'}).events.map(e=>e.event_id));
});

test('legacy and cross-company observability inputs fail closed',()=>{
 assert.throws(()=>projectSchedulingBatchObservations(batch(),{company_id:'c2',correlation_id:'x',operation_id:'x'}),/cross-company/);
 assert.throws(()=>projectSchedulingBatchObservations(batch(),{company_id:'c1',correlation_id:'x',operation_id:'x',tenant_id:'legacy'}),/legacy-company-boundary/);
 const own=projectSchedulingBatchObservations(batch(),{company_id:'c1',correlation_id:'x',operation_id:'x',observed_at:1});
 assert.throws(()=>summarizeSchedulingMetrics([...own,{...own[0],company_id:'c2'}],'c1'),/cross-company/);
});

test('high-volume observability projection exposes aggregate counts without UI or execution effects',()=>{
 const jobs=Array.from({length:120},(_,i)=>({...job(`j${String(i).padStart(3,'0')}`),requested_window:{starts_at:new Date(Date.parse('2026-09-08T00:00:00Z')+(i%12)*3600000).toISOString(),ends_at:new Date(Date.parse('2026-09-08T01:00:00Z')+(i%12)*3600000).toISOString()}}));
 const b=evaluateSchedulingBatch({company_id:'c1',batch_id:'stress',jobs,capacity_snapshot:capacity,skill_registry:skills,availability,existing_assignments:[]});
 const events=projectSchedulingBatchObservations(b,{company_id:'c1',correlation_id:'stress-corr',operation_id:'stress-op',observed_at:500});
 const m=summarizeSchedulingMetrics(events,'c1');
 assert.equal(m.batches,1);assert.equal(m.recommendations,120);assert.equal(events.length,121);assert.equal(m.direct_mutation,false);assert.equal(m.execution_permitted,false);
});
