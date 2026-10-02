import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomBytes, randomUUID } from "node:crypto";
import { SignJWT } from "jose";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  createIdentitySessionRegistry,
  createSessionCredentialService,
  createSessionCredentialVerifier,
} from "@titan-zero/titan-platform/security-boundary";
import { createSqliteStorage } from "../../../../../packages/storage/src/index";
import {
  createCurrentWebSessionAdapter,
  createCurrentWebSessionIngress,
  CURRENT_WEB_SESSION_COOKIE_NAME,
} from "../current-session";

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
let approvedAccounts: Map<string, string>;
let service: ReturnType<typeof createSessionCredentialService>;
let verifier: ReturnType<typeof createSessionCredentialVerifier>;
let ingress: ReturnType<typeof createCurrentWebSessionIngress>;

function compose(resolveLegacyAccountId = async (companyId: string): Promise<string | null> => approvedAccounts.get(companyId) ?? null) {
  const credentialConfig = {
    registry, issuer, audience: "titan-web", key_id: "test-access-key",
    verification_key: signingKey, algorithm: "HS256" as const,
    upstream: { issuer: upstreamIssuer, audience: "titan-session-exchange", key_id: "test-upstream-key", algorithm: "HS256" as const, verification_key: upstreamKey },
    now: () => now, lifetime_seconds: 300,
  };
  service = createSessionCredentialService({ ...credentialConfig, signing_key: signingKey });
  verifier = createSessionCredentialVerifier(credentialConfig);
  const projection = { resolveLegacyAccountId };
  ingress = createCurrentWebSessionIngress(verifier, projection);
  return createCurrentWebSessionAdapter(service, projection);
}

function requestWithCookie(
  cookie: string | null,
  url = "https://web.example.test/api/v1/visits/visit-1/checklist?company_id=company-b",
  authorization?: string,
) {
  return new Request(url, { headers: {
    ...(cookie === null ? {} : { cookie }),
    "x-company-id": "company-b",
    ...(authorization === undefined ? {} : { authorization }),
  } });
}

function delayedMapper() {
  let enter!: () => void;
  let release!: () => void;
  const entered = new Promise<void>(resolve => { enter = resolve; });
  const released = new Promise<void>(resolve => { release = resolve; });
  return {
    entered, release: () => release(),
    resolve: async (companyId: string) => {
      enter();
      await released;
      return approvedAccounts.get(companyId) ?? null;
    },
  };
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
  approvedAccounts = new Map([["company-a", "company-a"], ["company-b", "company-b"]]);
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
  it.each(["resolve", "issue", "switchCompany", "getSession"] as const)("sanitizes mapper failures through %s", async method => {
    const issued = await web.issue(await upstream(), expected);
    const failing = compose(async () => { throw new Error("database-password=must-not-leak"); });
    if (method === "getSession") {
      expect(await failing.getSession(issued.credential, expected)).toBeNull();
    } else {
      const result = method === "issue" ? failing.issue(await upstream(), expected)
        : method === "switchCompany" ? failing.switchCompany(issued.credential, expected, "company-b")
        : failing.resolve(issued.credential, expected);
      await expect(result).rejects.toThrow(/^web-session-account-mapping-unavailable$/);
    }
  });

  it.each([
    ["resolve", "revoke"], ["resolve", "switch"],
    ["getSession", "revoke"], ["getSession", "switch"],
  ] as const)("denies stale %s projection when %s happens while mapping awaits", async (method, change) => {
    const issued = await web.issue(await upstream(), expected);
    const gate = delayedMapper();
    const delayed = compose(gate.resolve);
    const pending = delayed[method](issued.credential, expected);
    await gate.entered;
    if (change === "revoke") await service.revoke(issued.credential, expected);
    else await service.switchCompany(issued.credential, expected, "company-b");
    gate.release();
    if (method === "getSession") expect(await pending).toBeNull();
    else await expect(pending).rejects.toThrow("authentication-denied");
  });

  it.each(["issue", "switchCompany"] as const)("denies %s projection revoked after mutation while mapping awaits", async method => {
    const issued = method === "switchCompany" ? await web.issue(await upstream(), expected) : null;
    const gate = delayedMapper();
    const delayed = compose(gate.resolve);
    const pending = method === "issue" ? delayed.issue(await upstream(), expected)
      : delayed.switchCompany(issued!.credential, expected, "company-b");
    await gate.entered;
    const row = (await storage.query<{ session_id: string; revision: number }>("SELECT session_id,revision FROM titan_security_sessions WHERE revoked=0")).rows[0];
    await registry.revokeSession(row.session_id, row.revision);
    gate.release();
    await expect(pending).rejects.toThrow("authentication-denied");
  });

  it("uses the approved distinct legacy account mapping while retaining canonical operation scope", async () => {
    approvedAccounts.set("company-a", "account-17");
    const issued = await web.issue(await upstream({ accountId: "attacker-account" }), expected);
    expect(issued.session.accountId).toBe("account-17");
    expect(issued.context.company_id).toBe("company-a");
    expect(issued.operationCompanyIds).toEqual(["company-a"]);
    expect((await web.resolve(issued.credential, expected)).session.accountId).toBe("account-17");
    expect((await web.getSession(issued.credential, expected))?.accountId).toBe("account-17");
  });

  it("denies an unknown mapping without inferring equality or creating a mapping", async () => {
    const issued = await web.issue(await upstream(), expected);
    approvedAccounts.delete("company-a");
    expect(await web.getSession(issued.credential, expected)).toBeNull();
    await expect(web.resolve(issued.credential, expected)).rejects.toThrow("web-session-account-mapping-unavailable");
    await expect(web.issue(await upstream(), expected)).rejects.toThrow("web-session-account-mapping-unavailable");
    expect(approvedAccounts.has("company-a")).toBe(false);
  });

  it.each(["", "  ", " account-17", "account-17\n", "account\u0000-17"])("denies invalid approved account mapping %j", async (accountId) => {
    const issued = await web.issue(await upstream(), expected);
    approvedAccounts.set("company-a", accountId);
    expect(await web.getSession(issued.credential, expected)).toBeNull();
    await expect(web.resolve(issued.credential, expected)).rejects.toThrow("web-session-account-mapping-unavailable");
  });

  it("projects the switched company's approved mapping with canonical scope", async () => {
    approvedAccounts.set("company-b", "account-29");
    const issued = await web.issue(await upstream(), expected);
    const switched = await web.switchCompany(issued.credential, expected, "company-b");
    expect(switched.session.accountId).toBe("account-29");
    expect(switched.context.company_id).toBe("company-b");
    expect(switched.operationCompanyIds).toEqual(["company-b"]);
  });

  it("projects stable current identity and scopes operations only to the selected company", async () => {
    const issued = await web.issue(await upstream({ userId: "imposter", accountId: "company-b", role: "admin" }), expected);
    expect(issued.session).toEqual({ userId: "stable-user-17", accountId: "company-a", role: "owner" });
    expect(issued.context.allowed_company_ids).toEqual(["company-a", "company-b"]);
    expect(issued.operationCompanyIds).toEqual(["company-a"]);
    expect(await web.getSession(issued.credential, expected)).toEqual(issued.session);
  });

  it("derives request company, actor, device and revisions only from the canonical credential", async () => {
    const issued = await web.issue(await upstream(), expected);
    const request = requestWithCookie(`${CURRENT_WEB_SESSION_COOKIE_NAME}=${issued.credential}; fsm_session=legacy-token`);
    const current = await ingress.resolveRequest(request);

    expect(current?.session).toEqual({ userId: "stable-user-17", accountId: "company-a", role: "owner" });
    expect(current?.operationCompanyIds).toEqual(["company-a"]);
    expect(current?.context).toMatchObject({
      company_id: "company-a", actor_id: "stable-user-17", device_id: "device-1",
      session_id: issued.context.session_id, session_revision: issued.context.session_revision,
      context_revision: issued.context.context_revision, audience: "titan-web", authority_neutral: true,
    });
    expect(current?.scope).toEqual({
      kind: "authenticated",
      current: {
        company_id: "company-a", actor_id: "stable-user-17", session_id: issued.context.session_id,
        session_revision: issued.context.session_revision, context_revision: issued.context.context_revision,
        audience: "titan-web", expires_at: issued.context.expires_at, authority_neutral: true,
      },
    });
  });

  it("does not authenticate from legacy cookies, company fields, bearer headers or ambiguous credentials", async () => {
    const issued = await web.issue(await upstream(), expected);
    const legacy = await new SignJWT({ userId: "stable-user-17", accountId: "company-a", role: "owner" })
      .setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("7d").sign(signingKey);

    expect(await ingress.resolveRequest(requestWithCookie(`fsm_session=${legacy}`))).toBeNull();
    expect(await ingress.resolveRequest(requestWithCookie(null))).toBeNull();
    expect(await ingress.resolveRequest(requestWithCookie(null, undefined, `Bearer ${issued.credential}`))).toBeNull();
    expect(await ingress.resolveRequest(requestWithCookie(
      `${CURRENT_WEB_SESSION_COOKIE_NAME}=${issued.credential}; ${CURRENT_WEB_SESSION_COOKIE_NAME}=${issued.credential}`,
    ))).toBeNull();
    expect(await ingress.resolveRequest(requestWithCookie(`${CURRENT_WEB_SESSION_COOKIE_NAME}=not-a-jwt`))).toBeNull();
  });

  it("preserves only the sanitized registry-unavailable signal for server error handling", async () => {
    const unavailableIngress = createCurrentWebSessionIngress({
      authenticate: async () => { throw new Error("identity-registry-unavailable"); },
      resolve: verifier.resolve,
    }, { resolveLegacyAccountId: async companyId => approvedAccounts.get(companyId) ?? null });
    const request = requestWithCookie(`${CURRENT_WEB_SESSION_COOKIE_NAME}=a.b.c`);

    await expect(unavailableIngress.resolveRequest(request)).rejects.toThrow(/^identity-registry-unavailable$/);
    expect(await ingress.resolveRequest(request)).toBeNull();
  });

  it("revalidates canonical session context after request identity mapping", async () => {
    const issued = await web.issue(await upstream(), expected);
    const gate = delayedMapper();
    const delayedIngress = createCurrentWebSessionIngress(verifier, { resolveLegacyAccountId: gate.resolve });
    const pending = delayedIngress.resolveRequest(requestWithCookie(`${CURRENT_WEB_SESSION_COOKIE_NAME}=${issued.credential}`));
    await gate.entered;
    await service.switchCompany(issued.credential, expected, "company-b");
    gate.release();

    await expect(pending).resolves.toBeNull();
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
