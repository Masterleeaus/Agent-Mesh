import type { StorageClient } from "../../../packages/storage/src/index.js";
import type {
  AuthenticatedCompanyContext,
  CompanyStorageResolver,
  RegisteredCompanyPlacement,
} from "../../../packages/storage/src/company-storage-resolver.js";
import type { CurrentSessionContext } from "../../../packages/titan-platform/src/security-boundary.js";

export type CompanyWorkOrderInput = Readonly<{
  company_id: string;
  actor_id: string;
  run_id: string;
  work_id: string;
  work_order_id: string;
  signal?: AbortSignal;
}>;

export type CompanyWorkOrderEffectInput = CompanyWorkOrderInput & Readonly<{
  companyStorage: StorageClient;
  currentSession: CurrentSessionContext;
}>;

export type HostedCompanyWorkOrderOperations = Readonly<{
  read(input: CompanyWorkOrderEffectInput): Promise<unknown>;
  complete(input: CompanyWorkOrderEffectInput & { authorityFence?: { assertCurrent(): void } }): Promise<unknown>;
}>;

type CompanyStorageLeaseResolver = Pick<CompanyStorageResolver<StorageClient>, "resolve" | "open">;

function authenticatedScope(current: CurrentSessionContext): AuthenticatedCompanyContext {
  return Object.freeze({
    company_id: current.company_id,
    actor_id: current.actor_id,
    session_id: current.session_id,
    session_revision: current.session_revision,
    context_revision: current.context_revision,
    audience: current.audience,
    expires_at: current.expires_at,
    authority_neutral: true,
  });
}

function assertCurrentBinding(input: CompanyWorkOrderInput, current: CurrentSessionContext): void {
  input.signal?.throwIfAborted();
  if (current.authority_neutral !== true || current.audience !== "workforce"
    || current.company_id !== input.company_id || current.actor_id !== input.actor_id
    || current.session_id.length === 0 || current.context_revision.length === 0
    || !Number.isSafeInteger(current.session_revision) || current.session_revision < 1
    || !Number.isFinite(Date.parse(current.expires_at)) || Date.parse(current.expires_at) <= Date.now()) {
    throw new Error("workforce-company-session-binding-invalid");
  }
}

function assertPlacementBinding(input: CompanyWorkOrderInput, placement: RegisteredCompanyPlacement): void {
  if (placement.company_id !== input.company_id) throw new Error("workforce-company-placement-mismatch");
}

function leaseBoundClient(client: StorageClient, lease: Awaited<ReturnType<CompanyStorageResolver<StorageClient>["open"]>>, signal?: AbortSignal): StorageClient {
  const assertLeaseCurrent = async () => {
    signal?.throwIfAborted();
    await lease.assertCurrent({ signal });
    signal?.throwIfAborted();
  };
  return Object.freeze({
    dialect: client.dialect,
    async query<T>(sql: string, params?: readonly unknown[]) {
      await assertLeaseCurrent();
      return client.query<T>(sql, params);
    },
    transaction<T>(fn: (tx: StorageClient) => Promise<T>, transactionOptions?: Parameters<StorageClient["transaction"]>[1]) {
      // The lease was asserted at provider admission. Once a consequential
      // effect is admitted, the existing execution contract lets it finish;
      // the post-effect check below blocks verification if scope/placement moved.
      return client.transaction(fn, transactionOptions);
    },
    async close() {
      throw new Error("workforce-company-store-close-owned-by-lease");
    },
  });
}

/**
 * Workforce consumer for the canonical #1233 resolver. It derives placement
 * only from a freshly verified #302 current session, passes the resolver-issued
 * lease client to the existing native work-order owner, and closes every lease.
 * Placement/lease values remain in-process and are never serialized as authority.
 */
export function createCompanyScopedWorkOrders(options: {
  resolver: CompanyStorageLeaseResolver;
  resolveCurrentSession(input: CompanyWorkOrderInput): Promise<CurrentSessionContext>;
  operations: HostedCompanyWorkOrderOperations;
}) {
  const withLease = async <T>(input: CompanyWorkOrderInput, effect: (companyStorage: StorageClient, currentSession: CurrentSessionContext) => Promise<T>): Promise<T> => {
    input.signal?.throwIfAborted();
    const current = await options.resolveCurrentSession(input);
    assertCurrentBinding(input, current);
    const placement = await options.resolver.resolve({ kind: "authenticated", current: authenticatedScope(current) }, { signal: input.signal });
    assertPlacementBinding(input, placement);

    const lease = await options.resolver.open(placement, { signal: input.signal });
    let effectFailed = false;
    try {
      if (lease.company_id !== input.company_id || lease.placement_id !== placement.placement_id
        || lease.placement_revision !== placement.placement_revision || lease.provider !== placement.provider
        || lease.schema_version !== placement.schema_version || lease.client.dialect !== lease.provider) {
        throw new Error("workforce-company-store-binding-invalid");
      }
      await lease.assertCurrent({ signal: input.signal });
      input.signal?.throwIfAborted();
      const result = await effect(leaseBoundClient(lease.client, lease, input.signal), current);
      await lease.assertCurrent({ signal: input.signal });
      input.signal?.throwIfAborted();
      return result;
    } catch (error) {
      effectFailed = true;
      throw error;
    } finally {
      if (effectFailed) await lease.close().catch(() => undefined);
      else await lease.close();
    }
  };

  return Object.freeze({
    read(input: CompanyWorkOrderInput) {
      return withLease(input, (companyStorage, currentSession) => options.operations.read({ ...input, companyStorage, currentSession }));
    },
    complete(input: CompanyWorkOrderInput & { authorityFence?: { assertCurrent(): void } }) {
      return withLease(input, (companyStorage, currentSession) => options.operations.complete({ ...input, companyStorage, currentSession }));
    },
  });
}
