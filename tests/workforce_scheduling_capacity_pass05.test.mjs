import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateWorkforceSchedulingConflicts } from '../titan-workforce/scheduling/workforce-scheduling-conflict-evaluator.mjs';

const availability = {
  schema: 'titan.workforce.worker-availability-capacity-state.v1',
  company_id: 'company-a',
  workers: [
    { company_id: 'company-a', worker_id: 'w1', eligible_for_scheduling_proposal: true, blockers: [] },
    { company_id: 'company-a', worker_id: 'w2', eligible_for_scheduling_proposal: false, blockers: ['AVAILABILITY_UNAVAILABLE'] }
  ]
};

const match = {
  schema: 'titan.workforce.worker-skill-role-site-match.v1',
  company_id: 'company-a',
  workers: [
    { company_id: 'company-a', worker_id: 'w1', eligible_for_scheduling_proposal: true, blockers: [] },
    { company_id: 'company-a', worker_id: 'w2', eligible_for_scheduling_proposal: false, blockers: ['MISSING_VERIFIED_CAPABILITY:carpet'] }
  ]
};

const hierarchy = {
  schema: 'titan.workforce.manager-supervisor-team-assignment-hierarchy.v1',
  company_id: 'company-a',
  mission_teams: [{
    mission_team_id: 'team-1',
    candidate_workers: [{ worker_id: 'w1' }, { worker_id: 'w2' }]
  }]
};

const baseInput = {
  company_id: 'company-a',
  availability_capacity_state: availability,
  candidate_match: match,
  assignment_hierarchy: hierarchy,
  proposed_assignment: {
    company_id: 'company-a',
    assignment_id: 'proposal-1',
    worker_id: 'w1',
    site_id: 'site-b',
    mission_team_id: 'team-1',
    start_ms: 10 * 60_000,
    end_ms: 20 * 60_000
  },
  existing_assignments: [],
  travel_evidence: []
};

test('detects worker double booking', () => {
  const result = evaluateWorkforceSchedulingConflicts({
    ...baseInput,
    existing_assignments: [{
      company_id: 'company-a', assignment_id: 'existing-1', worker_id: 'w1',
      site_id: 'site-a', start_ms: 15 * 60_000, end_ms: 25 * 60_000
    }]
  });
  assert.equal(result.state, 'BLOCKED');
  assert.ok(result.conflicts.some((conflict) => conflict.type === 'DOUBLE_BOOKING'));
});

test('explicit unavailable worker fails closed using Pass2 evidence', () => {
  const result = evaluateWorkforceSchedulingConflicts({
    ...baseInput,
    proposed_assignment: { ...baseInput.proposed_assignment, worker_id: 'w2' }
  });
  assert.equal(result.state, 'BLOCKED');
  assert.ok(result.conflicts.some((conflict) => conflict.type === 'WORKER_UNAVAILABLE'));
  assert.ok(result.conflicts.some((conflict) => conflict.type === 'WORKER_MATCH_BLOCKED'));
});

test('travel overlap uses supplied evidence and never guesses travel time', () => {
  const existing = [{
    company_id: 'company-a', assignment_id: 'existing-1', worker_id: 'w1',
    site_id: 'site-a', start_ms: 0, end_ms: 5 * 60_000
  }];
  const missing = evaluateWorkforceSchedulingConflicts({ ...baseInput, existing_assignments: existing });
  assert.equal(missing.state, 'REVIEW_REQUIRED');
  assert.ok(missing.conflicts.some((conflict) => conflict.type === 'TRAVEL_EVIDENCE_MISSING'));
  assert.equal(missing.travel_time_inferred, false);

  const evidenced = evaluateWorkforceSchedulingConflicts({
    ...baseInput,
    existing_assignments: existing,
    travel_evidence: [{
      company_id: 'company-a', worker_id: 'w1',
      from_site_id: 'site-a', to_site_id: 'site-b',
      travel_minutes: 8, source_ref: 'route:evidence-1'
    }]
  });
  assert.equal(evidenced.state, 'BLOCKED');
  const travel = evidenced.conflicts.find((conflict) => conflict.type === 'TRAVEL_OVERLAP');
  assert.equal(travel.required_travel_minutes, 8);
  assert.equal(travel.available_gap_minutes, 5);
  assert.equal(travel.source_ref, 'route:evidence-1');
});

test('team mismatch is a proposal blocker but hierarchy grants no authority', () => {
  const result = evaluateWorkforceSchedulingConflicts({
    ...baseInput,
    proposed_assignment: { ...baseInput.proposed_assignment, mission_team_id: 'team-x' }
  });
  assert.equal(result.state, 'BLOCKED');
  assert.ok(result.conflicts.some((conflict) => conflict.type === 'TEAM_MEMBERSHIP_MISMATCH'));
  assert.equal(result.proposal_only, true);
  assert.equal(result.requires_fresh_assignment_authority, true);
  assert.equal(result.automatic_reschedule, false);
  assert.equal(result.execution_permitted, false);
  assert.equal(result.grants_authority, false);
});

test('cross-company and legacy boundaries fail closed', () => {
  assert.throws(() => evaluateWorkforceSchedulingConflicts({
    ...baseInput,
    proposed_assignment: { ...baseInput.proposed_assignment, company_id: 'company-b' }
  }), /cross-company/);

  assert.throws(() => evaluateWorkforceSchedulingConflicts({
    ...baseInput,
    tenant_company_id: 'legacy'
  }), /legacy-tenant-boundary/);

  assert.throws(() => evaluateWorkforceSchedulingConflicts({
    ...baseInput,
    travel_evidence: [{
      company_id: 'company-b', worker_id: 'w1',
      from_site_id: 'site-a', to_site_id: 'site-b', travel_minutes: 5
    }]
  }), /cross-company/);
});
