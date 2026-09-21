import test from 'node:test';
import assert from 'node:assert/strict';
import { matchSchedulingCandidates, classifySchedulingConflict } from '../../../titan-workforce/starter-agents/scheduling/scheduling-matcher.mjs';

const capacity = {
  schema: 'titan.workforce.workload-capacity.v1', company_id: 'co-1',
  worker_capacity: [
    {worker_id:'w-a', available_units:6, capacity_units:10, utilization:.4, state:'BALANCED'},
    {worker_id:'w-b', available_units:8, capacity_units:10, utilization:.2, state:'BALANCED'},
    {worker_id:'w-c', available_units:0, capacity_units:10, utilization:1.1, state:'OVERLOADED'}
  ]
};
const skills = {
  schema: 'titan.workforce.skill-capability-registry.v1', company_id: 'co-1',
  worker_capabilities: [
    {worker_id:'w-a', capability_id:'electrical', proficiency:4, verification_state:'VERIFIED'},
    {worker_id:'w-b', capability_id:'electrical', proficiency:4, verification_state:'VERIFIED'},
    {worker_id:'w-b', capability_id:'confined-space', proficiency:3, verification_state:'VERIFIED'},
    {worker_id:'w-c', capability_id:'electrical', proficiency:5, verification_state:'VERIFIED'}
  ]
};
const availability = [
  {company_id:'co-1', worker_id:'w-a', windows:[{starts_at:'2026-09-08T09:00:00+10:00',ends_at:'2026-09-08T12:00:00+10:00'}]},
  {company_id:'co-1', worker_id:'w-b', windows:[{starts_at:'2026-09-08T08:00:00+10:00',ends_at:'2026-09-08T17:00:00+10:00'}]},
  {company_id:'co-1', worker_id:'w-c', windows:[{starts_at:'2026-09-08T08:00:00+10:00',ends_at:'2026-09-08T17:00:00+10:00'}]}
];

test('Pass 3 ranks only workers satisfying capacity, verified capability and the full requested window', () => {
  const result = matchSchedulingCandidates({
    company_id:'co-1', schedule_intent_id:'si-1', work_item_id:'job-1', required_capacity_units:2,
    required_capabilities:[{capability_id:'electrical',min_proficiency:3,require_verified:true},{capability_id:'confined-space',min_proficiency:2,require_verified:true}],
    requested_window:{starts_at:'2026-09-08T10:00:00+10:00',ends_at:'2026-09-08T11:00:00+10:00'}
  }, capacity, skills, availability);
  assert.equal(result.conflict, null);
  assert.deepEqual(result.eligible_workers.map(x=>x.worker_id), ['w-b']);
  assert.equal(result.eligible_workers[0].grants_authority, false);
  assert.equal(result.automatic_assignment, false);
  assert.equal(result.execution_permitted, false);
});

test('Pass 3 returns capability conflict when capacity/time exist but required capability is absent', () => {
  const result = matchSchedulingCandidates({company_id:'co-1',schedule_intent_id:'si-2',work_item_id:'job-2',required_capacity_units:1,required_capabilities:['gasfitting'],requested_window:{starts_at:'2026-09-08T10:00:00+10:00',ends_at:'2026-09-08T11:00:00+10:00'}}, capacity, skills, availability);
  assert.equal(result.conflict?.code, 'MISSING_CAPABILITY');
  assert.deepEqual(result.conflict.missing_capabilities, ['gasfitting']);
});

test('Pass 3 distinguishes no-time-window from no-capacity', () => {
  const noTime = matchSchedulingCandidates({company_id:'co-1',schedule_intent_id:'si-3',work_item_id:'job-3',required_capacity_units:1,required_capabilities:['electrical'],requested_window:{starts_at:'2026-09-08T18:00:00+10:00',ends_at:'2026-09-08T19:00:00+10:00'}}, capacity, skills, availability);
  assert.equal(noTime.conflict?.code, 'NO_TIME_WINDOW');
  const noCapacity = matchSchedulingCandidates({company_id:'co-1',schedule_intent_id:'si-4',work_item_id:'job-4',required_capacity_units:20,required_capabilities:['electrical'],requested_window:{starts_at:'2026-09-08T10:00:00+10:00',ends_at:'2026-09-08T11:00:00+10:00'}}, capacity, skills, availability);
  assert.equal(noCapacity.conflict?.code, 'NO_CAPACITY');
});

test('Pass 3 fails closed on cross-company dependencies and legacy tenant keys', () => {
  assert.throws(()=>matchSchedulingCandidates({company_id:'co-1',schedule_intent_id:'si-x',work_item_id:'job-x',tenant_id:'old',requested_window:{starts_at:'2026-09-08T10:00:00+10:00',ends_at:'2026-09-08T11:00:00+10:00'}},capacity,skills,availability),/legacy-company-boundary/);
  assert.throws(()=>matchSchedulingCandidates({company_id:'co-1',schedule_intent_id:'si-x',work_item_id:'job-x',requested_window:{starts_at:'2026-09-08T10:00:00+10:00',ends_at:'2026-09-08T11:00:00+10:00'}},{...capacity,company_id:'co-2'},skills,availability),/cross-company-capacity/);
});

test('Pass 3 conflict classifier rejects invalid windows deterministically', () => {
  const conflict = classifySchedulingConflict({requested_window:{starts_at:'2026-09-08T11:00:00+10:00',ends_at:'2026-09-08T10:00:00+10:00'}},{capacityEligible:[],capabilityEligible:[],timeEligible:[]});
  assert.equal(conflict.code,'INVALID_WINDOW');
  assert.equal(conflict.grants_authority,false);
});
