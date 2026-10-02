import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { Pool } from "pg";
import { SignJWT } from "jose";
import { NextRequest } from "next/server";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const harness = vi.hoisted(() => ({
  pool: null as Pool | null,
  secret: "test-only-email-response-key-not-a-production-credential",
}));

vi.mock("@/lib/db", () => ({
  getPool: () => harness.pool!,
  getDatabaseDialect: () => "postgres",
}));
vi.mock("@/lib/env", () => ({ getEnv: () => ({ AUTH_SECRET: harness.secret }) }));
vi.mock("@/lib/logger", () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));
vi.mock("@/lib/attention", () => ({ emitAttentionEvent: vi.fn().mockResolvedValue(undefined) }));
vi.mock("@/lib/estimates/create-job-db", () => ({
  getAccountOwnerUserId: vi.fn().mockResolvedValue(null),
  createJobFromEstimate: vi.fn(),
}));
vi.mock("@/lib/estimates/approve", () => ({ createApprovalArtifacts: vi.fn() }));
vi.mock("@/lib/booking-requests/advance-stage", () => ({
  advanceBookingRequestForEstimate: vi.fn().mockResolvedValue(undefined),
}));

import { emitAttentionEvent } from "@/lib/attention";
import { POST } from "../route";

const schema = `test_email_response_${randomUUID().replaceAll("-", "")}`;
const accountId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const estimateId = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";
let admin: Pool;

function request(token: string): NextRequest {
  return new NextRequest(`http://localhost/api/v1/estimates/${estimateId}/respond`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ action: "approve", token }),
  });
}

async function signedApprovalToken(): Promise<string> {
  return new SignJWT({ estimateId, action: "approve" })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt()
    .setExpirationTime("5m")
    .sign(new TextEncoder().encode(harness.secret));
}

async function rejectInserts(table: "audit_log" | "workflow_events"): Promise<void> {
  const functionName = `reject_${table}_insert`;
  const triggerName = `reject_${table}_insert_trigger`;
  await harness.pool!.query(`
    CREATE FUNCTION ${schema}.${functionName}() RETURNS trigger AS $$
    BEGIN RAISE EXCEPTION 'test ${table} rejection' USING ERRCODE = 'P0001'; END;
    $$ LANGUAGE plpgsql
  `);
  await harness.pool!.query(`
    CREATE TRIGGER ${triggerName} BEFORE INSERT ON ${table}
    FOR EACH ROW EXECUTE FUNCTION ${schema}.${functionName}()
  `);
}

async function allowInserts(table: "audit_log" | "workflow_events"): Promise<void> {
  await harness.pool!.query(`DROP TRIGGER IF EXISTS reject_${table}_insert_trigger ON ${table}`);
  await harness.pool!.query(`DROP FUNCTION IF EXISTS ${schema}.reject_${table}_insert()`);
}

async function assertCounts(expected: { status: string; audit: number; events: number }): Promise<void> {
  const estimate = await admin.query<{ status: string }>(
    `SELECT status FROM ${schema}.estimates WHERE id = $1`,
    [estimateId],
  );
  const audit = await admin.query<{ count: number }>(
    `SELECT count(*)::int AS count FROM ${schema}.audit_log WHERE entity_id = $1`,
    [estimateId],
  );
  const events = await admin.query<{ count: number }>(
    `SELECT count(*)::int AS count FROM ${schema}.workflow_events WHERE entity_id = $1`,
    [estimateId],
  );
  expect(estimate.rows).toEqual([{ status: expected.status }]);
  expect(audit.rows[0]?.count).toBe(expected.audit);
  expect(events.rows[0]?.count).toBe(expected.events);
}

async function assertAcceptedEvidence(): Promise<void> {
  const audit = await admin.query<{
    actor_id: string | null;
    old_value: Record<string, unknown>;
    new_value: Record<string, unknown>;
  }>(
    `SELECT actor_id, old_value, new_value FROM ${schema}.audit_log WHERE entity_id = $1`,
    [estimateId],
  );
  const events = await admin.query<{ account_id: string; event_type: string }>(
    `SELECT account_id, event_type FROM ${schema}.workflow_events WHERE entity_id = $1`,
    [estimateId],
  );
  expect(audit.rows).toHaveLength(1);
  expect(audit.rows[0]).toMatchObject({
    actor_id: null,
    old_value: { status: "sent" },
    new_value: { status: "approved", via: "email_link" },
  });
  expect(events.rows).toEqual([{ account_id: accountId, event_type: "estimate.approved" }]);
}

beforeAll(async () => {
  const url = process.env.TEST_DATABASE_URL;
  if (!url) throw new Error("Use a disposable PostgreSQL TEST_DATABASE_URL");

  admin = new Pool({ connectionString: url });
  await admin.query(`CREATE SCHEMA ${schema}`);
  harness.pool = new Pool({ connectionString: url, options: `-c search_path=${schema}`, max: 4 });
  await harness.pool.query("CREATE TABLE accounts (id uuid PRIMARY KEY)");
  await harness.pool.query("INSERT INTO accounts (id) VALUES ($1)", [accountId]);
  await harness.pool.query(`CREATE TABLE estimates (
    id uuid PRIMARY KEY,
    account_id uuid NOT NULL REFERENCES accounts(id),
    status text NOT NULL,
    updated_at timestamptz
  )`);

  const coreSchema = readFileSync(resolve(process.cwd(), "../../db/migrations/001_core_schema.sql"), "utf8");
  const auditTable = coreSchema.match(/create table if not exists audit_log \([\s\S]*?\n\);/i)?.[0];
  if (!auditTable) throw new Error("Committed audit_log definition was not found");
  await harness.pool.query(auditTable);
  await harness.pool.query(readFileSync(resolve(process.cwd(), "../../db/migrations/005_audit_log_trace_id.sql"), "utf8"));
  await harness.pool.query(readFileSync(resolve(process.cwd(), "../../db/migrations/189_audit_log_nullable_actor.sql"), "utf8"));
  await harness.pool.query(readFileSync(resolve(process.cwd(), "../../db/migrations/059_workflow_events.sql"), "utf8"));
});

beforeEach(async () => {
  vi.clearAllMocks();
  vi.stubEnv("APP_URL", "");
  await harness.pool!.query("TRUNCATE estimates, audit_log, workflow_events");
  await harness.pool!.query(
    "INSERT INTO estimates (id, account_id, status) VALUES ($1, $2, 'sent')",
    [estimateId, accountId],
  );
});

afterAll(async () => {
  await harness.pool?.end();
  if (admin) {
    await admin.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
    await admin.end();
  }
  vi.unstubAllEnvs();
});

describe("email estimate response PostgreSQL transaction", () => {
  it("rejects a tampered signed-link token before opening a transaction", async () => {
    const connect = vi.spyOn(harness.pool!, "connect");
    try {
      const failed = await POST(request("not-a-valid-signed-link"));
      expect(failed.status).toBe(307);
      expect(new URL(failed.headers.get("location")!).searchParams.get("action")).toBe("error");
      expect(connect).not.toHaveBeenCalled();
      await assertCounts({ status: "sent", audit: 0, events: 0 });
    } finally {
      connect.mockRestore();
    }
  });

  it("rolls back a rejected audit, retries the same signed link once, and makes replay effect-idempotent", async () => {
    const token = await signedApprovalToken();
    await rejectInserts("audit_log");
    try {
      const failed = await POST(request(token));
      expect(failed.status).toBe(307);
      expect(new URL(failed.headers.get("location")!).searchParams.get("action")).toBe("error");
      await assertCounts({ status: "sent", audit: 0, events: 0 });
      expect(emitAttentionEvent).not.toHaveBeenCalled();
    } finally {
      await allowInserts("audit_log");
    }

    const retry = await POST(request(token));
    expect(retry.status).toBe(307);
    expect(new URL(retry.headers.get("location")!).searchParams.get("action")).toBe("approve");
    await assertCounts({ status: "approved", audit: 1, events: 1 });
    await assertAcceptedEvidence();
    expect(emitAttentionEvent).toHaveBeenCalledOnce();

    const [replayA, replayB] = await Promise.all([POST(request(token)), POST(request(token))]);
    expect([replayA, replayB].map(response => response.status)).toEqual([307, 307]);
    await assertCounts({ status: "approved", audit: 1, events: 1 });
    await assertAcceptedEvidence();
    expect(emitAttentionEvent).toHaveBeenCalledOnce();
  });

  it("rolls back both the quote and audit when workflow evidence fails, then allows a safe retry", async () => {
    const token = await signedApprovalToken();
    await rejectInserts("workflow_events");
    try {
      const failed = await POST(request(token));
      expect(failed.status).toBe(307);
      expect(new URL(failed.headers.get("location")!).searchParams.get("action")).toBe("error");
      await assertCounts({ status: "sent", audit: 0, events: 0 });
      expect(emitAttentionEvent).not.toHaveBeenCalled();
    } finally {
      await allowInserts("workflow_events");
    }

    const retry = await POST(request(token));
    expect(retry.status).toBe(307);
    expect(new URL(retry.headers.get("location")!).searchParams.get("action")).toBe("approve");
    await assertCounts({ status: "approved", audit: 1, events: 1 });
    await assertAcceptedEvidence();
    expect(emitAttentionEvent).toHaveBeenCalledOnce();
  });
});
