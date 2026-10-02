import type { IdentitySessionRegistry, CurrentSessionContext } from './security-boundary.js';
import type { DirectAdminRole } from './directadmin-plugin.js';

/** Installed by the trusted host composition, never derived from request headers.
 * The upstream issuer authenticates DirectAdmin and attests the canonical session.
 * This adapter verifies that attestation; it cannot commission an issuer or log in
 * to DirectAdmin from a raw session ID. Keys are verification-only Ed25519 keys. */
export type DirectAdminBridgeConfig = Readonly<{
  origin: string; issuer: string; audience: string; node_id: string;
  verification_keys: ReadonlyMap<string, CryptoKey>;
  registry: Pick<IdentitySessionRegistry, 'resolveCurrentSession' | 'switchCompany' | 'revokeSession'>;
  now?: () => number;
}>;
type Claims = Readonly<{
  iss: string; sub: string; aud: string; node_id: string;
  session_id: string; device_id: string; session_revision: number;
  company_id: string; actor_id: string; context_revision: string;
  csrf_sha256: string; da_role: DirectAdminRole; iat: number; exp: number;
}>;
export type DirectAdminBridgeContext = Readonly<{
  schema: 'titan.directadmin.session/v1'; actor_id: string; company_id: string;
  company_ids: readonly string[]; context_revision: string; session_revision: number;
  expires_at: number; da_role: DirectAdminRole; authority: 'not-carried';
}>;
const COOKIE = '__Host-titan-da-session';
const encoder = new TextEncoder();
const decoder = new TextDecoder('utf-8', { fatal: true });
const fail = (): never => { throw new Error('directadmin-session-rejected'); };
const id = (v: unknown): v is string => typeof v === 'string' && v.length > 0 && v.length <= 1024 && !/[\u0000-\u0020\u007f]/u.test(v);
function decode(value: string): Uint8Array<ArrayBuffer> {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) return fail();
  const bytes = Uint8Array.from(atob(value.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
  if (encode(bytes) !== value) return fail();
  return bytes;
}
function encode(value: Uint8Array): string {
  return btoa(String.fromCharCode(...value)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}
function cookie(request: Request): string {
  const values = (request.headers.get('cookie') ?? '').split(';').map(v => v.trim()).filter(v => v.startsWith(`${COOKIE}=`));
  if (values.length !== 1) return fail();
  return values[0].slice(COOKIE.length + 1);
}

/** An authenticated request retains the verified credential and rereads #302 on
 * every use, including the downstream authorization/effect seam. No authority is
 * inferred from caller_id, company headers, a DA role or possession of a cookie. */
export class DirectAdminSessionBridge {
  readonly #config: DirectAdminBridgeConfig;
  constructor(config: DirectAdminBridgeConfig) {
    const origin = new URL(config.origin);
    if (origin.protocol !== 'https:' || origin.origin !== config.origin || !id(config.issuer) || !id(config.audience) || !id(config.node_id) || !config.verification_keys.size) fail();
    const keys = new Map(config.verification_keys);
    for (const [kid, key] of keys) {
      if (!id(kid) || key.type !== 'public' || key.algorithm.name !== 'Ed25519' || !key.usages.includes('verify')) fail();
    }
    this.#config = Object.freeze({ ...config, verification_keys: keys });
  }
  private now(): number {
    const now = (this.#config.now ?? Date.now)();
    if (!Number.isFinite(now)) fail();
    return now;
  }
  private async verify(token: string): Promise<Claims> {
    if (token.length > 8192) return fail();
    const parts = token.split('.');
    if (parts.length !== 3) return fail();
    const header = JSON.parse(decoder.decode(decode(parts[0])));
    if (!header || header.alg !== 'EdDSA' || header.typ !== 'titan-da-session+jwt' || !id(header.kid) ||
        Object.keys(header).some(k => !['alg', 'typ', 'kid'].includes(k))) return fail();
    const key = this.#config.verification_keys.get(header.kid);
    if (!key || !await crypto.subtle.verify('Ed25519', key, decode(parts[2]), encoder.encode(`${parts[0]}.${parts[1]}`))) return fail();
    const c = JSON.parse(decoder.decode(decode(parts[1]))) as Claims;
    const now = this.now() / 1000;
    if (!c || ![c.iss, c.sub, c.aud, c.node_id, c.session_id, c.device_id, c.company_id, c.actor_id].every(id) ||
        typeof c.context_revision !== 'string' || !c.context_revision.length || c.context_revision.length > 2048 ||
        c.iss !== this.#config.issuer || c.aud !== this.#config.audience || c.node_id !== this.#config.node_id ||
        !Number.isSafeInteger(c.session_revision) || c.session_revision < 1 ||
        !Number.isSafeInteger(c.iat) || !Number.isSafeInteger(c.exp) || c.iat > now || c.exp <= now || c.exp <= c.iat || c.exp - c.iat > 300 ||
        typeof c.csrf_sha256 !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(c.csrf_sha256) || !['admin', 'reseller', 'user'].includes(c.da_role)) return fail();
    return Object.freeze(c);
  }
  async authenticate(request: Request): Promise<{
    context: DirectAdminBridgeContext;
    revalidate: () => Promise<DirectAdminBridgeContext>;
    switchCompany: (company_id: string) => Promise<void>;
    logout: () => Promise<void>;
  }> {
    try {
      const url = new URL(request.url);
      // Exact configured HTTPS origin; forwarded host/origin headers grant nothing.
      const origin = request.headers.get('origin');
      const sameOrigin = origin === this.#config.origin || (origin === null && request.method === 'GET' &&
        new URL(request.headers.get('referer') ?? '').origin === this.#config.origin);
      if (url.origin !== this.#config.origin || request.headers.get('sec-fetch-site') !== 'same-origin' ||
          !sameOrigin || !['GET', 'POST'].includes(request.method)) return fail();
      const token = cookie(request);
      const claims = await this.verify(token);
      const csrf = request.headers.get('x-titan-csrf') ?? '';
      if (!/^[A-Za-z0-9_-]{43,128}$/.test(csrf)) return fail();
      const hash = encode(new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(csrf))));
      if (hash !== claims.csrf_sha256) return fail();
      const proof = Object.freeze({ provider: claims.iss, subject: claims.sub, session_id: claims.session_id,
        device_id: claims.device_id, session_revision: claims.session_revision });
      const expected = Object.freeze({ audience: this.#config.audience, company_id: claims.company_id,
        actor_id: claims.actor_id, context_revision: claims.context_revision });
      const resolve = async (): Promise<CurrentSessionContext> => {
        await this.verify(token);
        return this.#config.registry.resolveCurrentSession(proof, expected, new Date(this.now()).toISOString());
      };
      const project = (current: CurrentSessionContext): DirectAdminBridgeContext => Object.freeze({
        schema: 'titan.directadmin.session/v1', actor_id: current.actor_id, company_id: current.company_id,
        company_ids: Object.freeze([current.company_id]), context_revision: current.context_revision,
        session_revision: current.session_revision, expires_at: Math.min(claims.exp * 1000, Date.parse(current.expires_at)),
        da_role: claims.da_role, authority: 'not-carried',
      });
      const revalidate = async () => { try { return project(await resolve()); } catch { return fail(); } };
      return Object.freeze({ context: await revalidate(), revalidate,
        switchCompany: async (company_id: string) => {
          if (request.method !== 'POST' || !id(company_id)) return fail();
          await revalidate();
          await this.#config.registry.switchCompany(proof, expected, company_id, new Date(this.now()).toISOString());
          // No replacement credential is minted here. The authenticated upstream
          // issuer must rebind to the new canonical revision before reads resume.
        },
        logout: async () => {
          if (request.method !== 'POST') return fail();
          await revalidate();
          await this.#config.registry.revokeSession(claims.session_id, claims.session_revision);
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
