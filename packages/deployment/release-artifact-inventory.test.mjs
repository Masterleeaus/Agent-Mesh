import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import { mkdtemp, rm, writeFile, symlink } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { inventoryReleaseArtifacts } from './release-candidate.mjs';

const sourceSha = 'a'.repeat(40);
const sha = value => createHash('sha256').update(value).digest('hex');
async function fixture(t) {
  const parent = await mkdtemp(join(tmpdir(), 'titan-artifact-inventory-'));
  const root = join(parent, 'artifacts');
  await fs.mkdir(root);
  t.after(() => rm(parent, { recursive: true, force: true }));
  const bytes = Buffer.from('actual built artifact bytes');
  await writeFile(join(root, 'web-image.tar'), bytes);
  return { parent, root, bytes };
}

test('inventories exact artifact bytes but always denies unsigned release readiness', async t => {
  const f = await fixture(t);
  const inventory = await inventoryReleaseArtifacts({
    artifactRoot: f.root,
    source_sha: sourceSha,
    profile: 'portable',
    artifacts: [{ role: 'web', path: 'web-image.tar' }],
  });

  assert.equal(inventory.schema, 'titan.deployment.release-artifact-inventory.v1');
  assert.equal(inventory.status, 'ARTIFACTS_INVENTORIED');
  assert.deepEqual(inventory.artifacts, [{ role: 'web', path: 'web-image.tar', sha256: sha(f.bytes) }]);
  assert.equal(inventory.subject_sha256,
    sha(JSON.stringify([{ role: 'web', path: 'web-image.tar', sha256: sha(f.bytes) }])));
  assert.ok(inventory.missing_artifact_roles.includes('sbom'));
  assert.deepEqual(inventory.unattested_required_checks, inventory.required_check_ids);
  assert.equal(inventory.release_gate.status, 'DENIED');
  assert.equal(inventory.release_gate.signature_status, 'NOT_SIGNED');
  assert.equal(inventory.release_gate.host_certification, 'NOT_PERFORMED');
  assert.equal(inventory.release_gate.promotion_allowed, false);
  assert.equal(inventory.release_gate.grants_authority, false);
  assert.equal(inventory.release_gate.store_status, 'NOT_SUBMITTED');
  assert.equal(Object.hasOwn(inventory, 'checks'), false);
});

test('DirectAdmin inventory includes the owner check without attesting it', async t => {
  const f = await fixture(t);
  const inventory = await inventoryReleaseArtifacts({
    artifactRoot: f.root,
    source_sha: sourceSha,
    profile: 'directadmin',
    artifacts: [{ role: 'web', path: 'web-image.tar' }],
  });
  assert.ok(inventory.required_check_ids.includes('business_node_812'));
  assert.equal(inventory.unattested_required_checks.includes('business_node_812'), true);
  assert.equal(inventory.release_gate.status, 'DENIED');
});

test('complete artifact-role inventory remains denied until signed checks and host evidence exist', async t => {
  const f = await fixture(t);
  const roles = ['web', 'worker', 'workforce', 'config', 'migrations', 'sbom', 'provenance', 'evidence'];
  const artifacts = [];
  for (const role of roles) {
    const path = `${role}.test-artifact`;
    await writeFile(join(f.root, path), `fixture bytes for ${role}`);
    artifacts.push({ role, path });
  }
  const inventory = await inventoryReleaseArtifacts({
    artifactRoot: f.root, source_sha: sourceSha, profile: 'portable', artifacts,
  });

  assert.deepEqual(inventory.missing_artifact_roles, []);
  assert.equal(inventory.unattested_required_checks.length, inventory.required_check_ids.length);
  assert.equal(inventory.release_gate.status, 'DENIED');
  assert.equal(inventory.release_gate.host_certification, 'NOT_PERFORMED');
  assert.equal(inventory.release_gate.promotion_allowed, false);
});

test('rejects malformed artifact paths, duplicate paths and links during inventory', async t => {
  const f = await fixture(t);
  await assert.rejects(inventoryReleaseArtifacts({
    artifactRoot: f.root, source_sha: sourceSha, profile: 'portable',
    artifacts: [{ role: 'web', path: '../outside' }],
  }), /artifact-path-invalid/);
  await assert.rejects(inventoryReleaseArtifacts({
    artifactRoot: f.root, source_sha: sourceSha, profile: 'portable',
    artifacts: [{ role: 'web', path: 'web-image.tar' }, { role: 'worker', path: 'WEB-IMAGE.TAR' }],
  }), /duplicate-artifact-path/);
  await symlink(join(f.root, 'web-image.tar'), join(f.root, 'linked.tar'));
  await assert.rejects(inventoryReleaseArtifacts({
    artifactRoot: f.root, source_sha: sourceSha, profile: 'portable',
    artifacts: [{ role: 'web', path: 'linked.tar' }],
  }), /artifact-path-link/);
});

test('CLI emits an unsigned inventory and refuses assertion fields', async t => {
  const f = await fixture(t);
  const requestPath = join(f.parent, 'request.json');
  const request = {
    schema: 'titan.deployment.release-artifact-inventory-request.v1',
    source_sha: sourceSha,
    profile: 'portable',
    artifacts: [{ role: 'web', path: 'web-image.tar' }],
  };
  await writeFile(requestPath, JSON.stringify(request));
  const cli = fileURLToPath(new URL('../../scripts/inventory-release-artifacts.mjs', import.meta.url));
  const run = () => spawnSync(process.execPath, [cli, requestPath, f.root], { encoding: 'utf8' });
  const result = run();
  assert.equal(result.status, 0, result.stderr);
  const inventory = JSON.parse(result.stdout);
  assert.equal(inventory.release_gate.status, 'DENIED');
  assert.equal(inventory.release_gate.grants_authority, false);

  await writeFile(requestPath, JSON.stringify({ ...request, checks: [{ id: 'fresh_install', status: 'passed' }] }));
  const rejected = run();
  assert.equal(rejected.status, 1);
  assert.equal(rejected.stdout, '');
  assert.match(rejected.stderr, /request-field-invalid/);
});
