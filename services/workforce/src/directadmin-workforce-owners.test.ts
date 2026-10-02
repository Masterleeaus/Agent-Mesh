import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createSqliteStorage } from "../../../packages/storage/src/index.js";
import { SqliteWorkforceStore } from "./sqlite-store.js";
import { createDirectAdminWorkforceOwners, DirectAdminWorkforceActionDenied, type DirectAdminBridgeContext } from "./directadmin-workforce-owners.js";
// @ts-expect-error Canonical run storage owner is JavaScript.
import { SqliteRunStore } from "../../../packages/runtime/agent-runtime/sqlite-run-store.mjs";

const now = "2026-10-02T00:00:00.000Z";
const context: DirectAdminBridgeContext = Object.freeze({
  actor_id: "manager-a", company_id: "company-a", context_revision: "session-revision-a", authority: "not-carried",
});

function work(company_id: string, work_id: string, evidence_refs: string[]) {
  return {
    company_id, work_id, objective: `Objective ${work_id}`, creator: "manager-a", priority: 1,
    state: "IN_PROGRESS" as const, dependencies: [], required_capabilities: [],
    context_refs: [`context-${work_id}`], evidence_refs, created_at: now, updated_at: now,
  };
}

test("DirectAdmin projection reads canonical company-filtered workers, work, runs and evidence references", async () => {
  const dir = mkdtempSync(join(tmpdir(), "titan-directadmin-workforce-"));
  const storage = createSqliteStorage(join(dir, "workforce.db"));
  try {
    const workforce = new SqliteWorkforceStore(storage);
    const runs = new SqliteRunStore(storage);
    await workforce.migrate(); await runs.migrate();
    await workforce.putWorker({ company_id: "company-a", worker_id: "worker-a", kind: "digital", active: true, capabilities: ["crm.work_order.complete"] });
    await workforce.putWorker({ company_id: "company-b", worker_id: "worker-b", kind: "human", active: true, capabilities: ["work.delegate"] });
    await workforce.put({ ...work("company-a", "work-a", ["evidence-ref-a"]), assignee: "worker-a" });
    await workforce.put(work("company-b", "work-b", ["evidence-ref-b"]));
    await runs.create({ company_id: "company-a", run_id: "run-a", state: "COMPLETED", conversation_id: "conversation-a", agent_id: "worker-a", work_id: "work-a", updated_at: now });
    await runs.create({ company_id: "company-b", run_id: "run-b", state: "COMPLETED", conversation_id: "conversation-b", agent_id: "worker-b", work_id: "work-b", updated_at: now });

    const projection = await createDirectAdminWorkforceOwners({ workforceStore: workforce, runStore: runs }).projection("titan_workforce", context);
    const data = projection.data as any;
    assert.equal(projection.company_id, "company-a");
    assert.equal(data.company_id, "company-a");
    assert.equal(data.schema, "titan.workforce-cockpit.v1");
    assert.deepEqual(data.discovery.company_id, "company-a");
    assert.deepEqual(data.discovery.workers.map((worker: any) => worker.worker_id), ["worker-a"]);
    assert.deepEqual(data.discovery.controls, []);
    assert.deepEqual(data.status.company_id, "company-a");
    assert.deepEqual(data.status.work, [{ company_id: "company-a", work_id: "work-a", state: "IN_PROGRESS",
      context_refs: ["context-work-a"], evidence_refs: ["evidence-ref-a"], assignee: "worker-a", run_id: "run-a" }]);
    assert.deepEqual(projection.evidence_refs, ["evidence-ref-a"]);
    assert.equal(JSON.stringify(projection).includes("company-b"), false);
    assert.ok(projection.freshness && Number.isFinite(Date.parse(projection.freshness)));
  } finally { await storage.close(); rmSync(dir, { recursive: true, force: true }); }
});

test("DirectAdmin lifecycle proposals are denied without writes, events, receipts or stale-session acceptance", async () => {
  const dir = mkdtempSync(join(tmpdir(), "titan-directadmin-denial-"));
  const storage = createSqliteStorage(join(dir, "workforce.db"));
  try {
    const workforce = new SqliteWorkforceStore(storage);
    const runs = new SqliteRunStore(storage);
    await workforce.migrate(); await runs.migrate();
    await workforce.put(work("company-a", "work-a", []));
    const owners = createDirectAdminWorkforceOwners({ workforceStore: workforce, runStore: runs });
    const before = await workforce.get("company-a", "work-a");
    const beforeEvents = await storage.query("SELECT event_seq FROM workforce_events");
    for (const action of ["pause", "resume", "cancel", "reassign", "escalate", "revoke"]) {
      await assert.rejects(() => owners.requestIntent("titan_workforce", {
        company_id: "company-a", actor_id: "manager-a", capability_id: `titan.workforce.${action}`,
        operation_id: `operation-${action}`, correlation_id: `correlation-${action}`,
        input: { action, work_id: "work-a", reason: "bounded test denial" },
      }, context, async () => context), (error: unknown) => error instanceof DirectAdminWorkforceActionDenied && error.code === "directadmin-workforce-action-unsupported" && error.status === 403);
    }
    await assert.rejects(() => owners.requestIntent("titan_workforce", {
      company_id: "company-a", actor_id: "manager-a", capability_id: "titan.workforce.delete",
      operation_id: "operation-unknown", correlation_id: "correlation-unknown",
      input: { action: "delete", work_id: "work-a", reason: "must reject" },
    }, context, async () => context), /directadmin-workforce-intent-invalid/);
    await assert.rejects(() => owners.requestIntent("titan_workforce", {
      company_id: "company-a", actor_id: "manager-a", capability_id: "titan.workforce.cancel",
      operation_id: "operation-switch", correlation_id: "correlation-switch",
      input: { action: "cancel", work_id: "work-a", reason: "session changed" },
    }, context, async () => ({ ...context, company_id: "company-b" })), /directadmin-workforce-context-changed/);
    assert.deepEqual(await workforce.get("company-a", "work-a"), before);
    assert.equal((await storage.query("SELECT event_seq FROM workforce_events")).rowCount, beforeEvents.rowCount);
    assert.equal((await workforce.list("company-b")).length, 0);
  } finally { await storage.close(); rmSync(dir, { recursive: true, force: true }); }
});
