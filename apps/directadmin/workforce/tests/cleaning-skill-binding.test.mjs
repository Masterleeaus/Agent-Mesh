import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { WorkforceApi } from '../images/api.mjs';
import { CLEANING_SERVICE_BY_ID, CLEANING_SERVICE_CATALOGUE } from '../../../../packages/titan-platform/src/verticals/cleaning/catalogue.ts';
import { buildEvidenceBackedSkillProof } from '../../../../packages/titan-platform/src/ported/titan-workforce/capability/evidence-backed-skill-proof.mjs';

const company_id = 'company-cleaning-a';
const context_revision = 'ctx-cleaning-7';
const actor_id = 'actor-manager-a';
const target_worker_id = 'worker-cleaner-a';
const service = CLEANING_SERVICE_BY_ID.regular_clean;

function canonicalSkills({
  company = company_id,
  revision = context_revision,
  worker = target_worker_id,
  capability = service.skills[0],
  verification_state = 'VERIFIED',
  proficiency = 4,
  required_min_proficiency = 3,
  require_verified = true,
  meets_registry_requirement = true,
} = {}) {
  const registry = {
    schema: 'titan.workforce.skill-capability-registry.v1', company_id: company,
    graph_revision: 9, updated_at: '2026-10-03T00:00:00.000Z',
    grants_authority: false, execution_permitted: false,
    worker_capabilities: [{ worker_id: worker, capability_id: capability, proficiency,
      proficiency_level: 'ADVANCED', verification_state,
      evidence: [{ evidence_id: 'proof:cleaning-a:worker-cleaner-a:general-cleaning' }] }],
  };
  const matrix = {
    schema: 'titan.workforce.capability-matrix.v1', company_id: company,
    grants_authority: false, execution_permitted: false,
    workers: [{ worker_id: worker, capabilities: [{ capability_id: capability,
      meets_registry_requirement, required_min_proficiency, require_verified }] }],
  };
  const proof = buildEvidenceBackedSkillProof(registry, null, matrix);
  return {
    schema: 'titan.directadmin.workforce-skills.v1', company_id: company, context_revision: revision,
    read_only: true, capability_presence_confers_authority: false, verification_confers_authority: false,
    assignment_decision: false, routing_decision: false, entitlement_decision: false,
    execution_permitted: false, grants_authority: false,
    status: 'available', source: 'canonical-workforce-skill-capability-registry',
    freshness: '2026-10-03T00:00:00.000Z', source_revision: 9,
    evidence_refs: proof.skill_proofs.flatMap(skill => skill.evidence_refs), projection: proof,
  };
}

function sessionFixture({ skills = canonicalSkills(), required_capabilities = service.skills,
  worker_id = target_worker_id, worker_company_id = company_id, worker_capabilities = [],
  includeSkills = true,
} = {}) {
  const calls = [];
  const workers = [{ company_id: worker_company_id, worker_id, kind: 'human', active: true,
    // This raw array is deliberately empty: eligibility comes from the canonical proof projection.
    capabilities: worker_capabilities }];
  return {
    calls,
    connect: async () => ({ company_id, actor_id, session_revision: 3, context_revision }),
    projection: async plugin => {
      calls.push(['projection', plugin]);
      const discovery = { company_id, workers, controls: [{ action: 'reassign',
        capability_id: 'titan.workforce.reassign', requires_fresh_approval: true, grants_authority: false }] };
      if (includeSkills) discovery.skills = skills;
      return { company_id, source: 'canonical-workforce-runtime', freshness: '2026-10-03T00:00:00.000Z',
        evidence_refs: [], data: { schema: 'titan.workforce-cockpit.v1', company_id, discovery,
          status: { company_id, work: [{ company_id, work_id: 'work-regular-clean-a', state: 'READY',
            assignee: 'worker-cleaner-previous', required_capabilities, context_refs: [], evidence_refs: [] }] } } };
    },
    intent: async (plugin, intent) => {
      calls.push(['intent', plugin, intent]);
      return { status: 'REQUESTED', receipt_id: 'receipt-cleaning-a', correlation_id: intent.correlation_id };
    },
  };
}

function validBundleJobTypes() {
  const bundle = JSON.parse(readFileSync(new URL('../../../../packages/modules/bundles/cleaning-workforce.bundle.json', import.meta.url), 'utf8'));
  const cleaning = bundle.modules.find(module => module.id === 'titan.workforce.cleaning');
  return cleaning.contributes.projections.find(projection => projection.id === 'job-types').value;
}

test('supported regular-clean work binds the current company worker to its canonical verified skill proof', async () => {
  assert.equal(service.id, 'regular_clean');
  assert.deepEqual(service.skills, ['general_cleaning']);
  assert.equal(service.retained_job_type_id, 'domestic_recurring');
  assert.ok(validBundleJobTypes().some(jobType => jobType.id === service.retained_job_type_id));

  const session = sessionFixture();
  let id = 0;
  const api = new WorkforceApi(session, () => 'operation-cleaning-' + (++id));
  const receipt = await api.control({ company_id, actor_id, context_revision }, {
    action: 'reassign', work_id: 'work-regular-clean-a', target_worker_id, reason: 'Assign qualified cleaner',
  });

  assert.equal(receipt.state, 'REQUESTED');
  assert.deepEqual(receipt.evidence_refs, []);
  const intent = session.calls.find(([kind]) => kind === 'intent');
  assert.equal(intent[1], 'titan_workforce');
  assert.equal(intent[2].company_id, company_id);
  assert.equal(intent[2].actor_id, actor_id);
  assert.equal(intent[2].input.target_worker_id, target_worker_id);
  assert.equal(intent[2].input.expected_assignee_id, 'worker-cleaner-previous');
  assert.equal(intent[2].capability_id, 'titan.workforce.reassign');
});

test('missing, stale, cross-company, or unavailable canonical skill proof withholds cleaning reassignment', async () => {
  const unavailable = { schema: 'titan.directadmin.workforce-skills.v1', company_id, context_revision,
    read_only: true, capability_presence_confers_authority: false, verification_confers_authority: false,
    assignment_decision: false, routing_decision: false, entitlement_decision: false,
    execution_permitted: false, grants_authority: false, status: 'unavailable',
    reason: 'canonical-skill-projection-unavailable', source: null, freshness: null,
    source_revision: null, evidence_refs: [] };
  const cases = [
    { includeSkills: false },
    { skills: unavailable },
    { skills: canonicalSkills({ revision: 'ctx-old' }) },
    { skills: canonicalSkills({ company: 'company-cleaning-b' }) },
    { skills: canonicalSkills({ worker: 'worker-from-company-b' }) },
  ];
  for (const value of cases) {
    const session = sessionFixture(value);
    const api = new WorkforceApi(session, () => 'operation-denied');
    await assert.rejects(api.control({ company_id, actor_id, context_revision }, {
      action: 'reassign', work_id: 'work-regular-clean-a', target_worker_id, reason: 'test',
    }), /denied|invalid/);
    assert.equal(session.calls.some(([kind]) => kind === 'intent'), false);
  }
});

test('unverified, expired, revoked, or unmet canonical requirements never submit an intent', async () => {
  const cases = [
    canonicalSkills({ verification_state: 'UNVERIFIED' }),
    canonicalSkills({ verification_state: 'EXPIRED' }),
    canonicalSkills({ verification_state: 'REVOKED' }),
    canonicalSkills({ meets_registry_requirement: false }),
    canonicalSkills({ proficiency: 2, required_min_proficiency: 3 }),
    canonicalSkills({ require_verified: false }),
  ];
  for (const skills of cases) {
    const session = sessionFixture({ skills });
    const api = new WorkforceApi(session, () => 'operation-denied');
    await assert.rejects(api.control({ company_id, actor_id, context_revision }, {
      action: 'reassign', work_id: 'work-regular-clean-a', target_worker_id, reason: 'test',
    }), /denied/);
    assert.equal(session.calls.some(([kind]) => kind === 'intent'), false);
  }
});

test('raw worker capability metadata cannot replace an unavailable canonical proof', async () => {
  const session = sessionFixture({ includeSkills: false, worker_capabilities: service.skills });
  const api = new WorkforceApi(session, () => 'operation-denied');
  await assert.rejects(api.control({ company_id, actor_id, context_revision }, {
    action: 'reassign', work_id: 'work-regular-clean-a', target_worker_id, reason: 'test',
  }), /denied/);
  assert.equal(session.calls.some(([kind]) => kind === 'intent'), false);
});

test('each currently supported Cleaning service skill requires its canonical proof, including turnover linen handling', async () => {
  const requirements = [...new Set(CLEANING_SERVICE_CATALOGUE
    .filter(candidate => candidate.retained_job_type_id !== null)
    .flatMap(candidate => candidate.skills))];
  assert.ok(requirements.includes('general_cleaning'));
  assert.ok(requirements.includes('linen_handling'));

  for (const capability of requirements) {
    const session = sessionFixture({ includeSkills: false, required_capabilities: [capability],
      worker_capabilities: [capability] });
    const api = new WorkforceApi(session, () => 'operation-denied');
    await assert.rejects(api.control({ company_id, actor_id, context_revision }, {
      action: 'reassign', work_id: 'work-regular-clean-a', target_worker_id, reason: 'test',
    }), /denied/);
    assert.equal(session.calls.some(([kind]) => kind === 'intent'), false, capability);
  }
});
