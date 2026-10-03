import { normalizeCompanyContext, type StorageClient } from "../../../../packages/storage/src/index";
import cleaningBundle from "../../../../packages/modules/bundles/cleaning-workforce.bundle.json";
import { createCleaningServiceSetupAuthority } from "../../../../packages/onboarding/runtime/cleaning-service-setup.mjs";
import type { VerifiedCompanyScope } from "../../../../packages/storage/src/company-storage-resolver";

const LOCATOR = Object.freeze({
  module_id: "titan.onboarding",
  collection: "cleaning-service-setup",
  record_id: "canonical",
});
const SETTINGS_KEY = "cleaning_service_setup";
const RECORD_SCHEMA = "titan.onboarding.cleaning-service-setup-record.v1";

type Locator = { module_id: string; collection: string; record_id: string };
type RecordInput = {
  module_id: string;
  collection: string;
  record_id: string;
  expected_revision?: number;
  updated_at?: number;
  data?: unknown;
  provenance?: unknown;
};

function assertCompany(scope: VerifiedCompanyScope, context: unknown): string {
  if (scope.kind !== "authenticated") throw new Error("cleaning-service-setup-authenticated-session-required");
  const companyId = normalizeCompanyContext(context as { company_id?: string });
  if (companyId !== scope.current.company_id) throw new Error("cleaning-service-setup-company-context-mismatch");
  return companyId;
}

function assertLocator(locator: Partial<Locator>): void {
  if (locator.module_id !== LOCATOR.module_id || locator.collection !== LOCATOR.collection || locator.record_id !== LOCATOR.record_id) {
    throw new Error("cleaning-service-setup-record-locator-invalid");
  }
}

function parseSettings(value: unknown): Record<string, unknown> {
  let parsed: unknown;
  try { parsed = typeof value === "string" ? JSON.parse(value || "{}") : value ?? {}; }
  catch { throw new Error("company-settings-invalid"); }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("company-settings-invalid");
  return parsed as Record<string, unknown>;
}

function storedRecord(value: unknown, companyId: string): Record<string, unknown> | null {
  if (value == null) return null;
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("cleaning-service-setup-record-invalid");
  const record = value as Record<string, unknown>;
  if (record.schema !== RECORD_SCHEMA || record.company_id !== companyId
    || !Number.isSafeInteger(record.revision) || Number(record.revision) < 1
    || !record.data || typeof record.data !== "object" || Array.isArray(record.data)) {
    throw new Error("cleaning-service-setup-record-invalid");
  }
  return record;
}

/**
 * Adapts the retained onboarding authority's record port to the already
 * verified company's native `companies.settings` row. It adds one namespaced
 * key, preserving profile and other settings in the same transaction.
 */
export function createCleaningServiceSetupAuthorityStore(input: {
  scope: VerifiedCompanyScope;
  storage: StorageClient;
  assertCurrent?: () => Promise<void>;
}) {
  if (input.scope.kind !== "authenticated") throw new Error("cleaning-service-setup-authenticated-session-required");
  if (input.storage.dialect !== "sqlite") throw new Error("cleaning-service-setup-company-storage-provider-unsupported");
  const companyId = input.scope.current.company_id;

  const database = {
    async getRecord(context: unknown, locator: Partial<Locator>) {
      const resolvedCompanyId = assertCompany(input.scope, context);
      assertLocator(locator);
      await input.assertCurrent?.();
      const row = (await input.storage.query<{ id: string; settings: unknown }>(
        "SELECT id,settings FROM companies WHERE id=$1", [resolvedCompanyId],
      )).rows[0];
      if (!row || row.id !== companyId) throw new Error("cleaning-service-setup-company-not-found");
      const record = storedRecord(parseSettings(row.settings)[SETTINGS_KEY], companyId);
      await input.assertCurrent?.();
      return record ? {
        ...LOCATOR,
        version: Number(record.revision),
        updated_at: Number(record.updated_at),
        data: record.data as Record<string, unknown>,
        provenance: record.provenance,
      } : null;
    },

    async putRecord(context: unknown, recordInput: RecordInput) {
      const resolvedCompanyId = assertCompany(input.scope, context);
      assertLocator(recordInput);
      const expectedRevision = recordInput.expected_revision;
      if (!Number.isSafeInteger(expectedRevision) || Number(expectedRevision) < 0) {
        throw new Error("cleaning-service-setup-expected-revision-required");
      }
      if (!recordInput.data || typeof recordInput.data !== "object" || Array.isArray(recordInput.data)
        || (recordInput.data as Record<string, unknown>).company_id !== companyId) {
        throw new Error("cleaning-service-setup-record-company-mismatch");
      }
      await input.assertCurrent?.();
      const stored = await input.storage.transaction(async transaction => {
        const row = (await transaction.query<{ id: string; settings: unknown }>(
          "SELECT id,settings FROM companies WHERE id=$1", [resolvedCompanyId],
        )).rows[0];
        if (!row || row.id !== companyId) throw new Error("cleaning-service-setup-company-not-found");
        const settings = parseSettings(row.settings);
        const prior = storedRecord(settings[SETTINGS_KEY], companyId);
        const revision = Number(prior?.revision || 0);
        if (revision !== expectedRevision) throw new Error("cleaning setup revision mismatch");
        const next = {
          schema: RECORD_SCHEMA,
          company_id: companyId,
          revision: revision + 1,
          updated_at: Number(recordInput.updated_at ?? Date.now()),
          data: recordInput.data,
          provenance: recordInput.provenance ?? null,
        };
        const result = await transaction.query(
          "UPDATE companies SET settings=$1,updated_at=CURRENT_TIMESTAMP WHERE id=$2",
          [JSON.stringify({ ...settings, [SETTINGS_KEY]: next }), companyId],
        );
        if (result.rowCount !== 1) throw new Error("cleaning-service-setup-write-failed");
        return { ...LOCATOR, version: next.revision, updated_at: next.updated_at, data: next.data };
      });
      await input.assertCurrent?.();
      return stored;
    },
  };

  return createCleaningServiceSetupAuthority({ database, cleaningBundle });
}
