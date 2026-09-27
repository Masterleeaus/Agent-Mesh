import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluateSchedulingBatch} from '../../../titan-workforce/starter-agents/scheduling/scheduling-adversarial-batch.mjs';

const baseWorker=(id,units=4)=>({worker_id:id,available_units:units,capacity_units:4,utilization:(4-units)/4,state:'AVAILABLE'});
const availability=id=>({company_id:'c1',worker_id:id,windows:[{starts_at:'2026-09-08T00:00:00Z',ends_at:'2026-09-09T00:00:00Z'}]});
const registry={schema:'titan.workforce.skill-capability-registry.v1',company_id:'c1',worker_capabilities:[
 {worker_id:'w1',capability_id:'cleaning.standard',proficiency:3,verification_state:'VERIFIED'},
 {worker_id:'w2',capability_id:'cleaning.standard',proficiency:3,verification_state:'VERIFIED'},
 {worker_id:'w3',capability_id:'cleaning.standard',proficiency:3,verification_state:'VERIFIED'}
]};
const capacity={schema:'titan.workforce.workload-capacity.v1',company_id:'c1',worker_capacity:[baseWorker('w1'),baseWorker('w2'),baseWorker('w3')]};
const jobs=[
 {company_id:'c1',schedule_intent_id:'s2',work_item_id:'j2',requested_window:{starts_at:'2026-09-08T11:00:00Z',ends_at:'2026-09-08T12:00:00Z'},required_capacity_units:1,required_capabilities:['cleaning.standard']},
 {company_id:'c1',schedule_intent_id:'s1',work_item_id:'j1',requested_window:{starts_at:'2026-09-08T10:00:00Z',ends_at:'2026-09-08T11:00:00Z'},required_capacity_units:1,required_capabilities:['cleaning.standard']}
];

test('batch scheduling is deterministic independent of input order',()=>{
 const a=evaluateSchedulingBatch({company_id:'c1',batch_id:'b1',jobs,capacity_snapshot:capacity,skill_registry:registry,availability:[availability('w1'),availability('w2'),availability('w3')],existing_assignments:[]});
 const b=evaluateSchedulingBatch({company_id:'c1',batch_id:'b1',jobs:[...jobs].reverse(),capacity_snapshot:capacity,skill_registry:registry,availability:[availability('w3'),availability('w2'),availability('w1')],existing_assignments:[]});
 assert.deepEqual(a.recommendations,b.recommendations);
 assert.deepEqual(a.recommendations.map(x=>x.work_item_id),['j1','j2']);
 assert.equal(a.execution_permitted,false); assert.equal(a.automatic_assignment,false);
});

test('competing overlapping jobs do not recommend the same worker twice in the batch',()=>{
 const overlap=jobs.map((j,i)=>({...j,schedule_intent_id:`s${i+1}`,work_item_id:`o${i+1}`,requested_window:{starts_at:'2026-09-08T10:00:00Z',ends_at:'2026-09-08T11:00:00Z'}}));
 const r=evaluateSchedulingBatch({company_id:'c1',batch_id:'b2',jobs:overlap,capacity_snapshot:capacity,skill_registry:registry,availability:[availability('w1'),availability('w2'),availability('w3')],existing_assignments:[]});
 assert.equal(new Set(r.recommendations.flatMap(x=>x.recommended_worker_ids)).size,2);
});

test('existing assignment conflict removes worker from recommendation',()=>{
 const r=evaluateSchedulingBatch({company_id:'c1',batch_id:'b3',jobs:[jobs[1]],capacity_snapshot:capacity,skill_registry:registry,availability:[availability('w1'),availability('w2')],existing_assignments:[{company_id:'c1',assignment_id:'a1',work_item_id:'old',worker_id:'w1',requested_window:{starts_at:'2026-09-08T09:30:00Z',ends_at:'2026-09-08T10:30:00Z'}}]});
 assert.deepEqual(r.recommendations[0].recommended_worker_ids,['w2']);
 assert.ok(r.recommendations[0].excluded_workers.some(x=>x.worker_id==='w1'&&x.reason_codes.includes('DOUBLE_BOOKING')));
});

test('duplicate jobs are suppressed and stale replay evidence requires review',()=>{
 const r=evaluateSchedulingBatch({company_id:'c1',batch_id:'b4',jobs:[jobs[0],{...jobs[0]}],capacity_snapshot:capacity,skill_registry:registry,availability:[availability('w1')],existing_assignments:[],replay_state:{applied_operation_ids:['op-old'],current_revision:5},job_replay:[{work_item_id:'j2',operation_id:'op-new',base_revision:4}]});
 assert.equal(r.duplicate_work_items.length,1);
 assert.equal(r.recommendations[0].replay_disposition,'STALE_REVISION');
 assert.equal(r.recommendations[0].requires_human_review,true);
});

test('cross-company and legacy tenant evidence fail closed',()=>{
 assert.throws(()=>evaluateSchedulingBatch({company_id:'c1',batch_id:'b5',jobs:[{...jobs[0],company_id:'c2'}],capacity_snapshot:capacity,skill_registry:registry,availability:[]}),/cross-company/);
 assert.throws(()=>evaluateSchedulingBatch({company_id:'c1',batch_id:'b5',jobs:[{...jobs[0],tenant_id:'x'}],capacity_snapshot:capacity,skill_registry:registry,availability:[]}),/legacy-company-boundary/);
});

test('high-volume deterministic run remains recommendation-only',()=>{
 const many=Array.from({length:120},(_,i)=>({company_id:'c1',schedule_intent_id:`s${String(i).padStart(3,'0')}`,work_item_id:`j${String(i).padStart(3,'0')}`,requested_window:{starts_at:new Date(Date.parse('2026-09-08T00:00:00Z')+(i%12)*3600000).toISOString(),ends_at:new Date(Date.parse('2026-09-08T01:00:00Z')+(i%12)*3600000).toISOString()},required_capacity_units:1,required_capabilities:['cleaning.standard']}));
 const r=evaluateSchedulingBatch({company_id:'c1',batch_id:'b6',jobs:many,capacity_snapshot:capacity,skill_registry:registry,availability:[availability('w1'),availability('w2'),availability('w3')],existing_assignments:[]});
 assert.equal(r.total_input_jobs,120); assert.equal(r.execution_permitted,false); assert.equal(r.grants_authority,false);
 assert.deepEqual(r.recommendations.map(x=>x.work_item_id),[...r.recommendations.map(x=>x.work_item_id)].sort());
});
