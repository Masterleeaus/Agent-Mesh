import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCleaningAssignmentRequirementSuggestions } from '../titan-workforce/scheduling/cleaning-assignment-requirement-suggestions.mjs';

const hierarchy = {
  schema: 'titan.workforce.manager-supervisor-team-assignment-hierarchy.v1',
  company_id: 'company-a',
  mission_teams: [
    {
      mission_team_id: 'team-a',
      supervisor_worker_id: 's1',
      coordinator_worker_id: 'w1',
      candidate_workers: [{ worker_id: 'w1' }, { worker_id: 'w2' }, { worker_id: 'w3' }]
    },
    {
      mission_team_id: 'team-b',
      supervisor_worker_id: 's2',
      coordinator_worker_id: 'w4',
      candidate_workers: [{ worker_id: 'w4' }]
    }
  ]
};

const candidateMatch = {
  schema: 'titan.workforce.worker-skill-role-site-match.v1',
  company_id: 'company-a',
  workers: [
    { company_id: 'company-a', worker_id: 'w1', eligible_for_scheduling_proposal: true, blockers: [] },
    { company_id: 'company-a', worker_id: 'w2', eligible_for_scheduling_proposal: true, blockers: [] },
    { company_id: 'company-a', worker_id: 'w3', eligible_for_scheduling_proposal: false, blockers: ['MISSING_VERIFIED_CAPABILITY:carpet'] },
    { company_id: 'company-a', worker_id: 'w4', eligible_for_scheduling_proposal: true, blockers: [] }
  ]
};

const conflictEvaluations = [
  { company_id: 'company-a', proposed_assignment: { worker_id: 'w1' }, state: 'CLEAR_FOR_PROPOSAL_REVIEW', conflicts: [] },
  { company_id: 'company-a', proposed_assignment: { worker_id: 'w2' }, state: 'CLEAR_FOR_PROPOSAL_REVIEW', conflicts: [] },
  { company_id: 'company-a', proposed_assignment: { worker_id: 'w3' }, state: 'BLOCKED', conflicts: [{ type: 'WORKER_MATCH_BLOCKED', severity: 'BLOCK' }] },
  { company_id: 'company-a', proposed_assignment: { worker_id: 'w4' }, state: 'CLEAR_FOR_PROPOSAL_REVIEW', conflicts: [] }
];

const base = {
  company_id: 'company-a',
  cleaning_requirements: {
    company_id: 'company-a',
    service_id: 'svc-clean',
    job_id: 'job-1',
    site_id: 'site-1',
    duration_minutes: 120,
    crew_size: 2,
    source_ref: 'crm:job:job-1',
    equipment: [
      { company_id: 'company-a', equipment_id: 'vacuum', quantity: 1, source_ref: 'job:eq:v1' },
      { company_id: 'company-a', equipment_id: 'mop-kit', quantity: 2, source_ref: 'job:eq:m2' }
    ]
  },
  assignment_hierarchy: hierarchy,
  candidate_match: candidateMatch,
  conflict_evaluations: conflictEvaluations,
  equipment_availability: [
    { company_id: 'company-a', equipment_id: 'vacuum', available_quantity: 1, source_ref: 'assets:vac:1' },
    { company_id: 'company-a', equipment_id: 'mop-kit', available_quantity: 2, source_ref: 'assets:mop:2' }
  ]
};

test('builds cleaning proposal with explicit duration, crew size and equipment evidence', () => {
  const result = buildCleaningAssignmentRequirementSuggestions(base);
  assert.equal(result.cleaning_requirements.duration_minutes, 120);
  assert.equal(result.cleaning_requirements.crew_size, 2);
  assert.deepEqual(result.best_suggestion.suggested_worker_ids, ['w1', 'w2']);
  assert.equal(result.best_suggestion.state, 'READY_FOR_ASSIGNMENT_PROPOSAL_REVIEW');
  assert.equal(result.duration_inferred, false);
  assert.equal(result.crew_size_inferred, false);
  assert.equal(result.equipment_inferred, false);
});

test('crew shortage blocks a team without inventing workers', () => {
  const result = buildCleaningAssignmentRequirementSuggestions({
    ...base,
    cleaning_requirements: { ...base.cleaning_requirements, crew_size: 3 }
  });
  const teamA = result.suggestions.find((item) => item.mission_team_id === 'team-a');
  assert.equal(teamA.state, 'BLOCKED');
  assert.equal(teamA.crew_size_shortage, 1);
  assert.ok(teamA.blockers.includes('CREW_SIZE_SHORTAGE:1'));
  assert.deepEqual(teamA.suggested_worker_ids, ['w1', 'w2']);
});

test('equipment shortage is explicit and asset availability is not inferred', () => {
  const result = buildCleaningAssignmentRequirementSuggestions({
    ...base,
    equipment_availability: [
      { company_id: 'company-a', equipment_id: 'vacuum', available_quantity: 1, source_ref: 'assets:vac:1' }
    ]
  });
  const teamA = result.suggestions.find((item) => item.mission_team_id === 'team-a');
  assert.equal(teamA.state, 'BLOCKED');
  assert.ok(teamA.blockers.some((item) => item.startsWith('EQUIPMENT_SHORTAGE:mop-kit:2')));
  const mop = teamA.equipment.find((item) => item.equipment_id === 'mop-kit');
  assert.equal(mop.available_quantity, 0);
  assert.equal(mop.availability_source_ref, null);
});

test('missing conflict evidence requires review and never bypasses Pass5', () => {
  const result = buildCleaningAssignmentRequirementSuggestions({
    ...base,
    conflict_evaluations: conflictEvaluations.filter((item) => item.proposed_assignment.worker_id !== 'w2')
  });
  const teamA = result.suggestions.find((item) => item.mission_team_id === 'team-a');
  assert.notEqual(teamA.state, 'READY_FOR_ASSIGNMENT_PROPOSAL_REVIEW');
  const w2 = teamA.suggested_worker_ids.includes('w2');
  assert.equal(w2, false);
  assert.ok(teamA.review_reasons.includes('CONFLICT_EVIDENCE_INCOMPLETE'));
});

test('requirements, identity and suggestions grant no authority; cross-company/legacy fail closed', () => {
  const result = buildCleaningAssignmentRequirementSuggestions(base);
  assert.equal(result.proposal_only, true);
  assert.equal(result.requires_fresh_assignment_authority, true);
  assert.equal(result.automatic_assignment, false);
  assert.equal(result.execution_permitted, false);
  assert.equal(result.grants_authority, false);

  assert.throws(() => buildCleaningAssignmentRequirementSuggestions({
    ...base,
    cleaning_requirements: { ...base.cleaning_requirements, company_id: 'company-b' }
  }), /cross-company/);

  assert.throws(() => buildCleaningAssignmentRequirementSuggestions({
    ...base,
    tenant_company_id: 'legacy'
  }), /legacy-tenant-boundary/);
});
