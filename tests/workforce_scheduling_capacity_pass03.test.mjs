import test from 'node:test';
import assert from 'node:assert/strict';
import { buildWorkerSkillRoleSiteMatch } from '../titan-workforce/scheduling/worker-skill-role-site-match.mjs';

const base = {
  schema: 'titan.workforce.worker-availability-capacity-state.v1',
  company_id: 'company-a',
  workers: [
    { company_id: 'company-a', worker_id: 'w1', eligible_for_scheduling_proposal: true, blockers: [] },
    { company_id: 'company-a', worker_id: 'w2', eligible_for_scheduling_proposal: true, blockers: [] },
    { company_id: 'company-a', worker_id: 'w3', eligible_for_scheduling_proposal: false, blockers: ['AVAILABILITY_UNAVAILABLE'] }
  ]
};

function build(overrides = {}) {
  return buildWorkerSkillRoleSiteMatch({
    company_id: 'company-a',
    site_id: 'site-1',
    now: 1000,
    availability_capacity_state: base,
    role_assignments: [
      { company_id: 'company-a', worker_id: 'w1', role_id: 'cleaner' },
      { company_id: 'company-a', worker_id: 'w2', role_id: 'cleaner' },
      { company_id: 'company-a', worker_id: 'w3', role_id: 'cleaner' }
    ],
    capabilities: [
      { company_id: 'company-a', worker_id: 'w1', capability_id: 'carpet', proficiency: 3, verified: true, source_ref: 'skill:w1' },
      { company_id: 'company-a', worker_id: 'w2', capability_id: 'carpet', proficiency: 3, verified: false, source_ref: 'skill:w2' },
      { company_id: 'company-a', worker_id: 'w3', capability_id: 'carpet', proficiency: 4, verified: true, source_ref: 'skill:w3' }
    ],
    site_eligibility: [
      { company_id: 'company-a', worker_id: 'w1', site_ids: ['site-1'], source_ref: 'site:w1' },
      { company_id: 'company-a', worker_id: 'w2', site_ids: ['site-1'], source_ref: 'site:w2' },
      { company_id: 'company-a', worker_id: 'w3', site_ids: ['site-1'], source_ref: 'site:w3' }
    ],
    required_roles: ['cleaner'],
    required_capabilities: [{ capability_id: 'carpet', minimum_proficiency: 2 }],
    ...overrides
  });
}

test('intersects availability/capacity, verified skill, role and site evidence', () => {
  const result = build();
  assert.equal(result.summary.workers_eligible, 1);
  assert.equal(result.workers.find((w) => w.worker_id === 'w1').eligible_for_scheduling_proposal, true);
  assert.ok(result.workers.find((w) => w.worker_id === 'w2').blockers.includes('MISSING_VERIFIED_CAPABILITY:carpet'));
  assert.ok(result.workers.find((w) => w.worker_id === 'w3').blockers.includes('AVAILABILITY_UNAVAILABLE'));
});

test('missing required role blocks candidate', () => {
  const result = build({ required_roles: ['supervisor'] });
  assert.equal(result.summary.workers_eligible, 0);
  assert.ok(result.workers[0].blockers.includes('MISSING_ROLE:supervisor'));
});

test('site eligibility is explicit and never inferred', () => {
  const result = build({
    site_eligibility: [{ company_id: 'company-a', worker_id: 'w1', site_ids: ['site-2'] }]
  });
  const w1 = result.workers.find((w) => w.worker_id === 'w1');
  const w2 = result.workers.find((w) => w.worker_id === 'w2');
  assert.ok(w1.blockers.includes('SITE_NOT_ELIGIBLE:site-1'));
  assert.ok(w2.blockers.includes('SITE_ELIGIBILITY_UNKNOWN'));
});

test('matching never grants authority', () => {
  const result = build();
  assert.equal(result.proposal_only, true);
  assert.equal(result.identity_is_not_authority, true);
  assert.equal(result.role_is_not_authority, true);
  assert.equal(result.capability_is_not_authority, true);
  assert.equal(result.site_match_is_not_authority, true);
  assert.equal(result.requires_fresh_assignment_authority, true);
  assert.equal(result.execution_permitted, false);
  assert.equal(result.grants_authority, false);
});

test('cross-company and legacy boundaries fail closed', () => {
  assert.throws(() => buildWorkerSkillRoleSiteMatch({
    company_id: 'company-a',
    site_id: 'site-1',
    availability_capacity_state: { ...base, company_id: 'company-b' }
  }), /cross-company/);

  assert.throws(() => build({
    capabilities: [{ company_id: 'company-b', worker_id: 'w1', capability_id: 'carpet', verified: true }]
  }), /cross-company/);

  assert.throws(() => buildWorkerSkillRoleSiteMatch({
    company_id: 'company-a',
    tenant_company_id: 'legacy',
    site_id: 'site-1',
    availability_capacity_state: base
  }), /legacy tenant boundary/);
});
