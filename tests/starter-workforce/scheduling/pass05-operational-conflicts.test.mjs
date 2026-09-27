import test from 'node:test';
import assert from 'node:assert/strict';
import { detectSchedulingConflicts } from '../../../titan-workforce/starter-agents/scheduling/scheduling-conflict-detector.mjs';

const baseInput={company_id:'co-1',schedule_intent_id:'sched-5',work_item_id:'job-new',worker_id:'w1',requested_window:{starts_at:'2026-09-08T10:00:00Z',ends_at:'2026-09-08T11:00:00Z'},site_id:'site-new'};
const availability=[{company_id:'co-1',worker_id:'w1',windows:[{starts_at:'2026-09-08T08:00:00Z',ends_at:'2026-09-08T18:00:00Z'}]}];

test('detects direct double-booking against existing schedule truth',()=>{
 const result=detectSchedulingConflicts(baseInput,[{company_id:'co-1',assignment_id:'a1',worker_id:'w1',work_item_id:'job-old',site_id:'site-old',starts_at:'2026-09-08T10:30:00Z',ends_at:'2026-09-08T11:30:00Z'}],availability,[]);
 assert.equal(result.has_conflict,true);
 assert.deepEqual(result.conflicts.map(x=>x.code),['DOUBLE_BOOKING']);
 assert.equal(result.execution_permitted,false);
 assert.equal(result.grants_authority,false);
});

test('detects unavailable worker when requested window is outside explicit availability',()=>{
 const result=detectSchedulingConflicts({...baseInput,requested_window:{starts_at:'2026-09-08T19:00:00Z',ends_at:'2026-09-08T20:00:00Z'}},[],availability,[]);
 assert.deepEqual(result.conflicts.map(x=>x.code),['WORKER_UNAVAILABLE']);
});

test('detects travel overlap only from supplied travel-duration evidence',()=>{
 const assignments=[{company_id:'co-1',assignment_id:'a-prev',worker_id:'w1',work_item_id:'job-prev',site_id:'site-prev',starts_at:'2026-09-08T08:30:00Z',ends_at:'2026-09-08T09:45:00Z'}];
 const travel=[{company_id:'co-1',from_site_id:'site-prev',to_site_id:'site-new',duration_minutes:30,source:'ROUTING_PROVIDER'}];
 const result=detectSchedulingConflicts(baseInput,assignments,availability,travel);
 assert.deepEqual(result.conflicts.map(x=>x.code),['TRAVEL_OVERLAP']);
 assert.equal(result.conflicts[0].required_travel_minutes,30);
 assert.equal(result.conflicts[0].available_gap_minutes,15);
});

test('does not invent travel conflict when travel evidence is absent',()=>{
 const assignments=[{company_id:'co-1',assignment_id:'a-prev',worker_id:'w1',work_item_id:'job-prev',site_id:'site-prev',starts_at:'2026-09-08T08:30:00Z',ends_at:'2026-09-08T09:59:00Z'}];
 const result=detectSchedulingConflicts(baseInput,assignments,availability,[]);
 assert.equal(result.has_conflict,false);
 assert.equal(result.travel_evidence_complete,false);
});

test('fails closed on cross-company and legacy tenant evidence',()=>{
 assert.throws(()=>detectSchedulingConflicts(baseInput,[{company_id:'co-2',worker_id:'w1',starts_at:'2026-09-08T09:00:00Z',ends_at:'2026-09-08T09:30:00Z'}],availability,[]),/cross-company-assignment-denied/);
 assert.throws(()=>detectSchedulingConflicts({...baseInput,tenant_id:'legacy'},[],availability,[]),/legacy-company-boundary/);
 assert.throws(()=>detectSchedulingConflicts(baseInput,[],availability,[{company_id:'co-2',from_site_id:'x',to_site_id:'y',duration_minutes:10}]),/cross-company-travel-evidence-denied/);
});

test('returns authority-neutral no-conflict result for a clean schedule',()=>{
 const result=detectSchedulingConflicts(baseInput,[],availability,[]);
 assert.equal(result.schema,'titan.scheduling.operational-conflict-result.v1');
 assert.equal(result.has_conflict,false);
 assert.deepEqual(result.conflicts,[]);
 assert.equal(result.requires_fresh_authority_evaluation,true);
 assert.equal(result.automatic_reschedule,false);
 assert.equal(result.direct_mutation,false);
 assert.equal(result.execution_permitted,false);
 assert.equal(result.grants_authority,false);
});
