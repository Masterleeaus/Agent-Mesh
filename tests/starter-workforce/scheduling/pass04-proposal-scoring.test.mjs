import test from 'node:test';
import assert from 'node:assert/strict';
import { scoreSchedulingProposal, generateAlternativeWindows, buildGovernedRescheduleRecommendation } from '../../../titan-workforce/starter-agents/scheduling/scheduling-adapter.mjs';

const matchResult={
 schema:'titan.scheduling.match-result.v1',company_id:'c1',schedule_intent_id:'si1',work_item_id:'w1',
 requested_window:{starts_at:'2026-09-08T09:00:00Z',ends_at:'2026-09-08T10:00:00Z'},
 eligible_workers:[
  {worker_id:'w-b',available_units:4,capacity_units:8,utilization:0.5,matched_capabilities:['clean'],window_match:'FULL',grants_authority:false},
  {worker_id:'w-a',available_units:6,capacity_units:8,utilization:0.25,matched_capabilities:['clean'],window_match:'FULL',grants_authority:false}
 ],
 conflict:null,requires_governed_assignment:true,requires_fresh_authority_evaluation:true,automatic_assignment:false,direct_mutation:false,execution_permitted:false,grants_authority:false
};

test('scores eligible workers deterministically without creating authority',()=>{
 const out=scoreSchedulingProposal(matchResult,{preferred_worker_ids:['w-b'],utilization_weight:60,preference_weight:10,capacity_weight:30});
 assert.equal(out.schema,'titan.scheduling.scored-proposal.v1');
 assert.deepEqual(out.ranked_workers.map(x=>x.worker_id),['w-a','w-b']);
 assert.ok(out.ranked_workers[0].score>out.ranked_workers[1].score);
 assert.equal(out.automatic_assignment,false);
 assert.equal(out.execution_permitted,false);
 assert.equal(out.grants_authority,false);
 assert.equal(out.requires_fresh_authority_evaluation,true);
});

test('generates bounded deterministic alternative windows from worker availability only',()=>{
 const out=generateAlternativeWindows({company_id:'c1',schedule_intent_id:'si1',work_item_id:'w1',requested_window:matchResult.requested_window,duration_minutes:60},[
  {company_id:'c1',worker_id:'w-a',windows:[{starts_at:'2026-09-08T11:00:00Z',ends_at:'2026-09-08T13:00:00Z'}]},
  {company_id:'c1',worker_id:'w-b',windows:[{starts_at:'2026-09-08T10:30:00Z',ends_at:'2026-09-08T12:00:00Z'}]}
 ],{limit:3,step_minutes:30});
 assert.equal(out.schema,'titan.scheduling.alternative-windows.v1');
 assert.deepEqual(out.alternatives.map(x=>[x.worker_id,x.starts_at,x.ends_at]),[
  ['w-b','2026-09-08T10:30:00.000Z','2026-09-08T11:30:00.000Z'],
  ['w-a','2026-09-08T11:00:00.000Z','2026-09-08T12:00:00.000Z'],
  ['w-b','2026-09-08T11:00:00.000Z','2026-09-08T12:00:00.000Z']
 ]);
 assert.equal(out.synthetic_calendar_truth,false);
 assert.equal(out.grants_authority,false);
});

test('alternative generation rejects cross-company availability',()=>{
 assert.throws(()=>generateAlternativeWindows({company_id:'c1',schedule_intent_id:'si1',work_item_id:'w1',requested_window:matchResult.requested_window,duration_minutes:60},[
  {company_id:'c2',worker_id:'w-x',windows:[{starts_at:'2026-09-08T11:00:00Z',ends_at:'2026-09-08T13:00:00Z'}]}
 ]),/cross-company-availability-denied/);
});

test('builds governed reschedule recommendation from a selected derived alternative',()=>{
 const alternative={worker_id:'w-b',starts_at:'2026-09-08T10:30:00.000Z',ends_at:'2026-09-08T11:30:00.000Z',source:'WORKER_AVAILABILITY_DERIVED'};
 const out=buildGovernedRescheduleRecommendation({company_id:'c1',schedule_intent_id:'si1',work_item_id:'w1',idempotency_key:'idem1'},alternative,'NO_TIME_WINDOW');
 assert.equal(out.schema,'titan.scheduling.reschedule-recommendation.v1');
 assert.equal(out.company_id,'c1');
 assert.equal(out.recommended_worker_id,'w-b');
 assert.deepEqual(out.recommended_window,{starts_at:alternative.starts_at,ends_at:alternative.ends_at});
 assert.equal(out.requires_governed_assignment,true);
 assert.equal(out.requires_fresh_authority_evaluation,true);
 assert.equal(out.automatic_assignment,false);
 assert.equal(out.direct_mutation,false);
 assert.equal(out.execution_permitted,false);
 assert.equal(out.grants_authority,false);
});

test('reschedule recommendation rejects non-derived alternatives',()=>{
 assert.throws(()=>buildGovernedRescheduleRecommendation({company_id:'c1',schedule_intent_id:'si1',work_item_id:'w1',idempotency_key:'idem1'},
  {worker_id:'w-b',starts_at:'2026-09-08T10:30:00Z',ends_at:'2026-09-08T11:30:00Z',source:'BOOKING_PROVIDER_TRUTH'},'NO_TIME_WINDOW'),/derived-alternative-required/);
});
