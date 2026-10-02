import test from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync, sign, createHash } from 'node:crypto';
import { constants as fsConstants } from 'node:fs';
import fs from 'node:fs/promises';
import { mkdtemp, writeFile, rm, mkdir, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { verifyReleaseCandidate } from './release-candidate.mjs';

const { publicKey, privateKey } = generateKeyPairSync('ed25519');
const gates = ['ci_648', 'native_fsm_809', 'workforce_811', 'security_302',
  'fresh_install', 'production_readiness', 'native_without_frappe', 'company_isolation',
  'upgrade', 'rollback', 'reboot_recovery', 'backup_restore_semantic', 'second_substrate'];
const sha = value => createHash('sha256').update(value).digest('hex');
async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), 'titan-release-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const artifacts = [];
  for (const role of ['web', 'worker', 'workforce', 'config', 'migrations', 'sbom', 'provenance', 'evidence']) {
    const path = `${role}.txt`, content = `fixture ${role}`;
    await writeFile(join(root, path), content);
    artifacts.push({ role, path, sha256: sha(content) });
  }
  const manifest = {
    schema: 'titan.deployment.release-candidate.v1', release_id: 'candidate-322',
    version: '1.2.3', source_sha: 'a'.repeat(40), channel: 'stable',
    created_at: new Date(Date.now() - 60_000).toISOString(),
    expires_at: new Date(Date.now() + 3600_000).toISOString(),
    profile: 'portable', artifacts,
    rollback: { version: '1.2.2', manifest_sha256: 'b'.repeat(64) },
    migrations: ['GLOBAL_REGISTRY', 'COMPANY_NATIVE_FSM', 'RUNTIME', 'WORKFORCE', 'AUTHORITY', 'EVIDENCE', 'COMPATIBILITY']
      .map(owner => ({ owner, version: '1', rollback_compatible: true })),
    compatibility: { node: '22', substrates: ['ubuntu-compose', 'debian-systemd'] },
    unresolved_p0: [], regression_count: 0, installer_status: 'passed',
    checks: gates.map(id => ({ id, status: 'passed', release_id: 'candidate-322',
      source_sha: 'a'.repeat(40), evidence_path: 'evidence.txt', observed_at: new Date().toISOString() })),
  };
  const subject = artifacts.filter(a => a.role !== 'evidence').sort((a, b) => a.path < b.path ? -1 : 1);
  for (const check of manifest.checks) check.subject_sha256 = sha(JSON.stringify(subject));
  return { root, manifest };
}
async function verify(f, key = publicKey) {
  const payload = Buffer.from(JSON.stringify(f.manifest));
  const envelope = { payload: payload.toString('base64'), signature: sign(null, payload, privateKey).toString('base64') };
  return verifyReleaseCandidate({ envelope, publicKey: key, artifactRoot: f.root });
}

test('verifies signed shipped bytes and reports release verification without authority or publication', async t => {
  const result = await verify(await fixture(t));
  assert.equal(result.status, 'RELEASE_VERIFIED');
  assert.equal(result.release_id, 'candidate-322');
  assert.equal(result.grants_authority, false);
  assert.equal(result.store_status, 'NOT_SUBMITTED');
});

test('rejects a candidate signed by an untrusted key', async t => {
  const other = generateKeyPairSync('ed25519');
  await assert.rejects(verify(await fixture(t), other.publicKey), /signature/);
});

for (const [description, set] of [
  ['timezone-free created_at', manifest => manifest.created_at = manifest.created_at.slice(0, -1)],
  ['timezone-free expires_at', manifest => manifest.expires_at = manifest.expires_at.slice(0, -1)],
  ['timezone-free check.observed_at', manifest => manifest.checks[0].observed_at = manifest.checks[0].observed_at.slice(0, -1)],
  ['a noncanonical UTC offset', manifest => manifest.created_at = manifest.created_at.replace(/Z$/, '+00:00')],
]) {
  test(`rejects ${description}`, async t => {
    const f = await fixture(t);
    set(f.manifest);
    await assert.rejects(verify(f), /time/);
  });
}

test('detects changed shipped bytes even if all check records passed', async t => {
  const f = await fixture(t);
  await writeFile(join(f.root, 'web.txt'), 'tampered');
  await assert.rejects(verify(f), /checksum/);
});

for (const [name, change, error] of [
  ['missing owner evidence', m => m.checks.splice(0, 1), /ci_648/],
  ['failed verification', m => m.checks[0].status = 'failed', /check/],
  ['different candidate evidence', m => m.checks[0].source_sha = 'c'.repeat(40), /candidate/],
  ['same source rebuilt with other bytes', m => m.artifacts[0].sha256 = 'd'.repeat(64), /candidate/],
  ['stale verification', m => m.checks[0].observed_at = '2020-01-01T00:00:00Z', /time/],
  ['expired manifest', m => m.expires_at = '2020-01-01T00:00:00Z', /time/],
  ['unresolved P0', m => m.unresolved_p0 = [811], /p0/],
  ['nonzero regression baseline', m => m.regression_count = 1, /regression/],
  ['blocked installer', m => m.installer_status = 'blocked', /installer/],
  ['missing checksummed evidence', m => m.checks[0].evidence_path = 'not-shipped.txt', /evidence/],
  ['missing runtime artifact', m => m.artifacts = m.artifacts.filter(a => a.role !== 'workforce'), /workforce/],
  ['duplicate artifact path', m => m.artifacts.push({ ...m.artifacts[0] }), /duplicate/],
  ['path traversal', m => m.artifacts[0].path = '../outside', /path/],
  ['Windows absolute path', m => m.artifacts[0].path = 'C:\\outside', /path/],
  ['missing owner migration version', m => m.migrations.splice(0, 1), /GLOBAL_REGISTRY/],
  ['unsafe rollback', m => m.migrations[0].rollback_compatible = false, /rollback/],
  ['missing rollback target', m => delete m.rollback, /rollback/],
  ['missing second substrate', m => m.compatibility.substrates = ['ubuntu-compose'], /substrate/],
  ['DirectAdmin without owner evidence', m => m.profile = 'directadmin', /business_node_812/],
]) {
  test(`fails closed for ${name}`, async t => {
    const f = await fixture(t); change(f.manifest);
    await assert.rejects(verify(f), error);
  });
}

test('rejects directories masquerading as artifacts', async t => {
  const f = await fixture(t);
  await rm(join(f.root, 'web.txt')); await mkdir(join(f.root, 'web.txt'));
  await assert.rejects(verify(f), /file/);
});

test('CLI verifies a bundle with an external trusted key and fails on tampered bytes', async t => {
  const f = await fixture(t);
  const payload = Buffer.from(JSON.stringify(f.manifest));
  const envelope = { payload: payload.toString('base64'), signature: sign(null, payload, privateKey).toString('base64') };
  const envelopePath = join(f.root, 'candidate.json'), keyPath = join(f.root, 'trusted.pem');
  await writeFile(envelopePath, JSON.stringify(envelope));
  await writeFile(keyPath, publicKey.export({ type: 'spki', format: 'pem' }));
  const cli = fileURLToPath(new URL('../../scripts/verify-release-candidate.mjs', import.meta.url));
  const run = () => spawnSync(process.execPath, [cli, envelopePath, f.root, keyPath], { encoding: 'utf8' });
  let result = run();
  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout).status, 'RELEASE_VERIFIED');
  await writeFile(join(f.root, 'web.txt'), 'changed');
  result = run();
  assert.equal(result.status, 1);
  assert.equal(result.stdout, '');
  assert.match(result.stderr, /checksum/);
});

test('rejects modified signed payload instead of trusting its passed assertions', async t => {
  const f = await fixture(t), original = Buffer.from(JSON.stringify(f.manifest));
  f.manifest.version = 'forged';
  const envelope = { payload: Buffer.from(JSON.stringify(f.manifest)).toString('base64'),
    signature: sign(null, original, privateKey).toString('base64') };
  await assert.rejects(verifyReleaseCandidate({ envelope, publicKey, artifactRoot: f.root }), /signature/);
});

test('rejects a directory link even when its target contains matching evidence', async t => {
  const f = await fixture(t);
  const target = await mkdtemp(join(tmpdir(), 'titan-external-'));
  t.after(() => rm(target, { recursive: true, force: true }));
  await writeFile(join(target, 'proof.txt'), 'fixture evidence');
  await symlink(target, join(f.root, 'linked'), process.platform === 'win32' ? 'junction' : 'dir');
  f.manifest.artifacts.find(a => a.role === 'evidence').path = 'linked/proof.txt';
  f.manifest.checks.forEach(c => c.evidence_path = 'linked/proof.txt');
  await assert.rejects(verify(f), /path-link/);
});

test('rejects a final artifact symlink swapped in after path validation', async t => {
  const f = await fixture(t);
  const outside = await mkdtemp(join(tmpdir(), 'titan-raced-artifact-'));
  t.after(() => rm(outside, { recursive: true, force: true }));
  const artifactPath = join(f.root, 'web.txt');
  const matchingExternal = join(outside, 'web.txt');
  await writeFile(matchingExternal, 'fixture web');
  const originalOpen = fs.open.bind(fs);
  let replaced = false;
  let openFlags;
  t.mock.method(fs, 'open', async function (path, flags, ...rest) {
    if (!replaced && path === artifactPath) {
      replaced = true;
      openFlags = flags;
      await rm(artifactPath);
      await symlink(matchingExternal, artifactPath);
    }
    return originalOpen(path, flags, ...rest);
  });
  await assert.rejects(verify(f), /artifact-path-raced/);
  assert.equal(replaced, true);
  assert.ok((openFlags & fsConstants.O_NOFOLLOW) !== 0);
  assert.ok((openFlags & fsConstants.O_NONBLOCK) !== 0);
});

test('requires and accepts DirectAdmin owner verification for that profile', async t => {
  const f = await fixture(t);
  f.manifest.profile = 'directadmin';
  f.manifest.checks.push({ ...f.manifest.checks[0], id: 'business_node_812' });
  assert.equal((await verify(f)).status, 'RELEASE_VERIFIED');
});

test('rejects private PEM keys instead of deriving a trusted public key from them', async t => {
  await assert.rejects(verify(await fixture(t), privateKey.export({ type: 'pkcs8', format: 'pem' })), /public-key/);
  await assert.rejects(verify(await fixture(t), privateKey), /public-key/);
});

test('fails when the candidate expires while hashing its artifacts', async t => {
  const f = await fixture(t), before = Date.now();
  let calls = 0;
  t.mock.method(Date, 'now', () => ++calls === 1 ? before : before + 7_200_000);
  await assert.rejects(verify(f), /time/);
});

test('rejects a FIFO artifact without opening and blocking on it', { skip: process.platform === 'win32' }, async t => {
  const f = await fixture(t);
  await rm(join(f.root, 'web.txt'));
  const fifo = spawnSync('mkfifo', [join(f.root, 'web.txt')]);
  assert.equal(fifo.status, 0);
  const payload = Buffer.from(JSON.stringify(f.manifest));
  await writeFile(join(f.root, 'candidate.json'), JSON.stringify({ payload: payload.toString('base64'),
    signature: sign(null, payload, privateKey).toString('base64') }));
  await writeFile(join(f.root, 'trusted.pem'), publicKey.export({ type: 'spki', format: 'pem' }));
  const cli = fileURLToPath(new URL('../../scripts/verify-release-candidate.mjs', import.meta.url));
  const result = spawnSync(process.execPath, [cli, join(f.root, 'candidate.json'), f.root, join(f.root, 'trusted.pem')],
    { encoding: 'utf8', timeout: 3000 });
  assert.equal(result.error, undefined, 'verifier must not wait for a FIFO writer');
  assert.equal(result.status, 1);
  assert.match(result.stderr, /file/);
});
