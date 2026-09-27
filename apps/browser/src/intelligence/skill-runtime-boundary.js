'use strict';

const SKILL_RUNTIME_BOUNDARY_SCHEMA = 'titan-code-skill-runtime-boundary/v1';
const INVENTORY_SCHEMA = 'titan-code-skill-runtime-inventory/v1';

const PROTECTED_AUTHORITY = Object.freeze({
  plan_advance: false,
  plan_complete: false,
  verification_authority: false,
  canonical_authority: false,
  merge_authority: false,
  baseline_authority: false,
  mutation_authority: false,
  repository_write_authority: false,
  shell_authority: false,
  database_mutation_authority: false,
  browser_permission_authority: false,
  spend_policy_authority: false,
  memory_promotion_authority: false,
  skill_permission_escalation: false,
});

const RETAINED_PRIMITIVES = Object.freeze([
  Object.freeze({ id: 'intelligence-contract', kind: 'controller-contract', required: true }),
  Object.freeze({ id: 'intelligence-host', kind: 'host-runtime', required: true }),
  Object.freeze({ id: 'intelligence-rpc', kind: 'transport', required: true }),
  Object.freeze({ id: 'browser-model-runtime', kind: 'model-runtime', required: true }),
  Object.freeze({ id: 'browser-model-scheduler', kind: 'scheduler', required: true }),
  Object.freeze({ id: 'model-output-verifier', kind: 'model-verification', required: true }),
  Object.freeze({ id: 'repository-rag', kind: 'evidence-retrieval', required: true }),
  Object.freeze({ id: 'project-memory-governance', kind: 'project-memory', required: true }),
  Object.freeze({ id: 'capability-registry', kind: 'skill-catalog-registry', required: true }),
  Object.freeze({ id: 'repository-skills', kind: 'skill-catalog', required: false }),
  Object.freeze({ id: 'workforce-skills', kind: 'skill-catalog', required: false }),
  Object.freeze({ id: 'titan-zero-skills', kind: 'skill-catalog', required: false }),
  Object.freeze({ id: 'titan-zero-development-skills', kind: 'skill-catalog', required: false }),
]);

function clone(value) {
  return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
}

function hasFunction(value, name) {
  return Boolean(value && typeof value[name] === 'function');
}

function describePrimitive(id, value) {
  switch (id) {
    case 'intelligence-contract':
      return Boolean(value && typeof value.createContext === 'function' && typeof value.assertAdvisory === 'function');
    case 'intelligence-host':
      return Boolean(value && typeof value.request === 'function' && typeof value.registerRuntime === 'function');
    case 'intelligence-rpc':
      return Boolean(value && typeof value === 'object');
    case 'browser-model-runtime':
      return Boolean(value && (hasFunction(value, 'generate') || hasFunction(value, 'request')));
    case 'browser-model-scheduler':
      return Boolean(value && hasFunction(value, 'schedule') && hasFunction(value, 'cancel'));
    case 'model-output-verifier':
      return Boolean(value && (hasFunction(value, 'verify') || typeof value.ModelOutputVerifier === 'function'));
    case 'repository-rag':
      return Boolean(value && hasFunction(value, 'retrieve'));
    case 'project-memory-governance':
      return Boolean(value && hasFunction(value, 'promote') && hasFunction(value, 'reject'));
    case 'capability-registry':
      return Boolean(value && hasFunction(value, 'registerSkills') && hasFunction(value, 'getSkill'));
    case 'repository-skills':
    case 'workforce-skills':
    case 'titan-zero-skills':
    case 'titan-zero-development-skills':
      return Array.isArray(value);
    default:
      return Boolean(value);
  }
}

function inventory(primitives = {}) {
  const items = RETAINED_PRIMITIVES.map(definition => {
    const value = primitives[definition.id];
    return Object.freeze({
      id: definition.id,
      kind: definition.kind,
      required: definition.required,
      present: describePrimitive(definition.id, value),
    });
  });
  const missingRequired = items.filter(item => item.required && !item.present).map(item => item.id);
  return Object.freeze({
    schema: INVENTORY_SCHEMA,
    items: Object.freeze(items),
    missing_required: Object.freeze(missingRequired),
    complete: missingRequired.length === 0,
    advisory_only: true,
    authority: false,
  });
}

function assertNoAuthorityEscalation(value, path = '$') {
  if (!value || typeof value !== 'object') return true;
  const protectedKeys = new Set([
    'authority', 'canonical', 'verified', 'approved', 'plan_advance', 'planAdvance',
    'mutation_authorized', 'execution_authorized', 'merge_authorized', 'baseline_authorized',
    'promotion_authority', 'memory_authority', 'browser_permission_authority',
    'skill_permission_escalation',
  ]);
  const stack = [{ value, path }];
  const violations = [];
  while (stack.length) {
    const current = stack.pop();
    for (const [key, child] of Object.entries(current.value)) {
      const childPath = `${current.path}.${key}`;
      if (protectedKeys.has(key) && child === true) violations.push(childPath);
      if (child && typeof child === 'object') stack.push({ value: child, path: childPath });
    }
  }
  if (violations.length) {
    const error = new Error('skill/runtime record attempted to expand protected authority');
    error.code = 'ERR_SKILL_RUNTIME_AUTHORITY_ESCALATION';
    error.details = { violations };
    throw error;
  }
  return true;
}

function boundaryDescriptor({ inventoryResult = null } = {}) {
  if (inventoryResult) assertNoAuthorityEscalation(inventoryResult);
  return Object.freeze({
    schema: SKILL_RUNTIME_BOUNDARY_SCHEMA,
    role: 'governed-skill-runtime-boundary',
    catalogs_are_descriptors_not_executors: true,
    existing_intelligence_host_is_authoritative_runtime_path: true,
    tools_remain_host_owned: true,
    model_output_remains_advisory: true,
    skill_execution_cannot_expand_caller_authority: true,
    automatic_plan_advance: false,
    automatic_memory_promotion: false,
    automatic_browser_permission_grant: false,
    authority: clone(PROTECTED_AUTHORITY),
    inventory: inventoryResult ? clone(inventoryResult) : null,
  });
}

module.exports = {
  INVENTORY_SCHEMA,
  PROTECTED_AUTHORITY,
  RETAINED_PRIMITIVES,
  SKILL_RUNTIME_BOUNDARY_SCHEMA,
  assertNoAuthorityEscalation,
  boundaryDescriptor,
  inventory,
};
