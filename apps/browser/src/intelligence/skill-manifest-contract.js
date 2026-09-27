'use strict';

const Boundary = require('./skill-runtime-boundary');

const SKILL_MANIFEST_SCHEMA = 'titan-code-skill-manifest/v1';
const SKILL_PERMISSION_SCHEMA = 'titan-code-skill-permission-evaluation/v1';
const MAX_CAPABILITIES = 64;
const MAX_PERMISSIONS = 64;

const PRIVILEGED_PERMISSIONS = Object.freeze(new Set([
  'plan.advance',
  'plan.complete',
  'artifact.verify',
  'canonical.promote',
  'manager.merge',
  'baseline.write',
  'repository.write',
  'shell.execute',
  'database.mutate',
  'browser.permission.grant',
  'spend.policy.change',
  'memory.promote',
]));

const KNOWN_CAPABILITIES = Object.freeze(new Set([
  'intelligence.request',
  'intelligence.stream',
  'intelligence.embed',
  'repository.search',
  'repository.symbols',
  'repository.dependencies',
  'repository.rag',
  'project-memory.read-promoted',
  'project-memory.propose-candidate',
  'diagnostics.read',
]));

function clean(value, max = 160) {
  return String(value == null ? '' : value).trim().slice(0, max);
}

function uniqList(value, max, pattern, label) {
  const list = Array.isArray(value) ? value : [];
  const out = [];
  const seen = new Set();
  for (const item of list) {
    const normalized = clean(item, 160).toLowerCase();
    if (!normalized || seen.has(normalized)) continue;
    if (pattern && !pattern.test(normalized)) {
      const error = new Error(`invalid ${label}: ${normalized}`);
      error.code = 'ERR_SKILL_MANIFEST_INVALID_IDENTIFIER';
      error.details = { label, value: normalized };
      throw error;
    }
    seen.add(normalized);
    out.push(normalized);
    if (out.length >= max) break;
  }
  return Object.freeze(out);
}

function freeze(value, seen = new WeakSet()) {
  if (!value || typeof value !== 'object' || seen.has(value)) return value;
  seen.add(value);
  Object.freeze(value);
  Object.values(value).forEach(child => freeze(child, seen));
  return value;
}

function normalizeManifest(input = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    const error = new Error('skill manifest must be an object');
    error.code = 'ERR_SKILL_MANIFEST_REQUIRED';
    throw error;
  }
  Boundary.assertNoAuthorityEscalation(input);
  const id = clean(input.id, 96).toLowerCase();
  if (!/^[a-z0-9][a-z0-9._-]{0,95}$/.test(id)) {
    const error = new Error('skill manifest requires a stable id');
    error.code = 'ERR_SKILL_MANIFEST_ID';
    throw error;
  }
  const version = clean(input.version || '1', 32);
  if (!/^[0-9a-z][0-9a-z._+-]{0,31}$/i.test(version)) {
    const error = new Error('skill manifest has invalid version');
    error.code = 'ERR_SKILL_MANIFEST_VERSION';
    throw error;
  }
  const capabilities = uniqList(input.capabilities, MAX_CAPABILITIES, /^[a-z0-9][a-z0-9._-]{0,79}$/, 'capability');
  const permissions = uniqList(input.permissions, MAX_PERMISSIONS, /^[a-z0-9][a-z0-9._-]{0,79}$/, 'permission');
  const unknownCapabilities = capabilities.filter(capability => !KNOWN_CAPABILITIES.has(capability));
  const privilegedRequested = permissions.filter(permission => PRIVILEGED_PERMISSIONS.has(permission));
  return freeze({
    schema: SKILL_MANIFEST_SCHEMA,
    id,
    version,
    title: clean(input.title || id, 160),
    description: clean(input.description, 1000),
    capabilities,
    permissions,
    unknown_capabilities: Object.freeze(unknownCapabilities),
    privileged_permissions_requested: Object.freeze(privilegedRequested),
    catalogs_are_descriptors_not_executors: true,
    advisory_only: true,
    authority: false,
  });
}

function evaluatePermissions(manifestInput, callerGrant = {}) {
  const manifest = manifestInput && manifestInput.schema === SKILL_MANIFEST_SCHEMA
    ? manifestInput
    : normalizeManifest(manifestInput);
  Boundary.assertNoAuthorityEscalation(callerGrant);
  const grantedCapabilities = new Set(uniqList(callerGrant.capabilities, MAX_CAPABILITIES, /^[a-z0-9][a-z0-9._-]{0,79}$/, 'capability'));
  const grantedPermissions = new Set(uniqList(callerGrant.permissions, MAX_PERMISSIONS, /^[a-z0-9][a-z0-9._-]{0,79}$/, 'permission'));
  const capabilityDecisions = manifest.capabilities.map(id => freeze({
    id,
    granted: KNOWN_CAPABILITIES.has(id) && grantedCapabilities.has(id),
    reason: !KNOWN_CAPABILITIES.has(id) ? 'unknown-capability' : grantedCapabilities.has(id) ? 'caller-granted' : 'not-granted-by-caller',
  }));
  const permissionDecisions = manifest.permissions.map(id => {
    if (PRIVILEGED_PERMISSIONS.has(id)) return freeze({ id, granted: false, reason: 'privileged-permission-not-delegable-to-skill' });
    return freeze({
      id,
      granted: grantedPermissions.has(id),
      reason: grantedPermissions.has(id) ? 'caller-granted' : 'not-granted-by-caller',
    });
  });
  const denied = [
    ...capabilityDecisions.filter(item => !item.granted).map(item => `capability:${item.id}`),
    ...permissionDecisions.filter(item => !item.granted).map(item => `permission:${item.id}`),
  ];
  return freeze({
    schema: SKILL_PERMISSION_SCHEMA,
    skill_id: manifest.id,
    skill_version: manifest.version,
    capability_decisions: Object.freeze(capabilityDecisions),
    permission_decisions: Object.freeze(permissionDecisions),
    executable: denied.length === 0,
    denied: Object.freeze(denied),
    caller_authority_is_ceiling: true,
    privileged_permissions_delegated: false,
    authority: { ...Boundary.PROTECTED_AUTHORITY },
  });
}

function assertExecutable(manifestInput, callerGrant = {}) {
  const result = evaluatePermissions(manifestInput, callerGrant);
  if (!result.executable) {
    const error = new Error('skill manifest is not executable under caller grant');
    error.code = 'ERR_SKILL_PERMISSION_DENIED';
    error.details = { denied: result.denied.slice() };
    throw error;
  }
  return result;
}

module.exports = {
  KNOWN_CAPABILITIES,
  MAX_CAPABILITIES,
  MAX_PERMISSIONS,
  PRIVILEGED_PERMISSIONS,
  SKILL_MANIFEST_SCHEMA,
  SKILL_PERMISSION_SCHEMA,
  assertExecutable,
  evaluatePermissions,
  normalizeManifest,
};
