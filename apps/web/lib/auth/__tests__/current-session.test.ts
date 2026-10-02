import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomBytes, randomUUID } from "node:crypto";
import { SignJWT } from "jose";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  createIdentitySessionRegistry,
  createSessionCredentialService,
} from "@titan-zero/titan-platform/security-boundary";
import { createSqliteStorage } from "../../../../../packages/storage/src/index";
import { createCurrentWebSessionAdapter } from "../current-session";

const issuer = "https://titan.example.test/session";
const upstreamIssuer = "https://da-a.example.test/identity";
const expected = { company_id: "company-a", device_id: "device-1" };
const now = new Date("2026-10-02T00:00:00Z");
let directory: string;
let storage: ReturnType<typeof createSqliteStorage>;
let registry: Awaited<ReturnType<typeof createIdentitySessionRegistry>>;
let web: ReturnType<typeof createCurrentWebSessionAdapter>;
let signingKey: Uint8Array;
let upstreamKey: Uint8Array;

function compose() {
  return createCurrentWebSessionAdapter(createSessionCredentialService({
    registry, issuer, audience: "titan-web", key_id: "test-access-key",
    signing_key: signingKey, verification_key: signingKey, algorithm: "HS256",
    upstream: { issuer: upstreamIssuer, audience: "titan-session-exchange", key_id: "test-upstream-key", algorithm: "HS256", verification_key: upstreamKey },
    now: () => now, lifetime_seconds: 300,
  }));
}

async function upstream(patch: Record<string, unknown> = {}) {
  return new SignJWT({ company_id: expected.company_id, device_id: expected.device_id, ...patch })
    .setProtectedHeader({ alg: "HS256", kid: "test-upstream-key", typ: "titan-login+jwt" })
    .setIssuer(upstreamIssuer).setSubject("host-account-17").setAudience("titan-session-exchange")
    .setJti(randomUUID()).setIssuedAt(Math.floor(now.getTime() / 1000))
    .setExpirationTime(Math.floor(now.getTime() / 1000) + 300).sign(upstreamKey);
}

beforeEach(async () => {
  directory = await mkdtemp(join(tmpdir(), "titan-web-credentials-"));
  signingKey = randomBytes(32);
  upstreamKey = randomBytes(32);
  storage = createSqliteStorage(join(directory, "identity.sqlite"));
  registry = await createIdentitySessionRegistry({ storage, storage_role: "GLOBAL_REGISTRY" });
  await registry.putActor({ actor_id: "stable-user-17", status: "active" }, null);
  await registry.putDevice({ device_id: expected.device_id, actor_id: "stable-user-17", status: "active" }, null);
  for (const [company, role] of [["company-a", "owner"], ["company-b", "tech"]]) {
    await registry.putCompany({ company_id: company, status: "active" }, null);
    await registry.putMembership({ actor_id: "stable-user-17", company_id: company, role, status: "active" }, null);
    await registry.putExternalBinding({ binding_id: `binding-${company}`, provider: upstreamIssuer, subject: "host-account-17", actor_id: "stable-user-17", company_id: company, status: "active" }, null);
  }
  web = compose();
});
afterEach(async () => {
  await storage?.close();
  await rm(directory, { recursive: true, force: true });
});

describe("opt-in web durable session migration", () => {
  it("projects stable current identity and scopes operations only to the selected company", async () => {
    const issued = await web.issue(await upstream({ userId: "imposter", accountId: "company-b", role: "admin" }), expected);
    expect(issued.session).toEqual({ userId: "stable-user-17", accountId: "company-a", role: "owner" });
    expect(issued.context.allowed_company_ids).toEqual(["company-a", "company-b"]);
    expect(issued.operationCompanyIds).toEqual(["company-a"]);
    expect(await web.getSession(issued.credential, expected)).toEqual(issued.session);
  });

  it("switches with current authentication and invalidates the old credential", async () => {
    const original = await web.issue(await upstream(), expected);
    const switched = await web.switchCompany(original.credential, expected, "company-b");
    expect(switched.session).toEqual({ userId: "stable-user-17", accountId: "company-b", role: "tech" });
    expect(switched.operationCompanyIds).toEqual(["company-b"]);
    expect(await web.getSession(original.credential, expected)).toBeNull();
    expect(await web.getSession(switched.credential, expected)).toBeNull();
    expect(await web.getSession(switched.credential, { ...expected, company_id: "company-b" })).toEqual(switched.session);
  });

  it("denies legacy cookies for resolve, exchange, company switching and revocation", async () => {
    const legacy = await new SignJWT({ userId: "stable-user-17", accountId: "company-a", role: "owner" })
      .setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("7d").sign(signingKey);
    expect(await web.getSession(legacy, expected)).toBeNull();
    await expect(web.resolve(legacy, expected)).rejects.toThrow();
    await expect(web.issue(legacy, expected)).rejects.toThrow();
    await expect(web.switchCompany(legacy, expected, "company-b")).rejects.toThrow();
    await expect(web.revoke(legacy, expected)).rejects.toThrow();
    expect((await storage.query("SELECT session_id FROM titan_security_sessions")).rows).toEqual([]);
  });

  it("does not accept a session ID or missing cookie as authentication", async () => {
    const issued = await web.issue(await upstream(), expected);
    for (const candidate of [issued.context.session_id, null, undefined, ""]) {
      expect(await web.getSession(candidate, expected)).toBeNull();
    }
    await expect(web.switchCompany(issued.context.session_id, expected, "company-b")).rejects.toThrow();
    await expect(web.revoke(issued.context.session_id, expected)).rejects.toThrow();
    expect(await web.getSession(issued.credential, expected)).toEqual(issued.session);
  });

  it("rechecks current membership and never backfills a missing membership", async () => {
    const issued = await web.issue(await upstream(), expected);
    await storage.query("DELETE FROM titan_security_memberships WHERE company_id=$1", [expected.company_id]);
    expect(await web.getSession(issued.credential, expected)).toBeNull();
    await expect(web.issue(await upstream(), expected)).rejects.toThrow();
    expect((await storage.query("SELECT actor_id FROM titan_security_memberships WHERE company_id=$1", [expected.company_id])).rows).toEqual([]);
  });

  it("rejects stale role tokens and projects a downgraded role only after fresh authentication", async () => {
    const issued = await web.issue(await upstream(), expected);
    await registry.putMembership({ actor_id: "stable-user-17", company_id: "company-a", role: "tech", status: "active" }, 1);
    expect(await web.getSession(issued.credential, expected)).toBeNull();
    const replacement = await web.issue(await upstream({ role: "owner" }), expected);
    expect(replacement.session.role).toBe("tech");
  });

  it("fails closed for roles outside the web role contract", async () => {
    await registry.putMembership({ actor_id: "stable-user-17", company_id: "company-a", role: "host-admin", status: "active" }, 1);
    await expect(web.issue(await upstream(), expected)).rejects.toThrow("web-session-role-unsupported");
  });

  it("reopens durable current state and preserves revocation after restart", async () => {
    const issued = await web.issue(await upstream(), expected);
    await storage.close();
    storage = createSqliteStorage(join(directory, "identity.sqlite"));
    registry = await createIdentitySessionRegistry({ storage, storage_role: "GLOBAL_REGISTRY" });
    web = compose();
    expect(await web.getSession(issued.credential, expected)).toEqual(issued.session);
    await web.revoke(issued.credential, expected);
    await storage.close();
    storage = createSqliteStorage(join(directory, "identity.sqlite"));
    registry = await createIdentitySessionRegistry({ storage, storage_role: "GLOBAL_REGISTRY" });
    web = compose();
    expect(await web.getSession(issued.credential, expected)).toBeNull();
  });

  it("denies the wrong selected company or device without changing current session", async () => {
    const issued = await web.issue(await upstream(), expected);
    expect(await web.getSession(issued.credential, { ...expected, company_id: "company-b" })).toBeNull();
    expect(await web.getSession(issued.credential, { ...expected, device_id: "other-device" })).toBeNull();
    await expect(web.revoke(issued.credential, { ...expected, device_id: "other-device" })).rejects.toThrow();
    expect(await web.getSession(issued.credential, expected)).toEqual(issued.session);
  });
});
