import { createHash, createPublicKey, verify, KeyObject } from 'node:crypto';
import { constants as fsConstants } from 'node:fs';
import fs from 'node:fs/promises';
import { resolve, relative, sep, isAbsolute } from 'node:path';

const CHECKS = ['ci_648', 'native_fsm_809', 'workforce_811', 'security_302',
  'fresh_install', 'production_readiness', 'native_without_frappe', 'company_isolation',
  'upgrade', 'rollback', 'reboot_recovery', 'backup_restore_semantic', 'second_substrate'];
const ROLES = ['web', 'worker', 'workforce', 'config', 'migrations', 'sbom', 'provenance'];
const INVENTORY_ROLES = [...ROLES, 'evidence'];
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
function subjectDigest(artifacts) {
  const subject = artifacts.filter(a => a.role !== 'evidence')
    .map(({ role, path, sha256 }) => ({ role, path, sha256 }))
    .sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0);
  return sha256(JSON.stringify(subject));
}
function date(value) {
  const timestamp = typeof value === 'string' ? Date.parse(value) : Number.NaN;
  requireValue(typeof value === 'string' &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value) &&
    Number.isFinite(timestamp) && new Date(timestamp).toISOString() === value, 'time-invalid');
  return timestamp;
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
  const components = [];
  const parts = name.split('/');
  for (const [index, part] of parts.entries()) {
    path = resolve(path, part);
    const stat = await fs.lstat(path, { bigint: true });
    requireValue(!stat.isSymbolicLink(), 'artifact-path-link');
    if (index < parts.length - 1) requireValue(stat.isDirectory(), 'artifact-path-directory-required');
    components.push({ path, stat });
  }
  const actual = await fs.realpath(path);
  const rel = relative(root, actual);
  requireValue(rel && !isAbsolute(rel) && rel !== '..' && !rel.startsWith(`..${sep}`), 'artifact-path-escape');
  const checked = await fs.lstat(actual, { bigint: true });
  requireValue(checked.isFile(), 'artifact-file-required');
  requireValue(checked.dev === components.at(-1).stat.dev && checked.ino === components.at(-1).stat.ino,
    'artifact-path-raced');
  requireValue(Number.isInteger(fsConstants.O_NOFOLLOW) && fsConstants.O_NOFOLLOW !== 0 &&
    Number.isInteger(fsConstants.O_NONBLOCK) && fsConstants.O_NONBLOCK !== 0, 'artifact-safe-open-unavailable');
  let file;
  try {
    file = await fs.open(actual, fsConstants.O_RDONLY | fsConstants.O_NOFOLLOW | fsConstants.O_NONBLOCK);
  } catch (error) {
    if (error?.code === 'ELOOP') throw new Error('release-candidate:artifact-path-raced', { cause: error });
    throw error;
  }
  try {
    const before = await file.stat({ bigint: true });
    requireValue(before.isFile(), 'artifact-file-required');
    requireValue(before.dev === checked.dev && before.ino === checked.ino, 'artifact-path-raced');
    const checkPaths = async () => {
      for (const component of components) {
        const current = await fs.lstat(component.path, { bigint: true });
        requireValue(!current.isSymbolicLink(), 'artifact-path-link');
        requireValue(current.dev === component.stat.dev && current.ino === component.stat.ino &&
          current.mtimeNs === component.stat.mtimeNs && current.ctimeNs === component.stat.ctimeNs,
          'artifact-path-raced');
      }
      const current = await fs.lstat(actual, { bigint: true });
      requireValue(current.dev === before.dev && current.ino === before.ino && current.size === before.size &&
        current.mtimeNs === before.mtimeNs && current.ctimeNs === before.ctimeNs, 'artifact-path-raced');
    };
    await checkPaths();
    const hash = createHash('sha256');
    for await (const chunk of file.createReadStream({ autoClose: false })) hash.update(chunk);
    const after = await file.stat({ bigint: true });
    requireValue(after.dev === before.dev && after.ino === before.ino && after.size === before.size &&
      after.mtimeNs === before.mtimeNs && after.ctimeNs === before.ctimeNs,
    'artifact-mutated-during-verification');
    await checkPaths();
    return hash.digest('hex');
  } finally { await file.close(); }
}

/** Inventory already-produced bytes. This records hashes only: no test results,
 * host certification, signature, promotion state or business authority is made.
 */
export async function inventoryReleaseArtifacts({ artifactRoot, source_sha, profile, artifacts }) {
  requireValue(typeof source_sha === 'string' && /^[a-f0-9]{40}$/.test(source_sha), 'inventory-source-sha-invalid');
  requireValue(['portable', 'directadmin'].includes(profile), 'inventory-profile-invalid');
  requireValue(Array.isArray(artifacts) && artifacts.length > 0, 'inventory-artifacts-required');

  const root = await fs.realpath(artifactRoot);
  const paths = new Set();
  const measured = [];
  for (const artifact of artifacts) {
    const role = artifact?.role;
    const path = artifact?.path;
    requireValue(INVENTORY_ROLES.includes(role), 'inventory-artifact-role-invalid');
    validatePath(path);
    const pathKey = path.toLowerCase();
    requireValue(!paths.has(pathKey), 'inventory-duplicate-artifact-path');
    paths.add(pathKey);
    measured.push({ role, path, sha256: await fileDigest(root, path) });
  }

  const measuredPaths = new Set(measured.map(a => a.role));
  const missingArtifactRoles = INVENTORY_ROLES.filter(role => !measuredPaths.has(role));
  const requiredChecks = profile === 'directadmin' ? [...CHECKS, 'business_node_812'] : CHECKS;
  const orderedArtifacts = measured.sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0);
  return Object.freeze({
    schema: 'titan.deployment.release-artifact-inventory.v1',
    status: 'ARTIFACTS_INVENTORIED',
    source_sha,
    profile,
    observed_at: new Date().toISOString(),
    artifacts: Object.freeze(orderedArtifacts.map(a => Object.freeze(a))),
    subject_sha256: subjectDigest(orderedArtifacts),
    required_artifact_roles: Object.freeze([...INVENTORY_ROLES]),
    missing_artifact_roles: Object.freeze(missingArtifactRoles),
    required_check_ids: Object.freeze(requiredChecks),
    unattested_required_checks: Object.freeze([...requiredChecks]),
    release_gate: Object.freeze({
      status: 'DENIED',
      reason: 'unsigned-artifact-inventory-is-not-a-release-candidate',
      signature_status: 'NOT_SIGNED',
      host_certification: 'NOT_PERFORMED',
      promotion_allowed: false,
      grants_authority: false,
      store_status: 'NOT_SUBMITTED',
    }),
  });
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
  const candidateSubjectDigest = subjectDigest(artifacts);
  const checks = list(manifest.checks, 'checks');
  requireValue(new Set(checks.map(c => c.id)).size === checks.length, 'duplicate-check');
  const required = manifest.profile === 'directadmin' ? [...CHECKS, 'business_node_812'] : CHECKS;
  for (const id of required) requireValue(checks.some(c => c.id === id), `check-${id}-required`);
  for (const check of checks) {
    requireValue(check.status === 'passed', `check-${check.id}-unverified`);
    requireValue(check.release_id === manifest.release_id && check.source_sha === manifest.source_sha &&
      check.subject_sha256 === candidateSubjectDigest, `check-${check.id}-candidate-mismatch`);
    const observed = date(check.observed_at);
    requireValue(observed >= created && observed <= now, `check-${check.id}-time-invalid`);
    requireValue(typeof check.evidence_path === 'string' &&
      paths.get(check.evidence_path.toLowerCase())?.role === 'evidence' &&
      paths.get(check.evidence_path.toLowerCase()).path === check.evidence_path, `check-${check.id}-evidence-required`);
  }
  const root = await fs.realpath(artifactRoot);
  for (const artifact of artifacts) {
    requireValue(await fileDigest(root, artifact.path) === artifact.sha256, `artifact-${artifact.role}-checksum-mismatch`);
  }
  const verifiedAt = Date.now();
  requireValue(verifiedAt >= now && verifiedAt < expires, 'time-expired-during-verification');
  return Object.freeze({ schema: 'titan.deployment.release-verification.v1', status: 'RELEASE_VERIFIED',
    release_id: manifest.release_id, version: manifest.version, source_sha: manifest.source_sha,
    manifest_sha256: sha256(payload), subject_sha256: candidateSubjectDigest, channel: manifest.channel,
    verified_at: new Date(verifiedAt).toISOString(), expires_at: manifest.expires_at,
    store_status: 'NOT_SUBMITTED', grants_authority: false });
}
