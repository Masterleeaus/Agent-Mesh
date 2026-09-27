'use strict';

const assert = require('assert');
const { SkillRegistryLoader, SKILL_REGISTRY_SCHEMA } = require('../src/intelligence/skill-registry-loader');

const grant = {
  capabilities: ['repository.rag', 'diagnostics.read'],
  permissions: ['context.read'],
};

const loader = new SkillRegistryLoader({ maxSkills: 4 });
const loaded = loader.load({
  id: 'repository.explain-impact',
  version: '1.0.0',
  capabilities: ['repository.rag'],
  permissions: ['context.read'],
}, grant, { source: 'repository-catalog' });
assert.equal(loaded.loaded, true);
assert.equal(loaded.executable, true);
assert.equal(loaded.authority.plan_advance, false);
assert(Object.isFrozen(loaded));

assert.throws(() => loader.load({
  id: 'repository.write-now',
  version: '1',
  capabilities: ['repository.rag'],
  permissions: ['repository.write'],
}, { capabilities: ['repository.rag'], permissions: ['repository.write'] }), error => error.code === 'ERR_SKILL_LOAD_PERMISSION_DENIED');

assert.throws(() => loader.load({
  id: 'future.unknown',
  version: '1',
  capabilities: ['future.magic'],
}, { capabilities: ['future.magic'] }), error => error.code === 'ERR_SKILL_LOAD_PERMISSION_DENIED');

assert.throws(() => loader.load({
  id: 'repository.explain-impact',
  version: '1.0.0',
  capabilities: ['repository.rag'],
  permissions: ['context.read'],
}, grant), error => error.code === 'ERR_SKILL_REGISTRY_DUPLICATE');

const batchLoader = new SkillRegistryLoader({ maxSkills: 3 });
const batch = batchLoader.loadMany([
  { id: 'z.skill', version: '1', capabilities: ['diagnostics.read'] },
  { id: 'a.skill', version: '1', capabilities: ['repository.rag'] },
], grant, { source: 'catalog' });
assert.deepEqual(batch.map(item => item.id), ['a.skill', 'z.skill']);
assert.deepEqual(batchLoader.list().map(item => item.id), ['a.skill', 'z.skill']);
assert.equal(batchLoader.snapshot().schema, SKILL_REGISTRY_SCHEMA);
assert.equal(batchLoader.snapshot().count, 2);

const atomic = new SkillRegistryLoader({ maxSkills: 3 });
assert.throws(() => atomic.loadMany([
  { id: 'good.skill', capabilities: ['repository.rag'] },
  { id: 'bad.skill', capabilities: ['future.magic'] },
], grant), error => error.code === 'ERR_SKILL_LOAD_PERMISSION_DENIED');
assert.equal(atomic.snapshot().count, 0);

assert.throws(() => new SkillRegistryLoader({ maxSkills: 2 }).loadMany([
  { id: 'a', capabilities: ['repository.rag'] },
  { id: 'b', capabilities: ['repository.rag'] },
  { id: 'c', capabilities: ['repository.rag'] },
], grant), error => error.code === 'ERR_SKILL_REGISTRY_LIMIT');

assert.throws(() => new SkillRegistryLoader({ authority: true }), error => error.code === 'ERR_SKILL_RUNTIME_AUTHORITY_ESCALATION');

console.log('skill registry loader tests passed');
