import type { StorageClient } from "../../../packages/storage/src/index.js";
import { IdentitySessionRegistry, type VerifiedSessionIdentity } from "../../../packages/titan-platform/src/security-boundary.js";
// Existing native composition owns authority, provider verification and evidence.
// @ts-expect-error Native runtime owner is JavaScript.
import { createFieldServiceRuntime } from "./field-service-runtime.mjs";
// @ts-expect-error Canonical execution boundary is JavaScript.
import { boundedAdapterCall } from "../../../packages/tools/execution-gateway.mjs";
import type { ConversationAuth, ConversationSurface } from "./conversation-api.js";
import type { DirectAdminGatewayFactory } from "./directadmin-workforce-owners.js";

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

export async function createHostedRuntime(storage: StorageClient, identityStorage: StorageClient, dependencies: HostedWorkforceDependencies, signal?: AbortSignal) {
  const timeoutMs = dependencies.adapterTimeoutMs ?? 30_000;
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 120_000) throw new Error("workforce-adapter-timeout-invalid");
  const registry = new IdentitySessionRegistry(identityStorage);
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
        const proof = { provider: verified.provider, subject: verified.subject, session_id: verified.session_id,
          device_id: verified.device_id, session_revision: verified.session_revision };
        const current = await registry.resolveCurrentSession(proof, {
          audience: "workforce", company_id: request.company_id!, actor_id: request.actor_id,
          context_revision: request.context_revision,
        }, new Date().toISOString());
        return { company_id: current.company_id, actor_id: current.actor_id, device_id: current.device_id,
          session_id: current.session_id, context_revision: current.context_revision, surface: verified.surface,
          authenticated_identity: { ...proof, audience: "workforce", company_id: current.company_id,
            actor_id: current.actor_id, context_revision: current.context_revision, surface: verified.surface } };
      } catch { throw new Error("conversation-authentication-failed"); }
    },
  };
  // Only these public provider ports cross the hosted boundary. In particular,
  // never forward the legacy same-store transaction port from an adapter object.
  const workOrders = {
    complete: (input: Parameters<HostedWorkforceDependencies["workOrders"]["complete"]>[0]) => dependencies.workOrders.complete(input),
    read: (input: Parameters<HostedWorkforceDependencies["workOrders"]["read"]>[0]) => dependencies.workOrders.read(input),
  };
  const runtime = await createFieldServiceRuntime({ storage, workOrders, timeoutMs, signal,
    async revalidateIdentity(input: { company_id: string; actor_id: string; run_id: string }) {
      signal?.throwIfAborted();
      const row = (await storage.query<{ payload: string }>("SELECT payload FROM agent_runs WHERE company_id=$1 AND run_id=$2", [input.company_id, input.run_id])).rows[0];
      signal?.throwIfAborted();
      const run = row ? JSON.parse(row.payload) : null;
      const proof = run?.authenticated_identity;
      if (!proof || proof.actor_id !== input.actor_id || proof.company_id !== input.company_id) throw new Error("runtime-authentication-required");
      await registry.resolveCurrentSession(proof, { audience: "workforce", company_id: input.company_id,
        actor_id: input.actor_id, context_revision: proof.context_revision }, new Date().toISOString());
    },
  });
  return { auth, runtime, registry };
}
