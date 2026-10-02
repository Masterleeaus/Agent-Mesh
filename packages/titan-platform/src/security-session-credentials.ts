import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import { requireSecurityId, requireSecurityRevision, securityTimestamp } from './security-boundary.js';
import { isIdentityRegistryUnavailableError, type CurrentSessionContext, type IdentitySessionRegistry,
  type SessionSourceReference, type VerifiedSessionIdentity } from './security-session-registry.js';

type Algorithm = 'ES256' | 'RS256' | 'HS256' | 'EdDSA';
type Key = CryptoKey | Uint8Array;
type Trust = Readonly<{ issuer: string; audience: string; key_id: string; algorithm: Algorithm; verification_key: Key }>;
export type CredentialExpectation = Readonly<{
  company_id: string; device_id: string; actor_id?: string; context_revision?: string;
}>;
export type WorkforceZeroExchangeOptions = Readonly<{
  issuer: string; key_id: string; algorithm: Algorithm; verification_key: Key; signing_key: Key;
  lifetime_seconds?: number;
}>;
export type DirectAdminCredentialBinding = Readonly<{ node_id: string; csrf_sha256: string; da_role: 'admin' | 'reseller' | 'user' }>;
export type AuthenticatedSessionCredential = Readonly<{
  context: CurrentSessionContext; provider: string; subject: string;
  credential_expires_at: string;
  directadmin?: DirectAdminCredentialBinding; source_session?: SessionSourceReference; surface?: 'zero';
}>;
export type SessionCredentialOptions = Trust & Readonly<{
  registry: IdentitySessionRegistry;
  /** Omit on a verification-only host. Issuance/switching then fail closed. */
  signing_key?: Key;
  upstream: Trust;
  lifetime_seconds?: number;
  /** Enables signed browser binding; the DA adapter still enforces origin/CSRF. */
  directadmin?: Readonly<{ node_id: string }>;
  /** Fixed server-side DA → Workforce/Zero target. Audience and surface are
   * intentionally absent here and fixed by the canonical owner. */
  workforce_zero_exchange?: WorkforceZeroExchangeOptions;
  /** Trusted server clock only; never bind to a request parameter. */
  now?: () => Date;
}>;
export type IssuedSessionCredential = Readonly<{ credential: string; context: CurrentSessionContext; credential_expires_at: string }>;

/** Configured host identity, never Host/X-Forwarded-Host or a request URL. */
export function directAdminIssuer(origin: string): string {
  const url = new URL(origin);
  if (url.protocol !== 'https:' || url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
    throw new Error('directadmin-issuer-origin-invalid');
  }
  return `directadmin:${url.origin}`;
}

function trust(input: Trust): Trust {
  for (const field of ['issuer', 'audience', 'key_id'] as const) requireSecurityId(input[field], field);
  if (!['ES256', 'RS256', 'HS256', 'EdDSA'].includes(input.algorithm)) throw new Error('credential-algorithm-unsupported');
  if (input.issuer === 'directadmin' || (input.issuer.startsWith('directadmin:')
    && directAdminIssuer(input.issuer.slice('directadmin:'.length)) !== input.issuer)) {
    throw new Error('directadmin-issuer-host-required');
  }
  const key = input.verification_key;
  if (input.algorithm === 'HS256' && (!(key instanceof Uint8Array) || key.byteLength < 32)) throw new Error('credential-key-invalid');
  if (input.algorithm !== 'HS256' && key instanceof Uint8Array) throw new Error('credential-key-invalid');
  return Object.freeze({ issuer: input.issuer, audience: input.audience, key_id: input.key_id,
    algorithm: input.algorithm, verification_key: key instanceof Uint8Array ? new Uint8Array(key) : key });
}

function id(payload: JWTPayload, field: string): string {
  const value = payload[field];
  if (typeof value !== 'string' || value.length > 2048) throw new Error('credential-claim-invalid');
  requireSecurityId(value, field);
  return value;
}
function expected(input: CredentialExpectation): void {
  requireSecurityId(input.company_id, 'company_id');
  requireSecurityId(input.device_id, 'device_id');
  if (input.actor_id !== undefined) requireSecurityId(input.actor_id, 'actor_id');
  if (input.context_revision !== undefined) requireSecurityId(input.context_revision, 'context_revision');
}

function sourceReference(value: unknown): SessionSourceReference {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('session-source-invalid');
  const input = value as Record<string, unknown>;
  const fields = ['schema','provider','subject','issuer','audience','session_id','session_revision',
    'context_revision','company_id','actor_id','device_id','expires_at','node_id','csrf_sha256'];
  if (Object.keys(input).length !== fields.length || fields.some(field => !(field in input))) throw new Error('session-source-invalid');
  if (input.schema !== 'titan.session-source/v1') throw new Error('session-source-invalid');
  for (const field of ['provider','subject','issuer','audience','session_id','context_revision','company_id',
    'actor_id','device_id','expires_at','node_id','csrf_sha256']) {
    if (typeof input[field] !== 'string') throw new Error('session-source-invalid');
    requireSecurityId(input[field] as string, field);
  }
  requireSecurityRevision(input.session_revision as number);
  securityTimestamp(input.expires_at as string);
  if (!/^[A-Za-z0-9_-]{43}$/.test(input.csrf_sha256 as string)) throw new Error('session-source-invalid');
  return Object.freeze(input as unknown as SessionSourceReference);
}

function canonicalDirectAdminProvider(value: string): boolean {
  if (!value.startsWith('directadmin:')) return false;
  try { return directAdminIssuer(value.slice('directadmin:'.length)) === value; } catch { return false; }
}

/** The only request-facing entrance to the registry: credentials, not asserted
 * principals/session IDs. Keys and policy are supplied once by trusted startup.
 * Raw registry provisioning remains a protected commissioning capability and is
 * deliberately not exposed by this service. Identity does not grant authority. */
export function createSessionCredentialService(options: SessionCredentialOptions) {
  const policy = trust(options);
  const upstream = trust(options.upstream);
  const workforceTarget = options.workforce_zero_exchange === undefined ? undefined : trust({
    ...options.workforce_zero_exchange, audience: 'workforce',
  });
  const workforceSigningKey = options.workforce_zero_exchange?.signing_key instanceof Uint8Array
    ? new Uint8Array(options.workforce_zero_exchange.signing_key) : options.workforce_zero_exchange?.signing_key;
  const registry = options.registry;
  const daNode = options.directadmin?.node_id;
  if (daNode !== undefined) requireSecurityId(daNode, 'node_id');
  const clock = options.now ?? (() => new Date());
  const lifetime = options.lifetime_seconds ?? 300;
  if (!Number.isSafeInteger(lifetime) || lifetime < 1 || lifetime > 900) throw new Error('credential-lifetime-invalid');
  const signingKey = options.signing_key instanceof Uint8Array ? new Uint8Array(options.signing_key) : options.signing_key;
  if (signingKey !== undefined && policy.algorithm === 'HS256' && (!(signingKey instanceof Uint8Array) || signingKey.byteLength < 32)) throw new Error('credential-key-invalid');
  if (signingKey !== undefined && policy.algorithm !== 'HS256' && signingKey instanceof Uint8Array) throw new Error('credential-key-invalid');
  const workforceLifetime = options.workforce_zero_exchange?.lifetime_seconds ?? 300;
  if (!Number.isSafeInteger(workforceLifetime) || workforceLifetime < 1 || workforceLifetime > 900) throw new Error('credential-lifetime-invalid');
  if (workforceTarget !== undefined) {
    if (daNode === undefined || !canonicalDirectAdminProvider(upstream.issuer) || policy.audience === 'workforce') {
      throw new Error('workforce-zero-exchange-source-invalid');
    }
    if (workforceSigningKey === undefined
      || (workforceTarget.algorithm === 'HS256' && (!(workforceSigningKey instanceof Uint8Array) || workforceSigningKey.byteLength < 32))
      || (workforceTarget.algorithm !== 'HS256' && workforceSigningKey instanceof Uint8Array)) throw new Error('credential-key-invalid');
  }
  // A signing service trusted for a DirectAdmin issuer must not use generic
  // issue() to mint an independent Workforce session. DA-derived Workforce
  // credentials must go through the fixed, source-bound Zero exchange. A
  // public-key-only Workforce verifier is still allowed to validate those
  // derived credentials.
  if (signingKey !== undefined && workforceTarget === undefined && policy.audience === 'workforce'
    && canonicalDirectAdminProvider(upstream.issuer)) throw new Error('workforce-zero-exchange-required');

  function now(): Date {
    const value = clock();
    if (!(value instanceof Date) || !Number.isFinite(value.getTime())) throw new Error('credential-clock-invalid');
    return new Date(value.getTime());
  }

  async function verify(token: string, configured: Trust, typ: string, at: Date, maxAge: number): Promise<JWTPayload> {
    if (typeof token !== 'string' || token.length > 16384 || token.length < 1) throw new Error('credential-invalid');
    // Static local key only: token-supplied jwk/jku/x5u never selects a key or network destination.
    const { payload, protectedHeader } = await jwtVerify(token, configured.verification_key, {
      algorithms: [configured.algorithm], issuer: configured.issuer, audience: configured.audience,
      typ, requiredClaims: ['iss', 'sub', 'aud', 'iat', 'exp'], currentDate: at, clockTolerance: 0,
    });
    if (protectedHeader.kid !== configured.key_id || protectedHeader.typ !== typ
      || Object.keys(protectedHeader).some(k => !['alg', 'kid', 'typ'].includes(k))) throw new Error('credential-header-invalid');
    // Audience arrays and unbounded/malformed NumericDates are not this contract.
    const seconds = Math.floor(at.getTime() / 1000);
    if (payload.aud !== configured.audience || !Number.isSafeInteger(payload.iat) || !Number.isSafeInteger(payload.exp)
      || payload.iat! > seconds || payload.exp! <= seconds || payload.exp! <= payload.iat!
      || payload.exp! - payload.iat! > maxAge) throw new Error('credential-time-or-audience-invalid');
    id(payload, 'sub');
    return payload;
  }

  let signingReady: Promise<void> | undefined;
  async function ensureSigning(at: Date): Promise<void> {
    if (signingKey === undefined) throw new Error('credential-issuance-disabled');
    // Validate fixed key-pair configuration before consuming an assertion or
    // rotating a session. This private probe is never persisted or returned.
    signingReady ??= (async () => {
      const seconds = Math.floor(at.getTime() / 1000);
      const probe = await new SignJWT({}).setProtectedHeader({ alg: policy.algorithm, kid: policy.key_id, typ: 'titan-configuration-probe+jwt' })
        .setIssuer(policy.issuer).setAudience(policy.audience).setSubject('configuration-probe')
        .setIssuedAt(seconds).setExpirationTime(seconds + 1).sign(signingKey);
      await verify(probe, policy, 'titan-configuration-probe+jwt', at, 1);
    })();
    await signingReady;
  }

  let workforceSigningReady: Promise<void> | undefined;
  async function ensureWorkforceSigning(at: Date): Promise<void> {
    if (workforceTarget === undefined || workforceSigningKey === undefined) throw new Error('credential-issuance-disabled');
    workforceSigningReady ??= (async () => {
      const seconds = Math.floor(at.getTime() / 1000);
      const probe = await new SignJWT({}).setProtectedHeader({ alg: workforceTarget.algorithm, kid: workforceTarget.key_id, typ: 'titan-configuration-probe+jwt' })
        .setIssuer(workforceTarget.issuer).setAudience('workforce').setSubject('configuration-probe')
        .setIssuedAt(seconds).setExpirationTime(seconds + 1).sign(workforceSigningKey);
      await verify(probe, workforceTarget, 'titan-configuration-probe+jwt', at, 1);
    })();
    await workforceSigningReady;
  }

  function channel(claims: JWTPayload): DirectAdminCredentialBinding | undefined {
    if (daNode === undefined) {
      if (claims.node_id !== undefined || claims.csrf_sha256 !== undefined || claims.da_role !== undefined) throw new Error('credential-channel-unconfigured');
      return undefined;
    }
    if (id(claims, 'node_id') !== daNode || !/^[A-Za-z0-9_-]{43}$/.test(id(claims, 'csrf_sha256'))
      || !['admin', 'reseller', 'user'].includes(id(claims, 'da_role'))) throw new Error('credential-channel-invalid');
    return Object.freeze({ node_id: daNode, csrf_sha256: claims.csrf_sha256 as string, da_role: claims.da_role as DirectAdminCredentialBinding['da_role'] });
  }

  async function signed(
    current: CurrentSessionContext,
    subject: string,
    at: Date,
    binding?: DirectAdminCredentialBinding,
    target: Readonly<{ trust: Trust; signing_key: Key; lifetime_seconds: number; source_session?: SessionSourceReference }> = {
      trust: policy, signing_key: signingKey!, lifetime_seconds: lifetime,
    },
  ): Promise<IssuedSessionCredential> {
    if (target.signing_key === undefined) throw new Error('credential-issuance-disabled');
    const iat = Math.floor(at.getTime() / 1000);
    const exp = Math.min(Math.floor(Date.parse(current.expires_at) / 1000), iat + target.lifetime_seconds,
      target.source_session === undefined ? Number.MAX_SAFE_INTEGER : Math.floor(Date.parse(target.source_session.expires_at) / 1000));
    if (exp <= iat) throw new Error('credential-expired');
    const credential = await new SignJWT({
      ...binding, identity_provider: upstream.issuer,
      session_id: current.session_id, device_id: current.device_id, company_id: current.company_id,
      actor_id: current.actor_id, session_revision: current.session_revision, context_revision: current.context_revision,
      ...(target.source_session ? { source_session: target.source_session, surface: 'zero' } : {}),
    }).setProtectedHeader({ alg: target.trust.algorithm, kid: target.trust.key_id, typ: 'titan-session+jwt' })
      .setIssuer(target.trust.issuer).setAudience(target.trust.audience).setSubject(subject)
      .setIssuedAt(iat).setExpirationTime(exp).sign(target.signing_key);
    // Detect misconfigured signing/verification pairs before returning any credential.
    await verify(credential, target.trust, 'titan-session+jwt', at, target.lifetime_seconds);
    return Object.freeze({ credential, context: current, credential_expires_at: new Date(exp * 1000).toISOString() });
  }

  async function authenticated(token: string, expectation: CredentialExpectation | undefined, at: Date) {
    if (expectation !== undefined) expected(expectation);
    const claims = await verify(token, policy, 'titan-session+jwt', at, lifetime);
    if (id(claims, 'identity_provider') !== upstream.issuer) throw new Error('credential-provider-mismatch');
    const company = id(claims, 'company_id');
    const device = id(claims, 'device_id');
    const actor = id(claims, 'actor_id');
    const revision = id(claims, 'context_revision');
    const subject = id(claims, 'sub');
    const sourceSession = claims.source_session === undefined ? undefined : sourceReference(claims.source_session);
    if (sourceSession !== undefined) {
      if (policy.audience !== 'workforce' || claims.surface !== 'zero' || daNode === undefined
        || !canonicalDirectAdminProvider(upstream.issuer) || sourceSession.provider !== upstream.issuer
        || sourceSession.subject !== subject || sourceSession.company_id !== company
        || sourceSession.actor_id !== actor || sourceSession.device_id !== device || sourceSession.node_id !== daNode
        || claims.exp! > Math.floor(Date.parse(sourceSession.expires_at) / 1000)) throw new Error('credential-source-mismatch');
    } else if (claims.surface !== undefined) throw new Error('credential-surface-invalid');
    const binding = sourceSession === undefined ? channel(claims) : undefined;
    if (expectation !== undefined && (company !== expectation.company_id || device !== expectation.device_id
      || (expectation.actor_id !== undefined && actor !== expectation.actor_id)
      || (expectation.context_revision !== undefined && revision !== expectation.context_revision))) throw new Error('credential-context-mismatch');
    requireSecurityRevision(claims.session_revision as number);
    const proof: VerifiedSessionIdentity = { provider: upstream.issuer, subject,
      session_id: id(claims, 'session_id'), device_id: device, session_revision: claims.session_revision as number,
      credential_expires_at: new Date(claims.exp! * 1000).toISOString(), ...(sourceSession ? { source_session: sourceSession } : {}) };
    const checked = { company_id: company, actor_id: actor, context_revision: revision, audience: policy.audience };
    return { proof, checked, binding, sourceSession, claims };
  }

  // Errors deliberately omit JWTs, crypto diagnostics, claim values and storage details.
  async function deny<T>(operation: () => Promise<T>): Promise<T> {
    try { return await operation(); } catch (error) {
      if (isIdentityRegistryUnavailableError(error)) throw new Error('identity-registry-unavailable');
      throw new Error('authentication-denied');
    }
  }

  return Object.freeze({
    issue(credential: string, expectation: CredentialExpectation): Promise<IssuedSessionCredential> {
      return deny(async () => {
        expected(expectation);
        const at = now();
        const claims = await verify(credential, upstream, 'titan-login+jwt', at, 300);
        const binding = channel(claims);
        const subject = id(claims, 'sub');
        const nonce = id(claims, 'jti');
        if (id(claims, 'company_id') !== expectation.company_id || id(claims, 'device_id') !== expectation.device_id) throw new Error('credential-context-mismatch');
        // Durable one-time exchange: the existing session primary key consumes the
        // issuer-scoped assertion ID. It remains consumed after switch/revoke/restart.
        const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify([upstream.issuer, nonce])));
        const sessionId = `auth-${Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('')}`;
        const expires = Math.min(claims.exp!, Math.floor(at.getTime() / 1000) + lifetime);
        await ensureSigning(at);
        const current = await registry.issueSession({ provider: upstream.issuer, subject, session_id: sessionId,
          device_id: expectation.device_id, company_id: expectation.company_id, audience: policy.audience,
          issued_at: at.toISOString(), expires_at: new Date(expires * 1000).toISOString() }, at.toISOString());
        // Never allow an optional asserted actor/context to override registry truth.
        if ((expectation.actor_id !== undefined && expectation.actor_id !== current.actor_id)
          || (expectation.context_revision !== undefined && expectation.context_revision !== current.context_revision)) {
          await registry.revokeSession(current.session_id, current.session_revision);
          throw new Error('credential-context-mismatch');
        }
        return signed(current, subject, at, binding);
      });
    },
    authenticate(credential: string, expectation?: CredentialExpectation): Promise<AuthenticatedSessionCredential> {
      return deny(async () => {
        const at = now();
        const { proof, checked, binding, sourceSession, claims } = await authenticated(credential, expectation, at);
        const context = await registry.resolveCurrentSession(proof, checked, at.toISOString());
        if (claims.exp! > Math.floor(Date.parse(context.expires_at) / 1000)) throw new Error('credential-expiry-exceeds-session');
        return Object.freeze({ context, provider: proof.provider, subject: proof.subject,
          credential_expires_at: proof.credential_expires_at!,
          ...(binding ? { directadmin: binding } : {}), ...(sourceSession ? { source_session: sourceSession, surface: 'zero' as const } : {}) });
      });
    },
    resolve(credential: string, expectation: CredentialExpectation): Promise<CurrentSessionContext> {
      return deny(async () => {
        expected(expectation);
        const at = now();
        const { proof, checked, claims } = await authenticated(credential, expectation, at);
        const current = await registry.resolveCurrentSession(proof, checked, at.toISOString());
        if (claims.exp! > Math.floor(Date.parse(current.expires_at) / 1000)) throw new Error('credential-expiry-exceeds-session');
        return current;
      });
    },
    switchCompany(credential: string, expectation: CredentialExpectation, companyId: string): Promise<IssuedSessionCredential> {
      return deny(async () => {
        expected(expectation);
        const at = now();
        const { proof, checked, binding, sourceSession } = await authenticated(credential, expectation, at);
        if (sourceSession !== undefined) throw new Error('derived-session-company-switch-denied');
        await ensureSigning(at);
        const current = await registry.switchCompany(proof, checked, companyId, at.toISOString());
        return signed(current, proof.subject, at, binding);
      });
    },
    exchangeWorkforceZero(credential: string, expectation?: CredentialExpectation): Promise<IssuedSessionCredential> {
      return deny(async () => {
        if (workforceTarget === undefined || workforceSigningKey === undefined || daNode === undefined) {
          throw new Error('workforce-zero-exchange-disabled');
        }
        if (expectation !== undefined && Object.keys(expectation).some(field =>
          !['company_id', 'device_id', 'actor_id', 'context_revision'].includes(field))) {
          throw new Error('workforce-zero-target-fixed');
        }
        if (expectation !== undefined) expected(expectation);
        const at = now();
        const { proof, checked, binding, sourceSession: parent, claims } = await authenticated(credential, expectation, at);
        if (parent !== undefined || binding === undefined || checked.audience !== policy.audience) throw new Error('workforce-zero-source-invalid');
        await ensureWorkforceSigning(at);
        const source: SessionSourceReference = Object.freeze({
          schema: 'titan.session-source/v1', provider: proof.provider, subject: proof.subject,
          issuer: id(claims, 'iss'), audience: policy.audience, session_id: proof.session_id,
          session_revision: proof.session_revision, context_revision: checked.context_revision,
          company_id: checked.company_id, actor_id: checked.actor_id, device_id: proof.device_id,
          expires_at: new Date(claims.exp! * 1000).toISOString(), node_id: binding.node_id,
          csrf_sha256: binding.csrf_sha256,
        });
        const current = await registry.issueWorkforceZeroSession(proof, checked, source, workforceLifetime, at.toISOString());
        const issued = await signed(current, proof.subject, at, undefined, {
          trust: workforceTarget, signing_key: workforceSigningKey, lifetime_seconds: workforceLifetime,
          source_session: source,
        });
        const targetProof: VerifiedSessionIdentity = {
          provider: proof.provider, subject: proof.subject, session_id: current.session_id,
          session_revision: current.session_revision, device_id: current.device_id,
          credential_expires_at: issued.credential_expires_at, source_session: source,
        };
        const targetExpected = { audience: 'workforce', company_id: current.company_id,
          actor_id: current.actor_id, context_revision: current.context_revision };
        await registry.resolveCurrentSession(targetProof, targetExpected, now().toISOString());
        return issued;
      });
    },
    revoke(credential: string, expectation: CredentialExpectation): Promise<void> {
      return deny(async () => {
        expected(expectation);
        const at = now();
        const { proof, checked } = await authenticated(credential, expectation, at);
        const current = await registry.resolveCurrentSession(proof, checked, at.toISOString());
        await registry.revokeSession(current.session_id, current.session_revision);
      });
    },
  });
}

/** Verification-only API for consumers such as the hosted Workforce.
 * Use an asymmetric algorithm for a public-key-only host; HS256 requires a secret.
 * Exposes no session issuance, switching, revocation or registry provisioning. */
export function createSessionCredentialVerifier(options: Omit<SessionCredentialOptions, 'signing_key' | 'workforce_zero_exchange'>) {
  const service = createSessionCredentialService({ ...options, signing_key: undefined, workforce_zero_exchange: undefined });
  return Object.freeze({ authenticate: service.authenticate, resolve: service.resolve });
}
