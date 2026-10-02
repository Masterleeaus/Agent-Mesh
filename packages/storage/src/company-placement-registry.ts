import type { StorageClient } from "./index.js";
import {
  CompanyStorageResolutionError,
  type CompanyPlacementRecord,
  type CompanyPlacementRegistry,
  type CompanyPlacementStatus,
  type CompanyStorageResolverOptions,
} from "./company-storage-resolver.js";

const migrationTable = "titan_company_storage_migrations";
const placementTable = "titan_company_storage_placements";
const schemaVersion = 1;
const placementStatuses = ["READY", "PROVISIONING", "MIGRATING", "FAILED", "DISABLED"] as const;

export interface GlobalRegistryStorageInput {
  readonly storage: StorageClient;
  readonly storage_role: "GLOBAL_REGISTRY";
}

function requireGlobalRegistry(input: GlobalRegistryStorageInput): StorageClient {
  if (!input || input.storage_role !== "GLOBAL_REGISTRY") {
    throw new Error("company-placement-registry-storage-role-required");
  }
  if (input.storage?.dialect !== "sqlite") {
    throw new Error("company-placement-registry-storage-dialect-unsupported");
  }
  return input.storage;
}

function validId(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value === value.trim()
    && !/[\u0000-\u001f\u007f]/.test(value);
}

function validPlacementId(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/.test(value);
}

/**
 * Explicit additive GLOBAL_REGISTRY schema setup. This is never called by the
 * read adapter or storage opener; deployment/migration owners must decide when
 * to apply it. Tests call it only against disposable registry files.
 */
export async function initializeSqliteCompanyPlacementRegistry(
  input: GlobalRegistryStorageInput,
): Promise<void> {
  const storage = requireGlobalRegistry(input);
  await storage.transaction(async tx => {
    await tx.query(`CREATE TABLE IF NOT EXISTS ${migrationTable} (version INTEGER PRIMARY KEY)`);
    const versions = (await tx.query<{ version: number }>(
      `SELECT version FROM ${migrationTable} ORDER BY version`,
    )).rows;
    if (versions.length === 1 && versions[0].version === schemaVersion) {
      await tx.query(`SELECT company_id, placement_id, placement_revision, provider, schema_version, status FROM ${placementTable} LIMIT 0`);
      return;
    }
    if (versions.length !== 0) throw new Error("company-placement-registry-schema-unsupported");

    const existing = await tx.query<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name = $1",
      [placementTable],
    );
    if (existing.rows.length !== 0) throw new Error("company-placement-registry-schema-version-missing");

    await tx.query(`CREATE TABLE ${placementTable} (
      company_id TEXT PRIMARY KEY NOT NULL CHECK (length(trim(company_id)) > 0),
      placement_id TEXT NOT NULL UNIQUE CHECK (length(placement_id) BETWEEN 1 AND 128),
      placement_revision INTEGER NOT NULL CHECK (placement_revision > 0),
      provider TEXT NOT NULL CHECK (provider = 'sqlite'),
      schema_version TEXT NOT NULL CHECK (length(trim(schema_version)) > 0),
      status TEXT NOT NULL CHECK (status IN ('READY', 'PROVISIONING', 'MIGRATING', 'FAILED', 'DISABLED'))
    )`);
    await tx.query(`INSERT INTO ${migrationTable} (version) VALUES ($1)`, [schemaVersion]);
  });
}

type PlacementRow = {
  company_id: unknown;
  placement_id: unknown;
  placement_revision: unknown;
  provider: unknown;
  schema_version: unknown;
  status: unknown;
};

function placementFromRow(row: PlacementRow): CompanyPlacementRecord {
  if (!validId(row.company_id) || !validPlacementId(row.placement_id)
    || !Number.isSafeInteger(row.placement_revision) || Number(row.placement_revision) < 1
    || row.provider !== "sqlite" || !validId(row.schema_version)
    || typeof row.status !== "string" || !placementStatuses.includes(row.status as CompanyPlacementStatus)) {
    throw new CompanyStorageResolutionError("placement-invalid");
  }
  return Object.freeze({
    company_id: row.company_id,
    placement_id: row.placement_id,
    placement_revision: row.placement_revision as number,
    provider: "sqlite",
    schema_version: row.schema_version,
    status: row.status as CompanyPlacementStatus,
  });
}

/** Create a read-only adapter over the existing, separately supplied registry. */
export async function createSqliteCompanyPlacementRegistry(
  input: GlobalRegistryStorageInput,
): Promise<CompanyPlacementRegistry> {
  const storage = requireGlobalRegistry(input);
  let versions: Array<{ version: number }>;
  try {
    versions = (await storage.query<{ version: number }>(
      `SELECT version FROM ${migrationTable} ORDER BY version`,
    )).rows;
  } catch {
    throw new Error("company-placement-registry-schema-unavailable");
  }
  if (versions.length !== 1 || versions[0].version !== schemaVersion) {
    throw new Error("company-placement-registry-schema-unavailable");
  }
  // Verify the expected table/columns now so missing or incompatible schema
  // fails during trusted composition rather than on the first business request.
  await storage.query(`SELECT company_id, placement_id, placement_revision, provider, schema_version, status FROM ${placementTable} LIMIT 0`);

  return Object.freeze({
    async findByCompanyId(companyId: string, options?: CompanyStorageResolverOptions) {
      if (options?.signal?.aborted) throw new CompanyStorageResolutionError("resolution-aborted");
      if (!validId(companyId)) throw new CompanyStorageResolutionError("placement-invalid");
      const rows = (await storage.query<PlacementRow>(
        `SELECT company_id, placement_id, placement_revision, provider, schema_version, status
           FROM ${placementTable}
          WHERE company_id = $1`,
        [companyId],
      )).rows;
      if (options?.signal?.aborted) throw new CompanyStorageResolutionError("resolution-aborted");
      if (rows.length === 0) return null;
      if (rows.length !== 1) throw new CompanyStorageResolutionError("placement-invalid");
      return placementFromRow(rows[0]);
    },
  });
}
