// Agent 4 Pass 5: combined Agent 1 runtime recovery + Agent 2 independent verification.
import { readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { mkdtemp, rm } from "node:fs/promises";
import { describe, expect, it } from "vitest";

import { createSqliteStorage } from "../src/index.ts";
import { WorkforceService } from "../../../services/workforce/src/index.ts";
import { SqliteWorkforceStore } from "../../../services/workforce/src/sqlite-store.ts";
import { TitanAgentRuntime } from "../../runtime/agent-runtime/index.mjs";
import { SqliteRunStore } from "../../runtime/agent-runtime/sqlite-run-store.mjs";
import { ExecutionGateway, EXECUTION_CLASSES, EXECUTION_STATES } from "../../tools/execution-gateway.mjs";

async function applyCanonicalSchema(storage: ReturnType<typeof createSqliteStorage>) {
  const schema = await readFile(new URL("../../../db/sqlite/001_canonical.sql", import.meta.url), "utf8");
  for (const raw of schema.split(";")) {
    const statement = raw.trim();
    if (!statement || statement.startsWith("PRAGMA")) continue;
    await storage.query(statement);
  }
}

async function seedCleaningCompany(storage: ReturnType<typeof createSqliteStorage>) {
  await storage.query("INSERT INTO companies(id,name) VALUES($1,$2)", ["company-a", "Bright Cleaning"]);
  await storage.query("INSERT INTO companies(id,name) VALUES($1,$2)", ["company-b", "Other Cleaning"]);
  await storage.query("INSERT INTO users(id,company_id,email,full_name,password_hash,role) VALUES($1,$2,$3,$4,$5,$6)", ["owner-a", "company-a", "owner@example.test", "Owner", "test", "owner"]);
  await storage.query("INSERT INTO users(id,company_id,email,full_name,password_hash,role) VALUES($1,$2,$3,$4,$5,$6)", ["emma", "company-a", "emma@example.test", "Emma", "test", "tech"]);
  await storage.query("INSERT INTO users(id,company_id,email,full_name,password_hash,role) VALUES($1,$2,$3,$4,$5,$6)", ["sarah", "company-a", "sarah@example.test", "Sarah", "test", "tech"]);
  await storage.query("INSERT INTO clients(id,company_id,name,email) VALUES($1,$2,$3,$4)", ["client-1", "company-a", "Mrs Smith", "smith@example.test"]);
  await storage.query("INSERT INTO properties(id,company_id,client_id,address) VALUES($1,$2,$3,$4)", ["property-1", "company-a", "client-1", "1 Example Street"]);
  await storage.query("INSERT INTO jobs(id,company_id,client_id,property_id,title,status,scheduled_start,scheduled_end,created_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)", ["job-1", "company-a", "client-1", "property-1", "Tomorrow clean", "scheduled", "2026-09-28T09:00:00+10:00", "2026-09-28T11:00:00+10:00", "owner-a"]);
  await storage.query("INSERT INTO visits(id,company_id,job_id,assigned_user_id,status,scheduled_start,scheduled_end) VALUES($1,$2,$3,$4,$5,$6,$7)", ["visit-1", "company-a", "job-1", "emma", "scheduled", "2026-09-28T09:00:00+10:00", "2026-09-28T11:00:00+10:00"]);
}

describe("Titan final cleaning convergence", () => {
  it("carries 'Emma is sick tomorrow. Sort it out.' through persistent work, governed execution, independent verification and evidence", async () => {
    const directory = await mkdtemp(join(tmpdir(), "titan-final-convergence-"));
    const databasePath = join(directory, "titan.db");
    let storage = createSqliteStorage(databasePath);

    try {
      await applyCanonicalSchema(storage);
      await seedCleaningCompany(storage);

      const workforceStore = new SqliteWorkforceStore(storage);
      await workforceStore.migrate();
      const workforce = new WorkforceService(
        workforceStore,
        undefined,
        { async isSatisfied() { return true; } },
        workforceStore,
      );

      await workforce.registerWorker({ company_id: "company-a", worker_id: "zero-ops", kind: "digital", capabilities: ["work.delegate", "visit.reassign"], active: true });
      await workforce.registerWorker({ company_id: "company-a", worker_id: "emma", kind: "human", manager_id: "zero-ops", capabilities: ["clean.standard"], active: false });
      await workforce.registerWorker({ company_id: "company-a", worker_id: "sarah", kind: "human", manager_id: "zero-ops", capabilities: ["clean.standard"], active: true });

      const work = await workforce.create({
        company_id: "company-a",
        work_id: "work-cover-emma",
        objective: "Emma is sick tomorrow. Sort it out.",
        creator: "owner-a",
        assignee: "zero-ops",
        priority: 100,
        dependencies: [],
        required_capabilities: ["visit.reassign"],
        authority_requirement: "schedule.change",
      });
      expect(work.state).toBe("READY");
      await workforce.claim("company-a", work.work_id, "zero-ops");
      await workforce.start("company-a", work.work_id, "zero-ops");

      const runStore = new SqliteRunStore(storage);
      await runStore.migrate();

      const gateway = new ExecutionGateway({
        providers: [{
          id: "native-schedule",
          company_id: "company-a",
          executionClass: EXECUTION_CLASSES.NATIVE,
          capabilities: ["visit.reassign"],
          async execute(request: any) {
            const candidate = await storage.query<{ id: string }>("SELECT id FROM users WHERE company_id=$1 AND id=$2 AND role='tech'", [request.company_id, request.input.assigned_user_id]);
            if (!candidate.rows[0]) throw new Error("replacement-not-in-company");
            await storage.query("UPDATE visits SET assigned_user_id=$3, updated_at=CURRENT_TIMESTAMP WHERE company_id=$1 AND id=$2", [request.company_id, request.input.visit_id, request.input.assigned_user_id]);
            return { external_ref: request.input.visit_id, acknowledgement: true };
          },
          async verify(_raw: any, request: any) {
            const observed = await storage.query<{ assigned_user_id: string }>("SELECT assigned_user_id FROM visits WHERE company_id=$1 AND id=$2", [request.company_id, request.input.visit_id]);
            return {
              verified: observed.rows[0]?.assigned_user_id === request.input.assigned_user_id,
              observed: { visit_id: request.input.visit_id, assigned_user_id: observed.rows[0]?.assigned_user_id ?? null },
              source: "canonical-visit-reread",
            };
          },
        }],
        evidenceSink: async (evidence: any) => {
          await storage.query(
            "INSERT INTO evidence(id,company_id,subject_type,subject_id,evidence_type,provenance,payload) VALUES($1,$2,$3,$4,$5,$6,$7)",
            [evidence.evidence_id, evidence.company_id, "execution", evidence.execution_id, "verified_outcome", JSON.stringify({ provider: evidence.provider }), JSON.stringify(evidence)],
          );
        },
      });

      let modelTurn = 0;
      const runtime = new TitanAgentRuntime({
        store: runStore,
        contextProvider: {
          load: async ({ company_id, work_id }: any) => {
            const visits = await storage.query("SELECT id,job_id,assigned_user_id,scheduled_start,scheduled_end FROM visits WHERE company_id=$1 AND assigned_user_id=$2", [company_id, "emma"]);
            return { work_id, affected_visits: visits.rows };
          },
        },
        modelRouter: {
          next: async () => modelTurn++ === 0
            ? { tool_calls: [{ id: "cover-emma-visit-1", name: "visit.reassign", arguments: { visit_id: "visit-1", assigned_user_id: "sarah" } }] }
            : { final: "Emma's tomorrow visit is now covered by Sarah." },
        },
        capabilities: {
          resolve: async ({ name }: any) => name === "visit.reassign" ? { name } : null,
        },
        authorityGateway: {
          authorize: async ({ company_id, work_id, capability }: any) => {
            const decisionId = "decision-cover-emma";
            await storage.query(
              "INSERT OR REPLACE INTO decisions(id,company_id,kind,subject_type,subject_id,state,payload,updated_at) VALUES($1,$2,$3,$4,$5,$6,$7,CURRENT_TIMESTAMP)",
              [decisionId, company_id, "execution", "work_item", work_id, "approved", JSON.stringify({ capability })],
            );
            return { status: "allowed", decision_id: decisionId };
          },
          execute: async ({ decision, capability, input, idempotency_key, company_id, work_id, agent_id, run_id }: any) => {
            const capabilityName = capability?.name ?? String(capability);
            const result = await gateway.execute({
              execution_id: `execution:${run_id}:${idempotency_key}`,
              company_id,
              work_id,
              agent_id,
              run_id,
              decision_id: decision.decision_id,
              capability: capabilityName,
              idempotency_key,
              authority: { status: "approved", decision_id: decision.decision_id },
              risk: { status: "approved" },
              input,
            });
            return {
              state: result.state === EXECUTION_STATES.SUCCEEDED ? "VERIFIED" : result.state,
              verified: result.state === EXECUTION_STATES.SUCCEEDED,
              evidence_ref: result.evidence?.evidence_id,
              evidence: result.evidence,
              output: result,
            };
          },
        },
      });

      const run = await runtime.start({
        run_id: "run-cover-emma",
        company_id: "company-a",
        actor_id: "owner-a",
        agent_id: "zero-ops",
        conversation_id: "conversation-cover-emma",
        work_id: work.work_id,
        role: "operations-manager",
        messages: [{ role: "user", content: "Emma is sick tomorrow. Sort it out." }],
      });

      expect(run.state).toBe("COMPLETED");
      const changedVisit = await storage.query<{ assigned_user_id: string }>("SELECT assigned_user_id FROM visits WHERE company_id=$1 AND id=$2", ["company-a", "visit-1"]);
      expect(changedVisit.rows[0]?.assigned_user_id).toBe("sarah");

      const evidence = await storage.query<{ id: string; payload: string }>("SELECT id,payload FROM evidence WHERE company_id=$1 AND subject_type='execution'", ["company-a"]);
      expect(evidence.rows).toHaveLength(1);
      const executionEvidence = JSON.parse(evidence.rows[0].payload);
      expect(executionEvidence.run_id).toBe("run-cover-emma");
      expect(executionEvidence.decision_id).toBe("decision-cover-emma");
      expect(executionEvidence.verification?.verified).toBe(true);
      expect(executionEvidence.verification?.source).toBe("canonical-visit-reread");
      await workforce.complete("company-a", work.work_id, "zero-ops", { replacement: "sarah", visit_id: "visit-1" }, [evidence.rows[0].id]);

      expect(await workforceStore.get("company-b", work.work_id)).toBeUndefined();
      expect(await runStore.get("company-b", "run-cover-emma")).toBeNull();

      await storage.close();
      storage = createSqliteStorage(databasePath);

      const recoveredWorkforce = new SqliteWorkforceStore(storage);
      const recoveredRunStore = new SqliteRunStore(storage);
      const persistedWork = await recoveredWorkforce.get("company-a", work.work_id);
      const persistedRun = await recoveredRunStore.get("company-a", "run-cover-emma");
      const persistedVisit = await storage.query<{ assigned_user_id: string }>("SELECT assigned_user_id FROM visits WHERE company_id=$1 AND id=$2", ["company-a", "visit-1"]);
      const persistedEvidence = await storage.query<{ id: string }>("SELECT id FROM evidence WHERE company_id=$1 AND subject_id LIKE 'execution:%'", ["company-a"]);

      expect(persistedWork?.state).toBe("COMPLETED");
      expect(persistedWork?.evidence_refs).toEqual(evidence.rows.map((row) => row.id));
      expect(persistedRun?.state).toBe("COMPLETED");
      expect(persistedVisit.rows[0]?.assigned_user_id).toBe("sarah");
      expect(persistedEvidence.rows).toHaveLength(1);
      expect((await recoveredRunStore.recoverable("company-a"))).toHaveLength(0);
    } finally {
      await storage.close().catch(() => undefined);
      await rm(directory, { recursive: true, force: true });
    }
  });
});
