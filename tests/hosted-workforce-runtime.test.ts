import test from "node:test";
import assert from "node:assert/strict";
import { createHash, generateKeyPairSync, sign, verify } from "node:crypto";
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { request as httpRequest } from "node:http";
import { SignJWT } from "jose";
import Database from "better-sqlite3";
import {
  createSqliteCompanyPlacementRegistry,
  createSqliteCompanyStoreOpener,
  createSqliteStorage,
  initializeSqliteCompanyPlacementRegistry,
} from "../packages/storage/src/index.js";
import { createIdentitySessionRegistry } from "../packages/titan-platform/src/security-boundary.js";
import { completeAssignedWorkOrder } from "../apps/web/lib/work-orders/lead-access.ts";
import { conversationHttpStatus } from "../services/workforce/src/conversation-api.js";
// @ts-expect-error Canonical authority store owner is JavaScript.
import { SqliteAuthorityStore, SqliteWorkerAccessStore } from "../packages/runtime/authority/index.mjs";
import type { WorkforceServer } from "../services/workforce/src/server.js";
import type { HostedWorkforceDependencies } from "../services/workforce/src/hosted-runtime.js";
import { SqliteWorkforceStore } from "../services/workforce/src/sqlite-store.js";

const capability = "crm.work_order.complete";
async function fixture(options: { adapterTimeoutMs?: number; shutdownTimeoutMs?: number; legacyControlPort?: () => Promise<never>; directAdmin?: HostedWorkforceDependencies["directAdmin"] } = {}) {
  const { createWorkforceServer } = await import("../services/workforce/src/server.ts");
  const dir = mkdtempSync(join(tmpdir(), "titan-hosted-"));
  const storagePath = join(dir, "control.db");
  const identityStoragePath = join(dir, "identity.db");
  const companyStoreRoot = join(dir, "company-stores");
  mkdirSync(companyStoreRoot, { mode: 0o700 });
  const files = { a: join(companyStoreRoot, "company-a.sqlite"), b: join(companyStoreRoot, "company-b.sqlite") };
  for (const [company, file] of [["a", storagePath], ...Object.entries(files)]) {
    const db = new Database(file);
    for (const name of readdirSync(new URL("../db/sqlite/", import.meta.url)).filter(name => name.endsWith(".sql")).sort()) {
      db.exec(readFileSync(new URL(`../db/sqlite/${name}`, import.meta.url), "utf8"));
    }
    db.exec(`INSERT INTO companies(id,name) VALUES('${company}','Company');
      INSERT INTO users(id,company_id,email,full_name,password_hash,role) VALUES('lead','${company}','lead@example.invalid','Lead','test-only','tech');
      INSERT INTO clients(id,company_id,name) VALUES('client','${company}','Client');
      INSERT INTO jobs(id,company_id,client_id,title,created_by) VALUES('job','${company}','client','Job','lead');
      INSERT INTO work_orders(id,company_id,job_id,client_id,title,status,assigned_user_id,created_by) VALUES('wo','${company}','job','client','Work','in_progress','lead','lead');
      INSERT INTO visits(id,company_id,job_id,work_order_id,assigned_user_id,status,scheduled_start,scheduled_end,completed_at) VALUES('visit','${company}','job','wo','lead','completed','2026-09-28','2026-09-28','2026-09-28');
      INSERT INTO work_order_tasks(id,company_id,work_order_id,label,completed,status) VALUES('task','${company}','wo','Completion evidence',1,'done');
      INSERT INTO evidence(id,company_id,subject_type,subject_id,evidence_type) VALUES('field-proof','${company}','work_order','wo','field_completion');
      CREATE TABLE mutation_count(n INTEGER); INSERT INTO mutation_count VALUES(0);
      CREATE TRIGGER count_completion AFTER UPDATE OF status ON work_orders WHEN OLD.status <> NEW.status BEGIN UPDATE mutation_count SET n=n+1; END;`);
    db.close();
  }
  const control = createSqliteStorage(storagePath);
  const identity = createSqliteStorage(identityStoragePath);
  const stores = { a: createSqliteStorage(files.a), b: createSqliteStorage(files.b) };
  const registry = await createIdentitySessionRegistry({ storage: identity, storage_role: "GLOBAL_REGISTRY" });
  await registry.putActor({ actor_id: "lead", status: "active" }, null);
  await registry.putDevice({ device_id: "device", actor_id: "lead", status: "active" }, null);
  for (const company_id of ["a", "b"]) {
    await registry.putCompany({ company_id, status: "active" }, null);
    await registry.putMembership({ company_id, actor_id: "lead", role: "owner", status: "active" }, null);
    await registry.putExternalBinding({ binding_id: `binding-${company_id}`, company_id, actor_id: "lead", provider: "test-ed25519", subject: "subject", status: "active" }, null);
  }
  const now = new Date().toISOString();
  const context = await registry.issueSession({ provider: "test-ed25519", subject: "subject", session_id: "session", device_id: "device", company_id: "a", audience: "workforce", issued_at: now, expires_at: new Date(Date.now() + 3600000).toISOString() }, now);
  const claims = { provider: "test-ed25519", subject: "subject", session_id: "session", device_id: "device", session_revision: 1, audience: "workforce", surface: "zero" as const, credential_expires_at: new Date(Date.now() + 3600000).toISOString() };
  await initializeSqliteCompanyPlacementRegistry({ storage: identity, storage_role: "GLOBAL_REGISTRY" });
  for (const company_id of ["a", "b"]) {
    await identity.query(`INSERT INTO titan_company_storage_placements
      (company_id, placement_id, placement_revision, provider, schema_version, status)
      VALUES ($1, $2, 1, 'sqlite', 'native-v1', 'READY')`, [company_id, `company-${company_id}`]);
  }
  const persistedPlacementRegistry = await createSqliteCompanyPlacementRegistry({ storage: identity, storage_role: "GLOBAL_REGISTRY" });
  const physicalCompanyOpener = createSqliteCompanyStoreOpener({ companyStoreRoot });
  let reportWrongPlacementCompany = false;
  let companyOpens = 0;
  let companyCloses = 0;
  const companyPlacementRegistry = {
    async findByCompanyId(company_id: string, options?: { signal?: AbortSignal }) {
      const placement = await persistedPlacementRegistry.findByCompanyId(company_id, options);
      return placement && reportWrongPlacementCompany && company_id === "a" ? { ...placement, company_id: "b" } : placement;
    },
  };
  const companyStoreOpener = {
    async open(placement: Parameters<typeof physicalCompanyOpener.open>[0], options?: { signal?: AbortSignal }) {
      const opened = await physicalCompanyOpener.open(placement, options);
      companyOpens += 1;
      const companyStorage = { ...opened.client, async close() { companyCloses += 1; await opened.client.close(); } };
      return { ...opened, client: companyStorage };
    },
  };
  const keys = generateKeyPairSync("ed25519");
  function credential(overrides: Record<string, unknown> = {}) {
    const payload = Buffer.from(JSON.stringify({ ...claims, ...overrides })).toString("base64url");
    return `Bearer ${payload}.${sign(null, Buffer.from(payload), keys.privateKey).toString("base64url")}`;
  }
  const envelope = { actor_id: "lead", work_order_id: "wo", permissions: [capability], policy_allows: true, governance_allows: true, assurance_allows: true, risk: "low", evidence_refs: ["field-proof"], approval: { status: "approved", approval_id: "approval", approver_id: "lead", approval_scope: "wo", granted_at: now }, autonomy_snapshot: { company_id: "a", source: "titan-autonomy", status: "verified", decision_id: "external-autonomy", capability, effective_score: 60, verified_at: now } };
  await control.query("INSERT INTO authority_state(id,company_id,subject_type,subject_id,level,envelope) VALUES('grant','a','worker_capability',$1,'scoped',$2)", [`manager/${capability}`, JSON.stringify(envelope)]);
  await new SqliteWorkerAccessStore(control).append({ company_id: "a", assignment_id: "access", worker_id: "manager", permissions: [capability], status: "active", granted_at: now });
  const authority = new SqliteAuthorityStore(control);
  await authority.appendAutonomySnapshot(envelope.autonomy_snapshot, { worker_id: "manager" });
  await authority.appendApproval({ company_id: "a", ...envelope.approval });
  const workforce = new SqliteWorkforceStore(control);
  await workforce.migrate();
  await workforce.putWorker({ company_id: "a", worker_id: "manager", kind: "digital", active: true, capabilities: ["work.delegate", capability] });
  let beforeRead: ((signal?: AbortSignal) => Promise<void>) | undefined;
  let beforeComplete: ((signal?: AbortSignal) => Promise<void>) | undefined;
  let afterComplete: ((signal?: AbortSignal) => Promise<void>) | undefined;
  let nativeInvocations = 0;
  let beforeVerify: ((signal?: AbortSignal) => Promise<void>) | undefined;
  let dependencyCloseCount = 0;
  let readinessHook: (() => ReturnType<HostedWorkforceDependencies["readiness"]>) | undefined;
  const dependencies: HostedWorkforceDependencies = {
    identityStoragePath, adapterTimeoutMs: options.adapterTimeoutMs,
    credentialVerifier: { async verify(authorization, options) {
      if (beforeVerify) await beforeVerify(options?.signal);
      options?.signal.throwIfAborted();
      const match = /^Bearer ([A-Za-z0-9_-]+)\.([A-Za-z0-9_-]+)$/.exec(authorization);
      if (!match || !verify(null, Buffer.from(match[1]), keys.publicKey, Buffer.from(match[2], "base64url"))) throw new Error("signature-invalid");
      return JSON.parse(Buffer.from(match[1], "base64url").toString("utf8"));
    } },
    companyPlacementRegistry,
    companyStoreOpener,
    workOrders: {
      async complete({ company_id, actor_id, work_order_id, signal, authorityFence, companyStorage, currentSession }) {
        if (beforeComplete) await beforeComplete(signal);
        signal?.throwIfAborted();
        assert.equal(currentSession.company_id, company_id);
        nativeInvocations += 1;
        const result = await companyStorage.transaction(tx => completeAssignedWorkOrder(tx, work_order_id, company_id, actor_id, authorityFence));
        if (afterComplete) await afterComplete(signal);
        signal?.throwIfAborted();
        return result;
      },
      async read({ company_id, actor_id, work_order_id, signal, companyStorage, currentSession }) {
        if (beforeRead) { const hook = beforeRead; beforeRead = undefined; await hook(signal); }
        signal?.throwIfAborted();
        assert.equal(currentSession.company_id, company_id);
        return (await companyStorage.query("SELECT id,status,completed_at FROM work_orders WHERE company_id=$1 AND id=$2 AND assigned_user_id=$3", [company_id, work_order_id, actor_id])).rows[0] ?? null;
      },
    },
    async close() { dependencyCloseCount += 1; },
    async readiness() { if (readinessHook) return readinessHook(); await Promise.all([identity.query("SELECT 1"), control.query("SELECT 1"), stores.a.query("SELECT 1"), stores.b.query("SELECT 1")]); return { authentication: true, authority: true, provider: true, evidence: true }; },
    ...(options.directAdmin ? { directAdmin: options.directAdmin } : {}),
  };
  if (options.legacyControlPort) Object.assign(dependencies.workOrders, { completeInControlTransaction: options.legacyControlPort });
  let host: WorkforceServer;
  let base: string;
  async function start() {
    host = await createWorkforceServer({ storagePath, dependencies, shutdownTimeoutMs: options.shutdownTimeoutMs });
    await new Promise<void>(resolve => host.server.listen(0, "127.0.0.1", resolve));
    const address = host.server.address(); assert.ok(address && typeof address !== "string");
    base = `http://127.0.0.1:${address.port}`;
  }
  await start();
  const input = { action: "start", company_id: "a", actor_id: "lead", device_id: "device", surface: "zero", session_id: "session", context_revision: context.context_revision, conversation_id: "conversation", interaction_id: "interaction", client_message_id: "message", request_id: "request", operation_id: "operation", correlation_id: "correlation", trace_id: "trace", idempotency_key: "idempotency", text: "complete work order wo" };
  return { control, controlPath: storagePath, identity, dependencies, registry, stores, companyPlacementRegistry, companyStoreOpener, companyOpens: () => companyOpens, companyCloses: () => companyCloses, claims, context, authority, envelope, credential, input,
    async post(overrides: Record<string, unknown> = {}, token: string | null = credential()) { const response = await fetch(`${base}/v1/workforce/conversations`, { method: "POST", headers: { "content-type": "application/json", ...(token ? { authorization: token } : {}) }, body: JSON.stringify({ ...input, ...overrides }) }); return { status: response.status, body: await response.json() as any }; },
    async status(company: "a" | "b" = "a") { return (await stores[company].query<{ status: string }>("SELECT status FROM work_orders WHERE id='wo'")).rows[0].status; },
    async run() { const rows = await control.query<{ payload: string }>("SELECT payload FROM agent_runs WHERE company_id='a'"); return rows.rows.map(row => JSON.parse(row.payload)); },
    async executionStateCount(state: string) { return (await control.query("SELECT id FROM evidence WHERE evidence_type='gateway_execution' AND json_extract(payload,'$.state')=$1", [state])).rowCount; },
    async rotatePlacement(company_id: "a" | "b") {
      const result = await identity.query("UPDATE titan_company_storage_placements SET placement_revision=placement_revision+1 WHERE company_id=$1", [company_id]);
      assert.equal(result.rowCount, 1);
    },
    async pointCompanyAtForeignPhysicalStore() {
      const filename = join(companyStoreRoot, "misbound-a.sqlite");
      const wrong = new Database(filename);
      wrong.exec("CREATE TABLE companies(id TEXT PRIMARY KEY); INSERT INTO companies(id) VALUES('b');");
      wrong.close();
      const result = await identity.query("UPDATE titan_company_storage_placements SET placement_id='misbound-a', placement_revision=placement_revision+1 WHERE company_id='a'");
      assert.equal(result.rowCount, 1);
    },
    reportWrongPlacementCompany() { reportWrongPlacementCompany = true; },
    credentialVerifier(verifier: HostedWorkforceDependencies["credentialVerifier"]) { dependencies.credentialVerifier = verifier; },
    async workforceZero() {
      const { createSessionCredentialService, directAdminIssuer } = await import("../packages/titan-platform/src/security-boundary.js");
      const { createWorkforceSessionCredentialVerifier } = await import("../services/workforce/src/session-credential-verifier.ts");
      const provider = directAdminIssuer("https://da-host.test.invalid:2222");
      const daLoginKeys = await crypto.subtle.generateKey({ name: "Ed25519" }, false, ["sign", "verify"]);
      const daSessionKeys = await crypto.subtle.generateKey({ name: "Ed25519" }, false, ["sign", "verify"]);
      const workforceKeys = await crypto.subtle.generateKey({ name: "Ed25519" }, false, ["sign", "verify"]);
      for (const company_id of ["a", "b"]) await registry.putExternalBinding({ binding_id: `directadmin-${company_id}`, company_id, actor_id: "lead", provider, subject: "subject", status: "active" }, null);
      const upstream = { issuer: provider, audience: "da-login", key_id: "da-login-key", algorithm: "EdDSA" as const, verification_key: daLoginKeys.publicKey };
      const sourceService = createSessionCredentialService({
        registry, issuer: "titan:directadmin-auth", audience: "directadmin-browser", key_id: "da-session-key",
        algorithm: "EdDSA", signing_key: daSessionKeys.privateKey, verification_key: daSessionKeys.publicKey,
        upstream, directadmin: { node_id: "node-one" }, workforce_zero_exchange: {
          issuer: "titan:workforce-auth", key_id: "workforce-session-key", algorithm: "EdDSA",
          signing_key: workforceKeys.privateKey, verification_key: workforceKeys.publicKey, lifetime_seconds: 120,
        },
      });
      const csrf_sha256 = Buffer.from(await crypto.subtle.digest("SHA-256", crypto.getRandomValues(new Uint8Array(32)))).toString("base64url");
      const login = await new SignJWT({ jti: `login-${Date.now()}`, company_id: "a", device_id: "device",
        identity_provider: provider, node_id: "node-one", csrf_sha256, da_role: "admin" })
        .setProtectedHeader({ alg: "EdDSA", kid: "da-login-key", typ: "titan-login+jwt" })
        .setIssuer(provider).setAudience("da-login").setSubject("subject")
        .setIssuedAt().setExpirationTime("5m").sign(daLoginKeys.privateKey);
      const da = await sourceService.issue(login, { company_id: "a", device_id: "device" });
      const workforce = await sourceService.exchangeWorkforceZero(da.credential, { company_id: "a", device_id: "device" });
      const verifier = createWorkforceSessionCredentialVerifier({
        registry, issuer: "titan:workforce-auth", key_id: "workforce-session-key", algorithm: "EdDSA",
        verification_key: workforceKeys.publicKey, upstream, directadmin: { node_id: "node-one" },
      });
      dependencies.credentialVerifier = verifier;
      return { authorization: `Bearer ${workforce.credential}`, context: workforce.context, da, workforce, sourceService };
    },
    get nativeInvocations() { return nativeInvocations; },
    afterComplete(hook: (signal?: AbortSignal) => Promise<void>) { afterComplete = hook; },
    beforeVerify(hook: (signal?: AbortSignal) => Promise<void>) { beforeVerify = hook; },
    beforeComplete(hook: (signal?: AbortSignal) => Promise<void>) { beforeComplete = hook; },
    beforeRead(hook: (signal?: AbortSignal) => Promise<void>) { beforeRead = hook; },
    readiness(hook?: () => ReturnType<HostedWorkforceDependencies["readiness"]>) { readinessHook = hook; },
    async get(path: string) { return fetch(`${base}${path}`); },
    async directAdmin(path: string, init: RequestInit = {}) {
      const target = new URL(`${base}${path}`);
      return new Promise<Response>((resolve, reject) => {
        const outgoing = httpRequest({ hostname: target.hostname, port: target.port, path: `${target.pathname}${target.search}`, method: init.method ?? "GET", headers: {
          host: "127.0.0.1", origin: "https://127.0.0.1", "sec-fetch-site": "same-origin", cookie: "__Host-titan-da-session=test-only",
          "x-titan-csrf": "a".repeat(43), ...(init.headers as Record<string, string> | undefined),
        } }, incoming => {
          const headers = new Headers();
          for (const [name, value] of Object.entries(incoming.headers)) {
            if (typeof value === "string") headers.set(name, value);
            else if (Array.isArray(value)) for (const item of value) headers.append(name, item);
          }
          const chunks: Buffer[] = [];
          incoming.on("data", chunk => chunks.push(Buffer.from(chunk)));
          let settled = false;
          const finish = () => {
            if (settled) return;
            settled = true;
            resolve(new Response(Buffer.concat(chunks), { status: incoming.statusCode, headers }));
          };
          incoming.on("end", finish);
          incoming.on("aborted", finish);
          incoming.on("error", reject);
        });
        outgoing.once("error", reject);
        if (typeof init.body === "string") outgoing.write(init.body);
        outgoing.end();
      });
    },
    closeHost() { return host.close(); },
    get dependencyCloseCount() { return dependencyCloseCount; },
    async restart() { await host.close(); await start(); },
    async close() { await host.close(); await Promise.all([control.close(), identity.close(), stores.a.close(), stores.b.close()]); rmSync(dir, { recursive: true, force: true }); },
  };
}

test("hosted signed identity reaches real native completion and durable accepted evidence; restart replay has one mutation", async () => {
  const f = await fixture(); try {
    const first = await f.post(); assert.equal(first.status, 200, JSON.stringify(first.body));
    assert.equal(await f.status(), "completed", JSON.stringify(first.body)); assert.equal(await f.status("b"), "in_progress");
    const runs = await f.run(); assert.equal(runs.length, 1);
    const evidence = (await f.control.query<{ payload: string }>("SELECT payload FROM evidence WHERE evidence_type='gateway_execution' ORDER BY rowid")).rows.map(row => JSON.parse(row.payload));
    assert.ok(evidence.some(item => item.state === "VERIFIED"));
    assert.ok(evidence.every(item => item.accepted_evidence?.schema === "titan.business.accepted-evidence/v1" && item.run_id === runs[0].run_id && item.company_id === "a"));
    for (const field of ["request_id", "operation_id", "correlation_id", "trace_id", "idempotency_key"] as const) {
      assert.equal(first.body[field], f.input[field]);
      assert.ok(evidence.every(item => item.provenance[field] === f.input[field]), field);
    }
    assert.ok(evidence.every(item => item.provenance.actor_id === "lead" && item.provenance.conversation_id === "conversation" && item.provenance.work_id === "zero:conversation:message"));
    await f.restart(); const replay = await f.post(); assert.equal(replay.status, 200);
    assert.equal((await f.run())[0].run_id, runs[0].run_id); assert.equal((await f.run()).length, 1);
    assert.equal((await f.stores.a.query<{ n: number }>("SELECT n FROM mutation_count")).rows[0].n, 1);
    assert.equal((await f.control.query("SELECT status FROM work_orders WHERE id='wo'")).rows[0].status, "in_progress");
    assert.ok(f.companyOpens() > 0);
    assert.equal(f.companyOpens(), f.companyCloses(), "every resolver-issued company lease closes after native reads and replay");
  } finally { await f.close(); }
});

test("placement rotation during a company read is denied before the native effect", async () => {
  const f = await fixture();
  try {
    f.beforeRead(() => f.rotatePlacement("a"));
    await f.post();
    assert.equal(await f.status(), "in_progress");
    assert.ok(f.companyOpens() > 0);
    assert.equal(f.nativeInvocations, 0);
    assert.equal((await f.stores.a.query<{ n: number }>("SELECT n FROM mutation_count")).rows[0].n, 0);
    assert.equal(await f.executionStateCount("VERIFIED"), 0);
    assert.equal(f.companyOpens(), f.companyCloses());
  } finally { await f.close(); }
});

test("placement rotation after effect admission leaves the native outcome uncertain and unaccepted", async () => {
  const f = await fixture();
  try {
    f.beforeComplete(() => f.rotatePlacement("a"));
    const response = await f.post();
    assert.equal(response.status, 200, JSON.stringify(response.body));
    assert.equal(f.nativeInvocations, 1, "an already admitted native effect may finish while its store is rotated");
    assert.equal(await f.status(), "completed", "the native mutation may have committed before the stale lease is observed");
    assert.equal((await f.stores.a.query<{ n: number }>("SELECT n FROM mutation_count")).rows[0].n, 1);
    assert.equal(await f.executionStateCount("UNCERTAIN"), 1);
    assert.equal(await f.executionStateCount("VERIFIED"), 0, "a stale placement lease cannot produce accepted evidence");
    assert.equal(f.companyOpens(), f.companyCloses());
  } finally { await f.close(); }
});

test("a registered company mismatch is rejected before a physical database is opened", async () => {
  const f = await fixture();
  try {
    f.reportWrongPlacementCompany();
    await f.post();
    assert.equal(f.companyOpens(), 0);
    assert.equal(f.nativeInvocations, 0);
    assert.equal(await f.status(), "in_progress");
    assert.equal(await f.status("b"), "in_progress");
  } finally { await f.close(); }
});

test("a persisted placement that opens another company's physical database is rejected", async () => {
  const f = await fixture();
  try {
    await f.pointCompanyAtForeignPhysicalStore();
    await f.post();
    assert.equal(f.companyOpens(), 1, "the persisted opaque placement points to an existing trusted-root file");
    assert.equal(f.companyCloses(), 1, "physical company identity failure closes the opened lease");
    assert.equal(f.nativeInvocations, 0);
    assert.equal(await f.status(), "in_progress");
    assert.equal(await f.status("b"), "in_progress");
    assert.equal(await f.executionStateCount("VERIFIED"), 0);
  } finally { await f.close(); }
});

test("identity registry outage during authentication is sanitized as 503", async () => {
  const f = await fixture();
  try {
    await f.identity.query("DROP TABLE titan_security_sessions");
    const response = await f.post();
    assert.equal(response.status, 503, JSON.stringify(response.body));
    assert.deepEqual(response.body, { error: "identity-registry-unavailable" });
    assert.equal(f.nativeInvocations, 0);
    assert.equal(await f.executionStateCount("EXECUTING"), 0);
  } finally { await f.close(); }
});

test("identity registry outage at the initial company provider lookup is sanitized as 503", async () => {
  const f = await fixture();
  try {
    let failOnSecondCurrentLookup = false;
    let currentLookups = 0;
    const wrapStorage = (storage: any): any => ({
      dialect: storage.dialect,
      async query(sql: string, params?: readonly unknown[]) {
        if (failOnSecondCurrentLookup && /SELECT \* FROM titan_security_sessions/.test(sql)) {
          currentLookups += 1;
          if (currentLookups === 2) throw new Error("test-only registry outage");
        }
        return storage.query(sql, params);
      },
      transaction<T>(operation: (tx: any) => Promise<T>, options?: unknown) {
        return storage.transaction((tx: any) => operation(wrapStorage(tx)), options);
      },
      close() { return storage.close(); },
    });
    const { createHostedRuntime } = await import("../services/workforce/src/hosted-runtime.ts");
    const { handleConversationRequest, normalizeConversationRequest } = await import("../services/workforce/src/conversation-api.ts");
    const hosted = await createHostedRuntime(f.control, wrapStorage(f.identity), f.dependencies);
    const normalized = normalizeConversationRequest(f.input);
    const auth = {
      async resolve(input: Parameters<typeof hosted.auth.resolve>[0]) {
        const context = await hosted.auth.resolve(input);
        failOnSecondCurrentLookup = true;
        return context;
      },
    };
    await assert.rejects(
      handleConversationRequest(normalized, auth, hosted.runtime, f.credential()),
      { message: "identity-registry-unavailable" },
    );
    assert.equal(currentLookups, 2, "the first current identity check passed; the initial company-provider lookup failed");
    assert.equal(f.nativeInvocations, 0);
    assert.equal(await f.status(), "in_progress");
    assert.equal(await f.executionStateCount("EXECUTING"), 0);
  } finally { await f.close(); }
});

test("identity registry outage during post-read revalidation is sanitized as 503 before effect admission", async () => {
  const f = await fixture();
  try {
    f.beforeRead(async () => { await f.identity.query("DROP TABLE titan_security_sessions"); });
    const response = await f.post();
    assert.equal(response.status, 503, JSON.stringify(response.body));
    assert.deepEqual(response.body, { error: "identity-registry-unavailable" });
    assert.equal(f.nativeInvocations, 0);
    assert.equal(await f.status(), "in_progress");
    assert.equal(await f.executionStateCount("EXECUTING"), 0);
    assert.equal(await f.executionStateCount("VERIFIED"), 0);
  } finally { await f.close(); }
});

test("identity registry outage at source-session fence is sanitized as 503 without native effect", async () => {
  const f = await fixture();
  try {
    const identity = await f.workforceZero();
    const input = { ...f.input, company_id: "a", actor_id: "lead", device_id: "device",
      session_id: identity.context.session_id, context_revision: identity.context.context_revision };
    f.beforeRead(async () => { await f.identity.query("DROP TABLE titan_security_sessions"); });
    const response = await f.post(input, identity.authorization);
    assert.equal(response.status, 503, JSON.stringify(response.body));
    assert.deepEqual(response.body, { error: "identity-registry-unavailable" });
    assert.equal(f.nativeInvocations, 0);
    assert.equal(await f.status(), "in_progress");
    assert.equal(await f.executionStateCount("VERIFIED"), 0);
  } finally { await f.close(); }
});

test("source-session callback entry does not hide a blocked control-store admission timeout", { timeout: 5000 }, async () => {
  const f = await fixture();
  let admissionStorage: ReturnType<typeof createSqliteStorage> | undefined;
  let releaseControlWriter!: () => void;
  let controlWriterEntered!: () => void;
  const controlWriterReady = new Promise<void>(resolve => { controlWriterEntered = resolve; });
  const releaseControl = new Promise<void>(resolve => { releaseControlWriter = resolve; });
  let signalAdmissionSettled!: () => void;
  const admissionSettled = new Promise<void>(resolve => { signalAdmissionSettled = resolve; });
  try {
    const identity = await f.workforceZero();
    const input = { ...f.input, company_id: "a", actor_id: "lead", device_id: "device",
      session_id: identity.context.session_id, context_revision: identity.context.context_revision };
    await f.closeHost();
    admissionStorage = createSqliteStorage(f.controlPath);
    const { createHostedRuntime } = await import("../services/workforce/src/hosted-runtime.ts");
    const { normalizeConversationRequest } = await import("../services/workforce/src/conversation-api.js");
    const hosted = await createHostedRuntime(admissionStorage, f.identity, f.dependencies);
    const authenticated = await hosted.auth.resolve({ request: normalizeConversationRequest(input), authorization: identity.authorization });
    const runId = "control-admission-timeout-run";
    const workId = "control-admission-timeout-work";
    const updatedAt = new Date().toISOString();
    const run = {
      run_id: runId, company_id: "a", actor_id: "lead", agent_id: "manager", role: "agent",
      conversation_id: input.conversation_id, work_id: workId, authenticated_identity: authenticated.authenticated_identity,
      session_id: authenticated.session_id, context_revision: authenticated.context_revision,
      state: "RUNNING", updated_at: updatedAt,
    };
    await admissionStorage.query(
      "INSERT INTO agent_runs(company_id,run_id,state,conversation_id,agent_id,work_id,payload,updated_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8)",
      ["a", runId, run.state, run.conversation_id, run.agent_id, workId, JSON.stringify(run), updatedAt],
    );

    // A second real SQLite connection holds the control-store writer lock. The
    // current-session fence can enter its callback, but the nested admission
    // transaction cannot acquire that store before the shared deadline.
    const held = f.control.transaction(async () => {
      controlWriterEntered();
      await releaseControl;
    });
    await controlWriterReady;
    let callbackEntered = false;
    let admissionTransactionEntered = false;
    let nativeInvocations = 0;
    const admissionInput = { company_id: "a", actor_id: "lead", run_id: runId, work_id: workId };
    const failure = await hosted.sessionAdmission(
      admissionInput,
      async ({ acquire_deadline_ms }) => {
        callbackEntered = true;
        try {
          await admissionStorage!.transaction(async () => { admissionTransactionEntered = true; }, { acquireDeadlineMs: acquire_deadline_ms });
          nativeInvocations += 1; // the provider boundary follows successful admission
        } finally { signalAdmissionSettled(); }
      },
    ).then(() => null, error => error);

    assert.equal(callbackEntered, true, "the source-session fence callback entered before control-store admission");
    assert.ok(failure instanceof Error, "the blocked control-store admission is rejected");
    assert.equal(conversationHttpStatus(failure.message), 503, failure.message);
    assert.ok(["identity-registry-unavailable", "zero-execution-admission-unavailable"].includes(failure.message), failure.message);

    releaseControlWriter();
    await held;
    await admissionSettled;
    assert.equal(admissionTransactionEntered, false, "the bounded transaction callback never acquired the SQLite writer lock");
    assert.equal(nativeInvocations, 0, "provider entry remains blocked until durable admission succeeds");
    assert.equal(await f.executionStateCount("EXECUTING"), 0, "no EXECUTING transition committed");
    assert.equal(await f.executionStateCount("VERIFIED"), 0, "no accepted operation was recorded");
    assert.equal(await f.status(), "in_progress", "the company business store was not mutated");
    assert.equal((await f.stores.a.query<{ n: number }>("SELECT n FROM mutation_count")).rows[0].n, 0);

    const classifiedControlTimeout = await hosted.sessionAdmission(admissionInput, async () => {
      throw new Error("storage-transaction-acquire-timeout");
    }).then(() => null, error => error);
    assert.ok(classifiedControlTimeout instanceof Error);
    assert.equal(classifiedControlTimeout.message, "zero-execution-admission-unavailable");
    assert.equal(conversationHttpStatus(classifiedControlTimeout.message), 503);
  } finally {
    releaseControlWriter();
    await admissionStorage?.close();
    await f.close();
  }
});

test("pre-admission fence timeout still surfaces as 503 after gateway recovery", { timeout: 5000 }, async () => {
  const f = await fixture();
  let admissionReached!: () => void;
  let admissionDelayCompleted!: () => void;
  const admissionStarted = new Promise<void>(resolve => { admissionReached = resolve; });
  const admissionFinished = new Promise<void>(resolve => { admissionDelayCompleted = resolve; });
  let blockedExecutingEvidence = false;
  try {
    const identity = await f.workforceZero();
    const input = { ...f.input, company_id: "a", actor_id: "lead", device_id: "device",
      session_id: identity.context.session_id, context_revision: identity.context.context_revision };
    await f.closeHost();
    const { createHostedRuntime } = await import("../services/workforce/src/hosted-runtime.ts");
    const { handleConversationRequest, normalizeConversationRequest } = await import("../services/workforce/src/conversation-api.js");
    const delayedControl: any = {
      dialect: f.control.dialect,
      query: (sql: string, params?: readonly unknown[]) => f.control.query(sql, params),
      transaction(operation: (tx: any) => Promise<unknown>, options?: unknown) {
        return f.control.transaction((tx: any) => operation(Object.assign(Object.create(tx), {
          async query(sql: string, params: readonly unknown[] = []) {
            if (!blockedExecutingEvidence && sql.startsWith("INSERT INTO evidence") && params[4] === "gateway_execution") {
              const evidence = JSON.parse(String(params[6] ?? "{}"));
              if (evidence.state === "EXECUTING") {
                blockedExecutingEvidence = true;
                admissionReached();
                // Stay inside the real SQLite control transaction beyond the
                // 500 ms source-session fence while the durable admission row
                // is pending. The fence signal must make the transaction roll
                // back before the native provider can be called.
                await new Promise(resolve => setTimeout(resolve, 650));
                admissionDelayCompleted();
              }
            }
            return tx.query(sql, params);
          },
        })), options as any);
      },
      close: async () => {},
    };
    const hosted = await createHostedRuntime(delayedControl, f.identity, f.dependencies);
    const failure = await handleConversationRequest(
      normalizeConversationRequest(input), hosted.auth, hosted.runtime as any, identity.authorization,
    ).then(() => null, error => error);

    assert.equal(blockedExecutingEvidence, true, "the actual governed admission transaction reached its durable transition");
    assert.ok(failure instanceof Error, "gateway recovery does not convert the pre-admission timeout into success");
    assert.equal(conversationHttpStatus(failure.message), 503, failure.message);
    assert.ok(["identity-registry-unavailable", "zero-execution-admission-unavailable"].includes(failure.message), failure.message);
    await admissionStarted;
    await admissionFinished;
    assert.equal(f.nativeInvocations, 0, "the native provider remained behind the unsuccessful admission fence");
    assert.equal(await f.executionStateCount("EXECUTING"), 0, "the pending EXECUTING transaction rolled back");
    assert.equal(await f.executionStateCount("VERIFIED"), 0, "the timeout cannot create accepted evidence");
    assert.equal(await f.status(), "in_progress", "the company work order is unchanged");
    assert.equal((await f.stores.a.query<{ n: number }>("SELECT n FROM mutation_count")).rows[0].n, 0);
  } finally { await f.close(); }
});

test("canonical DA-derived Zero identity is persisted, fenced and replayed through native accepted evidence", async () => {
  const f = await fixture();
  try {
    const identity = await f.workforceZero();
    const input = { ...f.input, company_id: "a", actor_id: "lead", device_id: "device",
      session_id: identity.context.session_id, context_revision: identity.context.context_revision };
    const first = await f.post(input, identity.authorization);
    assert.equal(first.status, 200, JSON.stringify(first.body));
    assert.equal(await f.status(), "completed");
    assert.equal(f.nativeInvocations, 1);
    const runs = await f.run();
    assert.equal(runs.length, 1);
    assert.equal(runs[0].authenticated_identity.source_session.session_id, identity.da.context.session_id);
    assert.equal(runs[0].authenticated_identity.source_session.company_id, "a");
    assert.equal(typeof runs[0].authenticated_identity.credential_expires_at, "string");
    const evidence = (await f.control.query<{ payload: string }>("SELECT payload FROM evidence WHERE evidence_type='gateway_execution' AND json_extract(payload,'$.state')='VERIFIED'")).rows.map(row => JSON.parse(row.payload));
    assert.equal(evidence.length, 1);
    assert.equal(evidence[0].accepted_evidence.schema, "titan.business.accepted-evidence/v1");
    assert.equal(evidence[0].run_id, runs[0].run_id);

    await f.restart();
    const replay = await f.post(input, identity.authorization);
    assert.equal(replay.status, 200, JSON.stringify(replay.body));
    assert.equal((await f.run())[0].run_id, runs[0].run_id);
    assert.equal(f.nativeInvocations, 1, "restart replay observes the stored source proof and never repeats native work");
  } finally { await f.close(); }
});

test("signed Workforce child revocation and company changes fail before a fenced effect", { timeout: 5000 }, async () => {
  for (const change of ["source-revoke", "child-revoke", "company-switch"] as const) {
    const f = await fixture();
    try {
      const identity = await f.workforceZero();
      const { createHostedRuntime } = await import("../services/workforce/src/hosted-runtime.ts");
      const hosted = await createHostedRuntime(f.control, f.identity, f.dependencies);
      const credential = identity.authorization.slice("Bearer ".length);
      const child = {
        schema: "titan.workforce-zero.session/v1" as const, audience: "workforce" as const, surface: "zero" as const,
        actor_id: identity.workforce.context.actor_id, company_id: identity.workforce.context.company_id,
        company_ids: [identity.workforce.context.company_id], device_id: identity.workforce.context.device_id,
        session_id: identity.workforce.context.session_id, context_revision: identity.workforce.context.context_revision,
        session_revision: identity.workforce.context.session_revision,
        expires_at: Date.parse(identity.workforce.context.expires_at),
      };
      if (change === "source-revoke") {
        await f.registry.revokeSession(identity.da.context.session_id, identity.da.context.session_revision);
      } else if (change === "child-revoke") {
        await f.registry.revokeSession(identity.workforce.context.session_id, identity.workforce.context.session_revision);
      } else {
        await identity.sourceService.switchCompany(identity.da.credential, { company_id: "a", device_id: "device" }, "b");
      }
      let effects = 0;
      await assert.rejects(() => hosted.runtime.withWorkforceZeroSessionFence(credential, child, undefined, () => { effects += 1; }),
        /conversation-authentication-failed|runtime-authentication-required/);
      assert.equal(effects, 0, `${change} must reject before the effect callback`);
    } finally { await f.close(); }
  }
});

test("signed Workforce child fence serializes the native admission callback before source revocation", { timeout: 5000 }, async () => {
  const f = await fixture();
  try {
    const identity = await f.workforceZero();
    const { createHostedRuntime } = await import("../services/workforce/src/hosted-runtime.ts");
    const hosted = await createHostedRuntime(f.control, f.identity, f.dependencies);
    const credential = identity.authorization.slice("Bearer ".length);
    const child = {
      schema: "titan.workforce-zero.session/v1" as const, audience: "workforce" as const, surface: "zero" as const,
      actor_id: identity.workforce.context.actor_id, company_id: identity.workforce.context.company_id,
      company_ids: [identity.workforce.context.company_id], device_id: identity.workforce.context.device_id,
      session_id: identity.workforce.context.session_id, context_revision: identity.workforce.context.context_revision,
      session_revision: identity.workforce.context.session_revision,
      expires_at: Date.parse(identity.workforce.context.expires_at),
    };
    let entered!: () => void;
    let release!: () => void;
    const effectEntered = new Promise<void>(resolve => { entered = resolve; });
    const releaseEffect = new Promise<void>(resolve => { release = resolve; });
    let effects = 0;
    const fenced = hosted.runtime.withWorkforceZeroSessionFence(credential, child, undefined, async signal => {
      entered();
      await releaseEffect;
      signal.throwIfAborted();
      effects += 1;
      return "admitted";
    });
    await effectEntered;
    let revoked = false;
    const revocation = f.registry.revokeSession(identity.da.context.session_id, identity.da.context.session_revision)
      .then(() => { revoked = true; });
    await new Promise(resolve => setTimeout(resolve, 25));
    assert.equal(revoked, false, "the registry revoke waits behind the bounded child-session fence");
    release();
    assert.equal(await fenced, "admitted");
    await revocation;
    assert.equal(effects, 1);
    await assert.rejects(() => hosted.runtime.withWorkforceZeroSessionFence(credential, child, undefined, () => { effects += 1; }),
      /conversation-authentication-failed|runtime-authentication-required/);
    assert.equal(effects, 1, "after serialized revocation the same signed child cannot enter a second effect");
  } finally { await f.close(); }
});

async function startTimedOutSourceDerivedRun(f: Awaited<ReturnType<typeof fixture>>) {
  let enter!: () => void;
  let release!: () => void;
  let leave!: () => void;
  const entered = new Promise<void>(resolve => { enter = resolve; });
  const blocked = new Promise<void>(resolve => { release = resolve; });
  const exited = new Promise<void>(resolve => { leave = resolve; });
  const identity = await f.workforceZero();
  const input = { ...f.input, company_id: "a", actor_id: "lead", device_id: "device",
    session_id: identity.context.session_id, context_revision: identity.context.context_revision };
  f.beforeComplete(async signal => {
    enter();
    try { await blocked; } finally { leave(); }
    signal?.throwIfAborted();
  });
  const response = await f.post(input, identity.authorization);
  assert.equal(response.status, 200, JSON.stringify(response.body));
  assert.ok(response.body.continuation_token);
  await entered;
  assert.equal(await f.executionStateCount("UNCERTAIN"), 1);
  return { identity, input, response, release, exited };
}

for (const lineage of ["missing", "malformed", "null"] as const) test(`restored source-derived run with ${lineage} lineage fails closed before recovery admission`, { timeout: 5000 }, async () => {
  const f = await fixture({ adapterTimeoutMs: 30 });
  const pending = await startTimedOutSourceDerivedRun(f);
  try {
    pending.release();
    await pending.exited;
    await new Promise<void>(resolve => setTimeout(resolve, 25));
    assert.equal(f.nativeInvocations, 0);
    await f.restart();
    const restored = await f.post(pending.input, pending.identity.authorization);
    assert.ok(restored.body.continuation_token);
    const run = (await f.run())[0];
    assert.equal(run.authenticated_identity.source_session_required, true);
    assert.equal(run.authenticated_identity.session_proof_type, "titan.workforce.source-session/v1");
    if (lineage === "missing") delete run.authenticated_identity.source_session;
    else if (lineage === "null") run.authenticated_identity.source_session = null;
    else run.authenticated_identity.source_session = { ...run.authenticated_identity.source_session, schema: "invalid-session-source/v1" };
    await f.control.query("UPDATE agent_runs SET payload=$1 WHERE company_id='a' AND run_id=$2", [JSON.stringify(run), run.run_id]);
    const observed = await f.post({ ...pending.input, action: "resume", continuation_token: restored.body.continuation_token }, pending.identity.authorization);
    assert.notEqual(observed.status, 200, JSON.stringify(observed.body));
    assert.equal(f.nativeInvocations, 0, `${lineage} durable lineage is rejected before any recovery provider call`);
    assert.equal((await f.stores.a.query<{ n: number }>("SELECT n FROM mutation_count")).rows[0].n, 0);
    assert.equal((await f.run())[0].state, "WAITING_EXTERNAL");
    assert.equal(await f.executionStateCount("VERIFIED"), 0);
    assert.equal(await f.executionStateCount("UNCERTAIN"), 1);
  } finally { pending.release(); await f.close(); }
});

for (const change of ["source-revoke", "source-company-switch"] as const) test(`restored source-derived run rejects ${change} after restart before recovery`, { timeout: 5000 }, async () => {
  const f = await fixture({ adapterTimeoutMs: 30 });
  const pending = await startTimedOutSourceDerivedRun(f);
  try {
    pending.release();
    await pending.exited;
    await new Promise<void>(resolve => setImmediate(resolve));
    await f.restart();
    if (change === "source-revoke") {
      await f.registry.revokeSession(pending.identity.da.context.session_id, pending.identity.da.context.session_revision);
    } else {
      await pending.identity.sourceService.switchCompany(pending.identity.da.credential, { company_id: "a", device_id: "device" }, "b");
    }
    const observed = await f.post({ ...pending.input, action: "resume", continuation_token: pending.response.body.continuation_token }, pending.identity.authorization);
    assert.equal(observed.status, 401, JSON.stringify(observed.body));
    assert.equal(f.nativeInvocations, 0);
    assert.equal((await f.stores.a.query<{ n: number }>("SELECT n FROM mutation_count")).rows[0].n, 0);
    assert.equal(await f.executionStateCount("VERIFIED"), 0);
    assert.equal(await f.executionStateCount("UNCERTAIN"), 1);
    assert.equal(await f.status(), "in_progress");
  } finally { pending.release(); await f.close(); }
});

test("legacy ordinary session replays and continues after proof-type upgrade and restart", { timeout: 5000 }, async () => {
  const f = await fixture();
  try {
    const originalInput = { ...f.input, text: "What should happen next?" };
    const initial = await f.post({ text: originalInput.text });
    assert.equal(initial.status, 200, JSON.stringify(initial.body));
    assert.ok(initial.body.continuation_token);
    const runRow = (await f.control.query<{ payload: string }>("SELECT payload FROM agent_runs WHERE company_id='a'")).rows[0]!;
    const run = JSON.parse(runRow.payload);
    assert.equal(run.authenticated_identity.session_proof_type, "titan.workforce.session/v1");
    delete run.authenticated_identity.session_proof_type;
    await f.control.query("UPDATE agent_runs SET payload=$1 WHERE company_id='a' AND run_id=$2", [JSON.stringify(run), run.run_id]);
    const workRow = (await f.control.query<{ payload: string }>("SELECT payload FROM workforce_work_items WHERE company_id='a' AND work_id='zero:conversation:message'")).rows[0]!;
    const work = JSON.parse(workRow.payload);
    delete work.origin.authenticated_identity.session_proof_type;
    const correlationKeys = ["request_id", "operation_id", "trace_id", "idempotency_key", "session_id", "context_revision", "authenticated_identity"] as const;
    const legacyCorrelation = Object.fromEntries(correlationKeys
      .filter(key => work.origin[key] !== undefined)
      .map(key => [key, key === "authenticated_identity"
        ? Object.fromEntries(Object.entries(work.origin.authenticated_identity).sort(([a], [b]) => a.localeCompare(b)))
        : work.origin[key]]));
    work.origin.dispatch_fingerprint = createHash("sha256").update(JSON.stringify({
      text: work.objective, interaction_id: originalInput.interaction_id, correlation_id: work.origin.correlation_id,
      requested_agent_id: null, ...legacyCorrelation,
    })).digest("hex");
    await f.control.query("UPDATE workforce_work_items SET payload=$1 WHERE company_id='a' AND work_id='zero:conversation:message'", [JSON.stringify(work)]);

    await f.restart();
    const replay = await f.post({ text: originalInput.text });
    assert.equal(replay.status, 200, JSON.stringify(replay.body));
    assert.ok(replay.body.continuation_token);
    const resumed = await f.post({ action: "continue", continuation_token: replay.body.continuation_token,
      client_message_id: "legacy-reply", interaction_id: "legacy-reply-interaction", text: "complete work order wo" });
    assert.equal(resumed.status, 200, JSON.stringify(resumed.body));
    assert.equal(await f.status(), "completed");
    assert.equal(f.nativeInvocations, 1);
    assert.equal((await f.stores.a.query<{ n: number }>("SELECT n FROM mutation_count")).rows[0].n, 1);
  } finally { await f.close(); }
});

test("host rejects missing, forged, wrong-audience and caller-altered bound identity before creating work", async () => {
  const f = await fixture(); try {
    assert.equal((await f.post({}, null)).status, 401);
    const original = f.credential().slice("Bearer ".length).split(".");
    const tampered = Buffer.from(JSON.stringify({ ...f.claims, subject: "forged-subject" })).toString("base64url");
    const rejection = await f.post({}, `Bearer ${tampered}.${original[1]}`);
    assert.equal(rejection.status, 401);
    assert.deepEqual(rejection.body, { error: "conversation-authentication-failed" });
    assert.ok(!JSON.stringify(rejection.body).includes(original[1]));
    assert.equal((await f.post({}, f.credential({ audience: "other" }))).status, 401);
    assert.equal((await f.post({}, f.credential({ source_session: null }))).status, 401, "malformed lineage cannot be normalized into an ordinary session");
    for (const field of ["company_id", "actor_id", "device_id", "session_id", "context_revision", "surface"]) {
      const response = await f.post({ [field]: field === "surface" ? "hub" : "foreign" }); assert.ok([401, 409].includes(response.status), `${field}: ${JSON.stringify(response)}`);
    }
    assert.equal((await f.run()).length, 0); assert.equal(await f.status(), "in_progress");
  } finally { await f.close(); }
});

for (const mode of ["revoke", "switch"] as const) test(`host rejects ${mode === "revoke" ? "revoked" : "company-switched"} session after restart and prevents pending native effect`, async () => {
  const f = await fixture(); try {
    await f.authority.appendApproval({ company_id: "a", ...f.envelope.approval, approval_id: "zz-pending", status: "pending" });
    const waiting = await f.post(); assert.equal(waiting.status, 200); assert.ok(waiting.body.continuation_token);
    if (mode === "revoke") await f.registry.revokeSession("session", 1);
    else await f.registry.switchCompany(f.claims, { audience: "workforce", company_id: "a", actor_id: "lead", context_revision: f.context.context_revision }, "b", new Date().toISOString());
    await f.restart();
    const response = await f.post({ action: "continue", text: "continue", continuation_token: waiting.body.continuation_token });
    assert.equal(response.status, 401); assert.equal(await f.status(), "in_progress"); assert.equal(await f.status("b"), "in_progress");
  } finally { await f.close(); }
});

test("current session revocation during authority evaluation prevents native mutation", async () => {
  const f = await fixture(); try {
    f.beforeRead(() => f.registry.revokeSession("session", 1));
    await f.post(); assert.equal(await f.status(), "in_progress");
    const rows = await f.control.query("SELECT id FROM evidence WHERE evidence_type='gateway_execution' AND json_extract(payload,'$.state')='VERIFIED'"); assert.equal(rows.rowCount, 0);
  } finally { await f.close(); }
});

test("authenticated cancellation is durable and continuation replay cannot execute native completion", async () => {
  const f = await fixture(); try {
    await f.authority.appendApproval({ company_id: "a", ...f.envelope.approval, approval_id: "zz-pending", status: "pending" });
    const waiting = await f.post(); assert.ok(waiting.body.continuation_token);
    const cancellationRequest = {
      action: "cancel", continuation_token: waiting.body.continuation_token, text: undefined,
      interaction_id: "cancel-interaction", client_message_id: "cancel-message",
      request_id: "cancel-request", operation_id: "cancel-operation", trace_id: "cancel-trace",
      correlation_id: "cancel-correlation", idempotency_key: "cancel-idempotency",
    };
    const cancelled = await f.post(cancellationRequest); assert.equal(cancelled.status, 200, JSON.stringify(cancelled.body));
    const cancellationEvent = cancelled.body.events.find((event: { kind?: string }) => event.kind === "run.cancelled");
    assert.ok(cancellationEvent, "the cancellation transition emits its own lifecycle event");
    for (const field of ["interaction_id", "client_message_id", "request_id", "operation_id", "trace_id", "correlation_id", "idempotency_key"] as const) {
      assert.equal(cancellationEvent[field], cancellationRequest[field], field);
    }

    await f.restart(); await f.authority.appendApproval({ company_id: "a", ...f.envelope.approval, approval_id: "zzz-approved", status: "approved" });
    const durable = (await f.run())[0];
    assert.equal(durable.state, "CANCELLED");
    assert.deepEqual({
      actor_id: durable.cancellation.actor_id,
      interaction_id: durable.cancellation.interaction_id,
      client_message_id: durable.cancellation.client_message_id,
      request_id: durable.cancellation.request_id,
      operation_id: durable.cancellation.operation_id,
      trace_id: durable.cancellation.trace_id,
      correlation_id: durable.cancellation.correlation_id,
      idempotency_key: durable.cancellation.idempotency_key,
      session_id: durable.cancellation.session_id,
      context_revision: durable.cancellation.context_revision,
    }, {
      actor_id: "lead", interaction_id: cancellationRequest.interaction_id,
      client_message_id: cancellationRequest.client_message_id, request_id: cancellationRequest.request_id,
      operation_id: cancellationRequest.operation_id, trace_id: cancellationRequest.trace_id,
      correlation_id: cancellationRequest.correlation_id, idempotency_key: cancellationRequest.idempotency_key,
      session_id: f.input.session_id, context_revision: f.input.context_revision,
    });
    assert.equal(durable.cancellation.reason, "cancelled-by-client");
    assert.ok(Number.isFinite(Date.parse(durable.cancellation.requested_at)));

    const replay = await f.post(cancellationRequest);
    assert.equal(replay.status, 200, JSON.stringify(replay.body));
    assert.deepEqual((await f.run())[0].cancellation, durable.cancellation, "replaying a terminal cancel does not replace the durable receipt");
    await f.post({ action: "continue", continuation_token: waiting.body.continuation_token, text: "continue" });
    assert.equal(await f.status(), "in_progress"); assert.equal((await f.run())[0].state, "CANCELLED");
  } finally { await f.close(); }
});

// Startup configuration is operator-owned; a client cannot manufacture it.
test("host launcher rejects absent, relative or malformed dependency factories before listening", async () => {
  const { loadWorkforceDependencies } = await import("../services/workforce/src/server.ts");
  await assert.rejects(() => loadWorkforceDependencies(""), /workforce-dependencies-module-required/);
  await assert.rejects(() => loadWorkforceDependencies("relative.mjs"), /workforce-dependencies-module-required/);
  const dir = mkdtempSync(join(tmpdir(), "titan-host-config-"));
  try {
    const { writeFileSync } = await import("node:fs");
    const file = join(dir, "invalid.mjs");
    writeFileSync(file, "export const createWorkforceDependencies = async () => ({});\n");
    await assert.rejects(() => loadWorkforceDependencies(file), /workforce-dependencies-invalid/);
    const unplaced = join(dir, "unplaced.mjs");
    writeFileSync(unplaced, `export const createWorkforceDependencies = async () => ({
      identityStoragePath: "/tmp/identity.db",
      credentialVerifier: { async verify() { return {}; } },
      workOrders: { async read() { return null; }, async complete() { return null; } },
      readiness: async () => ({ authentication: true, authority: true, provider: true, evidence: true }),
    });\n`);
    await assert.rejects(() => loadWorkforceDependencies(unplaced), /workforce-dependencies-invalid/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test("host mounts only an injected Fetch gateway and keeps absent DirectAdmin bridge read-only", async () => {
  const unavailable = await fixture();
  try {
    const response = await unavailable.directAdmin("/v1/directadmin/titan_workforce/projection");
    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), { error: "directadmin-gateway-not-configured", read_only: true });
  } finally { await unavailable.close(); }

  let suppliedOwners: unknown;
  let forwarded: { url: string; cookie: string | null; authorization: string | null; bootstrapCsrf: string | null; body: string } | undefined;
  const configured = await fixture({ directAdmin: {
    publicOrigin: "https://127.0.0.1",
    createGateway(owners) {
      suppliedOwners = owners;
      return async request => {
        forwarded = { url: request.url, cookie: request.headers.get("cookie"), authorization: request.headers.get("authorization"),
          bootstrapCsrf: request.headers.get("x-titan-da-bootstrap-csrf"), body: await request.text() };
        return new Response("test-only SDK adapter", { status: 418, headers: { "x-test-sdk-handler": "mounted" } });
      };
    },
  } });
  try {
    const response = await configured.directAdmin("/v1/directadmin/titan_workforce/intents", {
      method: "POST", headers: { "content-type": "application/json", authorization: "Bearer workforce-token-must-not-cross" }, body: "{\"test\":true}",
    });
    assert.equal(response.status, 418, await response.text());
    assert.equal(response.headers.get("x-test-sdk-handler"), "mounted");
    assert.equal(typeof (suppliedOwners as any)?.projection, "function");
    assert.equal(typeof (suppliedOwners as any)?.requestIntent, "function");
    assert.deepEqual(forwarded, { url: "https://127.0.0.1/v1/directadmin/titan_workforce/intents",
      cookie: "__Host-titan-da-session=test-only", authorization: null, bootstrapCsrf: null, body: "{\"test\":true}" });
    const bootstrap = await configured.directAdmin("/v1/directadmin/bootstrap", { method: "POST", headers: {
      authorization: "Basic directadmin-proof", "x-titan-da-bootstrap-csrf": "b".repeat(43),
    } });
    assert.equal(bootstrap.status, 418);
    assert.deepEqual(forwarded, { url: "https://127.0.0.1/v1/directadmin/bootstrap",
      cookie: "__Host-titan-da-session=test-only", authorization: null,
      bootstrapCsrf: "b".repeat(43), body: "" });
    const bootstrapWithQuery = await configured.directAdmin("/v1/directadmin/bootstrap?unexpected=1", { method: "POST", headers: {
      "x-titan-da-bootstrap-csrf": "c".repeat(43),
    } });
    assert.equal(bootstrapWithQuery.status, 418);
    assert.equal(forwarded?.bootstrapCsrf, null, "the nonce is not forwarded for query-bearing near-miss paths");
  } finally { await configured.close(); }
});

test("DirectAdmin gateway timeout aborts the Fetch request and does not hold shutdown", async () => {
  let gatewaySignal: AbortSignal | undefined;
  const f = await fixture({ adapterTimeoutMs: 30, directAdmin: {
    publicOrigin: "https://127.0.0.1",
    createGateway() { return async request => { gatewaySignal = request.signal; return new Promise<Response>(() => {}); }; },
  } });
  try {
    const started = Date.now();
    const response = await f.directAdmin("/v1/directadmin/titan_workforce/projection");
    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), { error: "directadmin-gateway-unavailable", read_only: true });
    assert.ok(Date.now() - started < 1000);
    assert.equal(gatewaySignal?.aborted, true);
    await f.closeHost();
  } finally { await f.close(); }
});

test("DirectAdmin Fetch response stream failure closes an already-started response safely", async () => {
  const f = await fixture({ directAdmin: {
    publicOrigin: "https://127.0.0.1",
    createGateway() { return async () => new Response(new ReadableStream<Uint8Array>({
      start(controller) { controller.enqueue(new TextEncoder().encode("partial")); queueMicrotask(() => controller.error(new Error("injected-stream-failure"))); },
    }), { status: 200 }); },
  } });
  try {
    await assert.rejects(() => f.directAdmin("/v1/directadmin/titan_workforce/projection"),
      (error: unknown) => (error as NodeJS.ErrnoException).code === "ECONNRESET");
    assert.equal((await f.get("/health")).status, 200);
  } finally { await f.close(); }
});

test("shutdown waits for in-flight provider work and closes dependencies once", async () => {
  const f = await fixture();
  let enter!: () => void; let release!: () => void;
  const entered = new Promise<void>(resolve => { enter = resolve; });
  const released = new Promise<void>(resolve => { release = resolve; });
  try {
    f.beforeRead(async () => { enter(); await released; });
    const pending = f.post(); await entered;
    let closed = false;
    const closing = f.closeHost().then(() => { closed = true; });
    assert.equal(f.closeHost(), f.closeHost());
    await new Promise<void>(resolve => setImmediate(resolve));
    assert.equal(closed, false); assert.equal(f.dependencyCloseCount, 0);
    release();
    assert.equal((await pending).status, 200); await closing;
    assert.equal(f.dependencyCloseCount, 1); assert.equal(await f.status(), "completed");
  } finally { release(); await f.close(); }
});

test("host readiness rejects degraded dependencies and bounds a coalesced stalled probe while liveness survives", async () => {
  const f = await fixture(); let release!: () => void;
  try {
    assert.equal((await f.get("/ready")).status, 200);
    for (const field of ["authority", "provider"] as const) {
      f.readiness(async () => ({ authentication: true, authority: true, provider: true, evidence: true, [field]: false }));
      const response = await f.get("/ready"); assert.equal(response.status, 503);
      assert.equal((await response.json() as any).checks[field], "fail");
    }
    let probes = 0;
    const blocked = new Promise<void>(resolve => { release = resolve; });
    f.readiness(async () => { probes += 1; await blocked; return { authentication: true, authority: true, provider: true, evidence: true }; });
    const started = Date.now();
    const responses = await Promise.all([f.get("/ready"), f.get("/ready")]);
    assert.ok(Date.now() - started < 2500, "readiness must bound stalled dependencies");
    assert.ok(responses.every(response => response.status === 503)); assert.equal(probes, 1);
    assert.equal((await f.get("/health")).status, 200);
    release(); await new Promise<void>(resolve => setImmediate(resolve)); f.readiness();
    assert.equal((await f.get("/ready")).status, 200);
  } finally { release?.(); await f.close(); }
});

test("permanently hung credential verification times out, aborts and creates no work", { timeout: 5000 }, async () => {
  const f = await fixture({ adapterTimeoutMs: 30 }); let adapterSignal: AbortSignal | undefined;
  try {
    f.beforeVerify(async signal => { adapterSignal = signal; await new Promise<void>(() => {}); });
    const started = Date.now(); const response = await f.post();
    assert.equal(response.status, 401); assert.ok(Date.now() - started < 1000);
    assert.equal(adapterSignal?.aborted, true); assert.equal((await f.run()).length, 0);
    assert.equal(await f.status(), "in_progress");
  } finally { await f.close(); }
});

for (const adapter of ["read", "complete"] as const) test(`shutdown deadline aborts hung native ${adapter} and late release cannot complete`, { timeout: 5000 }, async () => {
  const f = await fixture({ adapterTimeoutMs: 2000, shutdownTimeoutMs: 50 });
  let enter!: () => void; let release!: () => void; let adapterSignal: AbortSignal | undefined;
  const entered = new Promise<void>(resolve => { enter = resolve; });
  const blocked = new Promise<void>(resolve => { release = resolve; });
  let invocations = 0;
  const hook = async (signal?: AbortSignal) => { invocations += 1; adapterSignal = signal; enter(); await blocked; };
  try {
    if (adapter === "read") f.beforeRead(hook); else f.beforeComplete(hook);
    const pending = f.post().catch(error => ({ disconnected: true, error })); await entered;
    const started = Date.now(); await f.closeHost();
    assert.ok(Date.now() - started < 1000, "shutdown must bound hung adapter");
    assert.equal(adapterSignal?.aborted, true); await pending;
    release(); await new Promise<void>(resolve => setImmediate(resolve));
    assert.equal(await f.status(), "in_progress");
    assert.equal((await f.control.query("SELECT id FROM evidence WHERE evidence_type='gateway_execution' AND json_extract(payload,'$.state')='VERIFIED'")).rowCount, 0);
    if (adapter === "complete") {
      assert.equal((await f.run())[0].state, "WAITING_EXTERNAL");
      assert.ok((await f.control.query("SELECT id FROM evidence WHERE evidence_type='gateway_execution' AND json_extract(payload,'$.state')='UNCERTAIN'")).rowCount > 0);
      await f.restart(); const restored = await f.post();
      assert.ok(restored.body.continuation_token);
      const observed = await f.post({ action: "resume", continuation_token: restored.body.continuation_token });
      assert.equal(observed.status, 200, JSON.stringify(observed.body));
      assert.equal((await f.run())[0].state, "WAITING_EXTERNAL");
      assert.equal(invocations, 1, "uncertain execution must never replay the provider mutation");
      assert.equal(await f.status(), "in_progress");
    }
  } finally { release(); await f.close(); }
});

test("readiness replaces a timed-out probe without waiting for the old adapter promise", { timeout: 5000 }, async () => {
  const f = await fixture();
  try {
    f.readiness(async () => new Promise<never>(() => {}));
    const response = await f.get("/ready"); assert.equal(response.status, 503);
    f.readiness();
    const recovered = await f.get("/ready"); assert.equal(recovered.status, 200);
    assert.equal((await f.get("/health")).status, 200);
  } finally { await f.close(); }
});

test("readiness retries stay available while the slow provider runs outside storage locks", { timeout: 7000 }, async () => {
  const f = await fixture({ adapterTimeoutMs: 5000, shutdownTimeoutMs: 6000 });
  let enter!: () => void; let release!: () => void;
  const entered = new Promise<void>(resolve => { enter = resolve; });
  const blocked = new Promise<void>(resolve => { release = resolve; });
  let dependencyProbes = 0;
  let execution: Promise<{ status: number; body: unknown }> | undefined;
  try {
    f.beforeComplete(async () => { enter(); await blocked; });
    execution = f.post();
    await entered;
    f.readiness(async () => { dependencyProbes += 1; return { authentication: true, authority: true, provider: true, evidence: true }; });

    for (let attempt = 0; attempt < 3; attempt += 1) {
      const started = Date.now();
      const ready = await f.get("/ready");
      assert.equal(ready.status, 200);
      assert.ok(Date.now() - started < 1500, "readiness remains bounded while the provider runs outside writer locks");
    }
    assert.equal(dependencyProbes, 3);
    assert.equal((await f.get("/health")).status, 200);

    release();
    assert.equal((await execution!).status, 200);
    const recovered = await f.get("/ready");
    assert.equal(recovered.status, 200);
    assert.equal(dependencyProbes, 4);
  } finally {
    release();
    if (execution) await execution;
    await f.close();
  }
});

for (const alias of ["symlink", "hardlink", "directory-symlink"] as const) test(`host rejects identity/control physical ${alias} alias before migration`, async () => {
  const { createWorkforceServer } = await import("../services/workforce/src/server.ts");
  const { symlinkSync, linkSync } = await import("node:fs");
  const dir = mkdtempSync(join(tmpdir(), "titan-identity-alias-"));
  const storagePath = join(dir, "existing.db");
  const db = new Database(storagePath);
  db.exec("CREATE TABLE operator_marker(id INTEGER PRIMARY KEY); INSERT INTO operator_marker VALUES(1)"); db.close();
  let identityStoragePath = join(dir, "identity.db");
  if (alias === "symlink") symlinkSync(storagePath, identityStoragePath);
  else if (alias === "hardlink") linkSync(storagePath, identityStoragePath);
  else { symlinkSync(dir, join(dir, "alias")); identityStoragePath = join(dir, "alias", "existing.db"); }
  try {
    const unavailable = async (): Promise<never> => { throw new Error("must-not-call-adapter"); };
    await assert.rejects(() => createWorkforceServer({ storagePath, dependencies: {
      identityStoragePath, credentialVerifier: { verify: unavailable },
      companyPlacementRegistry: { findByCompanyId: unavailable },
      companyStoreOpener: { open: unavailable },
      workOrders: { read: unavailable, complete: unavailable }, readiness: unavailable,
    } }), /workforce-separate-identity-storage-required/);
    const observed = new Database(storagePath);
    try { assert.deepEqual(observed.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all(), [{ name: "operator_marker" }]); }
    finally { observed.close(); }
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

for (const boundary of ["current", "revoked-session", "revoked-authority"] as const) test(`HTTP resume observes committed effect with ${boundary} and never reexecutes`, { timeout: 5000 }, async () => {
  const f = await fixture({ adapterTimeoutMs: 30 });
  try {
    f.afterComplete(async () => new Promise<void>(() => {}));
    const started = await f.post(); assert.equal(started.status, 200, JSON.stringify(started.body));
    assert.equal(await f.status(), "completed"); assert.equal(f.nativeInvocations, 1);
    assert.equal((await f.run())[0].state, "WAITING_EXTERNAL");
    assert.equal((await f.control.query("SELECT id FROM evidence WHERE evidence_type='gateway_execution' AND json_extract(payload,'$.state')='VERIFIED'")).rowCount, 0);
    if (boundary === "revoked-session") await f.registry.revokeSession("session", 1);
    if (boundary === "revoked-authority") await f.authority.appendApproval({ company_id: "a", ...f.envelope.approval, approval_id: "zzz-revoked", status: "revoked" });
    await f.restart();
    assert.ok(started.body.continuation_token);
    const resumed = await f.post({ action: "resume", continuation_token: started.body.continuation_token });
    const verified = (await f.control.query<{ payload: string }>("SELECT payload FROM evidence WHERE evidence_type='gateway_execution' AND json_extract(payload,'$.state')='VERIFIED'")).rows.map(row => JSON.parse(row.payload));
    if (boundary === "current") {
      assert.equal(resumed.status, 200, JSON.stringify(resumed.body));
      assert.equal((await f.run())[0].state, "COMPLETED"); assert.equal(verified.length, 1);
      assert.equal(verified[0].accepted_evidence.schema, "titan.business.accepted-evidence/v1");
      assert.equal(verified[0].run_id, (await f.run())[0].run_id);
    } else {
      if (boundary === "revoked-session") assert.equal(resumed.status, 401);
      assert.equal(verified.length, 0);
      assert.equal((await f.run())[0].state, "WAITING_EXTERNAL");
    }
    assert.equal(f.nativeInvocations, 1);
    assert.equal((await f.stores.a.query<{ n: number }>("SELECT n FROM mutation_count")).rows[0].n, 1);
    assert.equal(await f.status("b"), "in_progress");
  } finally { await f.close(); }
});

test("signed malformed lifecycle actions and missing or conflicting continuations cannot reserve execution", async () => {
  const f = await fixture();
  try {
    for (const action of [["cancel"], ["resume"], ["start"], null, {}, { toString: "cancel" }]) {
      const response = await f.post({ action });
      assert.equal(response.status, 400, JSON.stringify(response));
      assert.deepEqual(response.body, { error: "conversation-action-invalid" });
    }
    for (const action of ["cancel", "continue", "resume"]) {
      for (const continuation_token of [undefined, null, "", "  ", []]) {
        const response = await f.post({ action, continuation_token });
        assert.equal(response.status, 400, JSON.stringify(response));
        assert.deepEqual(response.body, { error: "conversation-continuation-required" });
      }
    }
    assert.equal((await f.post({ action: "start", continuation_token: "caller-supplied" })).status, 400);
    assert.equal((await f.run()).length, 0); assert.equal(f.nativeInvocations, 0);
    assert.equal((await f.control.query("SELECT work_id FROM workforce_work_items")).rowCount, 0);
    assert.equal(await f.status(), "in_progress");
  } finally { await f.close(); }
});

for (const surface of ["hub", "go"]) test(`signed ${surface} credentials cannot invoke zero-only native host`, async () => {
  const f = await fixture();
  try {
    const response = await f.post({ surface }, f.credential({ surface }));
    assert.equal(response.status, 401); assert.deepEqual(response.body, { error: "conversation-authentication-failed" });
    assert.equal((await f.run()).length, 0); assert.equal(f.nativeInvocations, 0);
    assert.equal((await f.control.query("SELECT work_id FROM workforce_work_items")).rowCount, 0);
    assert.equal(await f.status(), "in_progress");
  } finally { await f.close(); }
});

for (const change of ["revoke", "company-switch"] as const) test(`identity ${change} before effect admission blocks the native mutation`, async () => {
  const f = await fixture(); let reads = 0;
  const hook = async () => {
    reads += 1;
    if (reads < 2) { f.beforeRead(hook); return; }
    if (change === "revoke") await f.registry.revokeSession("session", 1);
    else await f.registry.switchCompany(f.claims, { audience: "workforce", company_id: "a", actor_id: "lead", context_revision: f.context.context_revision }, "b", new Date().toISOString());
  };
  try {
    f.beforeRead(hook); await f.post();
    assert.equal(reads, 2); assert.equal(f.nativeInvocations, 0);
    assert.equal(await f.status(), "in_progress"); assert.equal(await f.status("b"), "in_progress");
    assert.equal((await f.stores.a.query<{ n: number }>("SELECT n FROM mutation_count")).rows[0].n, 0);
    assert.equal((await f.control.query("SELECT id FROM evidence WHERE evidence_type='gateway_execution' AND json_extract(payload,'$.state')='VERIFIED'")).rowCount, 0);
  } finally { await f.close(); }
});

for (const expiry of [undefined, "invalid-expiry", new Date(Date.now() - 1000).toISOString()] as const) test(`source-free durable credential rejects ${expiry === undefined ? "missing" : expiry === "invalid-expiry" ? "malformed" : "expired"} expiry`, async () => {
  const f = await fixture();
  try {
    f.credentialVerifier({ async verify() {
      const { credential_expires_at: _ignored, ...proof } = f.claims;
      return { ...proof, audience: "workforce", surface: "zero", context_revision: f.context.context_revision,
        ...(expiry === undefined ? {} : { credential_expires_at: expiry === "invalid-expiry" ? "not-a-date" : expiry }) } as any;
    } });
    await f.post();
    assert.equal(f.nativeInvocations, 0);
    assert.equal(await f.executionStateCount("EXECUTING"), 0);
    assert.equal(await f.status(), "in_progress");
  } finally { await f.close(); }
});

test("hosted admission rolls back EXECUTING when credential expires during SQLite evidence persistence", async () => {
  const f = await fixture();
  let expiresAt = 0;
  let persistenceDelayMs = 0;
  try {
    await f.closeHost();
    f.credentialVerifier({ async verify() {
      expiresAt = Date.now() + 150;
      return { ...f.claims, audience: "workforce", surface: "zero", context_revision: f.context.context_revision,
        credential_expires_at: new Date(expiresAt).toISOString() };
    } });
    const delayedStorage = {
      dialect: f.control.dialect,
      query: (sql: string, params?: readonly unknown[]) => f.control.query(sql, params),
      transaction: (operation: (tx: any) => Promise<unknown>) => f.control.transaction((tx: any) => operation(Object.assign(Object.create(tx), {
        query: async (sql: string, params: readonly unknown[] = []) => {
          const result = await tx.query(sql, params);
          if (sql.startsWith("INSERT INTO evidence") && params[4] === "gateway_execution") {
            const evidence = JSON.parse(String(params[6] ?? "{}"));
            if (evidence.state === "EXECUTING") {
              const started = Date.now();
              await new Promise(resolve => setTimeout(resolve, 250));
              persistenceDelayMs = Date.now() - started;
            }
          }
          return result;
        },
      }))),
      close: async () => {},
    } as any;
    const { createHostedRuntime } = await import("../services/workforce/src/hosted-runtime.ts");
    const { handleConversationRequest } = await import("../services/workforce/src/conversation-api.ts");
    const hosted = await createHostedRuntime(delayedStorage, f.identity, f.dependencies, new AbortController().signal);
    await handleConversationRequest({ ...f.input, action: "start" } as any, hosted.auth, hosted.runtime as any, "Bearer short-lived-test");
    assert.ok(persistenceDelayMs >= 240, "the SQLite EXECUTING insert remained open past credential expiry");
    assert.ok(Date.now() >= expiresAt, "credential expiry elapsed before the admission transaction returned");
    assert.equal(f.nativeInvocations, 0, "expired credentials cannot enter the provider");
    assert.equal(await f.executionStateCount("EXECUTING"), 0, "expiry rolls back the uncommitted EXECUTING evidence");
    assert.equal(await f.status(), "in_progress");
  } finally { await f.close(); }
});

for (const change of ["source-revoke", "source-company-switch"] as const) test(`canonical DirectAdmin lineage rejects ${change} before effect admission`, async () => {
  const f = await fixture();
  try {
    const identity = await f.workforceZero();
    const input = { ...f.input, company_id: "a", actor_id: "lead", device_id: "device",
      session_id: identity.context.session_id, context_revision: identity.context.context_revision };
    let reads = 0;
    const hook = async () => {
      reads += 1;
    if (reads < 2) { f.beforeRead(hook); return; }
      if (change === "source-revoke") await f.registry.revokeSession(identity.da.context.session_id, identity.da.context.session_revision);
      else await identity.sourceService.switchCompany(identity.da.credential, { company_id: "a", device_id: "device" }, "b");
    };
    f.beforeRead(hook);
    const response = await f.post(input, identity.authorization);
    assert.equal(response.status, 401, JSON.stringify(response.body));
    assert.deepEqual(response.body, { error: "conversation-authentication-failed" });
    assert.equal(reads, 2);
    assert.equal(f.nativeInvocations, 0);
    assert.equal(await f.status(), "in_progress");
    assert.equal((await f.stores.a.query<{ n: number }>("SELECT n FROM mutation_count")).rows[0].n, 0);
    assert.equal((await f.control.query("SELECT id FROM evidence WHERE evidence_type='gateway_execution' AND json_extract(payload,'$.state')='VERIFIED'")).rowCount, 0);
  } finally { await f.close(); }
});

test("a session fence that wins admits the effect, releases both locks, and does not promise source revoke can cancel it", async () => {
  const f = await fixture();
  let enter!: () => void;
  let release!: () => void;
  const entered = new Promise<void>(resolve => { enter = resolve; });
  const blocked = new Promise<void>(resolve => { release = resolve; });
  try {
    const identity = await f.workforceZero();
    const input = { ...f.input, company_id: "a", actor_id: "lead", device_id: "device",
      session_id: identity.context.session_id, context_revision: identity.context.context_revision };
    f.beforeComplete(async () => { assert.equal(await f.executionStateCount("EXECUTING"), 1, "the admitted transition is durable before provider entry"); enter(); await blocked; });
    const pending = f.post(input, identity.authorization);
    await entered;
    const started = Date.now();
    await f.registry.revokeSession(identity.da.context.session_id, identity.da.context.session_revision);
    assert.ok(Date.now() - started < 1000, "the slow provider owns neither identity nor Workforce control writer lock");
    release();
    const response = await pending;
    assert.equal(response.status, 200, JSON.stringify(response.body));
    assert.equal(f.nativeInvocations, 1, "an effect admitted before revocation may finish after it");
    assert.equal(await f.status(), "completed");
    assert.equal((await f.control.query("SELECT id FROM evidence WHERE evidence_type='gateway_execution' AND json_extract(payload,'$.state')='UNCERTAIN'")).rowCount, 1,
      "source revocation prevents later verification but cannot roll back an already admitted provider mutation");
  } finally { release(); await f.close(); }
});

test("canonical source proof survives provider timeout and restart without replay", { timeout: 5000 }, async () => {
  const f = await fixture({ adapterTimeoutMs: 30 });
  let enter!: () => void;
  let release!: () => void;
  const entered = new Promise<void>(resolve => { enter = resolve; });
  const blocked = new Promise<void>(resolve => { release = resolve; });
  try {
    const identity = await f.workforceZero();
    const input = { ...f.input, company_id: "a", actor_id: "lead", device_id: "device",
      session_id: identity.context.session_id, context_revision: identity.context.context_revision };
    let adapterSignal: AbortSignal | undefined;
    f.beforeComplete(async signal => { assert.equal(await f.executionStateCount("EXECUTING"), 1, "the admitted transition is durable before provider entry"); adapterSignal = signal; enter(); await blocked; signal?.throwIfAborted(); });
    const started = Date.now();
    const response = await f.post(input, identity.authorization);
    assert.equal(response.status, 200, JSON.stringify(response.body));
    assert.ok(Date.now() - started < 1000);
    await entered;
    assert.equal((await f.control.query("SELECT id FROM evidence WHERE evidence_type='gateway_execution' AND json_extract(payload,'$.state')='UNCERTAIN'")).rowCount, 1);
    assert.equal(adapterSignal?.aborted, true);
    assert.equal((await f.run())[0].authenticated_identity.source_session.session_id, identity.da.context.session_id);
    release();
    await new Promise<void>(resolve => setTimeout(resolve, 25));
    assert.equal(await f.status(), "in_progress");
    assert.equal(f.nativeInvocations, 0, "the adapter observed abort before mutation");
    await f.restart();
    const restored = await f.post(input, identity.authorization);
    assert.ok(restored.body.continuation_token);
    const observed = await f.post({ ...input, action: "resume", continuation_token: restored.body.continuation_token }, identity.authorization);
    assert.equal(observed.status, 200, JSON.stringify(observed.body));
    assert.equal(f.nativeInvocations, 0, "UNCERTAIN recovery never reexecutes the provider");
    assert.equal((await f.run())[0].state, "WAITING_EXTERNAL");
  } finally {
    release();
    await f.close();
  }
});

test("host strips legacy provider control-transaction port before native runtime composition", async () => {
  let legacyCalls = 0;
  const f = await fixture({ legacyControlPort: async () => { legacyCalls += 1; throw new Error("must-not-pass-control-storage-to-provider"); } });
  try {
    const response = await f.post(); assert.equal(response.status, 200, JSON.stringify(response.body));
    assert.equal(legacyCalls, 0); assert.equal(f.nativeInvocations, 1);
    assert.equal(await f.status(), "completed"); assert.equal(await f.status("b"), "in_progress");
    assert.equal((await f.control.query("SELECT status FROM work_orders WHERE id='wo'")).rows[0].status, "in_progress");
    assert.equal((await f.control.query("SELECT id FROM evidence WHERE evidence_type='gateway_execution' AND json_extract(payload,'$.state')='VERIFIED'")).rowCount, 1);
  } finally { await f.close(); }
});

test("canonical issued session credentials authenticate real native host and reject tamper, audience and revocation", async () => {
  const { createSessionCredentialService } = await import("../packages/titan-platform/src/security-boundary.ts");
  const { createWorkforceSessionCredentialVerifier } = await import("../services/workforce/src/session-credential-verifier.ts");
  const f = await fixture();
  try {
    // Keys exist only in this disposable test. The hosted verifier receives public keys only.
    const access = await crypto.subtle.generateKey({ name: "Ed25519" }, false, ["sign", "verify"]);
    const login = await crypto.subtle.generateKey({ name: "Ed25519" }, false, ["sign", "verify"]);
    const config = { registry: f.registry, issuer: "titan:hosted-test", key_id: "access-test", algorithm: "EdDSA" as const, verification_key: access.publicKey, upstream: { issuer: "test-ed25519", audience: "titan-login", key_id: "login-test", algorithm: "EdDSA" as const, verification_key: login.publicKey } };
    const service = createSessionCredentialService({ ...config, audience: "workforce", signing_key: access.privateKey });
    f.credentialVerifier(createWorkforceSessionCredentialVerifier(config));
    const jwt = async (payload: Record<string, unknown>, key: CryptoKey, kid: string, typ: string) => {
      const signingInput = [Buffer.from(JSON.stringify({ alg: "EdDSA", kid, typ })).toString("base64url"), Buffer.from(JSON.stringify(payload)).toString("base64url")].join(".");
      return `${signingInput}.${Buffer.from(await crypto.subtle.sign("Ed25519", key, Buffer.from(signingInput))).toString("base64url")}`;
    };
    const now = Math.floor(Date.now() / 1000);
    const upstream = await jwt({ iss: config.upstream.issuer, aud: "titan-login", sub: "subject", jti: "hosted-canonical-once", company_id: "a", device_id: "device", iat: now, exp: now + 300 }, login.privateKey, "login-test", "titan-login+jwt");
    const issued = await service.issue(upstream, { company_id: "a", device_id: "device" });
    const input = { session_id: issued.context.session_id, context_revision: issued.context.context_revision };
    const claims = JSON.parse(Buffer.from(issued.credential.split(".")[1], "base64url").toString("utf8"));
    const wrongAudience = await jwt({ ...claims, aud: "other" }, access.privateKey, "access-test", "titan-session+jwt");
    const parts = issued.credential.split(".");
    const tampered = [parts[0], Buffer.from(JSON.stringify({ ...claims, actor_id: "forged" })).toString("base64url"), parts[2]].join(".");
    const wrongRevision = await jwt({ ...claims, session_revision: 2 }, access.privateKey, "access-test", "titan-session+jwt");
    for (const credential of [wrongAudience, tampered, wrongRevision]) {
      const rejected = await f.post(input, `Bearer ${credential}`);
      assert.equal(rejected.status, 401); assert.deepEqual(rejected.body, { error: "conversation-authentication-failed" });
    }
    for (const header of [`bearer ${issued.credential}`, `Bearer  ${issued.credential}`, `Basic ${issued.credential}`]) {
      assert.equal((await f.post(input, header)).status, 401);
    }
    assert.equal((await f.run()).length, 0); assert.equal(f.nativeInvocations, 0);
    const accepted = await f.post(input, `Bearer ${issued.credential}`);
    assert.equal(accepted.status, 200, JSON.stringify(accepted.body)); assert.equal(await f.status(), "completed");
    assert.equal((await f.control.query("SELECT id FROM evidence WHERE evidence_type='gateway_execution' AND json_extract(payload,'$.state')='VERIFIED'")).rowCount, 1);
    await service.revoke(issued.credential, { company_id: "a", device_id: "device" });
    await f.restart();
    const rejected = await f.post({ ...input, client_message_id: "revoked-request" }, `Bearer ${issued.credential}`);
    assert.equal(rejected.status, 401); assert.equal((await f.run()).length, 1); assert.equal(f.nativeInvocations, 1);
    assert.equal(await f.status("b"), "in_progress");
  } finally { await f.close(); }
});
