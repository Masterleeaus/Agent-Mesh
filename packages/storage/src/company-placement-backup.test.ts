import { afterEach, describe, expect, it } from "vitest";
import { access, mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { initializeSqliteCompanyPlacementRegistry, createSqliteCompanyPlacementRegistry } from "./company-placement-registry.js";
import { provisionSqliteCompanyPlacement } from "./company-placement-provisioner.js";
import { createCompanyPlacementBackup, restoreCompanyPlacementBackup, validateCompanyPlacementBackup } from "./company-placement-backup.js";
import { createSqliteStorage } from "./sqlite-client.js";
import { createSqliteCompanyStoreOpener } from "./company-store-opener.js";

const paths: string[] = [];
const closers: Array<() => Promise<void>> = [];
async function fixture() {
  const root = await mkdtemp(join(tmpdir(), "titan-placement-backup-")); paths.push(root);
  const dbRoot = join(root, "db"); const fileRoot = join(root, "files"); const backupRoot = join(root, "backups");
  await mkdir(dbRoot, { mode: 0o700 }); await mkdir(fileRoot, { mode: 0o700 }); await mkdir(backupRoot, { mode: 0o700 });
  const storage = createSqliteStorage(join(root, "registry.sqlite")); closers.push(() => storage.close());
  const registry = { storage, storage_role: "GLOBAL_REGISTRY" as const, companyStoreRoot: dbRoot, companyFileStoreRoot: fileRoot };
  await initializeSqliteCompanyPlacementRegistry({ storage, storage_role: "GLOBAL_REGISTRY" });
  return { root, registry, storage, backupRoot };
}
afterEach(async () => {
  await Promise.all(closers.splice(0).map(close => close().catch(() => undefined)));
  await Promise.all(paths.splice(0).map(path => rm(path, { recursive: true, force: true })));
});

describe("company placement backup and restore", () => {
  it("restores checksummed DB and files only to the same current company placement", async () => {
    const f = await fixture();
    const placement = await provisionSqliteCompanyPlacement({ registry: f.registry, company_id: "backup-co-a", company_name: "Company A" });
    const fileDir = join(f.registry.companyFileStoreRoot, placement.file_placement_id);
    await writeFile(join(fileDir, "invoice-a"), Buffer.from("original attachment"), { mode: 0o600, flag: "wx" });
    const active = createSqliteStorage(join(f.registry.companyStoreRoot, `${placement.placement_id}.sqlite`));
    await active.query("UPDATE companies SET name='Before restore' WHERE id=$1", [placement.company_id]);
    await active.close();

    const input = { ...f.registry, backupRoot: f.backupRoot, company_id: placement.company_id };
    const backup = await createCompanyPlacementBackup({ ...input, now: () => new Date("2026-10-02T21:10:00.000Z") });
    expect(backup.manifest).toMatchObject({ company_id: "backup-co-a", placement_id: placement.placement_id,
      file_placement_id: placement.file_placement_id, files: { "invoice-a": expect.stringMatching(/^[a-f0-9]{64}$/) } });
    expect(await validateCompanyPlacementBackup({ ...input, bundle_id: backup.bundle_id })).toEqual(backup.manifest);

    const changed = createSqliteStorage(join(f.registry.companyStoreRoot, `${placement.placement_id}.sqlite`));
    await changed.query("UPDATE companies SET name='After backup' WHERE id=$1", [placement.company_id]);
    await changed.close();
    await writeFile(join(fileDir, "later-file"), Buffer.from("not in the snapshot"), { mode: 0o600, flag: "wx" });

    await expect(restoreCompanyPlacementBackup({ ...input, company_id: "backup-co-b", bundle_id: backup.bundle_id }))
      .rejects.toThrow("company-placement-backup-company-mismatch");
    await restoreCompanyPlacementBackup({ ...input, bundle_id: backup.bundle_id });
    const restored = createSqliteStorage(join(f.registry.companyStoreRoot, `${placement.placement_id}.sqlite`));
    expect((await restored.query<{ name: string }>("SELECT name FROM companies WHERE id=$1", [placement.company_id])).rows)
      .toEqual([{ name: "Before restore" }]);
    await restored.close();
    expect(await readFile(join(fileDir, "invoice-a"), "utf8")).toBe("original attachment");
    await expect(readFile(join(fileDir, "later-file"))).rejects.toMatchObject({ code: "ENOENT" });
    const reopened = await createSqliteCompanyPlacementRegistry({ storage: f.storage, storage_role: "GLOBAL_REGISTRY" });
    expect(await reopened.findByCompanyId(placement.company_id)).toMatchObject({ status: "READY", placement_id: placement.placement_id });
  });

  it("rejects corrupted bundle bytes and a snapshot from an obsolete placement revision", async () => {
    const f = await fixture();
    const placement = await provisionSqliteCompanyPlacement({ registry: f.registry, company_id: "backup-co-c", company_name: "Company C" });
    const objectPath = join(f.registry.companyFileStoreRoot, placement.file_placement_id, "attachment-c");
    await writeFile(objectPath, Buffer.from("checksum this"), { mode: 0o600, flag: "wx" });
    const input = { ...f.registry, backupRoot: f.backupRoot, company_id: placement.company_id };
    const backup = await createCompanyPlacementBackup(input);
    const bundlePath = join(f.backupRoot, backup.bundle_id);
    const originalDatabase = await readFile(join(bundlePath, "database.sqlite"));
    const originalFile = await readFile(join(bundlePath, "files", "attachment-c"));
    await writeFile(join(bundlePath, "files", "attachment-c"), Buffer.from("tampered"));
    await expect(validateCompanyPlacementBackup({ ...input, bundle_id: backup.bundle_id }))
      .rejects.toThrow("company-placement-backup-file-checksum-mismatch");
    await writeFile(join(bundlePath, "files", "attachment-c"), originalFile);
    await writeFile(join(bundlePath, "database.sqlite"), Buffer.from("corrupt"));
    await expect(validateCompanyPlacementBackup({ ...input, bundle_id: backup.bundle_id }))
      .rejects.toThrow("company-placement-backup-database-checksum-mismatch");
    await writeFile(join(bundlePath, "database.sqlite"), originalDatabase);
  });

  it("rejects restore for stale placement identity before changing current registry status", async () => {
    const f = await fixture();
    const placement = await provisionSqliteCompanyPlacement({ registry: f.registry, company_id: "backup-co-d", company_name: "Company D" });
    const input = { ...f.registry, backupRoot: f.backupRoot, company_id: placement.company_id };
    const backup = await createCompanyPlacementBackup(input);
    await f.storage.transaction(async tx => {
      await tx.query("UPDATE titan_company_storage_placements SET status='FAILED' WHERE company_id=$1", [placement.company_id]);
      await tx.query("UPDATE titan_company_file_placements SET status='FAILED' WHERE company_id=$1", [placement.company_id]);
    });
    const retry = await provisionSqliteCompanyPlacement({ registry: f.registry, company_id: placement.company_id, company_name: "Company D" });
    expect(retry.placement_revision).toBe(2);
    await expect(restoreCompanyPlacementBackup({ ...input, bundle_id: backup.bundle_id }))
      .rejects.toThrow("company-placement-backup-placement-stale");
    expect((await f.storage.query<{ status: string }>(
      "SELECT status FROM titan_company_storage_placements WHERE company_id=$1", [placement.company_id])).rows)
      .toEqual([{ status: "READY" }]);
  });

  it("drains an already-admitted company transaction before restoring or replacing the DB inode", async () => {
    const f = await fixture();
    const placement = await provisionSqliteCompanyPlacement({ registry: f.registry, company_id: "backup-co-e", company_name: "Company E" });
    const input = { ...f.registry, backupRoot: f.backupRoot, company_id: placement.company_id };
    const backup = await createCompanyPlacementBackup(input);
    const registry = await createSqliteCompanyPlacementRegistry({ storage: f.storage, storage_role: "GLOBAL_REGISTRY" });
    const row = await registry.findByCompanyId(placement.company_id);
    if (!row) throw new Error("expected registered placement");
    const store = await createSqliteCompanyStoreOpener({ companyStoreRoot: f.registry.companyStoreRoot }).open({
      company_id: row.company_id, placement_id: row.placement_id, placement_revision: row.placement_revision,
      provider: "sqlite", schema_version: row.schema_version,
    });
    let enterTransaction!: () => void;
    let releaseTransaction!: () => void;
    const entered = new Promise<void>(resolve => { enterTransaction = resolve; });
    const held = new Promise<void>(resolve => { releaseTransaction = resolve; });
    let transactionFinished = false;
    const transaction = store.client.transaction(async tx => {
      await tx.query("UPDATE companies SET name='Concurrent write' WHERE id=$1", [placement.company_id]);
      enterTransaction();
      await held;
    }).then(() => { transactionFinished = true; });
    await entered;
    let queuedTransactionStarted = false;
    const queuedTransaction = store.client.transaction(async tx => {
      queuedTransactionStarted = true;
      await tx.query("UPDATE companies SET name='Queued write' WHERE id=$1", [placement.company_id]);
    });
    let restoreFinished = false;
    const restoring = restoreCompanyPlacementBackup({ ...input, bundle_id: backup.bundle_id }).then(() => { restoreFinished = true; });
    const maintenanceIntent = join(f.registry.companyStoreRoot,
      `.titan-placement-${placement.placement_id}.operation-lock.maintenance`);
    for (let attempt = 0; attempt < 100; attempt += 1) {
      try { await access(maintenanceIntent); break; }
      catch { await new Promise(resolve => setTimeout(resolve, 5)); }
    }
    await expect(access(maintenanceIntent)).resolves.toBeUndefined();
    expect(restoreFinished).toBe(false);
    expect(transactionFinished).toBe(false);
    releaseTransaction();
    await transaction;
    await restoring;
    await expect(queuedTransaction).rejects.toThrow("company-store-binding-mismatch");
    expect(queuedTransactionStarted).toBe(false);
    expect(transactionFinished).toBe(true);
    expect(restoreFinished).toBe(true);
    await expect(store.assertPlacementBound()).rejects.toThrow("company-store-binding-mismatch");
    await store.client.close();
  });
});
