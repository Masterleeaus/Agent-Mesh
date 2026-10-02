import type { StorageClient } from "../../../packages/storage/src/index.js";
import { IdentitySessionRegistry, type CurrentSessionContext, type VerifiedSessionIdentity } from "../../../packages/titan-platform/src/security-boundary.js";
// Existing native composition owns authority, provider verification and evidence.
// @ts-expect-error Native runtime owner is JavaScript.
import { createFieldServiceRuntime } from "./field-service-runtime.mjs";
// @ts-expect-error Canonical execution boundary is JavaScript.
import { boundedAdapterCall } from "../../../packages/tools/execution-gateway.mjs";
import type { ConversationAuth, ConversationSurface } from "./conversation-api.js";
import type { DirectAdminGatewayFactory } from "./directadmin-workforce-owners.js";
import type { AuthenticatedWorkIdentity } from "./index.js";

export type HostedWorkforceDependencies = {
  identityStoragePath: string;
  /** Operator-configured adapter deadline; timeout never proves non-execution. */
  adapterTimeoutMs?: number;
  /** Authenticate cryptographically before returning these bound claims. */
  credentialVerifier: {
    verify(authorization: string, options?: { signal: AbortSignal }): Promise<VerifiedSessionIdentity & { audience: string; surface: ConversationSurface }>;
  };
  /** Resolve current physical company storage within the canonical native provider. */
  workOrders: {
    complete(input: { company_id: string; actor_id: string; work_order_id: string; signal?: AbortSignal; authorityFence?: { assertCurrent(): void } }): Promise<unknown>;
    read(input: { company_id: string; actor_id: string; work_order_id: string; signal?: AbortSignal }): Promise<unknown>;
  };
  /** Actual observations of credential, authority, provider and evidence dependencies. */
  readiness(options?: { signal: AbortSignal }): Promise<{ authentication: boolean; authority: boolean; provider: boolean; evidence: boolean }>;
  /** Optional, separately commissioned #1049/#302 audience-bound session bridge.
   * The module wraps the canonical SDK gateway factory; it must not reuse the
   * Workforce conversation credential or carry DirectAdmin authority into Titan. */
  directAdmin?: {
    publicOrigin: string;
    createGateway: DirectAdminGatewayFactory;
  };
  close?(options?: { signal: AbortSignal }): Promise<void>;
};

type SessionAdmissionInput = Readonly<{
  company_id: string; actor_id: string; run_id: string; work_id: string; signal?: AbortSignal;
}>;
type RunIdentityInput = Pick<SessionAdmissionInput, "company_id" | "actor_id" | "run_id">;
type SessionAdmissionContext = Readonly<{
  current: CurrentSessionContext;
  proof: VerifiedSessionIdentity;
  authenticated_identity: AuthenticatedWorkIdentity;
  source_fenced: boolean;
  signal?: AbortSignal;
  acquire_deadline_ms?: number;
}>;
type SessionAdmission = <T>(input: SessionAdmissionInput, effect: (context: SessionAdmissionContext) => Promise<T> | T) => Promise<T>;

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}

export async function createHostedRuntime(storage: StorageClient, identityStorage: StorageClient, dependencies: HostedWorkforceDependencies, signal?: AbortSignal) {
  const timeoutMs = dependencies.adapterTimeoutMs ?? 30_000;
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 120_000) throw new Error("workforce-adapter-timeout-invalid");
  const registry = new IdentitySessionRegistry(identityStorage);
  async function loadRunIdentity(input: RunIdentityInput, callSignal?: AbortSignal) {
    callSignal?.throwIfAborted();
    const row = (await storage.query<{ payload: string }>("SELECT payload FROM agent_runs WHERE company_id=$1 AND run_id=$2", [input.company_id, input.run_id])).rows[0];
    callSignal?.throwIfAborted();
    const now = new Date().toISOString();
    const run = row ? JSON.parse(row.payload) : null;
    const stored = run?.authenticated_identity as AuthenticatedWorkIdentity | undefined;
    if (!stored || stored.actor_id !== input.actor_id || stored.company_id !== input.company_id
      || stored.audience !== "workforce" || stored.surface !== "zero"
      || !Number.isSafeInteger(stored.session_revision) || typeof stored.provider !== "string"
      || typeof stored.subject !== "string" || typeof stored.session_id !== "string"
      || typeof stored.device_id !== "string" || typeof stored.context_revision !== "string"
      || (stored.source_session_required === true && stored.source_session === undefined)) {
      throw new Error("runtime-authentication-required");
    }
    if (typeof stored.credential_expires_at !== "string") {
      throw new Error("runtime-authentication-required");
    }
    const expiresAt = Date.parse(stored.credential_expires_at);
    if (!Number.isFinite(expiresAt) || expiresAt <= Date.parse(now)) throw new Error("runtime-credential-expired");
    const authenticated_identity = deepFreeze(structuredClone(stored));
    const proof: VerifiedSessionIdentity = deepFreeze({
      provider: authenticated_identity.provider,
      subject: authenticated_identity.subject,
      session_id: authenticated_identity.session_id,
      device_id: authenticated_identity.device_id,
      session_revision: authenticated_identity.session_revision,
      ...(authenticated_identity.credential_expires_at ? { credential_expires_at: authenticated_identity.credential_expires_at } : {}),
      ...(authenticated_identity.source_session ? { source_session: structuredClone(authenticated_identity.source_session) } : {}),
    });
    return { run, authenticated_identity, proof, now };
  }
  const expected = (input: RunIdentityInput, identity: AuthenticatedWorkIdentity) => ({
    audience: "workforce", company_id: input.company_id, actor_id: input.actor_id,
    context_revision: identity.context_revision,
  });
  const sessionAdmission: SessionAdmission = async (input, effect) => {
    const loaded = await loadRunIdentity(input, input.signal);
    const context = expected(input, loaded.authenticated_identity);
    if (loaded.proof.source_session !== undefined) {
      return registry.withCurrentSessionFence(loaded.proof, context, { signal: input.signal },
        (current, signal, acquireDeadlineMs) => effect({ current, proof: loaded.proof, authenticated_identity: loaded.authenticated_identity, source_fenced: true, signal, acquire_deadline_ms: acquireDeadlineMs }));
    }
    // Ordinary Workforce sessions retain their existing current-identity check;
    // lineage is never synthesized for credentials that have no signed source.
    const current = await registry.resolveCurrentSession(loaded.proof, context, loaded.now);
    input.signal?.throwIfAborted();
    return effect({ current, proof: loaded.proof, authenticated_identity: loaded.authenticated_identity, source_fenced: false, signal: input.signal });
  };
  const auth: ConversationAuth = {
    async resolve({ request, authorization }) {
      try {
        if (!authorization || authorization.length > 8192) throw new Error("credential-required");
        const verified = await boundedAdapterCall((adapterSignal: AbortSignal) => dependencies.credentialVerifier.verify(authorization, { signal: adapterSignal }), { timeoutMs, signal });
        signal?.throwIfAborted();
        // This native manager composition currently has only the Zero authority
        // contract. Do not silently translate Go/Hub credentials into Zero work.
        if (verified.surface !== "zero" || verified.audience !== "workforce") throw new Error("credential-audience-invalid");
        // Copy only verified identity fields, never credentials or arbitrary claims.
        const proof: VerifiedSessionIdentity = { provider: verified.provider, subject: verified.subject, session_id: verified.session_id,
          device_id: verified.device_id, session_revision: verified.session_revision,
          ...(verified.credential_expires_at ? { credential_expires_at: verified.credential_expires_at } : {}),
          ...(verified.source_session ? { source_session: verified.source_session } : {}) };
        const current = await registry.resolveCurrentSession(proof, {
          audience: "workforce", company_id: request.company_id!, actor_id: request.actor_id,
          context_revision: request.context_revision,
        }, new Date().toISOString());
        return { company_id: current.company_id, actor_id: current.actor_id, device_id: current.device_id,
          session_id: current.session_id, context_revision: current.context_revision, surface: verified.surface,
          authenticated_identity: { ...proof, audience: "workforce", company_id: current.company_id,
            actor_id: current.actor_id, context_revision: current.context_revision, surface: verified.surface,
            ...(proof.source_session ? { source_session_required: true } : {}) } };
      } catch { throw new Error("conversation-authentication-failed"); }
    },
  };
  // Only these public provider ports cross the hosted boundary. In particular,
  // never forward the legacy same-store transaction port from an adapter object.
  const workOrders = {
    complete: (input: Parameters<HostedWorkforceDependencies["workOrders"]["complete"]>[0]) => dependencies.workOrders.complete(input),
    read: (input: Parameters<HostedWorkforceDependencies["workOrders"]["read"]>[0]) => dependencies.workOrders.read(input),
  };
  const runtime = await createFieldServiceRuntime({ storage, workOrders, timeoutMs, signal, sessionAdmission,
    async revalidateIdentity(input: { company_id: string; actor_id: string; run_id: string }) {
      signal?.throwIfAborted();
      const loaded = await loadRunIdentity(input, signal);
      await registry.resolveCurrentSession(loaded.proof, expected(input, loaded.authenticated_identity), loaded.now);
    },
  });
  return { auth, runtime, registry, sessionAdmission };
}
