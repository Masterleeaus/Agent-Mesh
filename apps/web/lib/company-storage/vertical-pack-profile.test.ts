import { afterEach, describe, expect, it } from "vitest";
import { chmod, mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { DatabaseSync } from "node:sqlite";
import cleaningBundle from "../../../../packages/modules/bundles/cleaning-workforce.bundle.json";
import {
  createCompanyStorageResolver,
  type CompanyPlacementRecord,
  type StorageClient,
  type VerifiedCompanyScope,
} from "../../../../packages/storage/src/index";
import { companyNativeWorkOrdersManifest } from "../../../../packages/storage/src/company-native-schema-manifest";
import { initializeFreshCompanyNativeStore } from "../../../../packages/storage/src/company-native-store-initializer";
import { ensureCleaningFirstRunProfile, readCurrentCompanyVerticalProfile } from "./cleaning-profile-entry";
import { createCompanyVerticalPackProfileAuthority, createVerticalPackFromBundle } from "../../../../packages/titan-platform/src/vertical-pack";

const roots: string[] = [];

function sqliteStorage(path: string): StorageClient {
  const db = new DatabaseSync(path);
  db.exec("PRAGMA foreign_keys=ON");
  const direct = async <T>(sql: string, params: readonly unknown[] = []) => {
    const ordered: unknown[] = [];
    const text = sql.replace(/\$(\d+)/g, (_match, rawIndex: string) => {
      const index = Number(rawIndex) - 1;
      if (index < 0 || index >= params.length) throw new Error(`sqlite parameter $${rawIndex} is not bound`);
      ordered.push(params[index]);
      return "?";
    });
    const statement = db.prepare(text);
    if (statement.columns().length > 0) {
      const rows = statement.all(...ordered) as T[];
      return { rows, rowCount: rows.length };
    }
    const result = statement.run(...ordered);
    return { rows: [], rowCount: Number(result.changes) };
  };
  const client: StorageClient = {
    dialect: "sqlite",
    query: (sql, params = []) => direct(sql, params),
    async transaction<T>(fn: (tx: StorageClient) => Promise<T>) {
      db.exec("BEGIN IMMEDIATE");
      const tx: StorageClient = { dialect: "sqlite", query: (sql, params = []) => direct(sql, params), transaction: async () => { throw new Error("nested transaction unsupported"); }, close: async () => { throw new Error("transaction does not own database"); } };
      try { const result = await fn(tx); db.exec("COMMIT"); return result; }
      catch (error) { db.exec("ROLLBACK"); throw error; }
    },
    async close() { db.close(); },
  };
  return client;
}

function session(company_id: string): VerifiedCompanyScope {
  return { kind: "authenticated", current: {
    company_id, actor_id: `actor-${company_id}`, session_id: `session-${company_id}`,
    session_revision: 1, context_revision: "membership-1", audience: "titan-web",
    expires_at: "2099-01-01T00:00:00.000Z", authority_neutral: true,
  } };
}

async function fixture(companyIds: string[]) {
  const root = await mkdtemp(join(tmpdir(), "titan-vertical-pack-profile-"));
  await chmod(root, 0o700);
  roots.push(root);
  const placements = new Map<string, CompanyPlacementRecord>();
  const paths = new Map<string, string>();
  for (const company_id of companyIds) {
    const placement: CompanyPlacementRecord = {
      company_id, placement_id: `placement-${company_id}`, placement_revision: 1,
      provider: "sqlite", schema_version: companyNativeWorkOrdersManifest.schema_version, status: "READY",
    };
    const path = join(root, `${placement.placement_id}.sqlite`);
    const storage = sqliteStorage(path);
    await initializeFreshCompanyNativeStore({ storage, placement, company_profile: { name: company_id } });
    await storage.close();
    placements.set(company_id, placement);
    paths.set(placement.placement_id, path);
  }
  const resolver = createCompanyStorageResolver({
    registry: { findByCompanyId: async company_id => placements.get(company_id) ?? null },
    opener: { async open(placement) {
      const path = paths.get(placement.placement_id);
      if (!path) throw new Error("test-placement-not-found");
      const client = sqliteStorage(path);
      return {
        ...placement, client,
        assertPlacementBound: async () => {
          const main = (await client.query<{ file: string }>("PRAGMA database_list")).rows.find(row => row.file);
          if (main?.file !== path) throw new Error("test-placement-binding-mismatch");
        },
      };
    } },
    scopeRevalidator: { assertCurrent: async () => undefined },
  });
  return {
    async withStorage<T>(company_id: string, operation: (scope: VerifiedCompanyScope, storage: StorageClient, assertCurrent: () => Promise<void>) => Promise<T>, storeCompanyId = company_id) {
      const scope = session(company_id);
      const placement = await resolver.resolve(session(storeCompanyId));
      const company_store = await resolver.open(placement);
      try {
        await company_store.assertCurrent();
        const result = await operation(scope, company_store.client, () => company_store.assertCurrent());
        await company_store.assertCurrent();
        return result;
      } finally { await company_store.close(); }
    },
    async withAuthority<T>(company_id: string, operation: (authority: ReturnType<typeof createCompanyVerticalPackProfileAuthority>) => Promise<T>, authorizeMutation?: (scope: VerifiedCompanyScope) => Promise<void>, resolveAvailableProfile?: (profile: { pack_id: string; pack_version: string; module_id: string; module_version: string }) => Promise<boolean>, storeCompanyId = company_id) {
      return this.withStorage(company_id, (scope, storage, assertCurrent) => operation(createCompanyVerticalPackProfileAuthority({ scope, storage, assertCurrent, authorizeMutation, resolveAvailableProfile })), storeCompanyId);
    },
    async seedSettings(company_id: string, settings: Record<string, unknown>) {
      const storage = sqliteStorage(paths.get(`placement-${company_id}`)!);
      try { await storage.query("UPDATE companies SET settings=$1 WHERE id=$2", [JSON.stringify(settings), company_id]); }
      finally { await storage.close(); }
    },
    async readSettings(company_id: string) {
      const storage = sqliteStorage(paths.get(`placement-${company_id}`)!);
      try { return (await storage.query<{ settings: string }>("SELECT settings FROM companies WHERE id=$1", [company_id])).rows[0]?.settings; }
      finally { await storage.close(); }
    },
  };
}

afterEach(async () => {
  await Promise.all(roots.splice(0).map(root => rm(root, { recursive: true, force: true })));
});

const cleaningPack = (company_id: string) => createVerticalPackFromBundle(cleaningBundle, company_id, "titan.workforce.cleaning");

describe("persisted company vertical-pack profile", () => {
  it("selects and persists the canonical Cleaning default for a new company, then retains it after reload", async () => {
    const f = await fixture(["profile-new"]);
    const pack = cleaningPack("profile-new");
    const first = await f.withStorage("profile-new", (scope, storage, assertCurrent) => ensureCleaningFirstRunProfile({ scope, storage, assertCurrent }));
    expect(first).toMatchObject({ status: "selected", profile: { pack_id: "titan.cleaning-workforce-pack", module_id: "titan.workforce.cleaning" }, revision: 1 });
    expect(JSON.parse((await f.readSettings("profile-new"))!)).toMatchObject({ vertical_profile: { company_id: "profile-new", profile: first.profile } });

    const reloaded = await f.withAuthority("profile-new", authority => authority.ensureDefault(pack));
    expect(reloaded).toMatchObject({ status: "retained", profile: first.profile, revision: 1 });
    expect(await f.withStorage("profile-new", (scope, storage, assertCurrent) => readCurrentCompanyVerticalProfile({ scope, storage, assertCurrent })))
      .toMatchObject({ company_id: "profile-new", revision: 1, profile: first.profile });
  });

  it("retains an existing selected non-cleaning profile and permits an explicitly authorized profile switch", async () => {
    const f = await fixture(["profile-existing"]);
    const profile = { pack_id: "existing-profile-pack", pack_version: "2.1.0", module_id: "existing.vertical", module_version: "2.1.0" };
    await f.seedSettings("profile-existing", { retained_setting: "keep", vertical_profile: { schema: "titan.company.vertical-profile.v1", company_id: "profile-existing", revision: 1, profile } });
    const authorization = async (scope: VerifiedCompanyScope) => { expect(scope.kind === "authenticated" && scope.current.company_id === "profile-existing").toBe(true); };
    const availability = async (candidate: typeof profile) => candidate.pack_id === profile.pack_id && candidate.module_id === profile.module_id;

    await expect(f.withAuthority("profile-existing", authority => authority.ensureDefault(cleaningPack("profile-existing"))))
      .resolves.toMatchObject({ status: "retained", profile });
    await expect(f.withAuthority("profile-existing", authority => authority.select(profile, 1), authorization))
      .rejects.toThrow("vertical-pack-profile-availability-resolver-required");
    const nextProfile = { pack_id: "next-profile-pack", pack_version: "1.0.0", module_id: "next.vertical", module_version: "1.0.0" };
    const resolveAvailable = async (candidate: typeof profile) => candidate.pack_id === nextProfile.pack_id && candidate.module_id === nextProfile.module_id;
    await f.withAuthority("profile-existing", authority => authority.select(nextProfile, 1), authorization, resolveAvailable);
    await expect(f.withAuthority("profile-existing", authority => authority.select(profile, 1), authorization, availability))
      .rejects.toThrow("vertical-pack-profile-revision-mismatch");
    const persisted = JSON.parse((await f.readSettings("profile-existing"))!);
    expect(persisted.retained_setting).toBe("keep");
    expect(persisted.vertical_profile.profile).toEqual(nextProfile);
  });

  it("isolates first-run profile writes by company when the selected placement changes", async () => {
    const f = await fixture(["profile-a", "profile-b"]);
    for (const company_id of ["profile-a", "profile-b"]) {
      await f.withAuthority(company_id, authority => authority.ensureDefault(cleaningPack(company_id)));
    }
    const a = await f.withAuthority("profile-a", authority => authority.read());
    const b = await f.withAuthority("profile-b", authority => authority.read());
    expect(a).toMatchObject({ company_id: "profile-a", revision: 1, profile: { module_id: "titan.workforce.cleaning" } });
    expect(b).toMatchObject({ company_id: "profile-b", revision: 1, profile: { module_id: "titan.workforce.cleaning" } });
    await expect(f.withAuthority("profile-a", authority => authority.ensureDefault(cleaningPack("profile-b"))))
      .rejects.toThrow("vertical-pack-company-context-mismatch");
    await expect(f.withAuthority("profile-a", authority => authority.read(), undefined, undefined, "profile-b"))
      .rejects.toThrow("vertical-pack-company-profile-not-found");
  });

  it("does not replace stale or malformed saved profiles and reports an unavailable Cleaning pack without writing", async () => {
    const f = await fixture(["profile-stale", "profile-invalid", "profile-unavailable"]);
    const oldProfile = { pack_id: "titan.cleaning-workforce-pack", pack_version: "0.9.0", module_id: "titan.workforce.cleaning", module_version: "1.0.0" };
    await f.seedSettings("profile-stale", { vertical_profile: { schema: "titan.company.vertical-profile.v1", company_id: "profile-stale", revision: 2, profile: oldProfile } });
    await expect(f.withAuthority("profile-stale", authority => authority.ensureDefault(cleaningPack("profile-stale"))))
      .resolves.toMatchObject({ status: "stale", profile: oldProfile, revision: 2 });

    await f.seedSettings("profile-invalid", { vertical_profile: { schema: "titan.company.vertical-profile.v1", company_id: "profile-invalid", revision: 0, profile: {} } });
    await expect(f.withAuthority("profile-invalid", authority => authority.ensureDefault(cleaningPack("profile-invalid"))))
      .rejects.toThrow("profile.pack_id is required");
    const before = await f.readSettings("profile-unavailable");
    await expect(f.withAuthority("profile-unavailable", authority => authority.ensureDefault(null)))
      .resolves.toMatchObject({ status: "unavailable", profile: null, revision: 0 });
    expect(await f.readSettings("profile-unavailable")).toBe(before);
  });

  it("fails closed without a verified authenticated company scope or mutation authorizer", async () => {
    const f = await fixture(["profile-auth"]);
    const pack = cleaningPack("profile-auth");
    await expect(f.withAuthority("profile-auth", authority => authority.select({ pack_id: pack.pack_id, pack_version: pack.version, module_id: "titan.workforce.cleaning", module_version: "1.0.0" }, 0)))
      .rejects.toThrow("vertical-pack-profile-mutation-authorization-required");
    expect(() => createCompanyVerticalPackProfileAuthority({
      scope: { kind: "public-capability", capability: { company_id: "profile-auth" } } as any,
      storage: { dialect: "sqlite" } as any,
    })).toThrow("vertical-pack-authenticated-session-required");
    expect(() => createVerticalPackFromBundle({ ...cleaningBundle, modules: [] }, "profile-auth", "titan.workforce.cleaning"))
      .toThrow("vertical-pack-profile-module-unavailable");
  });
});
