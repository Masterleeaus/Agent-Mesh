import test from 'node:test';
import assert from 'node:assert/strict';
import { buildManagerSupervisorTeamAssignmentHierarchy } from '../titan-workforce/scheduling/manager-supervisor-team-assignment-hierarchy.mjs';

const graph = {
  schema: 'titan.workforce.graph.v1',
  company_id: 'company-a',
  projection_revision: 8,
  projection_cursor: 'cursor-8',
  nodes: [
    { node_id: 'worker:m1', entity_id: 'm1', kind: 'worker', company_id: 'company-a' },
    { node_id: 'worker:s1', entity_id: 's1', kind: 'worker', company_id: 'company-a' },
    { node_id: 'worker:w1', entity_id: 'w1', kind: 'worker', company_id: 'company-a' },
    { node_id: 'worker:w2', entity_id: 'w2', kind: 'worker', company_id: 'company-a' }
  ],
  edges: [
    { type: 'REPORTS_TO', from: 'worker:s1', to: 'worker:m1', company_id: 'company-a' },
    { type: 'REPORTS_TO', from: 'worker:w1', to: 'worker:s1', company_id: 'company-a' },
    { type: 'REPORTS_TO', from: 'worker:w2', to: 'worker:s1', company_id: 'company-a' }
  ]
};

const supervision = [{
  schema: 'titan.workforce.supervision.v1',
  company_id: 'company-a',
  supervisor_worker_id: 's1',
  coordination_state: 'active',
  scope: {
    scoped_worker_ids: ['s1', 'w1', 'w2'],
    subordinate_worker_ids: ['w1', 'w2'],
    direct_subordinate_worker_ids: ['w1', 'w2']
  },
  grants_authority: false
}];

const missionTeams = [{
  schema: 'titan.workforce.mission-team.v1',
  company_id: 'company-a',
  mission_team_id: 'team-cleaning-1',
  mission_id: 'mission-1',
  state: 'ACTIVE',
  supervisor_worker_id: 's1',
  coordinator_worker_id: 'w1',
  members: [{ worker_id: 'w1' }, { worker_id: 'w2' }],
  grants_authority: false
}];

const candidateMatch = {
  schema: 'titan.workforce.worker-skill-role-site-match.v1',
  company_id: 'company-a',
  workers: [
    { company_id: 'company-a', worker_id: 'w1', eligible_for_scheduling_proposal: true, blockers: [] },
    { company_id: 'company-a', worker_id: 'w2', eligible_for_scheduling_proposal: false, blockers: ['SITE_ELIGIBILITY_UNKNOWN'] },
    { company_id: 'company-a', worker_id: 's1', eligible_for_scheduling_proposal: false, blockers: ['NO_AVAILABLE_CAPACITY'] }
  ]
};

function build(overrides = {}) {
  return buildManagerSupervisorTeamAssignmentHierarchy({
    company_id: 'company-a',
    workforce_graph: graph,
    manager_worker_ids: ['m1'],
    supervision_records: supervision,
    mission_teams: missionTeams,
    candidate_match: candidateMatch,
    ...overrides
  });
}

test('derives manager > supervisor > team structure from canonical contracts', () => {
  const result = build();
  assert.deepEqual(result.managers[0].direct_report_worker_ids, ['s1']);
  assert.deepEqual(result.managers[0].subordinate_worker_ids, ['s1', 'w1', 'w2']);
  assert.deepEqual(result.managers[0].supervisor_worker_ids, ['s1']);
  assert.deepEqual(result.managers[0].mission_team_ids, ['team-cleaning-1']);
});

test('preserves candidate blockers inside team projection', () => {
  const result = build();
  const team = result.mission_teams[0];
  const w1 = team.candidate_workers.find((worker) => worker.worker_id === 'w1');
  const w2 = team.candidate_workers.find((worker) => worker.worker_id === 'w2');
  assert.equal(w1.eligible_for_scheduling_proposal, true);
  assert.equal(w2.eligible_for_scheduling_proposal, false);
  assert.deepEqual(w2.blockers, ['SITE_ELIGIBILITY_UNKNOWN']);
});

test('manager, supervisor and team identity never grant assignment authority', () => {
  const result = build();
  assert.equal(result.proposal_only, true);
  assert.equal(result.hierarchy_is_coordination_not_authority, true);
  assert.equal(result.manager_identity_confers_authority, false);
  assert.equal(result.supervisor_identity_confers_authority, false);
  assert.equal(result.team_membership_confers_authority, false);
  assert.equal(result.requires_fresh_assignment_authority, true);
  assert.equal(result.execution_permitted, false);
  assert.equal(result.grants_authority, false);
});

test('cross-company, missing-worker and legacy boundaries fail closed', () => {
  assert.throws(() => build({
    supervision_records: [{ ...supervision[0], company_id: 'company-b' }]
  }), /cross-company/);

  assert.throws(() => build({
    manager_worker_ids: ['not-in-graph']
  }), /manager-not-in-graph/);

  assert.throws(() => buildManagerSupervisorTeamAssignmentHierarchy({
    company_id: 'company-a',
    tenant_company_id: 'legacy',
    workforce_graph: graph
  }), /legacy-tenant-boundary/);
});

test('cyclic reporting hierarchy is rejected', () => {
  const cyclic = {
    ...graph,
    edges: [
      ...graph.edges,
      { type: 'REPORTS_TO', from: 'worker:m1', to: 'worker:w1', company_id: 'company-a' }
    ]
  };
  assert.throws(() => build({ workforce_graph: cyclic }), /reporting-cycle-rejected/);
});
