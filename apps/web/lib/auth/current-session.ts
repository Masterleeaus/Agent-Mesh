import { roleSchema } from "@titan-zero/domain";
import { requireSecurityId } from "@titan-zero/titan-platform/security-boundary";
import type {
  createSessionCredentialService,
  createSessionCredentialVerifier,
  CurrentSessionContext,
} from "@titan-zero/titan-platform/security-boundary";
import type { VerifiedCompanyScope } from "../../../../packages/storage/src/company-storage-resolver";
import type { SessionPayload } from "./session";

type CredentialService = ReturnType<typeof createSessionCredentialService>;
type CredentialVerifier = Pick<ReturnType<typeof createSessionCredentialVerifier>, "authenticate" | "resolve">;
type ExpectedContext = Parameters<CredentialService["resolve"]>[1];

/** Cookie contract for web session credentials issued by the canonical session owner. */
export const CURRENT_WEB_SESSION_COOKIE_NAME = "__Host-titan-web-session";
const MAX_COOKIE_HEADER_LENGTH = 32_768;
const MAX_CREDENTIAL_LENGTH = 16_384;

export interface WebSessionProjection {
  /** Trusted server resolver over approved company/account mappings. Never infer
   * equality or create a mapping when no approved compatibility binding exists. */
  resolveLegacyAccountId(company_id: string): Promise<string | null>;
}

export interface CurrentWebSession {
  readonly session: Readonly<SessionPayload>;
  readonly context: CurrentSessionContext;
  /** Storage scope derived only from this current, registry-verified context. */
  readonly scope: VerifiedCompanyScope;
  /** Only the selected company is an operation scope. Switch choices are not. */
  readonly operationCompanyIds: readonly [string];
}

function authenticatedCompanyScope(context: CurrentSessionContext): VerifiedCompanyScope {
  return Object.freeze({
    kind: "authenticated",
    current: Object.freeze({
      company_id: context.company_id,
      actor_id: context.actor_id,
      session_id: context.session_id,
      session_revision: context.session_revision,
      context_revision: context.context_revision,
      audience: context.audience,
      expires_at: context.expires_at,
      authority_neutral: true,
    }),
  });
}

async function project(context: CurrentSessionContext, resolveLegacyAccountId: WebSessionProjection["resolveLegacyAccountId"], revalidate: () => Promise<CurrentSessionContext>): Promise<CurrentWebSession> {
  let accountId: string;
  try {
    const mapped = await resolveLegacyAccountId(context.company_id);
    if (typeof mapped !== "string") throw new Error("missing-mapping");
    requireSecurityId(mapped, "account_id");
    accountId = mapped;
  } catch {
    throw new Error("web-session-account-mapping-unavailable");
  }
  // Mapping may await storage/network I/O. Recheck the exact authenticated
  // generation after it completes so switch/revoke cannot yield stale identity.
  const current = await revalidate();
  const role = roleSchema.safeParse(current.company_role);
  if (!role.success) throw new Error("web-session-role-unsupported");
  return Object.freeze({
    session: Object.freeze({
      userId: current.actor_id,
      accountId,
      role: role.data,
    }),
    context: current,
    scope: authenticatedCompanyScope(current),
    operationCompanyIds: Object.freeze([current.company_id] as [string]),
  });
}

function credentialFromRequest(request: Pick<Request, "headers">): string | null {
  let header: string | null;
  try {
    header = request.headers.get("cookie");
  } catch {
    return null;
  }
  if (!header || header.length > MAX_COOKIE_HEADER_LENGTH) return null;

  let credential: string | null = null;
  for (const pair of header.split(";")) {
    const separator = pair.indexOf("=");
    if (separator < 0 || pair.slice(0, separator).trim() !== CURRENT_WEB_SESSION_COOKIE_NAME) continue;
    if (credential !== null) return null;
    const candidate = pair.slice(separator + 1).trim();
    if (candidate.length > MAX_CREDENTIAL_LENGTH
      || !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(candidate)) return null;
    credential = candidate;
  }
  return credential;
}

function expectedFromCurrent(context: CurrentSessionContext): ExpectedContext {
  return Object.freeze({
    company_id: context.company_id,
    device_id: context.device_id,
    actor_id: context.actor_id,
    context_revision: context.context_revision,
  });
}

/**
 * Server-side request ingress for a canonical web credential. It accepts only
 * the fixed HttpOnly web-session cookie and derives all identity/context from
 * the pinned credential verifier plus GLOBAL_REGISTRY. The request cannot
 * choose company, actor, device, session or revision. This factory does not
 * instantiate trust keys or a registry; the host must inject the existing
 * configured verification-only service and approved compatibility mapping.
 */
export function createCurrentWebSessionIngress(verifier: CredentialVerifier, projection: WebSessionProjection) {
  if (typeof verifier?.authenticate !== "function" || typeof verifier?.resolve !== "function") {
    throw new Error("web-session-verifier-required");
  }
  if (typeof projection?.resolveLegacyAccountId !== "function") throw new Error("web-session-account-resolver-required");
  const resolveLegacyAccountId = projection.resolveLegacyAccountId.bind(projection);

  async function resolveCredential(credential: string): Promise<CurrentWebSession> {
    // No request-provided expectation: authenticate verifies the signed claims
    // first, then resolves the selected company/device and current revisions.
    const authenticated = await verifier.authenticate(credential);
    const context = authenticated.context;
    return project(context, resolveLegacyAccountId,
      () => verifier.resolve(credential, expectedFromCurrent(context)));
  }

  return Object.freeze({
    async resolveRequest(request: Pick<Request, "headers">): Promise<CurrentWebSession | null> {
      const credential = credentialFromRequest(request);
      if (!credential) return null;
      try {
        return await resolveCredential(credential);
      } catch {
        return null;
      }
    },
  });
}

/** Explicit server-side composition for migration to canonical durable sessions.
 * Supply a service configured from trusted server configuration and the canonical
 * GLOBAL_REGISTRY connection, plus an approved canonical-company-to-legacy-account
 * resolver. Canonical company IDs never implicitly become legacy account IDs.
 * This factory does not activate production mode,
 * provision identities, read legacy tables, or infer company/device from a JWT.
 *
 * Existing fsm_session cookies are NOT credentials for this adapter. Durable
 * mode requires fresh upstream authentication; there is deliberately no legacy
 * verifySession fallback on failure. These issue/switch methods require the
 * caller to supply independently trusted expected context. Request ingress for
 * already-issued credentials belongs in createCurrentWebSessionIngress below.
 * The host still owns CSRF/origin policy for mutating handlers.
 */
export function createCurrentWebSessionAdapter(service: CredentialService, projection: WebSessionProjection) {
  if (typeof projection?.resolveLegacyAccountId !== "function") throw new Error("web-session-account-resolver-required");
  const resolveLegacyAccountId = projection.resolveLegacyAccountId.bind(projection);
  function currentProjection(credential: string, context: CurrentSessionContext) {
    return project(context, resolveLegacyAccountId, () => service.resolve(credential, {
      company_id: context.company_id, device_id: context.device_id,
      actor_id: context.actor_id, context_revision: context.context_revision,
    }));
  }
  return Object.freeze({
    async issue(upstreamCredential: string, expected: ExpectedContext) {
      const issued = await service.issue(upstreamCredential, expected);
      return Object.freeze({ credential: issued.credential, ...await currentProjection(issued.credential, issued.context) });
    },
    async resolve(credential: string, expected: ExpectedContext): Promise<CurrentWebSession> {
      return currentProjection(credential, await service.resolve(credential, expected));
    },
    /** Request-auth convenience: missing, legacy, stale and invalid tokens deny. */
    async getSession(credential: string | null | undefined, expected: ExpectedContext): Promise<Readonly<SessionPayload> | null> {
      if (!credential) return null;
      try {
        return (await currentProjection(credential, await service.resolve(credential, expected))).session;
      } catch {
        return null;
      }
    },
    async switchCompany(credential: string, expected: ExpectedContext, targetCompany: string) {
      const switched = await service.switchCompany(credential, expected, targetCompany);
      return Object.freeze({ credential: switched.credential, ...await currentProjection(switched.credential, switched.context) });
    },
    async revoke(credential: string, expected: ExpectedContext): Promise<void> {
      await service.revoke(credential, expected);
    },
  });
}
