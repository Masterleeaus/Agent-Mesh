import {
  createCompanyStorageResolver,
  createSqliteCompanyPlacementRegistry,
  createSqliteCompanyStoreOpener,
  openExistingSqliteStorage,
  type CompanyStorageResolver,
  type StorageClient,
} from "../../../../packages/storage/src/index";
import type { CurrentWebSession } from "../auth/current-session";
import { getWebSessionRuntime } from "../auth/web-session-runtime";
import { withNativeCompanyStore } from "./consumer";

function requiredEnvironment(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`native-company-runtime-config-required:${name}`);
  return value;
}

function sameAuthenticatedScope(a: CurrentWebSession["scope"], b: CurrentWebSession["scope"]): boolean {
  if (a.kind !== "authenticated" || b.kind !== "authenticated") return false;
  return a.current.company_id === b.current.company_id
    && a.current.actor_id === b.current.actor_id
    && a.current.session_id === b.current.session_id
    && a.current.session_revision === b.current.session_revision
    && a.current.context_revision === b.current.context_revision
    && a.current.audience === b.current.audience
    && a.current.expires_at === b.current.expires_at
    && a.current.authority_neutral === b.current.authority_neutral;
}

/**
 * Resolve the #302 cookie on this request, then compose the existing read-only
 * #1233 GLOBAL_REGISTRY adapter and root-bounded SQLite opener. Each placement
 * lease re-resolves the same request credential so revocation or a company
 * switch invalidates an in-flight checklist operation. This creates no schema,
 * placement, READY state, identity binding, or business row.
 */
export async function withWebNativeCompanyStore<T>(input: {
  request: Pick<Request, "headers">;
  requiredSchemaVersion: string;
  operation(client: StorageClient, currentSession: CurrentWebSession): Promise<T>;
}): Promise<{ authenticated: false } | { authenticated: true; value: T; currentSession: CurrentWebSession }> {
  const sessionRuntime = await getWebSessionRuntime();
  const currentSession = await sessionRuntime.resolveRequest(input.request);
  if (!currentSession) return { authenticated: false };

  const registryPath = requiredEnvironment("TITAN_WEB_IDENTITY_REGISTRY_PATH");
  const companyStoreRoot = requiredEnvironment("TITAN_COMPANY_DATA_ROOT");
  const registryStorage = openExistingSqliteStorage(registryPath);
  try {
    const registry = await createSqliteCompanyPlacementRegistry({
      storage: registryStorage,
      storage_role: "GLOBAL_REGISTRY",
    });
    const opener = createSqliteCompanyStoreOpener({ companyStoreRoot });
    const resolver: CompanyStorageResolver<StorageClient> = createCompanyStorageResolver({
      registry,
      opener,
      scopeRevalidator: {
        async assertCurrent(scope) {
          const fresh = await sessionRuntime.resolveRequest(input.request);
          if (!fresh || !sameAuthenticatedScope(currentSession.scope, fresh.scope)
            || !sameAuthenticatedScope(fresh.scope, scope)) {
            throw new Error("native-company-session-not-current");
          }
        },
      },
    });
    const value = await withNativeCompanyStore({
      resolver,
      current_session: currentSession,
      required_schema_version: input.requiredSchemaVersion,
      operation: client => input.operation(client, currentSession),
    });
    return { authenticated: true, value, currentSession };
  } finally {
    await registryStorage.close();
  }
}
