/** PostgreSQL compatibility transaction test; uses only a disposable test schema. */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { randomUUID } from "node:crypto";
import { appendAuditLog } from "@/lib/db/audit";
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
const companyA = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const companyB = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const historicalActor = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const historicalEstimate = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
const estimateA = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";
const estimateB = "ffffffff-ffff-4fff-8fff-ffffffffffff";
let admin: Pool;
let preservedHistoricalAudit: Record<string, unknown> | null = null;
const request = () => new NextRequest("http://localhost/api/portal/estimates/token-a", { method: "POST", body: JSON.stringify({ action: "approve", name: "Customer", signature_svg: "private-signature", company_id: companyB }) });
const context = { params: Promise.resolve({ token: "token-a" }) };

beforeAll(async () => {
  const url = process.env.TEST_DATABASE_URL;
  if (!url) throw new Error("Use a disposable PostgreSQL TEST_DATABASE_URL");
  admin = new Pool({ connectionString: url });
  await admin.query(`CREATE SCHEMA ${schema}`);
  state.pool = new Pool({ connectionString: url, options: `-c search_path=${schema}`, max: 4 });
  await state.pool.query("CREATE TABLE accounts (id uuid PRIMARY KEY)");
  await state.pool.query("INSERT INTO accounts (id) VALUES ($1), ($2)", [companyA, companyB]);
  await state.pool.query(`CREATE TABLE estimates (
    id uuid PRIMARY KEY, account_id uuid NOT NULL, share_token text UNIQUE NOT NULL,
    status text NOT NULL, client_approved_name text, client_signature_svg text,
    responded_at timestamptz, updated_at timestamptz
  )`);

  // Load the committed audit definition and existing trace migration rather
  // than a permissive hand-written approximation of the production schema.
  const coreSchema = readFileSync(resolve(process.cwd(), "../../db/migrations/001_core_schema.sql"), "utf8");
  const auditTable = coreSchema.match(/create table if not exists audit_log \([\s\S]*?\n\);/)?.[0];
  if (!auditTable) throw new Error("Committed audit schema was not found");
  await state.pool.query(auditTable);
  await state.pool.query(readFileSync(resolve(process.cwd(), "../../db/migrations/005_audit_log_trace_id.sql"), "utf8"));
  await state.pool.query(
    `INSERT INTO audit_log (account_id, entity_type, entity_id, action, actor_id, old_value, new_value)
     VALUES ($1, 'estimate', $2, 'update', $3, '{"status":"draft"}', '{"status":"sent"}')`,
    [companyA, historicalEstimate, historicalActor],
  );
  await state.pool.query(readFileSync(resolve(process.cwd(), "../../db/migrations/189_audit_log_nullable_actor.sql"), "utf8"));
  preservedHistoricalAudit = (await state.pool.query(
    "SELECT account_id, entity_type, entity_id, actor_id, old_value, new_value FROM audit_log WHERE entity_id = $1",
    [historicalEstimate],
  )).rows[0] ?? null;
});

beforeEach(async () => {
  await state.pool!.query("TRUNCATE estimates, audit_log");
  await state.pool!.query("INSERT INTO estimates (id, account_id, share_token, status) VALUES ($1, $2, 'token-a', 'sent'), ($3, $4, 'token-b', 'sent')", [estimateA, companyA, estimateB, companyB]);
});

afterAll(async () => {
  await state.pool?.end();
  if (admin) {
    await admin.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
    await admin.end();
  }
});

describe("public estimate PostgreSQL compatibility transaction", () => {
  it("preserves existing actors and audit values when actor_id becomes nullable", () => {
    expect(preservedHistoricalAudit).toEqual({
      account_id: companyA,
      entity_type: "estimate",
      entity_id: historicalEstimate,
      actor_id: historicalActor,
      old_value: { status: "draft" },
      new_value: { status: "sent" },
    });
  });

  it("serializes simultaneous acceptance to one mutation and one honest public audit without crossing companies", async () => {
    const responses = await Promise.all([POST(request(), context), POST(request(), context)]);
    expect(responses.map(response => response.status).sort()).toEqual([200, 422]);
    expect((await state.pool!.query("SELECT id, account_id, status FROM estimates ORDER BY id")).rows).toEqual([
      { id: estimateA, account_id: companyA, status: "approved" },
      { id: estimateB, account_id: companyB, status: "sent" },
    ]);
    const audit = await state.pool!.query(
      "SELECT account_id, entity_type, entity_id, action, actor_id, old_value, new_value FROM audit_log",
    );
    expect(audit.rows).toEqual([{
      account_id: companyA,
      entity_type: "estimate",
      entity_id: estimateA,
      action: "update",
      actor_id: null,
      old_value: { status: "sent" },
      new_value: { status: "approved", via: "portal" },
    }]);
    expect(JSON.stringify(audit.rows)).not.toContain("token-a");
    expect(JSON.stringify(audit.rows)).not.toContain("private-signature");
  });

  it("rolls back the status transition when audit insertion fails", async () => {
    await state.pool!.query(`
      CREATE FUNCTION ${schema}.reject_audit_insert() RETURNS trigger AS $$
      BEGIN RAISE EXCEPTION 'test audit rejection' USING ERRCODE = 'P0001'; END;
      $$ LANGUAGE plpgsql
    `);
    await state.pool!.query(`
      CREATE TRIGGER reject_test_audit BEFORE INSERT ON audit_log
      FOR EACH ROW EXECUTE FUNCTION ${schema}.reject_audit_insert()
    `);
    try {
      await expect(POST(request(), context)).rejects.toThrow("test audit rejection");
      expect((await state.pool!.query("SELECT status FROM estimates WHERE id = $1", [estimateA])).rows).toEqual([{ status: "sent" }]);
      expect((await state.pool!.query("SELECT count(*)::int AS count FROM audit_log")).rows[0].count).toBe(0);
    } finally {
      await state.pool!.query("DROP TRIGGER IF EXISTS reject_test_audit ON audit_log");
      await state.pool!.query(`DROP FUNCTION IF EXISTS ${schema}.reject_audit_insert()`);
    }
  });

  it("keeps the audit row tied to an existing company", async () => {
    await expect(state.pool!.query(
      `INSERT INTO audit_log (account_id, entity_type, entity_id, action, actor_id)
       VALUES ($1, 'estimate', $2, 'update', NULL)`,
      ["99999999-9999-4999-8999-999999999999", estimateA],
    )).rejects.toMatchObject({ code: "23503", constraint: "audit_log_account_id_fkey" });
  });
});
