/**
 * Real JWT -> getSession -> protected clients route, with a real in-memory SQL
 * engine at the portable-query boundary. Non-SQLite statements run unchanged
 * apart from numbered bindings; this is not live PostgreSQL/MySQL certification.
 */
import Database from "better-sqlite3";
import { SignJWT } from "jose";
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { rewriteSqliteParams } from "@/lib/db/sqlite-params";

const state = vi.hoisted(() => ({
  token: "",
  dialect: "postgres",
  read: null as null | ((sql: string, params: unknown[]) => unknown[]),
  businessReads: 0,
  identityReads: 0,
}));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => state.token ? { value: state.token } : undefined }) }));
vi.mock("@/lib/env", () => ({ getEnv: () => ({ AUTH_SECRET: "session-context-test-only-secret-32-characters" }) }));
vi.mock("@/lib/db/dialect", () => ({ getDatabaseDialect: () => state.dialect }));
vi.mock("@/lib/db/portable", () => ({
  portableQueryOne: async (sql: string, params: unknown[]) => {
    state.identityReads++;
    return state.read!(sql, params)[0] ?? null;
  },
  portableQuery: async (sql: string, params: unknown[]) => {
    state.businessReads++;
    return state.read!(sql, params);
  },
  withPortableTransaction: () => { throw new Error("Read-only route test must not mutate"); },
}));
vi.mock("@/lib/db/audit", () => ({ appendAuditLog: () => { throw new Error("Unexpected audit write"); } }));
vi.mock("@/lib/logger", () => ({ logger: { error: vi.fn() } }));

import { createSession, getSession, verifySession } from "../session";
import { GET } from "@/app/api/v1/clients/route";

let db: Database.Database;
const user = "user-1";
const companyA = "company-a";
const companyB = "company-b";
const secret = new TextEncoder().encode("session-context-test-only-secret-32-characters");

beforeEach(() => {
  state.token = "";
  state.businessReads = 0;
  state.identityReads = 0;
  db = new Database(":memory:");
  db.exec(`CREATE TABLE users (id TEXT PRIMARY KEY, account_id TEXT, company_id TEXT, role TEXT);
    CREATE TABLE business_memberships (user_id TEXT, account_id TEXT, role TEXT, status TEXT, UNIQUE(user_id,account_id));
    CREATE TABLE clients (id TEXT, account_id TEXT, name TEXT);
    CREATE TABLE properties (id TEXT, client_id TEXT, account_id TEXT);
    CREATE TABLE jobs (id TEXT, client_id TEXT, account_id TEXT);
    INSERT INTO clients VALUES ('client-a','company-a','A private client'), ('client-b','company-b','B private client');`);
  db.prepare("INSERT INTO users VALUES (?, ?, ?, ?)").run(user, companyA, companyA, "owner");
  state.read = (sql, params) => {
    const bound = rewriteSqliteParams(sql, params);
    return db.prepare(bound.sql).all(...bound.params);
  };
});
afterEach(() => db.close());

function membership(company: string, role = "tech", status = "active") {
  db.prepare("INSERT INTO business_memberships VALUES (?, ?, ?, ?)").run(user, company, role, status);
}
async function select(company: string, role: "owner" | "admin" | "tech" = "owner") {
  state.token = await createSession({ userId: user, accountId: company, role });
}

for (const dialect of ["postgres", "mysql"]) {
  describe(`${dialect} selected membership SQL`, () => {
    beforeEach(() => { state.dialect = dialect; });
    it("returns distinct active company roles, never the stale JWT role", async () => {
      membership(companyA, "admin"); membership(companyB, "tech");
      await select(companyA); expect(await getSession()).toEqual({ userId: user, accountId: companyA, role: "admin" });
      await select(companyB); expect(await getSession()).toEqual({ userId: user, accountId: companyB, role: "tech" });
    });
    it.each(["revoked", "suspended", "invited"])("rejects %s selected membership without falling back to A", async (status) => {
      membership(companyA, "owner"); membership(companyB, "admin", status);
      await select(companyB); expect(await getSession()).toBeNull();
    });
    it.each(["missing", "deleted", "unmapped"])("rejects %s selected company", async (kind) => {
      membership(companyA, "owner");
      if (kind === "deleted") { membership(companyB); db.prepare("DELETE FROM business_memberships WHERE account_id=?").run(companyB); }
      await select(kind === "unmapped" ? "company-unknown" : companyB);
      expect(await getSession()).toBeNull();
    });
    it("rejects a revoked default-company membership even when users still says owner", async () => {
      membership(companyA, "owner", "revoked"); await select(companyA);
      expect(await getSession()).toBeNull();
    });
    it("fails closed for legacy default-company users without membership (requires explicit recovery)", async () => {
      await select(companyA); expect(await getSession()).toBeNull();
      await select(companyB); expect(await getSession()).toBeNull();
    });
    it("rejects deletion of the last default membership", async () => {
      membership(companyA, "owner"); await select(companyA);
      db.exec("DELETE FROM business_memberships"); expect(await getSession()).toBeNull();
    });
    it("does not use legacy fallback once any membership exists", async () => {
      membership(companyB); await select(companyA); expect(await getSession()).toBeNull();
    });
    it("revalidates an old signed cookie after membership revocation and company selection changes", async () => {
      membership(companyA, "owner"); membership(companyB, "admin");
      await select(companyB); const oldB = state.token; expect((await getSession())?.accountId).toBe(companyB);
      db.prepare("UPDATE business_memberships SET status='revoked' WHERE account_id=?").run(companyB);
      await select(companyA); expect((await getSession())?.accountId).toBe(companyA);
      state.token = oldB; expect(await getSession()).toBeNull();
    });
    it("uses current membership role after downgrade", async () => {
      membership(companyB, "admin"); await select(companyB);
      db.prepare("UPDATE business_memberships SET role='tech' WHERE account_id=?").run(companyB);
      expect((await getSession())?.role).toBe("tech");
    });
    it("rejects invalid stored membership roles", async () => {
      membership(companyA, "invalid"); await select(companyA); expect(await getSession()).toBeNull();
    });
    it("denies removed principals", async () => {
      membership(companyA, "owner"); await select(companyA); db.exec("DELETE FROM users");
      expect(await getSession()).toBeNull();
    });
    it("blocks downstream business reads through the real clients route after revocation", async () => {
      membership(companyB, "admin"); await select(companyB);
      const request = new NextRequest("https://example.test/api/v1/clients");
      const allowed = await GET(request);
      expect(allowed.status).toBe(200);
      expect((await allowed.json()).data.map((row: {id: string}) => row.id)).toEqual(["client-b"]);
      state.businessReads = 0;
      db.prepare("UPDATE business_memberships SET status='revoked' WHERE account_id=?").run(companyB);
      const denied = await GET(request);
      expect(denied.status).toBe(401);
      expect((await denied.json()).error.code).toBe("UNAUTHORIZED");
      expect(state.businessReads).toBe(0);
    });
    it("does not allow a stale owner claim through the route for a tech membership", async () => {
      membership(companyB, "tech"); await select(companyB, "owner");
      const response = await GET(new NextRequest("https://example.test/api/v1/clients"));
      expect(response.status).toBe(403); expect(state.businessReads).toBe(0);
    });
  });
}

describe("SQLite company compatibility", () => {
  beforeEach(() => { state.dialect = "sqlite"; });
  it("maps company_id to the existing session accountId compatibility field", async () => {
    await select(companyA); expect(await getSession()).toEqual({ userId: user, accountId: companyA, role: "owner" });
  });
  it("rejects mismatched company and replay after a user company change", async () => {
    await select(companyB); expect(await getSession()).toBeNull();
    await select(companyA); expect(await getSession()).not.toBeNull();
    db.prepare("UPDATE users SET company_id=? WHERE id=?").run(companyB, user);
    expect(await getSession()).toBeNull();
    await select(companyB); expect((await getSession())?.accountId).toBe(companyB);
  });
});

describe("signed token context validation", () => {
  beforeEach(() => { state.dialect = "postgres"; });
  it.each([
    { userId: "" }, { userId: " user-1" }, { userId: 12 }, { userId: null },
    { accountId: "" }, { accountId: "   " }, { accountId: "company-a\n" }, { accountId: [] },
    { role: "superadmin" },
  ])("rejects malformed identity before any DB read: %j", async (patch) => {
    state.token = await new SignJWT({ userId: user, accountId: companyA, role: "owner", ...patch })
      .setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("7d").sign(secret);
    expect(await verifySession(state.token)).toBeNull();
    expect(await getSession()).toBeNull(); expect(state.identityReads).toBe(0);
  });
  it.each(["userId", "accountId", "role", "iat"])("rejects missing required %s", async (field) => {
    const payload: Record<string, unknown> = { userId: user, accountId: companyA, role: "owner", iat: Math.floor(Date.now()/1000), exp: Math.floor(Date.now()/1000)+3600 };
    delete payload[field];
    state.token = await new SignJWT(payload).setProtectedHeader({ alg: "HS256" }).sign(secret);
    expect(await getSession()).toBeNull(); expect(state.identityReads).toBe(0);
  });
  it("rejects a different signing algorithm even with the same secret", async () => {
    state.token = await new SignJWT({ userId: user, accountId: companyA, role: "owner" })
      .setProtectedHeader({ alg: "HS384" }).setIssuedAt().setExpirationTime("7d").sign(secret);
    expect(await getSession()).toBeNull(); expect(state.identityReads).toBe(0);
  });
  it("rejects a token without expiry", async () => {
    state.token = await new SignJWT({ userId: user, accountId: companyA, role: "owner" })
      .setProtectedHeader({ alg: "HS256" }).setIssuedAt().sign(secret);
    expect(await getSession()).toBeNull(); expect(state.identityReads).toBe(0);
  });
  it("rejects expired and tampered tokens", async () => {
    state.token = await new SignJWT({ userId: user, accountId: companyA, role: "owner" })
      .setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime(1).sign(secret);
    expect(await getSession()).toBeNull();
    await select(companyA); state.token = `${state.token.slice(0,-5)}xxxxx`;
    expect(await getSession()).toBeNull(); expect(state.identityReads).toBe(0);
  });
  it("rejects inconsistent rows returned at the identity adapter boundary", async () => {
    await select(companyA); state.read = () => [{ id: user, account_id: companyB, role: "owner" }];
    expect(await getSession()).toBeNull();
  });
});
