import { roleSchema } from "@titan-zero/domain";
import type {
  createSessionCredentialService,
  CurrentSessionContext,
} from "@titan-zero/titan-platform/security-boundary";
import type { SessionPayload } from "./session";

type CredentialService = ReturnType<typeof createSessionCredentialService>;
type ExpectedContext = Parameters<CredentialService["resolve"]>[1];

export interface CurrentWebSession {
  readonly session: Readonly<SessionPayload>;
  readonly context: CurrentSessionContext;
  /** Only the selected company is an operation scope. Switch choices are not. */
  readonly operationCompanyIds: readonly [string];
}

function project(context: CurrentSessionContext): CurrentWebSession {
  const role = roleSchema.safeParse(context.company_role);
  if (!role.success) throw new Error("web-session-role-unsupported");
  return Object.freeze({
    session: Object.freeze({
      userId: context.actor_id,
      accountId: context.company_id,
      role: role.data,
    }),
    context,
    operationCompanyIds: Object.freeze([context.company_id] as [string]),
  });
}

/** Explicit server-side composition for migration to canonical durable sessions.
 * Supply a service configured from trusted server configuration and the canonical
 * GLOBAL_REGISTRY connection. This factory does not activate production mode,
 * provision identities, read legacy tables, or infer company/device from a JWT.
 *
 * Existing fsm_session cookies are NOT credentials for this adapter. Durable
 * mode requires fresh upstream authentication; there is deliberately no legacy
 * verifySession fallback on failure. The host owns cookie/CSRF handling and must
 * pass its expected selected company/device on every authenticated operation.
 */
export function createCurrentWebSessionAdapter(service: CredentialService) {
  return Object.freeze({
    async issue(upstreamCredential: string, expected: ExpectedContext) {
      const issued = await service.issue(upstreamCredential, expected);
      return Object.freeze({ credential: issued.credential, ...project(issued.context) });
    },
    async resolve(credential: string, expected: ExpectedContext): Promise<CurrentWebSession> {
      return project(await service.resolve(credential, expected));
    },
    /** Request-auth convenience: missing, legacy, stale and invalid tokens deny. */
    async getSession(credential: string | null | undefined, expected: ExpectedContext): Promise<Readonly<SessionPayload> | null> {
      if (!credential) return null;
      try {
        return project(await service.resolve(credential, expected)).session;
      } catch {
        return null;
      }
    },
    async switchCompany(credential: string, expected: ExpectedContext, targetCompany: string) {
      const switched = await service.switchCompany(credential, expected, targetCompany);
      return Object.freeze({ credential: switched.credential, ...project(switched.context) });
    },
    async revoke(credential: string, expected: ExpectedContext): Promise<void> {
      await service.revoke(credential, expected);
    },
  });
}
