import test from "node:test";
import assert from "node:assert/strict";
import { generateKeyPairSync, sign, verify } from "node:crypto";
import { mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import Database from "better-sqlite3";
import { createSqliteStorage } from "../packages/storage/src/index.js";
import { createIdentitySessionRegistry } from "../packages/titan-platform/src/security-boundary.js";
import { completeAssignedWorkOrder } from "../apps/web/lib/work-orders/lead-access.ts";
// @ts-expect-error Canonical authority store owner is JavaScript.
import { SqliteAuthorityStore, SqliteWorkerAccessStore } from "../packages/runtime/authority/index.mjs";
import type { WorkforceServer } from "../services/workforce/src/server.js";
import type { HostedWorkforceDependencies } from "../services/workforce/src/hosted-runtime.js";
import { SqliteWorkforceStore } from "../services/workforce/src/sqlite-store.js";

const capability = "crm.work_order.complete";
async function fixture() {
  const { createWorkforceServer } = await import("../services/workforce/src/server.ts");
  const dir = mkdtempSync(join(tmpdir(), "titan-hosted-"));
  const storagePath = join(dir, "control.db");
  const identityStoragePath = join(dir, "identity.db");
  const files = { a: join(dir, "company-a.db"), b: join(dir, "company-b.db") };
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
  const claims = { provider: "test-ed25519", subject: "subject", session_id: "session", device_id: "device", session_revision: 1, audience: "workforce", surface: "zero" as const };
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
  const mapped = (company: string) => { if (company !== "a" && company !== "b") throw new Error("company-storage-unmapped"); return stores[company]; };
  let beforeRead: (() => Promise<void>) | undefined;
  let dependencyCloseCount = 0;
  let readinessHook: (() => ReturnType<HostedWorkforceDependencies["readiness"]>) | undefined;
  const dependencies: HostedWorkforceDependencies = {
    identityStoragePath,
    credentialVerifier: { async verify(authorization) {
      const match = /^Bearer ([A-Za-z0-9_-]+)\.([A-Za-z0-9_-]+)$/.exec(authorization);
      if (!match || !verify(null, Buffer.from(match[1]), keys.publicKey, Buffer.from(match[2], "base64url"))) throw new Error("signature-invalid");
      return JSON.parse(Buffer.from(match[1], "base64url").toString("utf8"));
    } },
    workOrders: {
      complete: ({ company_id, actor_id, work_order_id }) => mapped(company_id).transaction(tx => completeAssignedWorkOrder(tx, work_order_id, company_id, actor_id)),
      async read({ company_id, actor_id, work_order_id }) {
        if (beforeRead) { const hook = beforeRead; beforeRead = undefined; await hook(); }
        return (await mapped(company_id).query("SELECT id,status,completed_at FROM work_orders WHERE company_id=$1 AND id=$2 AND assigned_user_id=$3", [company_id, work_order_id, actor_id])).rows[0] ?? null;
      },
    },
    async close() { dependencyCloseCount += 1; },
    async readiness() { if (readinessHook) return readinessHook(); await Promise.all([identity.query("SELECT 1"), control.query("SELECT 1"), stores.a.query("SELECT 1"), stores.b.query("SELECT 1")]); return { authentication: true, authority: true, provider: true, evidence: true }; },
  };
  let host: WorkforceServer;
  let base: string;
  async function start() {
    host = await createWorkforceServer({ storagePath, dependencies });
    await new Promise<void>(resolve => host.server.listen(0, "127.0.0.1", resolve));
    const address = host.server.address(); assert.ok(address && typeof address !== "string");
    base = `http://127.0.0.1:${address.port}`;
  }
  await start();
  const input = { action: "start", company_id: "a", actor_id: "lead", device_id: "device", surface: "zero", session_id: "session", context_revision: context.context_revision, conversation_id: "conversation", interaction_id: "interaction", client_message_id: "message", request_id: "request", operation_id: "operation", correlation_id: "correlation", trace_id: "trace", idempotency_key: "idempotency", text: "complete work order wo" };
  return { control, registry, stores, claims, context, authority, envelope, credential, input,
    async post(overrides: Record<string, unknown> = {}, token: string | null = credential()) { const response = await fetch(`${base}/v1/workforce/conversations`, { method: "POST", headers: { "content-type": "application/json", ...(token ? { authorization: token } : {}) }, body: JSON.stringify({ ...input, ...overrides }) }); return { status: response.status, body: await response.json() as any }; },
    async status(company: "a" | "b" = "a") { return (await stores[company].query<{ status: string }>("SELECT status FROM work_orders WHERE id='wo'")).rows[0].status; },
    async run() { const rows = await control.query<{ payload: string }>("SELECT payload FROM agent_runs WHERE company_id='a'"); return rows.rows.map(row => JSON.parse(row.payload)); },
    beforeRead(hook: () => Promise<void>) { beforeRead = hook; },
    readiness(hook?: () => ReturnType<HostedWorkforceDependencies["readiness"]>) { readinessHook = hook; },
    async get(path: string) { return fetch(`${base}${path}`); },
    closeHost() { return host.close(); },
    get dependencyCloseCount() { return dependencyCloseCount; },
    async restart() { await host.close(); await start(); },
    async close() { await host.close(); await Promise.all([control.close(), identity.close(), stores.a.close(), stores.b.close()]); rmSync(dir, { recursive: true, force: true }); },
  };
}

test("hosted signed identity reaches real native completion and durable accepted evidence; restart replay has one mutation", async () => {
  const f = await fixture(); try {
    const first = await f.post(); assert.equal(first.status, 200, JSON.stringify(first.body));
    assert.equal(await f.status(), "completed"); assert.equal(await f.status("b"), "in_progress");
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
    const cancelled = await f.post({ action: "cancel", continuation_token: waiting.body.continuation_token, text: undefined }); assert.equal(cancelled.status, 200, JSON.stringify(cancelled.body));
    await f.restart(); await f.authority.appendApproval({ company_id: "a", ...f.envelope.approval, approval_id: "zzz-approved", status: "approved" });
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
  } finally { rmSync(dir, { recursive: true, force: true }); }
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
