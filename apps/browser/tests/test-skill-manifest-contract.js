'use strict';

const assert = require('assert');
const Contract = require('../src/intelligence/skill-manifest-contract');

const base = {
  id: 'repository.explain-impact',
  version: '1.0.0',
  title: 'Explain repository impact',
  capabilities: ['repository.rag', 'diagnostics.read'],
  permissions: ['context.read'],
};

const manifest = Contract.normalizeManifest(base);
assert.equal(manifest.schema, Contract.SKILL_MANIFEST_SCHEMA);
assert.deepEqual(manifest.capabilities, ['repository.rag', 'diagnostics.read']);
assert.equal(manifest.authority, false);
assert(Object.isFrozen(manifest));

const allowed = Contract.evaluatePermissions(manifest, {
  capabilities: ['repository.rag', 'diagnostics.read'],
  permissions: ['context.read'],
});
assert.equal(allowed.executable, true);
assert.equal(allowed.privileged_permissions_delegated, false);
assert.equal(allowed.authority.plan_advance, false);

const missing = Contract.evaluatePermissions(manifest, {
  capabilities: ['repository.rag'],
  permissions: ['context.read'],
});
assert.equal(missing.executable, false);
assert(missing.denied.includes('capability:diagnostics.read'));

const unknown = Contract.normalizeManifest({
  id: 'unknown-capability-skill',
  capabilities: ['future.magic'],
});
assert.deepEqual(unknown.unknown_capabilities, ['future.magic']);
assert.equal(Contract.evaluatePermissions(unknown, { capabilities: ['future.magic'] }).executable, false);

const privileged = Contract.normalizeManifest({
  id: 'dangerous-skill',
  capabilities: ['repository.rag'],
  permissions: ['repository.write', 'shell.execute'],
});
const privilegedEval = Contract.evaluatePermissions(privileged, {
  capabilities: ['repository.rag'],
  permissions: ['repository.write', 'shell.execute'],
});
assert.equal(privilegedEval.executable, false);
assert(privilegedEval.denied.includes('permission:repository.write'));
assert(privilegedEval.denied.includes('permission:shell.execute'));

assert.throws(() => Contract.normalizeManifest({ id: 'x', authority: true }), error => error.code === 'ERR_SKILL_RUNTIME_AUTHORITY_ESCALATION');
assert.throws(() => Contract.evaluatePermissions(base, { authority: true }), error => error.code === 'ERR_SKILL_RUNTIME_AUTHORITY_ESCALATION');
assert.throws(() => Contract.assertExecutable(base, { capabilities: [], permissions: [] }), error => error.code === 'ERR_SKILL_PERMISSION_DENIED');
assert.throws(() => Contract.normalizeManifest({ id: '../bad' }), error => error.code === 'ERR_SKILL_MANIFEST_ID');

console.log('skill manifest contract tests passed');
