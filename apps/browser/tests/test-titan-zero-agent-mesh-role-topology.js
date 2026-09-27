const assert = require('assert');
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const root = path.resolve(__dirname, '..');
const sandbox = { console };
sandbox.globalThis = sandbox;
vm.createContext(sandbox);

const src = fs.readFileSync(path.join(root, 'src/titan-zero/agent-mesh-role-topology.js'), 'utf8');
vm.runInContext(src, sandbox, { filename: 'agent-mesh-role-topology.js' });

const topology = sandbox.TitanZeroAgentMeshRoleTopology;
assert(topology, 'topology contract must export');
assert.strictEqual(topology.SCHEMA, 'titan-zero.agent-mesh.role-topology.v1');
assert.strictEqual(topology.roles.manager.surface, 'titan-code');
assert.strictEqual(topology.roles.supervisor.surface, 'chatgpt');
assert.strictEqual(topology.roles.librarian.surface, 'chatgpt');
assert.strictEqual(topology.roles.browserIntelligence.authority, 'advisory-only');
assert.strictEqual(topology.can('manager', 'canonical.promote'), true);
assert.strictEqual(topology.can('manager', 'supervisor.verdict.fabricate'), false);
assert.strictEqual(topology.can('supervisor', 'canonical.promote'), false);
assert.strictEqual(topology.can('supervisor', 'verification.challenge'), true);
assert.strictEqual(topology.can('librarian', 'cleanup.decide'), true);
assert.strictEqual(topology.can('librarian', 'canonical.promote'), false);
assert.strictEqual(topology.can('builder', 'implementation.execute'), true);
assert.strictEqual(topology.can('builder', 'canonical.promote'), false);
assert.strictEqual(topology.can('browserIntelligence', 'canonical.promote'), false);
assert.strictEqual(topology.assertSeparation().ok, true);

const d = topology.describe();
assert(Object.isFrozen(d));
assert.deepStrictEqual(Array.from(d.externalIndependentRoles), ['supervisor', 'librarian']);
assert.strictEqual(d.canonicalAuthority, 'manager');
console.log('PASS test-titan-zero-agent-mesh-role-topology');
