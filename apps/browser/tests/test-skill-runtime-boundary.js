'use strict';
const assert = require('assert');
const {
  PROTECTED_AUTHORITY,
  RETAINED_PRIMITIVES,
  assertNoAuthorityEscalation,
  boundaryDescriptor,
  inventory,
} = require('../src/intelligence/skill-runtime-boundary');

const primitives = {
  'intelligence-contract': { createContext(){}, assertAdvisory(){} },
  'intelligence-host': { request(){}, registerRuntime(){} },
  'intelligence-rpc': {},
  'browser-model-runtime': { generate(){} },
  'browser-model-scheduler': { schedule(){}, cancel(){} },
  'model-output-verifier': { verify(){} },
  'repository-rag': { retrieve(){} },
  'project-memory-governance': { promote(){}, reject(){} },
  'capability-registry': { registerSkills(){}, getSkill(){} },
  'repository-skills': [],
  'workforce-skills': [],
  'titan-zero-skills': [],
  'titan-zero-development-skills': [],
};

const snapshot = inventory(primitives);
assert.strictEqual(snapshot.complete, true);
assert.deepStrictEqual(snapshot.missing_required, []);
assert.strictEqual(snapshot.items.length, RETAINED_PRIMITIVES.length);
assert.strictEqual(snapshot.advisory_only, true);
assert.strictEqual(snapshot.authority, false);

const incomplete = inventory({});
assert.strictEqual(incomplete.complete, false);
assert(incomplete.missing_required.includes('intelligence-contract'));
assert(incomplete.missing_required.includes('model-output-verifier'));

const boundary = boundaryDescriptor({ inventoryResult: snapshot });
assert.strictEqual(boundary.catalogs_are_descriptors_not_executors, true);
assert.strictEqual(boundary.existing_intelligence_host_is_authoritative_runtime_path, true);
assert.strictEqual(boundary.tools_remain_host_owned, true);
assert.strictEqual(boundary.skill_execution_cannot_expand_caller_authority, true);
assert.strictEqual(boundary.automatic_plan_advance, false);
assert.strictEqual(boundary.automatic_memory_promotion, false);
assert.strictEqual(boundary.automatic_browser_permission_grant, false);
for (const value of Object.values(PROTECTED_AUTHORITY)) assert.strictEqual(value, false);
for (const value of Object.values(boundary.authority)) assert.strictEqual(value, false);

assert.strictEqual(assertNoAuthorityEscalation({ authority: false, nested: { plan_advance: false } }), true);
assert.throws(
  () => assertNoAuthorityEscalation({ nested: { execution_authorized: true } }),
  error => error && error.code === 'ERR_SKILL_RUNTIME_AUTHORITY_ESCALATION'
);
assert.throws(
  () => boundaryDescriptor({ inventoryResult: { advisory_only: true, canonical: true } }),
  error => error && error.code === 'ERR_SKILL_RUNTIME_AUTHORITY_ESCALATION'
);

console.log('test-skill-runtime-boundary: PASS');
