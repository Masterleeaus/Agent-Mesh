import type { StorageClient } from '@titan-zero/storage';
import {
  createSessionBinding, requireSecurityId, requireSecurityRevision,
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
  await storage.transaction(async tx => {
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

/** Canonical #302 store. Provisioning methods are trusted control-plane operations,
 * not public request handlers. Callers must protect them with existing governance.
 * No credentials, bearer tokens, business records or authority grants are stored. */
export class IdentitySessionRegistry {
  constructor(private readonly storage: StorageClient) {}

  private async put(table: string, values: Record<string, string>, keys: readonly string[], immutable: readonly string[], expected: number | null): Promise<number> {
    for (const [key, value] of Object.entries(values)) requireSecurityId(value, key);
    if (!['active', 'suspended', 'revoked', 'deleted'].includes(values.status)) throw new Error('identity-status-invalid');
    if (expected !== null) requireSecurityRevision(expected);
    return this.storage.transaction(async tx => {
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
    return this.storage.transaction(async tx => {
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
    return { row, current };
  }

  /** Rereads current identity on every call; no cached JWT role/company authority. */
  async resolveCurrentSession(proof: VerifiedSessionIdentity, expected: ExpectedSessionContext, now: string): Promise<CurrentSessionContext> {
    return this.storage.transaction(async tx => (await this.resolve(tx, proof, expected, now)).current);
  }

  async switchCompany(proof: VerifiedSessionIdentity, expected: ExpectedSessionContext, companyId: string, now: string): Promise<CurrentSessionContext> {
    return this.storage.transaction(async tx => {
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

  async revokeSession(sessionId: string, expectedRevision: number): Promise<void> {
    requireSecurityId(sessionId, 'session_id');
    const revision = nextRevision(expectedRevision);
    const result = await this.storage.query('UPDATE titan_security_sessions SET revoked=1,revision=$1 WHERE session_id=$2 AND revision=$3 AND revoked=0', [revision,sessionId,expectedRevision]);
    if (result.rowCount !== 1) throw new Error('session-revision-conflict');
  }
}

/** Pass the separately configured canonical identity/control-plane connection.
 * Never pass a company-business connection or infer a path from request fields. */
export async function createIdentitySessionRegistry(input: { storage: StorageClient; storage_role: 'GLOBAL_REGISTRY' }): Promise<IdentitySessionRegistry> {
  if (input.storage_role !== 'GLOBAL_REGISTRY') throw new Error('identity-storage-role-required');
  if (input.storage.dialect !== 'sqlite') throw new Error('identity-storage-dialect-unsupported');
  await migrate(input.storage);
  return new IdentitySessionRegistry(input.storage);
}
