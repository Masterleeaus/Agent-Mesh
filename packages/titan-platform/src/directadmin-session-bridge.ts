import { directAdminIssuer, type createSessionCredentialService, type AuthenticatedSessionCredential } from './security-boundary.js';
import type { DirectAdminRole } from './directadmin-plugin.js';

/** Trusted host composition supplies the canonical #302 credential service.
 * The SDK owns no signature parser, issuer, keys, identity store or provisioning.
 * It adds DirectAdmin browser protections around that authenticated boundary. */
export type DirectAdminBridgeConfig = Readonly<{
  origin: string; audience: string; node_id: string;
  sessions: Pick<ReturnType<typeof createSessionCredentialService>, 'authenticate' | 'switchCompany' | 'revoke' | 'exchangeWorkforceZero'>;
}>;
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
const fail = (): never => { throw new Error('directadmin-session-rejected'); };
const id = (v: unknown): v is string => typeof v === 'string' && v.length > 0 && v.length <= 1024 && !/[\u0000-\u0020\u007f]/u.test(v);
function encode(value: Uint8Array): string {
  return btoa(String.fromCharCode(...value)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
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
    const provider = (() => {
      try { return directAdminIssuer(config.origin); } catch { return fail(); }
    })();
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
      const sameOrigin = origin === this.#config.origin || (origin === null && request.method === 'GET' &&
        new URL(request.headers.get('referer') ?? '').origin === this.#config.origin);
      if (url.origin !== this.#config.origin || request.headers.get('sec-fetch-site') !== 'same-origin' ||
          !sameOrigin || !['GET', 'POST'].includes(request.method)) return fail();
      const credential = cookie(request);
      const csrf = request.headers.get('x-titan-csrf') ?? '';
      if (!/^[A-Za-z0-9_-]{43,128}$/.test(csrf)) return fail();
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
        catch { return fail(); }
      };
      const withWorkforceZeroSession: WithWorkforceZeroSession = async consume => {
        try {
          if (request.method !== 'POST' || typeof consume !== 'function') return fail();
          const source = await authenticateCurrent();
          const issued = await this.#config.sessions.exchangeWorkforceZero(credential, expected);
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
              credentialExpiry > sourceExpiry || credentialExpiry > childSessionExpiry) return fail();
          const context: WorkforceZeroBridgeContext = Object.freeze({
            schema: 'titan.workforce-zero.session/v1', audience: 'workforce', surface: 'zero',
            actor_id: child.actor_id, company_id: child.company_id, company_ids: Object.freeze([child.company_id]),
            device_id: child.device_id, session_id: child.session_id, context_revision: child.context_revision,
            session_revision: child.session_revision, expires_at: childSessionExpiry,
          });
          const result = await consume(issued.credential, context);
          await authenticateCurrent();
          return result;
        } catch { return fail(); }
      };
      return Object.freeze({ context: project(initial), revalidate, withWorkforceZeroSession,
        switchCompany: async (company_id: string) => {
          try {
            if (request.method !== 'POST' || !id(company_id)) return fail();
            await revalidate();
            const issued = await this.#config.sessions.switchCompany(credential, expected, company_id);
            const current = check(await this.#config.sessions.authenticate(issued.credential, {
              company_id, device_id: expected.device_id, actor_id: expected.actor_id,
              context_revision: issued.context.context_revision,
            }));
            const seconds = Math.min(300, Math.floor((Date.parse(current.context.expires_at) - Date.now()) / 1000));
            if (!Number.isFinite(seconds) || seconds <= 0 || /[;\r\n]/.test(issued.credential)) return fail();
            // Server-only result: the gateway writes this header, never JSON.
            // #302 owns issuance; switching does not extend canonical expiry.
            return Object.freeze({ set_cookie: `${COOKIE}=${issued.credential}; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=${seconds}` });
          } catch { return fail(); }
        },
        logout: async () => {
          try {
            if (request.method !== 'POST') return fail();
            await revalidate();
            await this.#config.sessions.revoke(credential, expected);
          } catch { return fail(); }
        },
      });
    } catch { return fail(); }
  }
}

export const DIRECTADMIN_RESPONSE_HEADERS = Object.freeze({
  'cache-control': 'no-store', 'content-type': 'application/json; charset=utf-8',
  'x-content-type-options': 'nosniff', 'referrer-policy': 'no-referrer',
  'content-security-policy': "default-src 'none'; frame-ancestors 'self'; base-uri 'none'; form-action 'self'",
  'x-frame-options': 'SAMEORIGIN',
});
export const DIRECTADMIN_CLEAR_SESSION_COOKIE = `${COOKIE}=; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=0`;
