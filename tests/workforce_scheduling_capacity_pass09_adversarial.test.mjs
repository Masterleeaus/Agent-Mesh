import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateWorkforceSchedulingConflicts } from '../titan-workforce/scheduling/workforce-scheduling-conflict-evaluator.mjs';
import { buildCleaningAssignmentRequirementSuggestions } from '../titan-workforce/scheduling/cleaning-assignment-requirement-suggestions.mjs';
import { buildAssignmentOfflineEnvelope, reconcileAssignmentRestart } from '../titan-workforce/scheduling/assignment-offline-restart-runtime.mjs';

const company_id = 'company-a';
const workerIds = Array.from({length: 40}, (_, i) => `w${i + 1}`);
const availability_capacity_state = {
  schema: 'titan.workforce.worker-availability-capacity-state.v1', company_id,
  workers: workerIds.map(worker_id => ({company_id, worker_id, eligible_for_scheduling_proposal: true, blockers: []}))
};
const candidate_match = {
  schema: 'titan.workforce.worker-skill-role-site-match.v1', company_id,
  workers: workerIds.map(worker_id => ({company_id, worker_id, eligible_for_scheduling_proposal: true, blockers: []}))
};
const assignment_hierarchy = {
  schema: 'titan.workforce.manager-supervisor-team-assignment-hierarchy.v1', company_id,
  mission_teams: [
    {mission_team_id:'team-a', candidate_workers: workerIds.slice(0,20).map(worker_id => ({worker_id}))},
    {mission_team_id:'team-b', candidate_workers: workerIds.slice(20).map(worker_id => ({worker_id}))}
  ]
};

function conflict(worker_id, start_ms, end_ms, overrides={}) {
  return evaluateWorkforceSchedulingConflicts({
    company_id,
    availability_capacity_state,
    candidate_match,
    assignment_hierarchy,
    proposed_assignment: {company_id, assignment_id:`p-${worker_id}-${start_ms}`, worker_id, site_id:'site-a', mission_team_id: workerIds.indexOf(worker_id) < 20 ? 'team-a' : 'team-b', start_ms, end_ms},
    existing_assignments: [],
    travel_evidence: [],
    ...overrides
  });
}

test('40-worker / 120-job clear-load scenario remains proposal-only and deterministic', () => {
  let clear = 0;
  for (let job=0; job<120; job++) {
    const worker_id = workerIds[job % workerIds.length];
    const start = 1_800_000 * job;
    const result = conflict(worker_id, start, start + 1_200_000);
    assert.equal(result.state, 'CLEAR_FOR_PROPOSAL_REVIEW');
    assert.equal(result.execution_permitted, false);
    assert.equal(result.grants_authority, false);
    clear++;
  }
  assert.equal(clear, 120);
});

test('same-worker double booking blocks every colliding proposal under load', () => {
  const existing = workerIds.map((worker_id, i) => ({company_id, assignment_id:`existing-${i}`, worker_id, site_id:'site-a', start_ms:10_000, end_ms:70_000}));
  let blocked=0;
  for (const worker_id of workerIds) {
    const result = conflict(worker_id, 20_000, 60_000, {existing_assignments:existing});
    assert.equal(result.state, 'BLOCKED');
    assert.ok(result.conflicts.some(c => c.type === 'DOUBLE_BOOKING'));
    blocked++;
  }
  assert.equal(blocked, 40);
});

test('travel gaps never guess duration: missing evidence reviews; impossible supplied travel blocks', () => {
  const existing = [{company_id, assignment_id:'a-prev', worker_id:'w1', site_id:'site-old', start_ms:0, end_ms:60*60*1000}];
  const missing = conflict('w1', 70*60*1000, 130*60*1000, {existing_assignments:existing});
  assert.notEqual(missing.state, 'BLOCKED');
  assert.ok(missing.conflicts.some(c => c.type === 'TRAVEL_EVIDENCE_MISSING'));
  const impossible = conflict('w1', 70*60*1000, 130*60*1000, {existing_assignments:existing, travel_evidence:[{company_id, worker_id:'w1', from_site_id:'site-old', to_site_id:'site-a', travel_minutes:30, source_ref:'route:1'}]});
  assert.equal(impossible.state, 'BLOCKED');
  assert.ok(impossible.conflicts.some(c => c.type === 'TRAVEL_OVERLAP'));
});

test('large crew/equipment request never invents workers or equipment availability', () => {
  const hierarchy = {schema:'titan.workforce.manager-supervisor-team-assignment-hierarchy.v1', company_id, mission_teams:[{mission_team_id:'team-a',candidate_workers:workerIds.slice(0,20).map(worker_id=>({worker_id}))}]};
  const conflicts = workerIds.slice(0,20).map(worker_id => ({company_id, proposed_assignment:{worker_id}, state:'CLEAR_FOR_PROPOSAL_REVIEW', conflicts:[]}));
  const result = buildCleaningAssignmentRequirementSuggestions({
    company_id,
    cleaning_requirements:{company_id,service_id:'svc-bulk',job_id:'job-bulk',site_id:'site-a',duration_minutes:480,crew_size:25,source_ref:'crm:bulk',equipment:[{company_id,equipment_id:'vacuum',quantity:25,source_ref:'job:eq'}]},
    assignment_hierarchy:hierarchy,
    candidate_match,
    conflict_evaluations:conflicts,
    equipment_availability:[{company_id,equipment_id:'vacuum',available_quantity:10,source_ref:'assets:10'}]
  });
  const suggestion=result.suggestions[0];
  assert.equal(suggestion.state,'BLOCKED');
  assert.equal(suggestion.suggested_worker_ids.length,20);
  assert.equal(suggestion.crew_size_shortage,5);
  assert.ok(suggestion.blockers.includes('CREW_SIZE_SHORTAGE:5'));
  assert.ok(suggestion.blockers.some(x=>x.startsWith('EQUIPMENT_SHORTAGE:vacuum:15')));
  assert.equal(result.automatic_assignment,false);
  assert.equal(result.grants_authority,false);
});

test('100 accepted-assignment restart replays are idempotent evidence-only, including duplicates', () => {
  const applied=[];
  for(let i=0;i<100;i++){
    const decision={assignment_id:`a${i}`,company_id,work_item_id:`job${i}`,worker_id:workerIds[i%workerIds.length],eligibility_checks:[],ranking_factors:{},decision_state:'assigned',revision:1,grants_authority:false};
    const receipt={company_id,assignment_id:`a${i}`,acceptance_id:`accept-${i}`,authority_decision_ref:`auth-${i}`,accepted_at:'2026-09-09T01:00:00Z',revision:1,idempotency_key:`accept:a${i}:1`};
    const envelope=buildAssignmentOfflineEnvelope({company_id,assignment_decision:decision,acceptance_receipt:receipt});
    const first=reconcileAssignmentRestart({company_id,envelope,current_assignment_revision:1,current_assignment_state:'assigned'});
    assert.equal(first.replay_outcome,'REVIEW_REQUIRED');
    assert.equal(first.accepted_state_manufactured,false);
    assert.equal(first.automatic_effect_replay,false);
    applied.push(receipt.idempotency_key);
    const duplicate=reconcileAssignmentRestart({company_id,envelope,current_assignment_revision:1,current_assignment_state:'assigned',applied_idempotency_keys:applied});
    assert.equal(duplicate.replay_outcome,'NOOP_ALREADY_APPLIED');
    assert.equal(duplicate.duplicate_effect_prevented,true);
  }
});

test('cross-company evidence fails closed even in bulk scenarios', () => {
  assert.throws(() => conflict('w1',0,1000,{existing_assignments:[{company_id:'company-b',assignment_id:'foreign',worker_id:'w1',site_id:'site-a',start_ms:2000,end_ms:3000}]}), /cross-company/);
});
