import { resolve, isAbsolute } from "node:path";
import {
  createCompanyStorageResolver,
  createSqliteCompanyPlacementRegistry,
  createSqliteCompanyStoreOpener,
  openExistingSqliteStorage,
  type CompanyPlacementRegistry,
  type CompanyStoreOpener,
  type StorageClient,
  type VerifiedCompanyScope,
} from "../../../../packages/storage/src/index";
import { getCompanyNativeSchemaManifest } from "../../../../packages/storage/src/company-native-schema-manifest";
import type { CurrentWebSession } from "../auth/current-session";
import { withNativeCompanyStore } from "./consumer";
import { ensureCleaningFirstRunProfile } from "./cleaning-profile-entry";

export interface IssuedCleaningWebSession extends CurrentWebSession {
  readonly credential: string;
}

export class CleaningProfileStoreSetupRequiredError extends Error {
  readonly code = "CLEANING_PROFILE_STORE_SETUP_REQUIRED";
  readonly missing_or_invalid: readonly string[];

  constructor(missingOrInvalid: readonly string[]) {
    super("cleaning-profile-store-setup-required");
    this.name = "CleaningProfileStoreSetupRequiredError";
    this.missing_or_invalid = Object.freeze([...new Set(missingOrInvalid)]);
  }
}

export class CleaningProfileStoreUnavailableError extends Error {
  readonly code = "CLEANING_PROFILE_STORE_UNAVAILABLE";

  constructor() {
    super("cleaning-profile-store-unavailable");
    this.name = "CleaningProfileStoreUnavailableError";
  }
}

export interface CleaningProfileLoginOptions {
  readonly issued: IssuedCleaningWebSession;
  readonly resolveCurrentSession: (credential: string) => Promise<CurrentWebSession | null>;
  readonly environment?: Readonly<Record<string, string | undefined>>;
  /** Injectable canonical ports for isolated tests. Production routes omit this. */
  readonly test_ports?: Readonly<{
    registry: CompanyPlacementRegistry;
    opener: CompanyStoreOpener<StorageClient>;
  }>;
}

function configured(environment: Readonly<Record<string, string | undefined>>, name: string): string {
  const value = environment[name]?.trim();
  if (!value) throw new CleaningProfileStoreSetupRequiredError([name]);
  return value;
}

function sameAuthenticatedScope(a: VerifiedCompanyScope, b: VerifiedCompanyScope): boolean {
  if (a.kind !== "authenticated" || b.kind !== "authenticated") return false;
  const left = a.current;
  const right = b.current;
  return left.company_id === right.company_id
    && left.actor_id === right.actor_id
    && left.session_id === right.session_id
    && left.session_revision === right.session_revision
    && left.context_revision === right.context_revision
    && left.audience === right.audience
    && left.expires_at === right.expires_at
    && left.authority_neutral === right.authority_neutral;
}

/**
 * Initialize a company's Cleaning first-run profile before its login cookie is
 * published. This opens only an existing GLOBAL_REGISTRY and existing
 * registry-selected company store. It never creates/migrates either database.
 */
export async function initializeCleaningProfileForLogin(options: CleaningProfileLoginOptions) {
  const environment = options.environment ?? process.env;
  let registryStorage: ReturnType<typeof openExistingSqliteStorage> | undefined;
  let registry: CompanyPlacementRegistry;
  let opener: CompanyStoreOpener<StorageClient>;
  try {
    if (options.test_ports) {
      registry = options.test_ports.registry;
      opener = options.test_ports.opener;
    } else {
      const registryPath = configured(environment, "TITAN_WEB_IDENTITY_REGISTRY_PATH");
      const configuredRoot = configured(environment, "TITAN_COMPANY_DATA_ROOT");
      if (!isAbsolute(registryPath)) {
        throw new CleaningProfileStoreSetupRequiredError(["TITAN_WEB_IDENTITY_REGISTRY_PATH must be absolute"]);
      }
      const companyStoreRoot = isAbsolute(configuredRoot) ? configuredRoot : resolve(process.cwd(), configuredRoot);
      try {
        registryStorage = openExistingSqliteStorage(registryPath);
      } catch {
        throw new CleaningProfileStoreSetupRequiredError(["TITAN_WEB_IDENTITY_REGISTRY_PATH must point to an existing GLOBAL_REGISTRY"]);
      }

      try {
        registry = await createSqliteCompanyPlacementRegistry({ storage: registryStorage, storage_role: "GLOBAL_REGISTRY" });
      } catch {
        throw new CleaningProfileStoreSetupRequiredError(["GLOBAL_REGISTRY company-placement schema must already be commissioned"]);
      }
      try {
        opener = createSqliteCompanyStoreOpener({ companyStoreRoot });
      } catch {
        throw new CleaningProfileStoreSetupRequiredError(["TITAN_COMPANY_DATA_ROOT must be an existing trusted company-store directory"]);
      }
    }

    const resolver = createCompanyStorageResolver({
      registry,
      opener,
      scopeRevalidator: {
        async assertCurrent(scope) {
          const current = await options.resolveCurrentSession(options.issued.credential);
          if (!current || !sameAuthenticatedScope(scope, current.scope)
            || !sameAuthenticatedScope(scope, options.issued.scope)) {
            throw new Error("company-profile-session-stale");
          }
        },
      },
    });

    // Resolve first to select only a registered, supported native manifest.
    // The consumer resolves and attests it again around the actual operation.
    try {
      const placement = await resolver.resolve(options.issued.scope);
      if (!getCompanyNativeSchemaManifest(placement.schema_version)) {
        throw new CleaningProfileStoreSetupRequiredError(["company placement uses an unsupported native schema"]);
      }
      return await withNativeCompanyStore({
        resolver,
        current_session: options.issued,
        required_schema_version: placement.schema_version,
        operation: storage => ensureCleaningFirstRunProfile({ scope: options.issued.scope, storage }),
      });
    } catch (error) {
      if (error instanceof CleaningProfileStoreSetupRequiredError) throw error;
      throw new CleaningProfileStoreUnavailableError();
    }
  } finally {
    await registryStorage?.close();
  }
}
