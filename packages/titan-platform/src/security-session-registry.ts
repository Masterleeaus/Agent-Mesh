import type { StorageClient, StorageTransactionOptions } from '@titan-zero/storage';
import { createHash } from 'node:crypto';
import {
  createSessionBinding, requireSecurityId, requireSecurityRevision, securityTimestamp,
  validateSession, type SessionBinding,
} from './security-boundary.js';

type IdentityStatus = 'active' | 'suspended' | 'revoked' | 'deleted';
type Actor = Readonly<{ actor_id: string; status: IdentityStatus }>;
type Company = Readonly<{ company_id: string; status: IdentityStatus }>;
type Membership = Readonly<{ actor_id: string; company_id: string; role: string; status: IdentityStatus }>;
type Device = Readonly<{ device_id: string; actor_id: string; status: IdentityStatus }>;
type ExternalBinding = Readonly<{
  binding_id: string; provider: string; subject: string;
  actor_id: string; company_id: string; status: IdentityStatus;
}>;
type ExternalIdentity = Readonly<{ provider: string; subject: string }>;
/** Only construct after an upstream provider has authenticated its session/token.
 * Registry IDs, a DA role, and caller-supplied headers are not authentication. */
export type VerifiedSessionIdentity = ExternalIdentity & Readonly<{
  session_id: string; device_id: string; session_revision: number;
  /** Present only when a canonical session was derived from a signed source session. */
  source_session?: SessionSourceReference;
  /** Expiry of the verified bearer. Required with source_session for effect fences. */
  credential_expires_at?: string;
}>;
export type SessionSourceReference = Readonly<{
  schema: 'titan.session-source/v1';
  provider: string; subject: string; issuer: string; audience: string;
  session_id: string; session_revision: number; context_revision: string;
  company_id: string; actor_id: string; device_id: string;
  expires_at: string; node_id: string; csrf_sha256: string;
}>;
export type ExpectedSessionContext = Readonly<{
  audience: string; company_id: string; actor_id?: string; context_revision?: string;
}>;
export type CurrentSessionContext = Readonly<{
  session_id: string; session_revision: number; context_revision: string;
  company_id: string; actor_id: string; device_id: string; company_role: string;
  audience: string; expires_at: string; external_binding_id: string;
  allowed_company_ids: readonly string[]; authority_neutral: true;
}>;
export type IssueSessionInput = ExternalIdentity & Readonly<{
  session_id: string; device_id: string; company_id: string; audience: string;
  issued_at: string; expires_at: string;
}>;
type SessionRow = Omit<SessionBinding, 'revoked'> & {
  revoked: number; binding_id: string; audience: string; context_generation: string;
};
type RecordRow = Record<string, string | number> & { revision: number; status: IdentityStatus };
type CurrentIdentity = {
  binding: ExternalBinding & { revision: number };
  role: string; generation: string; allowedCompanyIds: readonly string[];
};

const workforceZeroFenceTimeoutMs = 500;
const registryAvailabilityMarker = Symbol.for('titan.identity-session-registry.availability.v1');
const registryAvailabilityKindMarker = Symbol.for('titan.identity-session-registry.availability-kind.v1');

type RegistryAvailabilityKind = 'unavailable' | 'acquisition-timeout';

function messageOf(error: unknown): string | undefined {
  if (!(error instanceof Error)) return undefined;
  const descriptor = Object.getOwnPropertyDescriptor(error, 'message');
  return descriptor && 'value' in descriptor && typeof descriptor.value === 'string' ? descriptor.value : undefined;
}

function registryUnavailable(error: unknown): Error {
  const unavailable = new Error('identity-registry-unavailable');
  const kind: RegistryAvailabilityKind = messageOf(error) === 'storage-transaction-acquire-timeout'
    ? 'acquisition-timeout' : 'unavailable';
  Object.defineProperty(unavailable, registryAvailabilityMarker, { value: true });
  Object.defineProperty(unavailable, registryAvailabilityKindMarker, { value: kind });
  return unavailable;
}

function metadataValue(error: unknown, key: PropertyKey): unknown {
  if (error === null || (typeof error !== 'object' && typeof error !== 'function')) return undefined;
  const descriptor = Object.getOwnPropertyDescriptor(error, key);
  return descriptor && 'value' in descriptor ? descriptor.value : undefined;
}

function registryQueryFailure(error: unknown): Error {
  const code = metadataValue(error, 'code');
  if (typeof code === 'string' && code.startsWith('SQLITE_CONSTRAINT')) {
    return new Error('identity-registry-conflict');
  }
  return registryUnavailable(error);
}

/** Stable, non-sensitive classification for infrastructure failures at the
 * canonical registry boundary. It never conveys identity or authentication. */
export function isIdentityRegistryUnavailableError(error: unknown): boolean {
  try {
    return metadataValue(error, registryAvailabilityMarker) === true;
  } catch { return false; }
}

export function isIdentityRegistryAcquisitionTimeout(error: unknown): boolean {
  try {
    return isIdentityRegistryUnavailableError(error)
      && metadataValue(error, registryAvailabilityKindMarker) === 'acquisition-timeout';
  } catch { return false; }
}

async function registryQuery<T>(storage: StorageClient, sql: string, params: readonly unknown[] = []) {
  try { return await storage.query<T>(sql, params); }
  catch (error) { throw registryQueryFailure(error); }
}

async function registryTransaction<T>(
  storage: StorageClient,
  operation: (tx: StorageClient) => Promise<T>,
  options?: StorageTransactionOptions,
): Promise<T> {
  let callbackFailed = false;
  let callbackError: unknown;
  try {
    return await storage.transaction(async raw => {
      const tx: StorageClient = {
        dialect: raw.dialect,
        query: async <R>(sql: string, params: readonly unknown[] = []) => {
          try { return await raw.query<R>(sql, params); }
          catch (error) { throw registryQueryFailure(error); }
        },
        transaction: async () => { throw new Error('identity-registry-nested-transaction-unsupported'); },
        close: async () => { throw new Error('identity-registry-connection-owned'); },
      };
      try { return await operation(tx); }
      catch (error) { callbackFailed = true; callbackError = error; throw error; }
    }, options);
  } catch (error) {
    if (isIdentityRegistryUnavailableError(error)) throw error;
    if (callbackFailed && Object.is(error, callbackError)) throw error;
    if (typeof metadataValue(error, 'code') === 'string'
      && (metadataValue(error, 'code') as string).startsWith('SQLITE_CONSTRAINT')) {
      throw new Error('identity-registry-conflict');
    }
    throw registryUnavailable(error);
  }
}

function validateSourceReference(source: SessionSourceReference): void {
  const keys = ['schema','provider','subject','issuer','audience','session_id','session_revision','context_revision',
    'company_id','actor_id','device_id','expires_at','node_id','csrf_sha256'];
  if (!source || typeof source !== 'object' || Object.keys(source).length !== keys.length
    || keys.some(key => !(key in source))) throw new Error('session-source-invalid');
  const fields = ['provider','subject','issuer','audience','session_id','context_revision',
    'company_id','actor_id','device_id','node_id','csrf_sha256'] as const;
  for (const field of fields) requireSecurityId(source[field], field);
  if (source.schema !== 'titan.session-source/v1') throw new Error('session-source-invalid');
  requireSecurityRevision(source.session_revision);
  securityTimestamp(source.expires_at);
  if (!/^[A-Za-z0-9_-]{43}$/.test(source.csrf_sha256)) throw new Error('session-source-invalid');
}

function sourceProof(source: SessionSourceReference): VerifiedSessionIdentity {
  return { provider: source.provider, subject: source.subject, session_id: source.session_id,
    session_revision: source.session_revision, device_id: source.device_id };
}

/** Stable across source-token re-signing; the source session/revision and every
 * identity/context binding are immutable parts of the derived child's identity. */
function workforceZeroSessionId(source: SessionSourceReference): string {
  const stableReference = [source.schema, source.provider, source.subject, source.issuer,
    source.audience, source.session_id, source.session_revision, source.context_revision,
    source.company_id, source.actor_id, source.device_id, source.node_id, source.csrf_sha256,
    'workforce', 'zero'];
  const digest = createHash('sha256').update(JSON.stringify(stableReference)).digest('hex');
  return `workforce-zero-${digest}`;
}

function sameSourceContext(source: SessionSourceReference, current: CurrentSessionContext): boolean {
  return source.session_id === current.session_id && source.session_revision === current.session_revision
    && source.context_revision === current.context_revision && source.company_id === current.company_id
    && source.actor_id === current.actor_id && source.device_id === current.device_id
    && source.audience === current.audience;
}

const schemaV1 = [
  `CREATE TABLE titan_security_actors (
    actor_id TEXT PRIMARY KEY, status TEXT NOT NULL, revision INTEGER NOT NULL CHECK (revision > 0))`,
  `CREATE TABLE titan_security_companies (
    company_id TEXT PRIMARY KEY, status TEXT NOT NULL, revision INTEGER NOT NULL CHECK (revision > 0))`,
  `CREATE TABLE titan_security_memberships (
    actor_id TEXT NOT NULL REFERENCES titan_security_actors(actor_id),
    company_id TEXT NOT NULL REFERENCES titan_security_companies(company_id),
    role TEXT NOT NULL, status TEXT NOT NULL, revision INTEGER NOT NULL CHECK (revision > 0),
    PRIMARY KEY(actor_id, company_id))`,
  `CREATE TABLE titan_security_devices (
    device_id TEXT PRIMARY KEY, actor_id TEXT NOT NULL REFERENCES titan_security_actors(actor_id),
    status TEXT NOT NULL, revision INTEGER NOT NULL CHECK (revision > 0))`,
  `CREATE TABLE titan_security_external_bindings (
    binding_id TEXT PRIMARY KEY, provider TEXT NOT NULL, subject TEXT NOT NULL,
    actor_id TEXT NOT NULL REFERENCES titan_security_actors(actor_id),
    company_id TEXT NOT NULL REFERENCES titan_security_companies(company_id),
    status TEXT NOT NULL, revision INTEGER NOT NULL CHECK (revision > 0),
    UNIQUE(provider, subject, company_id))`,
  `CREATE TABLE titan_security_sessions (
    session_id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL REFERENCES titan_security_companies(company_id),
    actor_id TEXT NOT NULL REFERENCES titan_security_actors(actor_id),
    device_id TEXT NOT NULL REFERENCES titan_security_devices(device_id),
    binding_id TEXT NOT NULL REFERENCES titan_security_external_bindings(binding_id),
    issued_at TEXT NOT NULL, expires_at TEXT NOT NULL,
    revoked INTEGER NOT NULL CHECK (revoked IN (0, 1)),
    revision INTEGER NOT NULL CHECK (revision > 0),
    audience TEXT NOT NULL, context_generation TEXT NOT NULL)`,
];

/** Explicit, additive identity/control-plane migration. Never examines or backfills
 * company business tables. Unsupported schema versions fail closed for rollback. */
async function migrate(storage: StorageClient): Promise<void> {
  await registryTransaction(storage, async tx => {
    await tx.query('CREATE TABLE IF NOT EXISTS titan_security_migrations (version INTEGER PRIMARY KEY)');
    const versions = (await tx.query<{ version: number }>('SELECT version FROM titan_security_migrations')).rows;
    if (versions.length !== 0 && (versions.length !== 1 || versions[0].version !== 1)) throw new Error('identity-schema-version-unsupported');
    if (versions.length === 1) return;
    for (const sql of schemaV1) await tx.query(sql);
    await tx.query('INSERT INTO titan_security_migrations (version) VALUES (1)');
  });
}

function validateIdentity(identity: ExternalIdentity): void {
  requireSecurityId(identity.provider, 'provider');
  requireSecurityId(identity.subject, 'subject');
}
function active(row: RecordRow | undefined, kind: string): RecordRow {
  if (!row || row.status !== 'active') throw new Error(`identity-${kind}-unavailable`);
  requireSecurityRevision(row.revision);
  return row;
}
function nextRevision(revision: number): number {
  requireSecurityRevision(revision);
  requireSecurityRevision(revision + 1);
  return revision + 1;
}
function bindingFromRow(row: SessionRow): SessionBinding {
  if (row.revoked !== 0 && row.revoked !== 1) throw new Error('session-revocation-invalid');
  return { session_id: row.session_id, company_id: row.company_id, actor_id: row.actor_id, device_id: row.device_id,
    issued_at: row.issued_at, expires_at: row.expires_at, revoked: row.revoked === 1, revision: row.revision };
}
function context(row: SessionRow, identity: CurrentIdentity): CurrentSessionContext {
  return Object.freeze({
    session_id: row.session_id, session_revision: row.revision,
    context_revision: JSON.stringify([row.revision, row.context_generation]),
    company_id: row.company_id, actor_id: row.actor_id, device_id: row.device_id,
    company_role: identity.role, audience: row.audience, expires_at: row.expires_at,
    external_binding_id: identity.binding.binding_id,
    allowed_company_ids: Object.freeze([...identity.allowedCompanyIds]), authority_neutral: true,
  });
}

function selectedCompanyOnly(current: CurrentSessionContext): CurrentSessionContext {
  return Object.freeze({ ...current, allowed_company_ids: Object.freeze([current.company_id]) });
}

/** Canonical #302 store. Provisioning methods are trusted control-plane operations,
 * not public request handlers. Callers must protect them with existing governance.
 * No credentials, bearer tokens, business records or authority grants are stored. */
export class IdentitySessionRegistry {
  constructor(private readonly storage: StorageClient, private readonly clock: () => Date = () => new Date()) {}

  private transaction<T>(operation: (tx: StorageClient) => Promise<T>, options?: StorageTransactionOptions): Promise<T> {
    return registryTransaction(this.storage, operation, options);
  }

  private async put(table: string, values: Record<string, string>, keys: readonly string[], immutable: readonly string[], expected: number | null): Promise<number> {
    for (const [key, value] of Object.entries(values)) requireSecurityId(value, key);
    if (!['active', 'suspended', 'revoked', 'deleted'].includes(values.status)) throw new Error('identity-status-invalid');
    if (expected !== null) requireSecurityRevision(expected);
    return this.transaction(async tx => {
      // Table and column names are internal constants, never request-supplied SQL.
      const where = keys.map((key, index) => `${key}=$${index + 1}`).join(' AND ');
      const parameters = keys.map(key => values[key]);
      const old = (await tx.query<RecordRow>(`SELECT * FROM ${table} WHERE ${where}`, parameters)).rows[0];
      if ((expected === null && old) || (expected !== null && (!old || old.revision !== expected))) throw new Error('identity-revision-conflict');
      if (old && immutable.some(key => old[key] !== values[key])) throw new Error('identity-binding-immutable');
      const revision = old ? nextRevision(old.revision) : 1;
      const columns = Object.keys(values);
      if (!old) {
        await tx.query(`INSERT INTO ${table} (${columns.join(',')},revision) VALUES (${columns.map((_, i) => `$${i + 1}`).join(',')},$${columns.length + 1})`, [...columns.map(key => values[key]), revision]);
      } else {
        const changes = [...columns, 'revision'];
        const sql = `UPDATE ${table} SET ${changes.map((key, i) => `${key}=$${i + 1}`).join(',')} WHERE ${keys.map((key, i) => `${key}=$${changes.length + i + 1}`).join(' AND ')} AND revision=$${changes.length + keys.length + 1}`;
        const result = await tx.query(sql, [...columns.map(key => values[key]), revision, ...parameters, expected]);
        if (result.rowCount !== 1) throw new Error('identity-revision-conflict');
      }
      return revision;
    });
  }

  putActor(value: Actor, expected: number | null): Promise<number> {
    return this.put('titan_security_actors', { actor_id: value.actor_id, status: value.status }, ['actor_id'], [], expected);
  }
  putCompany(value: Company, expected: number | null): Promise<number> {
    return this.put('titan_security_companies', { company_id: value.company_id, status: value.status }, ['company_id'], [], expected);
  }
  putMembership(value: Membership, expected: number | null): Promise<number> {
    return this.put('titan_security_memberships', { actor_id: value.actor_id, company_id: value.company_id, role: value.role, status: value.status }, ['actor_id', 'company_id'], [], expected);
  }
  putDevice(value: Device, expected: number | null): Promise<number> {
    return this.put('titan_security_devices', { device_id: value.device_id, actor_id: value.actor_id, status: value.status }, ['device_id'], ['actor_id'], expected);
  }
  putExternalBinding(value: ExternalBinding, expected: number | null): Promise<number> {
    return this.put('titan_security_external_bindings', { binding_id: value.binding_id, provider: value.provider, subject: value.subject, actor_id: value.actor_id, company_id: value.company_id, status: value.status }, ['binding_id'], ['provider', 'subject', 'actor_id', 'company_id'], expected);
  }

  private async identity(tx: StorageClient, external: ExternalIdentity, companyId: string, deviceId: string): Promise<CurrentIdentity> {
    validateIdentity(external);
    requireSecurityId(companyId, 'company_id');
    requireSecurityId(deviceId, 'device_id');
    const bindings = (await tx.query<ExternalBinding & RecordRow>(
      "SELECT * FROM titan_security_external_bindings WHERE provider=$1 AND subject=$2 AND status='active'",
      [external.provider, external.subject],
    )).rows;
    if (new Set(bindings.map(b => b.actor_id)).size > 1) throw new Error('identity-binding-ambiguous');
    const selected = bindings.filter(b => b.company_id === companyId);
    if (selected.length !== 1) throw new Error(selected.length ? 'identity-binding-ambiguous' : 'identity-binding-unavailable');
    const binding = selected[0];
    active(binding, 'binding');
    const actor = active((await tx.query<RecordRow>('SELECT * FROM titan_security_actors WHERE actor_id=$1', [binding.actor_id])).rows[0], 'actor');
    const company = active((await tx.query<RecordRow>('SELECT * FROM titan_security_companies WHERE company_id=$1', [companyId])).rows[0], 'company');
    const membership = active((await tx.query<RecordRow>('SELECT * FROM titan_security_memberships WHERE actor_id=$1 AND company_id=$2', [binding.actor_id, companyId])).rows[0], 'membership');
    const device = active((await tx.query<RecordRow>('SELECT * FROM titan_security_devices WHERE device_id=$1 AND actor_id=$2', [deviceId, binding.actor_id])).rows[0], 'device');
    requireSecurityId(membership.role as string, 'role');
    const companies = (await tx.query<{ company_id: string }>(
      `SELECT b.company_id FROM titan_security_external_bindings b
       JOIN titan_security_companies c ON c.company_id=b.company_id AND c.status='active'
       JOIN titan_security_memberships m ON m.company_id=b.company_id AND m.actor_id=b.actor_id AND m.status='active'
       WHERE b.provider=$1 AND b.subject=$2 AND b.actor_id=$3 AND b.status='active' ORDER BY b.company_id`,
      [external.provider, external.subject, binding.actor_id],
    )).rows;
    return { binding, role: membership.role as string,
      generation: JSON.stringify([actor.revision, company.revision, membership.revision, device.revision, binding.binding_id, binding.revision]),
      allowedCompanyIds: companies.map(c => c.company_id) };
  }

  async issueSession(input: IssueSessionInput, now: string): Promise<CurrentSessionContext> {
    requireSecurityId(input.audience, 'audience');
    return this.transaction(async tx => {
      const identity = await this.identity(tx, input, input.company_id, input.device_id);
      const binding = createSessionBinding({ session_id: input.session_id, actor_id: identity.binding.actor_id,
        company_id: input.company_id, device_id: input.device_id, issued_at: input.issued_at, expires_at: input.expires_at, revoked: false });
      validateSession(binding, input.company_id, now);
      const row: SessionRow = { ...binding, revoked: 0, binding_id: identity.binding.binding_id, audience: input.audience, context_generation: identity.generation };
      await tx.query(`INSERT INTO titan_security_sessions
        (session_id,company_id,actor_id,device_id,issued_at,expires_at,revoked,revision,binding_id,audience,context_generation)
        VALUES ($1,$2,$3,$4,$5,$6,0,1,$7,$8,$9)`,
        [row.session_id,row.company_id,row.actor_id,row.device_id,row.issued_at,row.expires_at,row.binding_id,row.audience,row.context_generation]);
      return context(row, identity);
    });
  }

  /** Idempotently derive the fixed Workforce/Zero child from a current DA
   * session. The durable child row is also the replay boundary; there is no
   * second lineage table and a revoked/expired child is never recreated. */
  async issueWorkforceZeroSession(
    sourceProof: VerifiedSessionIdentity,
    sourceExpected: ExpectedSessionContext,
    source: SessionSourceReference,
    lifetimeSeconds: number,
    now: string,
  ): Promise<CurrentSessionContext> {
    validateSourceReference(source);
    if (!Number.isSafeInteger(lifetimeSeconds) || lifetimeSeconds < 1 || lifetimeSeconds > 900) {
      throw new Error('credential-lifetime-invalid');
    }
    if (sourceProof.provider !== source.provider || sourceProof.subject !== source.subject
      || sourceProof.session_id !== source.session_id || sourceProof.session_revision !== source.session_revision
      || sourceProof.device_id !== source.device_id || sourceExpected.audience !== source.audience
      || sourceExpected.company_id !== source.company_id || sourceExpected.actor_id !== source.actor_id
      || sourceExpected.context_revision !== source.context_revision) throw new Error('session-source-mismatch');

    return this.transaction(async tx => {
      const sourceResolved = await this.resolve(tx, sourceProof, sourceExpected, now);
      if (!sameSourceContext(source, sourceResolved.current)) throw new Error('session-source-stale');
      const at = securityTimestamp(now);
      const sourceExpiry = Math.min(securityTimestamp(source.expires_at), securityTimestamp(sourceResolved.row.expires_at));
      const cap = Math.floor(Math.min(sourceExpiry, at + lifetimeSeconds * 1000) / 1000) * 1000;
      if (cap <= at) throw new Error('session-source-expired');
      const desiredExpiry = new Date(cap).toISOString();
      const sessionId = workforceZeroSessionId(source);
      const existing = (await tx.query<SessionRow>('SELECT * FROM titan_security_sessions WHERE session_id=$1', [sessionId])).rows[0];

      if (existing) {
        if (existing.revoked !== 0 || existing.audience !== 'workforce'
          || existing.company_id !== source.company_id || existing.actor_id !== source.actor_id
          || existing.device_id !== source.device_id || existing.binding_id !== sourceResolved.current.external_binding_id) {
          throw new Error('session-derived-child-conflict');
        }
        // A retry can tighten expiry when its source credential expires sooner,
        // but can never extend or reactivate the deterministic child.
        const tightenExpiry = Date.parse(desiredExpiry) < Date.parse(existing.expires_at);
        const childRow = tightenExpiry
          ? { ...existing, expires_at: desiredExpiry, revision: nextRevision(existing.revision) } : existing;
        if (childRow.expires_at !== existing.expires_at) {
          const updated = await tx.query('UPDATE titan_security_sessions SET expires_at=$1,revision=$2 WHERE session_id=$3 AND revision=$4 AND revoked=0',
            [desiredExpiry, childRow.revision, sessionId, existing.revision]);
          if (updated.rowCount !== 1) throw new Error('session-revision-conflict');
        }
        validateSession(bindingFromRow(childRow), source.company_id, now);
        const identity = await this.identity(tx, sourceProof, source.company_id, source.device_id);
        if (identity.binding.binding_id !== childRow.binding_id || identity.binding.binding_id !== sourceResolved.current.external_binding_id
          || identity.generation !== childRow.context_generation) {
          throw new Error('session-context-stale');
        }
        return selectedCompanyOnly(context(childRow, identity));
      }

      const identity = await this.identity(tx, sourceProof, source.company_id, source.device_id);
      if (identity.binding.binding_id !== sourceResolved.current.external_binding_id) throw new Error('session-source-binding-mismatch');
      const binding = createSessionBinding({ session_id: sessionId, actor_id: identity.binding.actor_id,
        company_id: source.company_id, device_id: source.device_id, issued_at: now,
        expires_at: desiredExpiry, revoked: false });
      validateSession(binding, source.company_id, now);
      const row: SessionRow = { ...binding, revoked: 0, binding_id: identity.binding.binding_id,
        audience: 'workforce', context_generation: identity.generation };
      await tx.query(`INSERT INTO titan_security_sessions
        (session_id,company_id,actor_id,device_id,issued_at,expires_at,revoked,revision,binding_id,audience,context_generation)
        VALUES ($1,$2,$3,$4,$5,$6,0,1,$7,'workforce',$8)`,
        [row.session_id,row.company_id,row.actor_id,row.device_id,row.issued_at,row.expires_at,row.binding_id,row.context_generation]);
      return selectedCompanyOnly(context(row, identity));
    });
  }

  private async resolve(tx: StorageClient, proof: VerifiedSessionIdentity, expected: ExpectedSessionContext, now: string): Promise<{ row: SessionRow; current: CurrentSessionContext }> {
    validateIdentity(proof);
    requireSecurityId(proof.session_id, 'session_id');
    requireSecurityId(proof.device_id, 'device_id');
    requireSecurityRevision(proof.session_revision);
    requireSecurityId(expected.audience, 'audience');
    const row = (await tx.query<SessionRow>('SELECT * FROM titan_security_sessions WHERE session_id=$1', [proof.session_id])).rows[0];
    if (!row) throw new Error('session-unavailable');
    validateSession(bindingFromRow(row), expected.company_id, now);
    if (row.revision !== proof.session_revision) throw new Error('session-revision-stale');
    if (row.audience !== expected.audience) throw new Error('session-audience-mismatch');
    if (row.device_id !== proof.device_id) throw new Error('session-device-mismatch');
    if (expected.actor_id !== undefined && expected.actor_id !== row.actor_id) throw new Error('session-actor-mismatch');
    const identity = await this.identity(tx, proof, row.company_id, row.device_id);
    if (identity.binding.binding_id !== row.binding_id || identity.binding.actor_id !== row.actor_id) throw new Error('session-identity-mismatch');
    if (identity.generation !== row.context_generation) throw new Error('session-context-stale');
    const current = context(row, identity);
    if (expected.context_revision !== undefined && expected.context_revision !== current.context_revision) throw new Error('session-context-stale');
    if (proof.source_session !== undefined) {
      const source = proof.source_session;
      validateSourceReference(source);
      if (expected.audience !== 'workforce' || row.session_id !== workforceZeroSessionId(source)
        || proof.provider !== source.provider || proof.subject !== source.subject
        || row.company_id !== source.company_id || row.actor_id !== source.actor_id || row.device_id !== source.device_id
        || current.company_id !== source.company_id || current.actor_id !== source.actor_id || current.device_id !== source.device_id
        || proof.credential_expires_at === undefined) throw new Error('session-source-mismatch');
      const credentialExpiry = securityTimestamp(proof.credential_expires_at);
      if (credentialExpiry <= securityTimestamp(now)
        || credentialExpiry > securityTimestamp(row.expires_at)
        || credentialExpiry > securityTimestamp(source.expires_at)) throw new Error('session-source-expired');
      const sourceExpected: ExpectedSessionContext = { audience: source.audience, company_id: source.company_id,
        actor_id: source.actor_id, context_revision: source.context_revision };
      const sourceCurrent = await this.resolve(tx, sourceProof(source), sourceExpected, now);
      if (!sameSourceContext(source, sourceCurrent.current)
        || sourceCurrent.current.external_binding_id !== current.external_binding_id
        || credentialExpiry > securityTimestamp(sourceCurrent.row.expires_at)) throw new Error('session-source-stale');
    }
    return { row, current: proof.source_session === undefined ? current : selectedCompanyOnly(current) };
  }

  /** Rereads current identity on every call; no cached JWT role/company authority. */
  async resolveCurrentSession(proof: VerifiedSessionIdentity, expected: ExpectedSessionContext, now: string): Promise<CurrentSessionContext> {
    return this.transaction(async tx => (await this.resolve(tx, proof, expected, now)).current);
  }

  async switchCompany(proof: VerifiedSessionIdentity, expected: ExpectedSessionContext, companyId: string, now: string): Promise<CurrentSessionContext> {
    if (proof.source_session !== undefined) throw new Error('derived-session-company-switch-denied');
    return this.transaction(async tx => {
      const { row } = await this.resolve(tx, proof, expected, now);
      const identity = await this.identity(tx, proof, companyId, row.device_id);
      if (identity.binding.actor_id !== row.actor_id) throw new Error('session-actor-mismatch');
      const revision = nextRevision(row.revision);
      const changed = await tx.query(`UPDATE titan_security_sessions SET company_id=$1,binding_id=$2,context_generation=$3,revision=$4
        WHERE session_id=$5 AND revision=$6 AND revoked=0`,
        [companyId,identity.binding.binding_id,identity.generation,revision,row.session_id,row.revision]);
      if (changed.rowCount !== 1) throw new Error('session-revision-stale');
      return context({ ...row, company_id: companyId, binding_id: identity.binding.binding_id, context_generation: identity.generation, revision }, identity);
    });
  }

  /** Revalidates a Workforce/Zero derivation under the GLOBAL_REGISTRY SQLite
   * writer lock immediately before the effect boundary. The bounded callback
   * receives the absolute acquisition deadline and an abort signal. Keep it to
   * short local admission work: no provider/network wait and no registry
   * re-entry. On timeout it may still be running; consumers must mark the
   * execution UNCERTAIN and must not claim cancellation or retry it. */
  async withCurrentSessionFence<T>(
    proof: VerifiedSessionIdentity,
    expected: ExpectedSessionContext,
    options: Readonly<{ signal?: AbortSignal }> = {},
    effect: (current: CurrentSessionContext, signal: AbortSignal, acquireDeadlineMs: number) => Promise<T> | T,
  ): Promise<T> {
    if (proof.source_session === undefined) throw new Error('session-source-required');
    if (options.signal?.aborted) throw new Error('session-fence-aborted');
    const acquireDeadlineMs = performance.now() + workforceZeroFenceTimeoutMs;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let removeAbortListener = () => {};
    try {
      return await this.transaction(async tx => {
        // Sample the registry-owned clock after BEGIN IMMEDIATE succeeds, so
        // queue or cross-process writer contention cannot use a stale timestamp.
        const { current } = await this.resolve(tx, proof, expected, this.clock().toISOString());
        const remainingMs = acquireDeadlineMs - performance.now();
        if (remainingMs <= 0) throw new Error('session-fence-timeout');
        const controller = new AbortController();
        let rejectAbort!: (error: Error) => void;
        let rejectTimeout!: (error: Error) => void;
        const aborted = new Promise<never>((_resolve, reject) => { rejectAbort = reject; });
        const timedOut = new Promise<never>((_resolve, reject) => { rejectTimeout = reject; });
        const abort = () => {
          const error = new Error('session-fence-aborted');
          controller.abort(error);
          rejectAbort(error);
        };
        if (options.signal?.aborted) abort();
        else if (options.signal) {
          options.signal.addEventListener('abort', abort, { once: true });
          removeAbortListener = () => options.signal?.removeEventListener('abort', abort);
        }
        timer = setTimeout(() => {
          const error = new Error('session-fence-timeout');
          controller.abort(error);
          rejectTimeout(error);
        }, remainingMs);
        controller.signal.throwIfAborted();
        const running = Promise.resolve().then(() => {
          controller.signal.throwIfAborted();
          return effect(current, controller.signal, acquireDeadlineMs);
        });
        // A non-cooperative effect can finish after this fence rejects. Consume
        // its late rejection; the consumer owns UNCERTAIN reconciliation.
        void running.catch(() => undefined);
        return await Promise.race([running, aborted, timedOut]);
      }, { acquireDeadlineMs });
    } catch (error) {
      if (isIdentityRegistryAcquisitionTimeout(error)) throw new Error('session-fence-timeout');
      if (isIdentityRegistryUnavailableError(error)) throw new Error('identity-registry-unavailable');
      throw error;
    } finally {
      if (timer !== undefined) clearTimeout(timer);
      removeAbortListener();
    }
  }

  async revokeSession(sessionId: string, expectedRevision: number): Promise<void> {
    requireSecurityId(sessionId, 'session_id');
    const revision = nextRevision(expectedRevision);
    const result = await registryQuery(this.storage,
      'UPDATE titan_security_sessions SET revoked=1,revision=$1 WHERE session_id=$2 AND revision=$3 AND revoked=0',
      [revision,sessionId,expectedRevision]);
    if (result.rowCount !== 1) throw new Error('session-revision-conflict');
  }
}

/** Pass the separately configured canonical identity/control-plane connection.
 * Never pass a company-business connection or infer a path from request fields. */
export async function createIdentitySessionRegistry(input: {
  storage: StorageClient; storage_role: 'GLOBAL_REGISTRY'; now?: () => Date;
}): Promise<IdentitySessionRegistry> {
  if (input.storage_role !== 'GLOBAL_REGISTRY') throw new Error('identity-storage-role-required');
  if (input.storage.dialect !== 'sqlite') throw new Error('identity-storage-dialect-unsupported');
  await migrate(input.storage);
  return new IdentitySessionRegistry(input.storage, input.now);
}
