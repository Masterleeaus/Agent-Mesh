import { roleSchema } from "@titan-zero/domain";
import { requireSecurityId } from "@titan-zero/titan-platform/security-boundary";
import type {
  createSessionCredentialService,
  CurrentSessionContext,
} from "@titan-zero/titan-platform/security-boundary";
import type { SessionPayload } from "./session";

type CredentialService = ReturnType<typeof createSessionCredentialService>;
type ExpectedContext = Parameters<CredentialService["resolve"]>[1];

export interface WebSessionProjection {
  /** Trusted server resolver over approved company/account mappings. Never infer
   * equality or create a mapping when no approved compatibility binding exists. */
  resolveLegacyAccountId(company_id: string): Promise<string | null>;
}

export interface CurrentWebSession {
  readonly session: Readonly<SessionPayload>;
  readonly context: CurrentSessionContext;
  /** Only the selected company is an operation scope. Switch choices are not. */
  readonly operationCompanyIds: readonly [string];
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
    operationCompanyIds: Object.freeze([current.company_id] as [string]),
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
 * verifySession fallback on failure. The host owns cookie/CSRF handling and must
 * pass its expected selected company/device on every authenticated operation.
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
