import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import { requireSecurityId, requireSecurityRevision } from './security-boundary.js';
import type { CurrentSessionContext, IdentitySessionRegistry, VerifiedSessionIdentity } from './security-session-registry.js';

type Algorithm = 'ES256' | 'RS256' | 'HS256' | 'EdDSA';
type Key = CryptoKey | Uint8Array;
type Trust = Readonly<{ issuer: string; audience: string; key_id: string; algorithm: Algorithm; verification_key: Key }>;
export type CredentialExpectation = Readonly<{
  company_id: string; device_id: string; actor_id?: string; context_revision?: string;
}>;
export type DirectAdminCredentialBinding = Readonly<{ node_id: string; csrf_sha256: string; da_role: 'admin' | 'reseller' | 'user' }>;
export type AuthenticatedSessionCredential = Readonly<{ context: CurrentSessionContext; provider: string; subject: string; directadmin?: DirectAdminCredentialBinding }>;
export type SessionCredentialOptions = Trust & Readonly<{
  registry: IdentitySessionRegistry;
  /** Omit on a verification-only host. Issuance/switching then fail closed. */
  signing_key?: Key;
  upstream: Trust;
  lifetime_seconds?: number;
  /** Enables signed browser binding; the DA adapter still enforces origin/CSRF. */
  directadmin?: Readonly<{ node_id: string }>;
  /** Trusted server clock only; never bind to a request parameter. */
  now?: () => Date;
}>;
export type IssuedSessionCredential = Readonly<{ credential: string; context: CurrentSessionContext }>;

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
    algorithm: input.algorithm, verification_key: key instanceof Uint8Array ? key.slice() : key });
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

/** The only request-facing entrance to the registry: credentials, not asserted
 * principals/session IDs. Keys and policy are supplied once by trusted startup.
 * Raw registry provisioning remains a protected commissioning capability and is
 * deliberately not exposed by this service. Identity does not grant authority. */
export function createSessionCredentialService(options: SessionCredentialOptions) {
  const policy = trust(options);
  const upstream = trust(options.upstream);
  const registry = options.registry;
  const daNode = options.directadmin?.node_id;
  if (daNode !== undefined) requireSecurityId(daNode, 'node_id');
  const clock = options.now ?? (() => new Date());
  const lifetime = options.lifetime_seconds ?? 300;
  if (!Number.isSafeInteger(lifetime) || lifetime < 1 || lifetime > 900) throw new Error('credential-lifetime-invalid');
  const signingKey = options.signing_key instanceof Uint8Array ? options.signing_key.slice() : options.signing_key;
  if (signingKey !== undefined && policy.algorithm === 'HS256' && (!(signingKey instanceof Uint8Array) || signingKey.byteLength < 32)) throw new Error('credential-key-invalid');
  if (signingKey !== undefined && policy.algorithm !== 'HS256' && signingKey instanceof Uint8Array) throw new Error('credential-key-invalid');

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

  function channel(claims: JWTPayload): DirectAdminCredentialBinding | undefined {
    if (daNode === undefined) {
      if (claims.node_id !== undefined || claims.csrf_sha256 !== undefined || claims.da_role !== undefined) throw new Error('credential-channel-unconfigured');
      return undefined;
    }
    if (id(claims, 'node_id') !== daNode || !/^[A-Za-z0-9_-]{43}$/.test(id(claims, 'csrf_sha256'))
      || !['admin', 'reseller', 'user'].includes(id(claims, 'da_role'))) throw new Error('credential-channel-invalid');
    return Object.freeze({ node_id: daNode, csrf_sha256: claims.csrf_sha256 as string, da_role: claims.da_role as DirectAdminCredentialBinding['da_role'] });
  }

  async function signed(current: CurrentSessionContext, subject: string, at: Date, binding?: DirectAdminCredentialBinding): Promise<IssuedSessionCredential> {
    if (signingKey === undefined) throw new Error('credential-issuance-disabled');
    const iat = Math.floor(at.getTime() / 1000);
    const exp = Math.min(Math.floor(Date.parse(current.expires_at) / 1000), iat + lifetime);
    if (exp <= iat) throw new Error('credential-expired');
    const credential = await new SignJWT({
      ...binding, identity_provider: upstream.issuer,
      session_id: current.session_id, device_id: current.device_id, company_id: current.company_id,
      actor_id: current.actor_id, session_revision: current.session_revision, context_revision: current.context_revision,
    }).setProtectedHeader({ alg: policy.algorithm, kid: policy.key_id, typ: 'titan-session+jwt' })
      .setIssuer(policy.issuer).setAudience(policy.audience).setSubject(subject)
      .setIssuedAt(iat).setExpirationTime(exp).sign(signingKey);
    // Detect misconfigured signing/verification pairs before returning any credential.
    await verify(credential, policy, 'titan-session+jwt', at, lifetime);
    return Object.freeze({ credential, context: current });
  }

  async function authenticated(token: string, expectation: CredentialExpectation | undefined, at: Date) {
    if (expectation !== undefined) expected(expectation);
    const claims = await verify(token, policy, 'titan-session+jwt', at, lifetime);
    if (id(claims, 'identity_provider') !== upstream.issuer) throw new Error('credential-provider-mismatch');
    const binding = channel(claims);
    const company = id(claims, 'company_id');
    const device = id(claims, 'device_id');
    const actor = id(claims, 'actor_id');
    const revision = id(claims, 'context_revision');
    if (expectation !== undefined && (company !== expectation.company_id || device !== expectation.device_id
      || (expectation.actor_id !== undefined && actor !== expectation.actor_id)
      || (expectation.context_revision !== undefined && revision !== expectation.context_revision))) throw new Error('credential-context-mismatch');
    requireSecurityRevision(claims.session_revision as number);
    const proof: VerifiedSessionIdentity = { provider: upstream.issuer, subject: id(claims, 'sub'),
      session_id: id(claims, 'session_id'), device_id: device, session_revision: claims.session_revision as number };
    const checked = { company_id: company, actor_id: actor, context_revision: revision, audience: policy.audience };
    return { proof, checked, binding };
  }

  // Errors deliberately omit JWTs, crypto diagnostics, claim values and storage details.
  async function deny<T>(operation: () => Promise<T>): Promise<T> {
    try { return await operation(); } catch { throw new Error('authentication-denied'); }
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
        const { proof, checked, binding } = await authenticated(credential, expectation, at);
        const context = await registry.resolveCurrentSession(proof, checked, at.toISOString());
        return Object.freeze({ context, provider: proof.provider, subject: proof.subject, ...(binding ? { directadmin: binding } : {}) });
      });
    },
    resolve(credential: string, expectation: CredentialExpectation): Promise<CurrentSessionContext> {
      return deny(async () => {
        expected(expectation);
        const at = now();
        const { proof, checked } = await authenticated(credential, expectation, at);
        return registry.resolveCurrentSession(proof, checked, at.toISOString());
      });
    },
    switchCompany(credential: string, expectation: CredentialExpectation, companyId: string): Promise<IssuedSessionCredential> {
      return deny(async () => {
        expected(expectation);
        const at = now();
        const { proof, checked, binding } = await authenticated(credential, expectation, at);
        await ensureSigning(at);
        const current = await registry.switchCompany(proof, checked, companyId, at.toISOString());
        return signed(current, proof.subject, at, binding);
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
export function createSessionCredentialVerifier(options: Omit<SessionCredentialOptions, 'signing_key'>) {
  const service = createSessionCredentialService({ ...options, signing_key: undefined });
  return Object.freeze({ authenticate: service.authenticate, resolve: service.resolve });
}
