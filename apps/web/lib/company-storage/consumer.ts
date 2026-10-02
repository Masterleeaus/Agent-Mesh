import type { CompanyStorageResolver, VerifiedCompanyScope } from "../../../../packages/storage/src/company-storage-resolver";
import type { StorageClient } from "../../../../packages/storage/src/index";
import { getCompanyNativeSchemaManifest } from "../../../../packages/storage/src/company-native-schema-manifest";
import { verifyCompanyNativeSchemaAttestation } from "../../../../packages/storage/src/company-native-schema-attestation";
import type { CurrentWebSession } from "../auth/current-session";

/**
 * The operation callback returned successfully, but the physical lease could
 * not be closed. The callback's side effects may already be committed, so
 * callers must not treat this as a safe-to-retry operation failure.
 */
export class NativeCompanyStoreCloseAfterOperationError extends Error {
  readonly operation_returned_successfully = true;
  readonly automatic_retry_allowed = false;

  constructor(cause: unknown) {
    super("native-company-store-close-after-operation", { cause });
    this.name = "NativeCompanyStoreCloseAfterOperationError";
  }
}

/**
 * Execute one native FSM operation against the company store selected by the
 * canonical #1233 resolver. Callers must pass a scope freshly produced by the
 * #302 session verifier (or a verified public capability); request JSON is
 * never accepted here. No app-local fallback store is used on resolver error.
 */
export async function withNativeCompanyStore<T>(input: {
  resolver: CompanyStorageResolver<StorageClient>;
  /** Verified identity context returned by the #302 session ingress. */
  current_session: CurrentWebSession;
  /** Verified scope returned by that same current-session ingress. */
  scope: VerifiedCompanyScope;
  /** Native manifest required by this operation (for example visit_tasks v2). */
  required_schema_version: string;
  signal?: AbortSignal;
  operation(client: StorageClient): Promise<T>;
}): Promise<T> {
  input.signal?.throwIfAborted();
  const companyId = input.current_session.context.company_id;
  const context = input.current_session.context;
  if (input.scope.kind !== "authenticated") {
    throw new Error("native-company-session-scope-mismatch");
  }
  const current = input.scope.current;
  if (current.company_id !== context.company_id
    || current.actor_id !== context.actor_id
    || current.session_id !== context.session_id
    || current.session_revision !== context.session_revision
    || current.context_revision !== context.context_revision
    || current.audience !== context.audience
    || current.expires_at !== context.expires_at
    || current.authority_neutral !== context.authority_neutral) {
    throw new Error("native-company-session-scope-mismatch");
  }
  const placement = await input.resolver.resolve(input.scope, { signal: input.signal });
  if (placement.company_id !== companyId) {
    throw new Error("native-company-placement-mismatch");
  }

  const lease = await input.resolver.open(placement, { signal: input.signal });
  let failed = false;
  try {
    if (lease.company_id !== companyId
      || lease.placement_id !== placement.placement_id
      || lease.placement_revision !== placement.placement_revision
      || lease.provider !== placement.provider
      || lease.schema_version !== placement.schema_version
      || lease.client.dialect !== lease.provider) {
      throw new Error("native-company-store-binding-mismatch");
    }
    await lease.assertCurrent({ signal: input.signal });
    const manifest = getCompanyNativeSchemaManifest(lease.schema_version);
    if (!manifest || lease.schema_version !== input.required_schema_version) {
      throw new Error("native-company-schema-version-unsupported");
    }
    // Registry READY controls whether the placement may be opened; this second,
    // DB-local check proves that this exact company/placement/revision has the
    // canonical schema and migration ledger before any native operation runs.
    await verifyCompanyNativeSchemaAttestation({ storage: lease.client, placement, manifest });
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
    else {
      try {
        await lease.close();
      } catch (error) {
        throw new NativeCompanyStoreCloseAfterOperationError(error);
      }
    }
  }
}
