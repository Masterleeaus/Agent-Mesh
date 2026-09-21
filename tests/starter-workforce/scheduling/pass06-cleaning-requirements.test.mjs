import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCleaningSchedulingRecommendation } from '../../../titan-workforce/starter-agents/scheduling/scheduling-cleaning-requirements.mjs';

const company_id='company:clean';
const match={schema:'titan.scheduling.match-result.v1',company_id,schedule_intent_id:'sched-6',work_item_id:'job-6',requested_window:{starts_at:'2026-09-08T09:00:00Z',ends_at:'2026-09-08T12:00:00Z'},eligible_workers:[
 {worker_id:'w1',available_units:6,capacity_units:8,utilization:.25,matched_capabilities:['cleaning.deep']},
 {worker_id:'w2',available_units:5,capacity_units:8,utilization:.375,matched_capabilities:['cleaning.deep']},
 {worker_id:'w3',available_units:4,capacity_units:8,utilization:.5,matched_capabilities:['cleaning.deep']}
],grants_authority:false};
const capacity={schema:'titan.workforce.workload-capacity.v1',company_id,worker_capacity:match.eligible_workers.map(w=>({...w,state:'BALANCED',grants_authority:false}))};
const skills={schema:'titan.workforce.skill-capability-registry.v1',company_id,worker_capabilities:[
 {worker_id:'w1',capability_id:'cleaning.deep',proficiency:4,verification_state:'VERIFIED'},
 {worker_id:'w2',capability_id:'cleaning.deep',proficiency:3,verification_state:'VERIFIED'},
 {worker_id:'w3',capability_id:'cleaning.deep',proficiency:2,verification_state:'EVIDENCED'}
]};
const equipment=[
 {company_id,equipment_id:'vac-1',equipment_type:'commercial_vacuum',state:'AVAILABLE',available_window:{starts_at:'2026-09-08T08:00:00Z',ends_at:'2026-09-08T13:00:00Z'}},
 {company_id,equipment_id:'steam-1',equipment_type:'steam_cleaner',state:'AVAILABLE',available_window:{starts_at:'2026-09-08T08:00:00Z',ends_at:'2026-09-08T13:00:00Z'}}
];
const input={company_id,schedule_intent_id:'sched-6',work_item_id:'job-6',service_type:'deep_clean',duration_minutes:150,crew_size:2,required_capabilities:[{capability_id:'cleaning.deep',min_proficiency:3,require_verified:true}],equipment_requirements:[{equipment_type:'commercial_vacuum',quantity:1},{equipment_type:'steam_cleaner',quantity:1}]};

test('builds deterministic cleaning crew/equipment recommendation without granting authority',()=>{
 const a=buildCleaningSchedulingRecommendation(input,match,capacity,skills,equipment);
 const b=buildCleaningSchedulingRecommendation(input,match,capacity,skills,equipment);
 assert.deepEqual(a,b);
 assert.equal(a.status,'READY_FOR_GOVERNED_ASSIGNMENT');
 assert.deepEqual(a.recommended_worker_ids,['w1','w2']);
 assert.equal(a.duration_minutes,150);
 assert.equal(a.crew_size,2);
 assert.deepEqual(a.reserved_equipment.map(x=>x.equipment_id),['vac-1','steam-1']);
 assert.equal(a.automatic_assignment,false);
 assert.equal(a.automatic_purchase,false);
 assert.equal(a.execution_permitted,false);
 assert.equal(a.grants_authority,false);
});

test('reports crew shortfall instead of weakening capability requirements',()=>{
 const r=buildCleaningSchedulingRecommendation({...input,crew_size:3},match,capacity,skills,equipment);
 assert.equal(r.status,'REQUIREMENTS_UNMET');
 assert.ok(r.unmet_requirements.some(x=>x.code==='CREW_SIZE_SHORTFALL'));
 assert.deepEqual(r.recommended_worker_ids,['w1','w2']);
});

test('reports equipment shortage and never invents inventory truth',()=>{
 const r=buildCleaningSchedulingRecommendation({...input,equipment_requirements:[{equipment_type:'commercial_vacuum',quantity:2}]},match,capacity,skills,equipment);
 assert.equal(r.status,'REQUIREMENTS_UNMET');
 assert.ok(r.unmet_requirements.some(x=>x.code==='EQUIPMENT_SHORTFALL'));
 assert.equal(r.synthetic_equipment_truth,false);
 assert.equal(r.automatic_purchase,false);
});

test('rejects cross-company equipment evidence',()=>{
 assert.throws(()=>buildCleaningSchedulingRecommendation(input,match,capacity,skills,[{...equipment[0],company_id:'company:other'}]),/cross-company-equipment-denied/);
});

test('fails closed on legacy tenant keys',()=>{
 assert.throws(()=>buildCleaningSchedulingRecommendation({...input,tenant_id:'legacy'},match,capacity,skills,equipment),/legacy-company-boundary/);
});
