import type {
  CompanyStorageResolver,
  VerifiedCompanyScope,
} from "../../../../packages/storage/src/company-storage-resolver";
import type { StorageClient } from "../../../../packages/storage/src/index";

/**
 * Execute one native FSM operation against the company store selected by the
 * canonical #1233 resolver. Callers must pass a scope freshly produced by the
 * #302 session verifier (or a verified public capability); request JSON is
 * never accepted here. No app-local fallback store is used on resolver error.
 */
export async function withNativeCompanyStore<T>(input: {
  resolver: CompanyStorageResolver<StorageClient>;
  scope: VerifiedCompanyScope;
  company_id: string;
  signal?: AbortSignal;
  operation(client: StorageClient): Promise<T>;
}): Promise<T> {
  input.signal?.throwIfAborted();
  const placement = await input.resolver.resolve(input.scope, { signal: input.signal });
  if (placement.company_id !== input.company_id) {
    throw new Error("native-company-placement-mismatch");
  }

  const lease = await input.resolver.open(placement, { signal: input.signal });
  let failed = false;
  try {
    if (lease.company_id !== input.company_id
      || lease.placement_id !== placement.placement_id
      || lease.placement_revision !== placement.placement_revision
      || lease.provider !== placement.provider
      || lease.schema_version !== placement.schema_version
      || lease.client.dialect !== lease.provider) {
      throw new Error("native-company-store-binding-mismatch");
    }
    await lease.assertCurrent({ signal: input.signal });
    input.signal?.throwIfAborted();
    const result = await input.operation(lease.client);
    await lease.assertCurrent({ signal: input.signal });
    input.signal?.throwIfAborted();
    return result;
  } catch (error) {
    failed = true;
    throw error;
  } finally {
    if (failed) await lease.close().catch(() => undefined);
    else await lease.close();
  }
}
