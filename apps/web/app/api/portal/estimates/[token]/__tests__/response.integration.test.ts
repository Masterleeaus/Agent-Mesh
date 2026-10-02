/** PostgreSQL compatibility transaction test; uses only a disposable test schema. */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { appendAuditLog } from "@/lib/db/audit";
import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
const state = vi.hoisted(() => ({ pool: null as Pool | null }));
vi.mock("@/lib/db", () => ({
  getPool: () => state.pool!, getDatabaseDialect: () => "postgres", query: vi.fn(), queryOne: vi.fn(),
}));
vi.mock("@/lib/estimates/create-job-db", () => ({ getAccountOwnerUserId: async () => null, createJobFromEstimate: vi.fn() }));
vi.mock("@/lib/estimates/approve", () => ({ createApprovalArtifacts: vi.fn() }));
import { POST } from "../route";

const schema = `test_estimate_response_${randomUUID().replaceAll("-", "")}`;
let admin: Pool;
const request = () => new NextRequest("http://localhost/api/portal/estimates/token-a", { method: "POST", body: JSON.stringify({ action: "approve", name: "Customer", company_id: "company-b" }) });
const context = { params: Promise.resolve({ token: "token-a" }) };
beforeAll(async () => {
  const url = process.env.TEST_DATABASE_URL;
  if (!url) throw new Error("Use a disposable PostgreSQL TEST_DATABASE_URL");
  admin = new Pool({ connectionString: url });
  await admin.query(`CREATE SCHEMA ${schema}`);
  state.pool = new Pool({ connectionString: url, options: `-c search_path=${schema}`, max: 4 });
  // Test-only estimate fixture; audit schema below is read from committed migrations.
  await state.pool.query(`CREATE TABLE estimates (
    id text PRIMARY KEY, account_id text NOT NULL, share_token text UNIQUE NOT NULL,
    status text NOT NULL, client_approved_name text, client_signature_svg text,
    responded_at timestamptz, updated_at timestamptz
  )`);
  await state.pool.query("CREATE TABLE accounts (id uuid PRIMARY KEY)");
  const migration = readFileSync(resolve(process.cwd(), "../../db/migrations/001_core_schema.sql"), "utf8");
  const auditTable = migration.match(/create table if not exists audit_log \([\s\S]*?\n\);/)?.[0];
  if (!auditTable) throw new Error("Committed audit schema was not found");
  await state.pool.query(auditTable);
  await state.pool.query(readFileSync(resolve(process.cwd(), "../../db/migrations/005_audit_log_trace_id.sql"), "utf8"));
});
beforeEach(async () => {
  await state.pool!.query("TRUNCATE estimates, audit_log");
  await state.pool!.query("INSERT INTO estimates (id, account_id, share_token, status) VALUES ('estimate-a', 'company-a', 'token-a', 'sent'), ('estimate-b', 'company-b', 'token-b', 'sent')");
});
afterAll(async () => {
  await state.pool?.end();
  if (admin) {
    await admin.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
    await admin.end();
  }
});
describe("public estimate PostgreSQL compatibility transaction", () => {
  it("serializes simultaneous acceptance to one mutation without crossing company boundaries", async () => {
    const responses = await Promise.all([POST(request(), context), POST(request(), context)]);
    expect(responses.map(response => response.status).sort()).toEqual([200, 422]);
    expect((await state.pool!.query("SELECT id, account_id, status FROM estimates ORDER BY id")).rows).toEqual([
      { id: "estimate-a", account_id: "company-a", status: "approved" },
      { id: "estimate-b", account_id: "company-b", status: "sent" },
    ]);

  });
  it("confirms the committed audit schema rejects anonymous actors pending an approved migration", async () => {
    const companyId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
    await state.pool!.query("INSERT INTO accounts (id) VALUES ($1)", [companyId]);
    const client = await state.pool!.connect();
    try {
      await expect(appendAuditLog(client, {
        account_id: companyId, entity_type: "estimate", entity_id: randomUUID(),
        action: "update", actor_id: null, old_value: { status: "sent" }, new_value: { status: "approved", via: "portal" },
      })).rejects.toMatchObject({ code: "23502", column: "actor_id" });
    } finally { client.release(); }
  });
});
