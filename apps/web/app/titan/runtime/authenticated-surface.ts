import type { SessionPayload } from "@/lib/auth/session";
import { createSurfaceProjection } from "./surface-contract.mjs";

export type CanonicalTitanSurface = "zero" | "go" | "hub";

export function surfaceForSessionRole(role: SessionPayload["role"]): CanonicalTitanSurface {
  if (role === "tech") return "go";
  return "zero";
}

export function createAuthenticatedSurfaceProjection(
  session: SessionPayload,
  input?: {
    surface?: CanonicalTitanSurface;
    revision?: string;
    issued_at?: string;
    expires_at?: string;
  },
) {
  const surface = input?.surface ?? surfaceForSessionRole(session.role);
  const allowed = surfaceForSessionRole(session.role);
  if (surface !== allowed) throw new TypeError("session-surface-not-authorised");

  const issued_at = input?.issued_at ?? new Date().toISOString();
  const expires_at =
    input?.expires_at ?? new Date(Date.now() + 5 * 60_000).toISOString();

  return createSurfaceProjection({
    company_id: session.accountId,
    surface,
    actor_id: session.userId,
    revision: input?.revision ?? `session-${surface}-v1`,
    issued_at,
    expires_at,
  });
}


/**
 * Hub is a customer boundary and must never be derived from a staff SessionPayload.
 * A future customer-auth adapter must supply an independently verified company and customer actor.
 */
export function createAuthenticatedHubSurfaceProjection(): never {
  throw new TypeError("hub-requires-customer-auth-boundary");
}
