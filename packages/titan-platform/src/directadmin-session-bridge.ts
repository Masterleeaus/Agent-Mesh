import type { createSessionCredentialService, AuthenticatedSessionCredential } from './security-boundary.js';
import type { DirectAdminRole } from './directadmin-plugin.js';

/** Trusted host composition supplies the canonical #302 credential service.
 * The SDK owns no signature parser, issuer, keys, identity store or provisioning.
 * It adds DirectAdmin browser protections around that authenticated boundary. */
export type DirectAdminBridgeConfig = Readonly<{
  origin: string; audience: string; node_id: string;
  sessions: Pick<ReturnType<typeof createSessionCredentialService>, 'authenticate' | 'switchCompany' | 'revoke' | 'exchangeWorkforceZero'>;
}>;
type WorkforceZeroIssuance = Awaited<ReturnType<DirectAdminBridgeConfig['sessions']['exchangeWorkforceZero']>>;
type CompanySessionIssuance = Awaited<ReturnType<DirectAdminBridgeConfig['sessions']['switchCompany']>>;
export type DirectAdminBridgeContext = Readonly<{
  schema: 'titan.directadmin.session/v1'; actor_id: string; company_id: string;
  company_ids: readonly string[]; context_revision: string; session_revision: number;
  expires_at: number; da_role: DirectAdminRole; authority: 'not-carried';
}>;
/** Selected-company identity for the fixed #302 Workforce/Zero child. The
 * credential itself is supplied only inside a trusted server-side callback. */
export type WorkforceZeroBridgeContext = Readonly<{
  schema: 'titan.workforce-zero.session/v1'; audience: 'workforce'; surface: 'zero';
  actor_id: string; company_id: string; company_ids: readonly string[]; device_id: string;
  session_id: string; context_revision: string; session_revision: number; expires_at: number;
}>;
export type WithWorkforceZeroSession = <T>(
  consume: (credential: string, context: WorkforceZeroBridgeContext) => Promise<T>,
) => Promise<T>;
const COOKIE = '__Host-titan-da-session';
type DirectAdminBridgeFailureKind = 'request-rejected' | 'session-rejected' | 'unavailable';
// tsx fixtures and separately bundled gateway/bridge modules can load through
// distinct module instances, so use a private, non-enumerable symbol marker.
const bridgeFailureMarker = Symbol.for('titan.directadmin.bridge.failure.v1');
function bridgeError(kind: DirectAdminBridgeFailureKind, message: string): Error {
  const error = new Error(message);
  Object.defineProperty(error, bridgeFailureMarker, { value: kind });
  return error;
}
export function directAdminBridgeFailureKind(error: unknown): DirectAdminBridgeFailureKind | undefined {
  try {
    if (!(error instanceof Error)) return undefined;
    const descriptor = Object.getOwnPropertyDescriptor(error, bridgeFailureMarker);
    return descriptor && 'value' in descriptor && ['request-rejected', 'session-rejected', 'unavailable'].includes(descriptor.value)
      ? descriptor.value as DirectAdminBridgeFailureKind : undefined;
  } catch { return undefined; }
}
const fail = (): never => { throw bridgeError('session-rejected', 'directadmin-session-rejected'); };
const rejectRequest = (): never => { throw bridgeError('request-rejected', 'directadmin-session-rejected-request'); };
const unavailable = (): never => { throw bridgeError('unavailable', 'directadmin-service-unavailable'); };
function safeErrorMessage(error: unknown): string | undefined {
  try {
    if (!(error instanceof Error)) return undefined;
    const message = Object.getOwnPropertyDescriptor(error, 'message');
    return message && 'value' in message && typeof message.value === 'string' ? message.value : undefined;
  } catch { return undefined; }
}
function normalizeAuthenticationFailure(error: unknown): never {
  const message = safeErrorMessage(error);
  if (message === 'directadmin-session-rejected-request') return rejectRequest();
  if (message === 'directadmin-session-rejected' || message === 'authentication-denied') return fail();
  return unavailable();
}
async function normalizePostAuthenticationFailure(_error: unknown, verifyCurrent: () => Promise<unknown>): Promise<never> {
  // Any operation failure gets a fresh identity read. #302 deliberately gives
  // identity failures one stable public error, so this read distinguishes an
  // operation/service outage from a source session revoked or switched while
  // the operation ran without exposing the original failure.
  try { await verifyCurrent(); } catch (verificationError) { return normalizeAuthenticationFailure(verificationError); }
  return unavailable();
}
const id = (v: unknown): v is string => typeof v === 'string' && v.length > 0 && v.length <= 1024 && !/[\u0000-\u0020\u007f]/u.test(v);
function encode(value: Uint8Array): string {
  return btoa(String.fromCharCode(...value)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}
/** Short, versioned transport assertion for the canonical revision. #302's
 * revision is an opaque JSON snapshot string; the DirectAdmin relay accepts
 * bounded URL-safe identifiers only. This digest carries no authority and is
 * compared with the freshly authenticated canonical revision at the gateway. */
export async function directAdminContextRevisionAssertion(revision: string): Promise<string> {
  if (typeof revision !== 'string' || revision.length === 0 || revision.length > 4096) {
    throw new Error('directadmin-context-revision-invalid');
  }
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(revision));
  return `ctx1_${encode(new Uint8Array(digest))}`;
}
export async function matchesDirectAdminContextRevision(assertion: unknown, revision: string): Promise<boolean> {
  if (assertion === revision) return true; // compatibility for direct, non-relayed callers
  if (typeof assertion !== 'string' || !/^ctx1_[A-Za-z0-9_-]{43}$/.test(assertion)) return false;
  return assertion === await directAdminContextRevisionAssertion(revision);
}
function cookie(request: Request): string {
  const values = (request.headers.get('cookie') ?? '').split(';').map(v => v.trim()).filter(v => v.startsWith(`${COOKIE}=`));
  if (values.length !== 1) return fail();
  const credential = values[0].slice(COOKIE.length + 1);
  if (!credential || credential.length > 16384) return fail();
  return credential;
}

/** Retains the opaque credential and calls #302 again on every revalidation.
 * Caller IDs, company headers, DA roles and session IDs never grant authority. */
export class DirectAdminSessionBridge {
  readonly #config: DirectAdminBridgeConfig;
  readonly #provider: string;
  constructor(config: DirectAdminBridgeConfig) {
    const origin = new URL(config.origin);
    if (origin.protocol !== 'https:' || origin.origin !== config.origin || !id(config.audience) || !id(config.node_id) ||
        !['authenticate', 'switchCompany', 'revoke', 'exchangeWorkforceZero'].every(method => typeof config.sessions?.[method as keyof typeof config.sessions] === 'function')) fail();
    // This is only the expected namespace check; #302 remains the sole
    // credential authenticator. Keep the browser-shared SDK free of the
    // server-only security-boundary barrel and its storage/Node dependencies.
    const provider = `directadmin:${origin.origin}`;
    this.#provider = provider;
    this.#config = Object.freeze({ ...config });
  }
  async authenticate(request: Request): Promise<{
    context: DirectAdminBridgeContext;
    revalidate: () => Promise<DirectAdminBridgeContext>;
    withWorkforceZeroSession: WithWorkforceZeroSession;
    switchCompany: (company_id: string) => Promise<Readonly<{ set_cookie: string }>>;
    logout: () => Promise<void>;
  }> {
    try {
      const url = new URL(request.url);
      const origin = request.headers.get('origin');
      let refererSameOrigin = false;
      if (origin === null && request.method === 'GET') {
        try { refererSameOrigin = new URL(request.headers.get('referer') ?? '').origin === this.#config.origin; } catch { /* reject below */ }
      }
      const sameOrigin = origin === this.#config.origin || refererSameOrigin;
      if (url.origin !== this.#config.origin || request.headers.get('sec-fetch-site') !== 'same-origin' ||
          !sameOrigin || !['GET', 'POST'].includes(request.method)) return rejectRequest();
      const credential = cookie(request);
      const csrf = request.headers.get('x-titan-csrf') ?? '';
      if (!/^[A-Za-z0-9_-]{43,128}$/.test(csrf)) return rejectRequest();
      const csrfHash = encode(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(csrf))));
      const check = (authenticated: AuthenticatedSessionCredential): AuthenticatedSessionCredential => {
        // Also reject a miswired canonical service for a different host/audience.
        if (authenticated.provider !== this.#provider || authenticated.context.audience !== this.#config.audience ||
            authenticated.directadmin?.node_id !== this.#config.node_id ||
            authenticated.directadmin.csrf_sha256 !== csrfHash) return fail();
        return authenticated;
      };
      const initial = check(await this.#config.sessions.authenticate(credential));
      const expected = Object.freeze({ company_id: initial.context.company_id, device_id: initial.context.device_id,
        actor_id: initial.context.actor_id, context_revision: initial.context.context_revision });
      const authenticateCurrent = async () => check(await this.#config.sessions.authenticate(credential, expected));
      const project = ({ context: current, directadmin }: AuthenticatedSessionCredential): DirectAdminBridgeContext => Object.freeze({
        schema: 'titan.directadmin.session/v1', actor_id: current.actor_id, company_id: current.company_id,
        company_ids: Object.freeze([current.company_id]), context_revision: current.context_revision,
        session_revision: current.session_revision, expires_at: Date.parse(current.expires_at),
        da_role: directadmin!.da_role, authority: 'not-carried',
      });
      const revalidate = async () => {
        try { return project(await authenticateCurrent()); }
        catch (error) { return normalizeAuthenticationFailure(error); }
      };
      const withWorkforceZeroSession: WithWorkforceZeroSession = async consume => {
        if (request.method !== 'POST' || typeof consume !== 'function') return fail();
        let source: AuthenticatedSessionCredential;
        let exchanged: Readonly<{ credential: string; context: WorkforceZeroBridgeContext }>;
        try {
          source = await authenticateCurrent();
        } catch (error) { return normalizeAuthenticationFailure(error); }
        let issued: WorkforceZeroIssuance;
        try { issued = await this.#config.sessions.exchangeWorkforceZero(credential, expected); }
        catch (error) { return normalizePostAuthenticationFailure(error, authenticateCurrent); }
        try {
          // Recheck the browser session after exchange and before handing the
          // child to a trusted server owner. The downstream Workforce verifier
          // and effect fence still revalidate the signed source lineage.
          await authenticateCurrent();
          const child = issued.context;
          const credentialExpiry = Date.parse(issued.credential_expires_at);
          const sourceExpiry = Date.parse(source.credential_expires_at);
          const childSessionExpiry = Date.parse(child.expires_at);
          if (!/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(issued.credential) ||
              issued.credential.length > 16384 || child.audience !== 'workforce' ||
              child.session_id === source.context.session_id || child.company_id !== source.context.company_id ||
              child.actor_id !== source.context.actor_id || child.device_id !== source.context.device_id ||
              !Array.isArray(child.allowed_company_ids) || child.allowed_company_ids.length !== 1 ||
              child.allowed_company_ids[0] !== child.company_id || !id(child.context_revision) ||
              !Number.isSafeInteger(child.session_revision) || child.session_revision < 1 ||
              !Number.isFinite(credentialExpiry) || !Number.isFinite(sourceExpiry) || !Number.isFinite(childSessionExpiry) ||
              credentialExpiry > sourceExpiry || credentialExpiry > childSessionExpiry) return unavailable();
          const context: WorkforceZeroBridgeContext = Object.freeze({
            schema: 'titan.workforce-zero.session/v1', audience: 'workforce', surface: 'zero',
            actor_id: child.actor_id, company_id: child.company_id, company_ids: Object.freeze([child.company_id]),
            device_id: child.device_id, session_id: child.session_id, context_revision: child.context_revision,
            session_revision: child.session_revision, expires_at: childSessionExpiry,
          });
          exchanged = Object.freeze({ credential: issued.credential, context });
        } catch (error) {
          if (safeErrorMessage(error) === 'directadmin-session-rejected' || safeErrorMessage(error) === 'authentication-denied') {
            return normalizeAuthenticationFailure(error);
          }
          return unavailable();
        }
        // The owner may return a typed, read-only denial (for example when
        // Workforce intentionally does not support an action). Preserve that
        // contract only while the originating DirectAdmin session is current.
        // If the source was revoked/switched during the callback, the session
        // failure takes precedence and the owner's error remains redacted.
        let result: unknown;
        try { result = await consume(exchanged.credential, exchanged.context); }
        catch (error) {
          try { await authenticateCurrent(); } catch (verificationError) { return normalizeAuthenticationFailure(verificationError); }
          throw error;
        }
        try { await authenticateCurrent(); } catch (error) { return normalizeAuthenticationFailure(error); }
        return result as Awaited<ReturnType<typeof consume>>;
      };
      return Object.freeze({ context: project(initial), revalidate, withWorkforceZeroSession,
        switchCompany: async (company_id: string) => {
          if (request.method !== 'POST' || !id(company_id)) return fail();
          await revalidate();
          let issued: CompanySessionIssuance;
          try { issued = await this.#config.sessions.switchCompany(credential, expected, company_id); }
          catch (error) { return normalizePostAuthenticationFailure(error, authenticateCurrent); }
          try {
            const current = check(await this.#config.sessions.authenticate(issued.credential, {
              company_id, device_id: expected.device_id, actor_id: expected.actor_id,
              context_revision: issued.context.context_revision,
            }));
            const seconds = Math.min(300, Math.floor((Date.parse(current.context.expires_at) - Date.now()) / 1000));
            if (!Number.isFinite(seconds) || seconds <= 0 || /[;\r\n]/.test(issued.credential)) return unavailable();
            // Server-only result: the gateway writes this header, never JSON.
            // #302 owns issuance; switching does not extend canonical expiry.
            return Object.freeze({ set_cookie: `${COOKIE}=${issued.credential}; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=${seconds}` });
          } catch { return unavailable(); }
        },
        logout: async () => {
          if (request.method !== 'POST') return fail();
          await revalidate();
          try { await this.#config.sessions.revoke(credential, expected); }
          catch (error) { return normalizePostAuthenticationFailure(error, authenticateCurrent); }
        },
      });
    } catch (error) { return normalizeAuthenticationFailure(error); }
  }
}

export const DIRECTADMIN_RESPONSE_HEADERS = Object.freeze({
  'cache-control': 'no-store', 'content-type': 'application/json; charset=utf-8',
  'x-content-type-options': 'nosniff', 'referrer-policy': 'no-referrer',
  'content-security-policy': "default-src 'none'; frame-ancestors 'self'; base-uri 'none'; form-action 'self'",
  'x-frame-options': 'SAMEORIGIN',
});
export const DIRECTADMIN_CLEAR_SESSION_COOKIE = `${COOKIE}=; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=0`;
