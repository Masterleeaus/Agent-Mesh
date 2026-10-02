import { afterEach, describe, expect, it } from "vitest";
import { copyFile, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { verifyCompanyNativeSchemaAttestation } from "./company-native-schema-attestation.js";
import { companyNativeWorkOrdersManifest } from "./company-native-schema-manifest.js";
import { initializeFreshCompanyNativeStore } from "./company-native-store-initializer.js";
import { createSqliteStorage } from "./sqlite-client.js";
import { createSqliteCompanyStoreOpener } from "./company-store-opener.js";
import type { StorageClient } from "./index.js";

const stores: StorageClient[] = [];
const tempDirs: string[] = [];
const companyId = "fresh-native-a";
const placement = Object.freeze({
  company_id: companyId,
  placement_id: "fresh-native-placement-a",
  placement_revision: 4,
  provider: "sqlite" as const,
  schema_version: companyNativeWorkOrdersManifest.schema_version,
});
const companyProfile = Object.freeze({ name: "Fresh Native A" });

function memoryStore(): StorageClient {
  const storage = createSqliteStorage(":memory:");
  stores.push(storage);
  return storage;
}

async function newTempDir(): Promise<string> {
  const path = await mkdtemp(join(tmpdir(), "titan-native-store-"));
  tempDirs.push(path);
  return path;
}

afterEach(async () => {
  await Promise.all(stores.splice(0).map(storage => storage.close().catch(() => undefined)));
  await Promise.all(tempDirs.splice(0).map(path => rm(path, { recursive: true, force: true })));
});

describe("fresh native-work-orders-v1 schema producer", () => {
  it("pins donor migration bytes and the new native migration independently", async () => {
    for (const source of companyNativeWorkOrdersManifest.source_provenance) {
      const bytes = await readFile(new URL(`../../../${source.path}`, import.meta.url));
      expect(createHash("sha256").update(bytes).digest("hex")).toBe(source.sha256);
    }
    const migration = companyNativeWorkOrdersManifest.migrations[0];
    const bytes = await readFile(new URL(`../../../${migration?.path}`, import.meta.url));
    expect(createHash("sha256").update(bytes).digest("hex")).toBe(migration?.sha256);
  });

  it("initializes the real fresh SQLite migration and returns the exact placement witness", async () => {
    const storage = memoryStore();
    const witness = await initializeFreshCompanyNativeStore({ storage, placement, company_profile: companyProfile });
    expect(witness).toMatchObject({
      company_id: companyId,
      placement_id: placement.placement_id,
      placement_revision: placement.placement_revision,
      provider: "sqlite",
      schema_version: placement.schema_version,
      manifest_sha256: expect.stringMatching(/^[a-f0-9]{64}$/),
      schema_fingerprint_sha256: expect.stringMatching(/^[a-f0-9]{64}$/),
    });

    const objects = (await storage.query<{ name: string; type: string }>(
      "SELECT name,type FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' ORDER BY type,name",
    )).rows;
    const tables = objects.filter(object => object.type === "table").map(object => object.name).sort();
    expect(tables).toEqual([
      "clients", "companies", "jobs", "properties", "titan_company_native_schema_attestation",
      "titan_company_native_schema_migrations", "visits", "work_order_tasks", "work_orders",
    ]);
    expect(tables).not.toContain("users");
    expect(tables).not.toContain("authority_state");
    expect(tables).not.toContain("evidence");
    expect(tables).not.toContain("local_queue");
    expect(tables.filter(name => !name.startsWith("titan_company_native_schema_")))
      .toEqual([...companyNativeWorkOrdersManifest.schema_scope].sort());
    expect((await storage.query("PRAGMA foreign_key_check")).rows).toEqual([]);
    expect((await storage.query<{ integrity_check: string }>("PRAGMA integrity_check")).rows)
      .toEqual([{ integrity_check: "ok" }]);

    // Actor ids are opaque references from the verified session; no local
    // password, role, or users table participates in native work-order writes.
    await storage.query("INSERT INTO clients(id,company_id,name) VALUES('client-a',$1,'A')", [companyId]);
    await storage.query(
      "INSERT INTO jobs(id,company_id,client_id,title,created_by) VALUES('job-a',$1,'client-a','Job A','canonical-actor-a')",
      [companyId],
    );
    await storage.query(
      `INSERT INTO work_orders(id,company_id,job_id,client_id,title,created_by,assigned_user_id)
       VALUES('work-a',$1,'job-a','client-a','Work A','canonical-actor-a','canonical-worker-a')`,
      [companyId],
    );
    await storage.query(
      `INSERT INTO visits(id,company_id,job_id,work_order_id,assigned_user_id,scheduled_start,scheduled_end)
       VALUES('visit-a',$1,'job-a','work-a','canonical-worker-a','2026-01-01T09:00:00Z','2026-01-01T10:00:00Z')`,
      [companyId],
    );
    const visit = await storage.query<{ account_id: string; company_id: string; work_order_id: string }>(
      "SELECT account_id,company_id,work_order_id FROM visits WHERE id='visit-a'",
    );
    expect(visit.rows[0]).toEqual({ account_id: companyId, company_id: companyId, work_order_id: "work-a" });

    const ledger = await storage.query<{ migration_id: string; sha256: string }>(
      "SELECT migration_id,sha256 FROM titan_company_native_schema_migrations",
    );
    expect(ledger.rows).toEqual([{
      migration_id: "company-native-fsm/0001-work-orders",
      sha256: companyNativeWorkOrdersManifest.migrations[0]?.sha256,
    }]);
    expect((await storage.query("SELECT name FROM sqlite_master WHERE name LIKE '%ready%'")).rows).toEqual([]);
  });

  it("rejects an existing mixed store without changing its historical schema or ledger", async () => {
    const storage = memoryStore();
    await storage.query("CREATE TABLE schema_migrations(filename TEXT PRIMARY KEY, applied_at TEXT NOT NULL)");
    await storage.query("INSERT INTO schema_migrations(filename,applied_at) VALUES('001_canonical.sql','legacy')");
    await storage.query("CREATE TABLE users(id TEXT PRIMARY KEY,password_hash TEXT NOT NULL)");

    await expect(initializeFreshCompanyNativeStore({ storage, placement, company_profile: companyProfile }))
      .rejects.toMatchObject({ code: "company-native-schema-store-not-fresh" });
    expect((await storage.query("SELECT filename,applied_at FROM schema_migrations")).rows)
      .toEqual([{ filename: "001_canonical.sql", applied_at: "legacy" }]);
    expect((await storage.query("SELECT name FROM sqlite_master WHERE name='work_orders'")).rows).toEqual([]);
  });

  it("fails verifier checks for wrong company, stale revision, schema drift, and restored placement mismatch", async () => {
    const storage = memoryStore();
    await initializeFreshCompanyNativeStore({ storage, placement, company_profile: companyProfile });
    await expect(verifyCompanyNativeSchemaAttestation({
      storage, placement: { ...placement, company_id: "fresh-native-b" }, manifest: companyNativeWorkOrdersManifest,
    })).rejects.toMatchObject({ code: "company-native-schema-company-mismatch" });
    await expect(verifyCompanyNativeSchemaAttestation({
      storage, placement: { ...placement, placement_revision: 5 }, manifest: companyNativeWorkOrdersManifest,
    })).rejects.toMatchObject({ code: "company-native-schema-placement-mismatch" });

    const dir = await newTempDir();
    // Materialize a real file-backed fresh company store, close it (checkpointing
    // WAL), then copy it as a restore into another physical placement.
    const sourcePath = join(dir, `${placement.placement_id}.sqlite`);
    const sourceStorage = createSqliteStorage(sourcePath);
    stores.push(sourceStorage);
    await initializeFreshCompanyNativeStore({ storage: sourceStorage, placement, company_profile: companyProfile });
    await sourceStorage.close();
    stores.splice(stores.indexOf(sourceStorage), 1);
    const restoredPlacement = { ...placement, company_id: "fresh-native-b", placement_id: "fresh-native-placement-b", placement_revision: 1 };
    const restoredPath = join(dir, `${restoredPlacement.placement_id}.sqlite`);
    await copyFile(sourcePath, restoredPath);
    const opener = createSqliteCompanyStoreOpener({ companyStoreRoot: dir });
    const openedA = await opener.open(placement);
    try {
      expect((await openedA.client.query<{ file: string }>("PRAGMA database_list")).rows[0]?.file).toBe(sourcePath);
      await openedA.assertPlacementBound();
      await verifyCompanyNativeSchemaAttestation({
        storage: openedA.client, placement, manifest: companyNativeWorkOrdersManifest,
      });
    } finally { await openedA.client.close(); }
    const openedRestore = await opener.open(restoredPlacement);
    try {
      await expect(verifyCompanyNativeSchemaAttestation({
        storage: openedRestore.client, placement: restoredPlacement, manifest: companyNativeWorkOrdersManifest,
      })).rejects.toMatchObject({ code: "company-native-schema-company-mismatch" });
    } finally { await openedRestore.client.close(); }

    await storage.query("CREATE TABLE unexpected_native_object(id TEXT PRIMARY KEY)");
    await expect(verifyCompanyNativeSchemaAttestation({
      storage, placement, manifest: companyNativeWorkOrdersManifest,
    })).rejects.toMatchObject({ code: "company-native-schema-fingerprint-mismatch" });
  });
});
