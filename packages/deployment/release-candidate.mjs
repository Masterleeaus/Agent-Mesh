import { createHash, createPublicKey, verify, KeyObject } from 'node:crypto';
import { open, lstat, realpath } from 'node:fs/promises';
import { resolve, relative, sep, isAbsolute } from 'node:path';

const CHECKS = ['ci_648', 'native_fsm_809', 'workforce_811', 'security_302',
  'fresh_install', 'production_readiness', 'native_without_frappe', 'company_isolation',
  'upgrade', 'rollback', 'reboot_recovery', 'backup_restore_semantic', 'second_substrate'];
const ROLES = ['web', 'worker', 'workforce', 'config', 'migrations', 'sbom', 'provenance'];
const OWNERS = ['GLOBAL_REGISTRY', 'COMPANY_NATIVE_FSM', 'RUNTIME', 'WORKFORCE', 'AUTHORITY', 'EVIDENCE', 'COMPATIBILITY'];
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
function requireValue(condition, reason) {
  if (!condition) throw new Error(`release-candidate:${reason}`);
}
const text = value => typeof value === 'string' && value.trim().length > 0;
const digest = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
function list(value, name) {
  requireValue(Array.isArray(value) && value.length > 0, `${name}-required`);
  return value;
}
function date(value) {
  requireValue(typeof value === 'string' && Number.isFinite(Date.parse(value)), 'time-invalid');
  return Date.parse(value);
}
function decode(value, name) {
  requireValue(typeof value === 'string' && value.length > 0 && value.length < 4_000_000, `${name}-invalid`);
  const bytes = Buffer.from(value, 'base64');
  requireValue(bytes.toString('base64') === value, `${name}-invalid`);
  return bytes;
}

// Artifacts are staged under an operator-owned immutable directory. Reject links,
// traversal, devices and Windows path syntax on every supported host platform.
function validatePath(name) {
  requireValue(typeof name === 'string' && name.length <= 512 &&
    name.split('/').every(part => /^[A-Za-z0-9_][A-Za-z0-9_.-]*$/.test(part)), 'artifact-path-invalid');
}
async function fileDigest(root, name) {
  validatePath(name);
  let path = root;
  for (const part of name.split('/')) {
    path = resolve(path, part);
    requireValue(!(await lstat(path)).isSymbolicLink(), 'artifact-path-link');
  }
  const actual = await realpath(path);
  const rel = relative(root, actual);
  requireValue(rel && !isAbsolute(rel) && rel !== '..' && !rel.startsWith(`..${sep}`), 'artifact-path-escape');
  requireValue((await lstat(actual)).isFile(), 'artifact-file-required');
  const file = await open(actual, 'r');
  try {
    requireValue((await file.stat()).isFile(), 'artifact-file-required');
    const hash = createHash('sha256');
    for await (const chunk of file.createReadStream({ autoClose: false })) hash.update(chunk);
    return hash.digest('hex');
  } finally { await file.close(); }
}

/** Validate signed release assertions AND actual shipped bytes. This does not run
 * host acceptance or grant authority. The external trusted signer must review the
 * referenced owner/host evidence before signing; bundle keys are never trusted.
 */
export async function verifyReleaseCandidate({ envelope, publicKey, artifactRoot }) {
  const now = Date.now();
  const payload = decode(envelope?.payload, 'payload');
  const signature = decode(envelope?.signature, 'signature');
  if (!(publicKey instanceof KeyObject)) {
    requireValue((typeof publicKey === 'string' || Buffer.isBuffer(publicKey)) &&
      /^-----BEGIN PUBLIC KEY-----\s+[A-Za-z0-9+/=\s]+-----END PUBLIC KEY-----\s*$/.test(publicKey.toString()), 'public-key-required');
  }
  const key = publicKey instanceof KeyObject ? publicKey : createPublicKey(publicKey);
  requireValue(key.type === 'public', 'public-key-required');
  requireValue(key.type === 'public' && key.asymmetricKeyType === 'ed25519' &&
    verify(null, payload, key, signature), 'signature-invalid');
  const manifest = JSON.parse(payload.toString('utf8'));
  requireValue(manifest.schema === 'titan.deployment.release-candidate.v1', 'schema-invalid');
  requireValue(text(manifest.release_id) && text(manifest.version) && text(manifest.channel) &&
    /^[a-f0-9]{40}$/.test(manifest.source_sha), 'identity-invalid');
  requireValue(['portable', 'directadmin'].includes(manifest.profile), 'profile-invalid');
  const created = date(manifest.created_at), expires = date(manifest.expires_at);
  requireValue(Number.isFinite(now) && created <= now && expires > now && expires > created &&
    expires - created <= 86_400_000, 'time-window-invalid');
  requireValue(Array.isArray(manifest.unresolved_p0) && manifest.unresolved_p0.length === 0, 'unresolved-p0');
  requireValue(manifest.regression_count === 0, 'regression-baseline');
  requireValue(manifest.installer_status === 'passed', 'installer-unverified');
  requireValue(text(manifest.rollback?.version) && manifest.rollback.version !== manifest.version &&
    digest(manifest.rollback?.manifest_sha256), 'rollback-target-required');
  requireValue(text(manifest.compatibility?.node), 'compatibility-required');
  const substrates = list(manifest.compatibility?.substrates, 'substrate');
  requireValue(substrates.every(text) && new Set(substrates).size >= 2, 'second-substrate-required');
  const migrations = list(manifest.migrations, 'migrations');
  requireValue(new Set(migrations.map(m => m.owner)).size === migrations.length, 'duplicate-migration-owner');
  for (const owner of OWNERS) {
    const migration = migrations.find(m => m.owner === owner);
    requireValue(migration && text(migration.version), `migration-${owner}-required`);
    requireValue(migration.rollback_compatible === true, `rollback-${owner}-unverified`);
  }

  const artifacts = list(manifest.artifacts, 'artifacts');
  const paths = new Map();
  for (const artifact of artifacts) {
    requireValue(artifact && [...ROLES, 'evidence'].includes(artifact.role) && digest(artifact.sha256), 'artifact-invalid');
    validatePath(artifact.path);
    const pathKey = artifact.path.toLowerCase();
    requireValue(!paths.has(pathKey), 'duplicate-artifact-path');
    paths.set(pathKey, artifact);
  }
  for (const role of ROLES) requireValue(artifacts.some(a => a.role === role), `artifact-${role}-required`);
  const subject = artifacts.filter(a => a.role !== 'evidence')
    .map(({ role, path, sha256 }) => ({ role, path, sha256 })).sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0);
  const subjectDigest = sha256(JSON.stringify(subject));
  const checks = list(manifest.checks, 'checks');
  requireValue(new Set(checks.map(c => c.id)).size === checks.length, 'duplicate-check');
  const required = manifest.profile === 'directadmin' ? [...CHECKS, 'business_node_812'] : CHECKS;
  for (const id of required) requireValue(checks.some(c => c.id === id), `check-${id}-required`);
  for (const check of checks) {
    requireValue(check.status === 'passed', `check-${check.id}-unverified`);
    requireValue(check.release_id === manifest.release_id && check.source_sha === manifest.source_sha &&
      check.subject_sha256 === subjectDigest, `check-${check.id}-candidate-mismatch`);
    const observed = date(check.observed_at);
    requireValue(observed >= created && observed <= now, `check-${check.id}-time-invalid`);
    requireValue(typeof check.evidence_path === 'string' &&
      paths.get(check.evidence_path.toLowerCase())?.role === 'evidence' &&
      paths.get(check.evidence_path.toLowerCase()).path === check.evidence_path, `check-${check.id}-evidence-required`);
  }
  const root = await realpath(artifactRoot);
  for (const artifact of artifacts) {
    requireValue(await fileDigest(root, artifact.path) === artifact.sha256, `artifact-${artifact.role}-checksum-mismatch`);
  }
  const verifiedAt = Date.now();
  requireValue(verifiedAt >= now && verifiedAt < expires, 'time-expired-during-verification');
  return Object.freeze({ schema: 'titan.deployment.release-verification.v1', status: 'RELEASE_VERIFIED',
    release_id: manifest.release_id, version: manifest.version, source_sha: manifest.source_sha,
    manifest_sha256: sha256(payload), subject_sha256: subjectDigest, channel: manifest.channel,
    verified_at: new Date(verifiedAt).toISOString(), expires_at: manifest.expires_at,
    store_status: 'NOT_SUBMITTED', grants_authority: false });
}
