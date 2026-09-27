import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createSqliteStorage } from "../../../packages/storage/src/index.js";
import { WorkforceService } from "./index.js";
import { SqliteWorkforceStore } from "./sqlite-store.js";

test("SQLite workforce survives restart with dependencies, worker identity and expired leases", async () => {
  const directory = mkdtempSync(join(tmpdir(), "titan-workforce-"));
  const filename = join(directory, "workforce.sqlite");
  try {
    const firstDb = createSqliteStorage(filename);
    const firstStore = new SqliteWorkforceStore(firstDb);
    await firstStore.migrate();
    const first = new WorkforceService(firstStore, undefined, undefined, firstStore);
    await first.registerWorker({ company_id: "c1", worker_id: "agent", kind: "digital", capabilities: ["work"], active: true });
    const base = (work_id: string, dependencies: string[] = []) => ({ company_id: "c1", work_id, objective: work_id,
      creator: "owner", priority: 1, dependencies, required_capabilities: ["work"], assignee: "agent" });
    await first.create({ ...base("parent"), context_refs: ["context:1"], evidence_refs: ["evidence:1"] });
    await first.create(base("child", ["parent"]));
    await first.claim("c1", "parent", "agent", -1);
    await firstDb.close();

    const secondDb = createSqliteStorage(filename);
    const secondStore = new SqliteWorkforceStore(secondDb);
    const second = new WorkforceService(secondStore, undefined, undefined, secondStore);
    assert.equal((await secondStore.getWorker("c1", "agent"))?.kind, "digital");
    assert.equal(await secondStore.getWorker("c2", "agent"), undefined);
    assert.equal((await secondStore.get("c1", "child"))?.dependencies[0], "parent");
    assert.equal((await secondStore.get("c1", "parent"))?.context_refs[0], "context:1");
    assert.equal((await secondStore.get("c1", "parent"))?.evidence_refs[0], "evidence:1");
    assert.equal(await secondStore.get("c2", "parent"), undefined);
    assert.deepEqual((await second.recoverExpiredLeases("c1")).map(item => item.work_id), ["parent"]);
    assert.equal((await secondStore.get("c1", "parent"))?.state, "READY");
    assert.equal((await secondStore.get("c1", "child"))?.state, "BLOCKED");
    await secondDb.close();
  } finally { rmSync(directory, { recursive: true, force: true }); }
});
