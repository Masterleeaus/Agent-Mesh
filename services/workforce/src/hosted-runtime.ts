import type { StorageClient } from "../../../packages/storage/src/index.js";
import { IdentitySessionRegistry, type VerifiedSessionIdentity } from "../../../packages/titan-platform/src/security-boundary.js";
// Existing native composition owns authority, provider verification and evidence.
// @ts-expect-error Native runtime owner is JavaScript.
import { createFieldServiceRuntime } from "./field-service-runtime.mjs";
import type { ConversationAuth, ConversationSurface } from "./conversation-api.js";

export type HostedWorkforceDependencies = {
  identityStoragePath: string;
  /** Authenticate cryptographically before returning these bound claims. */
  credentialVerifier: {
    verify(authorization: string): Promise<VerifiedSessionIdentity & { audience: string; surface: ConversationSurface }>;
  };
  /** Resolve current physical company storage within the canonical native provider. */
  workOrders: {
    complete(input: { company_id: string; actor_id: string; work_order_id: string }): Promise<unknown>;
    read(input: { company_id: string; actor_id: string; work_order_id: string }): Promise<unknown>;
  };
  /** Actual observations of credential, authority, provider and evidence dependencies. */
  readiness(): Promise<{ authentication: boolean; authority: boolean; provider: boolean; evidence: boolean }>;
  close?(): Promise<void>;
};

export async function createHostedRuntime(storage: StorageClient, identityStorage: StorageClient, dependencies: HostedWorkforceDependencies) {
  const registry = new IdentitySessionRegistry(identityStorage);
  const auth: ConversationAuth = {
    async resolve({ request, authorization }) {
      try {
        if (!authorization || authorization.length > 8192) throw new Error("credential-required");
        const verified = await dependencies.credentialVerifier.verify(authorization);
        if (!["zero", "go", "hub"].includes(verified.surface) || verified.audience !== "workforce") throw new Error("credential-audience-invalid");
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
  const runtime = await createFieldServiceRuntime({ storage, workOrders: dependencies.workOrders,
    async revalidateIdentity(input: { company_id: string; actor_id: string; run_id: string }) {
      const row = (await storage.query<{ payload: string }>("SELECT payload FROM agent_runs WHERE company_id=$1 AND run_id=$2", [input.company_id, input.run_id])).rows[0];
      const run = row ? JSON.parse(row.payload) : null;
      const proof = run?.authenticated_identity;
      if (!proof || proof.actor_id !== input.actor_id || proof.company_id !== input.company_id) throw new Error("runtime-authentication-required");
      await registry.resolveCurrentSession(proof, { audience: "workforce", company_id: input.company_id,
        actor_id: input.actor_id, context_revision: proof.context_revision }, new Date().toISOString());
    },
  });
  return { auth, runtime, registry };
}
