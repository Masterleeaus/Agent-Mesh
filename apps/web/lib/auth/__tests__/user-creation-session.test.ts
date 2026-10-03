/** Route-level creation/login/session integration; SQL runs in-memory, no live PG. */
import Database from "better-sqlite3";
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { rewriteSqliteParams } from "@/lib/db/sqlite-params";

const state = vi.hoisted(() => ({
  token: "",
  query: null as null | ((sql: string, params?: unknown[]) => { rows: unknown[]; rowCount: number }),
  rejectMembership: false,
  rejectRoleUpdate: false,
}));
vi.mock("next/headers", () => ({ cookies: async () => ({
  get: () => ({ value: state.token }),
  set: (_name: string, token: string) => { state.token = token; },
}) }));
vi.mock("@/lib/env", () => ({ getEnv: () => ({ AUTH_SECRET: "user-creation-test-only-secret-32-characters" }) }));
vi.mock("@/lib/db/dialect", () => ({ getDatabaseDialect: () => "postgres" }));
vi.mock("@/lib/db", () => ({
  query: async (sql: string, params: unknown[]) => state.query!(sql, params).rows,
  queryOne: async (sql: string, params: unknown[]) => state.query!(sql, params).rows[0] ?? null,
  getDatabaseDialect: () => "postgres",
  getPool: () => ({ connect: async () => ({
    query: async (sql: string, params?: unknown[]) => state.query!(sql, params),
    release: () => {},
  }) }),
}));
vi.mock("@/lib/db/portable", () => ({
  portableQueryOne: async (sql: string, params: unknown[]) => state.query!(sql, params).rows[0] ?? null,
  portableQuery: async (sql: string, params: unknown[]) => state.query!(sql, params).rows,
  withTenantTransaction: async (
    session: { accountId: string },
    fn: (client: { query: (sql: string, params?: unknown[]) => Promise<{ rows: unknown[]; rowCount: number }> }, accountId: string) => Promise<unknown>,
  ) => {
    state.query!("BEGIN");
    try {
      const result = await fn({ dialect: "sqlite", query: async (sql, params) => state.query!(sql, params) }, session.accountId);
      state.query!("COMMIT");
      return result;
    } catch (error) {
      state.query!("ROLLBACK");
      throw error;
    }
  },
}));
vi.mock("@/lib/db/audit", () => ({ appendAuditLog: async () => {} }));
vi.mock("@/lib/logger", () => ({ logger: { error: vi.fn() } }));

import { createSession, getSession } from "../session";
import { POST as createUser } from "@/app/api/v1/users/route";
import { DELETE as deleteUser, PATCH as updateUser, GET as readUser } from "@/app/api/v1/users/[id]/route";
import { POST as login } from "@/app/api/v1/auth/login/route";

let db: Database.Database;
beforeEach(async () => {
  state.rejectMembership = false;
  state.rejectRoleUpdate = false;
  db = new Database(":memory:");
  db.function("now", () => new Date().toISOString());
  db.exec(`CREATE TABLE users (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))), account_id TEXT NOT NULL,
    email TEXT, full_name TEXT, phone TEXT, role TEXT, password_hash TEXT,
    updated_at TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE business_memberships (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))), user_id TEXT, account_id TEXT, role TEXT,
    status TEXT DEFAULT 'active', updated_at TEXT, UNIQUE(user_id,account_id)
  );
  INSERT INTO users (id,account_id,email,full_name,role) VALUES ('owner-1','company-a','owner@example.test','Owner','owner');
  INSERT INTO business_memberships (user_id,account_id,role,status) VALUES ('owner-1','company-a','owner','active');`);
  state.query = (sql, params = []) => {
    // PostgreSQL transaction context has no SQLite equivalent. Do not replace
    // membership/session SQL: execute those exact production statements.
    if (sql.includes("set_config(")) return { rows: [], rowCount: 0 };
    if (state.rejectMembership && /INSERT INTO business_memberships/i.test(sql)) throw new Error("simulated membership persistence failure");
    if (state.rejectRoleUpdate && /UPDATE business_memberships/i.test(sql)) throw new Error("simulated membership role update failure");
    const bound = rewriteSqliteParams(sql, params);
    const statement = db.prepare(bound.sql);
    if (statement.reader) { const rows = statement.all(...bound.params); return { rows, rowCount: rows.length }; }
    const result = statement.run(...bound.params);
    return { rows: [], rowCount: result.changes };
  };
  state.token = await createSession({ userId: "owner-1", accountId: "company-a", role: "owner" });
});
afterEach(() => db.close());

function request(email = "new@example.test", role = "tech") {
  return new NextRequest("https://example.test/api/v1/users", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, full_name: "New User", role, password: "test-password-only" }),
  });
}

describe("user creation establishes explicit session membership", () => {
  it("creates the default membership transactionally and the real login/session resolves it", async () => {
    const response = await createUser(request());
    expect(response.status).toBe(201);
    const created = (await response.json()).data;
    expect(db.prepare("SELECT user_id,account_id,role,status FROM business_memberships WHERE user_id=?").get(created.id))
      .toEqual({ user_id: created.id, account_id: "company-a", role: "tech", status: "active" });
    state.token = "";
    const loggedIn = await login(new NextRequest("https://example.test/api/v1/auth/login", {
      method: "POST", headers: { "Content-Type": "application/json", "x-forwarded-for": "creation-session-test" },
      body: JSON.stringify({ email: "new@example.test", password: "test-password-only" }),
    }));
    expect(loggedIn.status).toBe(200);
    expect(await getSession()).toEqual({ userId: created.id, accountId: "company-a", role: "tech" });
    db.prepare("UPDATE business_memberships SET status='revoked' WHERE user_id=?").run(created.id);
    expect(await getSession()).toBeNull();
  });
  it("rolls back the user if membership creation fails", async () => {
    state.rejectMembership = true;
    const response = await createUser(request());
    expect(response.status).toBe(500);
    expect(db.prepare("SELECT id FROM users WHERE email='new@example.test'").all()).toEqual([]);
    expect(db.prepare("SELECT COUNT(*) AS count FROM business_memberships").get()).toEqual({ count: 1 });
  });
  it("keeps duplicate-user conflict non-mutating", async () => {
    expect((await createUser(request())).status).toBe(201);
    expect((await createUser(request())).status).toBe(409);
    expect(db.prepare("SELECT COUNT(*) AS count FROM users").get()).toEqual({ count: 2 });
    expect(db.prepare("SELECT COUNT(*) AS count FROM business_memberships").get()).toEqual({ count: 2 });
  });
});


function patchRequest(id: string, role: string) {
  return new NextRequest(`https://example.test/api/v1/users/${id}`, {
    method: "PATCH", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role }),
  });
}

describe("user role changes keep selected membership coherent", () => {
  it("downgrades a created admin and denies prior admin-only access with the old cookie", async () => {
    const created = (await (await createUser(request("admin2@example.test", "admin"))).json()).data;
    const oldToken = await createSession({ userId: created.id, accountId: "company-a", role: "admin" });
    expect((await updateUser(patchRequest(created.id, "tech"))).status).toBe(200);
    expect(db.prepare("SELECT role FROM users WHERE id=?").get(created.id)).toEqual({ role: "tech" });
    expect(db.prepare("SELECT role FROM business_memberships WHERE user_id=? AND account_id='company-a'").get(created.id)).toEqual({ role: "tech" });
    state.token = oldToken;
    expect((await getSession())?.role).toBe("tech");
    const response = await readUser(new NextRequest("https://example.test/api/v1/users/owner-1"));
    expect(response.status).toBe(403);
  });
  it("rolls back both role records when membership update fails", async () => {
    const created = (await (await createUser(request("admin2@example.test", "admin"))).json()).data;
    state.rejectRoleUpdate = true;
    expect((await updateUser(patchRequest(created.id, "tech"))).status).toBe(500);
    expect(db.prepare("SELECT role FROM users WHERE id=?").get(created.id)).toEqual({ role: "admin" });
    expect(db.prepare("SELECT role FROM business_memberships WHERE user_id=?").get(created.id)).toEqual({ role: "admin" });
  });
  it.each(["revoked", "suspended"])("can update the dormant %s role without restoring access", async (status) => {
    const created = (await (await createUser(request("admin2@example.test", "admin"))).json()).data;
    db.prepare("UPDATE business_memberships SET status=? WHERE user_id=?").run(status, created.id);
    expect((await updateUser(patchRequest(created.id, "tech"))).status).toBe(200);
    expect(db.prepare("SELECT role,status FROM business_memberships WHERE user_id=?").get(created.id)).toEqual({ role: "tech", status });
    expect(db.prepare("SELECT role FROM users WHERE id=?").get(created.id)).toEqual({ role: "admin" });
    state.token = await createSession({ userId: created.id, accountId: "company-a", role: "admin" });
    expect(await getSession()).toBeNull();
  });
  it("leaves other company memberships unchanged", async () => {
    const created = (await (await createUser(request("admin2@example.test", "admin"))).json()).data;
    db.prepare("INSERT INTO business_memberships (user_id,account_id,role,status) VALUES (?, 'company-b','owner','active')").run(created.id);
    expect((await updateUser(patchRequest(created.id, "tech"))).status).toBe(200);
    expect(db.prepare("SELECT role,status FROM business_memberships WHERE user_id=? AND account_id='company-b'").get(created.id)).toEqual({ role: "owner", status: "active" });
    expect(db.prepare("SELECT role FROM users WHERE id=? AND account_id='company-a'").get(created.id)).toEqual({ role: "tech" });
  });
  it("clears the legacy primary-company role when removing that company membership", async () => {
    const created = (await (await createUser(request("admin2@example.test", "admin"))).json()).data;
    db.prepare("INSERT INTO business_memberships (user_id,account_id,role,status) VALUES (?, 'company-b','owner','active')").run(created.id);
    const response = await deleteUser(new NextRequest(`https://example.test/api/v1/users/${created.id}`, { method: "DELETE" }));
    expect(response.status).toBe(200);
    expect(db.prepare("SELECT role FROM users WHERE id=?").get(created.id)).toEqual({ role: "tech" });
    expect(db.prepare("SELECT role,status FROM business_memberships WHERE user_id=? AND account_id='company-a'").get(created.id))
      .toEqual({ role: "admin", status: "revoked" });
    expect(db.prepare("SELECT role,status FROM business_memberships WHERE user_id=? AND account_id='company-b'").get(created.id))
      .toEqual({ role: "owner", status: "active" });
  });
  it("cannot update a user belonging to another default company", async () => {
    db.exec("INSERT INTO users (id,account_id,role) VALUES ('user-b','company-b','admin'); INSERT INTO business_memberships (user_id,account_id,role,status) VALUES ('user-b','company-b','admin','active');");
    expect((await updateUser(patchRequest("user-b", "tech"))).status).toBe(404);
    expect(db.prepare("SELECT role FROM business_memberships WHERE user_id='user-b'").get()).toEqual({ role: "admin" });
  });
  it("can repair an orphan primary-company role without creating membership or login access", async () => {
    db.exec("INSERT INTO users (id,account_id,role) VALUES ('legacy','company-a','admin');");
    expect((await updateUser(patchRequest("legacy", "tech"))).status).toBe(200);
    expect(db.prepare("SELECT role FROM users WHERE id='legacy'").get()).toEqual({ role: "tech" });
    expect(db.prepare("SELECT * FROM business_memberships WHERE user_id='legacy'").all()).toEqual([]);
    state.token = await createSession({ userId: "legacy", accountId: "company-a", role: "admin" });
    expect(await getSession()).toBeNull();
  });
});
