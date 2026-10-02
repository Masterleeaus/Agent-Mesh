import test from "node:test";
import assert from "node:assert/strict";
import { generateKeyPairSync, sign } from "node:crypto";
import { chmodSync, linkSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
// @ts-expect-error Native SQLite driver is used only by this disposable fixture.
import Database from "better-sqlite3";
import {
  createSqliteStorage,
  initializeSqliteCompanyPlacementRegistry,
} from "../../../packages/storage/src/index.js";
import { createIdentitySessionRegistry } from "../../../packages/titan-platform/src/security-boundary.js";
import { createHostedRuntime } from "./hosted-runtime.js";
import { createWorkforceDependencies } from "./production-dependencies.js";

function productionEnvironment(input: {
  root: string; identityPath: string; runtimePath: string; webPath: string; companyRoot: string;
}) {
  const keyRoot = join(input.root, "verification-keys");
  mkdirSync(input.companyRoot, { mode: 0o700 });
  mkdirSync(keyRoot, { mode: 0o700 });
  chmodSync(input.companyRoot, 0o700);
  chmodSync(keyRoot, 0o700);
  const workforceKeys = generateKeyPairSync("ed25519");
  const upstreamKeys = generateKeyPairSync("ed25519");
  const workforceKeyPath = join(keyRoot, "workforce.pem");
  const upstreamKeyPath = join(keyRoot, "upstream.pem");
  writeFileSync(workforceKeyPath, workforceKeys.publicKey.export({ format: "pem", type: "spki" }), { mode: 0o644 });
  writeFileSync(upstreamKeyPath, upstreamKeys.publicKey.export({ format: "pem", type: "spki" }), { mode: 0o644 });
  new Database(input.webPath).close();
  return {
    workforceKeys,
    environment: {
      WORKFORCE_SQLITE_PATH: input.runtimePath,
      WORKFORCE_WEB_SQLITE_PATH: input.webPath,
      WORKFORCE_IDENTITY_SQLITE_PATH: input.identityPath,
      WORKFORCE_COMPANY_STORE_ROOT: input.companyRoot,
      WORKFORCE_DIRECTADMIN_NODE_ID: "node-test",
      WORKFORCE_SESSION_ISSUER: "titan:workforce-auth",
      WORKFORCE_SESSION_KEY_ID: "workforce-test-key",
      WORKFORCE_SESSION_ALGORITHM: "EdDSA",
      WORKFORCE_SESSION_PUBLIC_KEY_PATH: workforceKeyPath,
      WORKFORCE_UPSTREAM_SESSION_ISSUER: "directadmin:https://panel.test.invalid",
      WORKFORCE_UPSTREAM_SESSION_AUDIENCE: "da-login",
      WORKFORCE_UPSTREAM_SESSION_KEY_ID: "upstream-test-key",
      WORKFORCE_UPSTREAM_SESSION_ALGORITHM: "EdDSA",
      WORKFORCE_UPSTREAM_SESSION_PUBLIC_KEY_PATH: upstreamKeyPath,
    },
  };
}

function createNativeCompanyFile(filename: string, companyId: string): void {
  const company = new Database(filename);
  company.exec(`CREATE TABLE companies(id TEXT PRIMARY KEY); INSERT INTO companies(id) VALUES('${companyId}');
    CREATE TABLE work_orders(id TEXT,status TEXT,completed_at TEXT,company_id TEXT,assigned_user_id TEXT,completion_criteria TEXT);
    CREATE TABLE visits(work_order_id TEXT,account_id TEXT,status TEXT);`);
  company.close();
}

test("production dependency factory composes only existing identity, placement and isolated native stores", async () => {
  const root = mkdtempSync(join(tmpdir(), "titan-workforce-production-composition-"));
  const identityPath = join(root, "identity.sqlite");
  const runtimePath = join(root, "workforce.sqlite");
  const webPath = join(root, "titan-zero.db");
  const companyRoot = join(root, "company-stores");
  const companyPath = join(companyRoot, "placement-a.sqlite");
  const keyRoot = join(root, "verification-keys");
  mkdirSync(companyRoot, { mode: 0o700 });
  mkdirSync(keyRoot, { mode: 0o700 });
  chmodSync(companyRoot, 0o700);
  chmodSync(keyRoot, 0o700);
  const workforceKeys = generateKeyPairSync("ed25519");
  const upstreamKeys = generateKeyPairSync("ed25519");
  const workforceKeyPath = join(keyRoot, "workforce.pem");
  const upstreamKeyPath = join(keyRoot, "upstream.pem");
  writeFileSync(workforceKeyPath, workforceKeys.publicKey.export({ format: "pem", type: "spki" }), { mode: 0o644 });
  writeFileSync(upstreamKeyPath, upstreamKeys.publicKey.export({ format: "pem", type: "spki" }), { mode: 0o644 });

  const identity = createSqliteStorage(identityPath);
  new Database(webPath).close();
  let runtime: ReturnType<typeof createSqliteStorage> | undefined;
  let hostedIdentity: ReturnType<typeof createSqliteStorage> | undefined;
  let dependencies: Awaited<ReturnType<typeof createWorkforceDependencies>> | undefined;
  try {
    const registry = await createIdentitySessionRegistry({ storage: identity, storage_role: "GLOBAL_REGISTRY" });
    const now = new Date();
    const provider = "directadmin:https://panel.test.invalid";
    await registry.putActor({ actor_id: "lead", status: "active" }, null);
    await registry.putCompany({ company_id: "a", status: "active" }, null);
    await registry.putDevice({ device_id: "device", actor_id: "lead", status: "active" }, null);
    await registry.putMembership({ company_id: "a", actor_id: "lead", role: "owner", status: "active" }, null);
    await registry.putExternalBinding({ binding_id: "binding-a", company_id: "a", actor_id: "lead", provider, subject: "subject", status: "active" }, null);
    const session = await registry.issueSession({ provider, subject: "subject", session_id: "session-a", device_id: "device",
      company_id: "a", audience: "workforce", issued_at: now.toISOString(), expires_at: new Date(now.getTime() + 600_000).toISOString() }, now.toISOString());
    await initializeSqliteCompanyPlacementRegistry({ storage: identity, storage_role: "GLOBAL_REGISTRY" });
    await identity.query(
      "INSERT INTO titan_company_storage_placements (company_id,placement_id,placement_revision,provider,schema_version,status) VALUES ('a','placement-a',1,'sqlite','native-v1','READY')",
    );
    const company = new Database(companyPath);
    company.exec(`CREATE TABLE companies(id TEXT PRIMARY KEY); INSERT INTO companies(id) VALUES('a');
      CREATE TABLE work_orders(id TEXT,status TEXT,completed_at TEXT,company_id TEXT,assigned_user_id TEXT,completion_criteria TEXT);
      CREATE TABLE visits(work_order_id TEXT,account_id TEXT,status TEXT);`);
    company.close();
    await identity.close();

    dependencies = await createWorkforceDependencies({
      WORKFORCE_SQLITE_PATH: runtimePath,
      WORKFORCE_WEB_SQLITE_PATH: webPath,
      WORKFORCE_IDENTITY_SQLITE_PATH: identityPath,
      WORKFORCE_COMPANY_STORE_ROOT: companyRoot,
      WORKFORCE_DIRECTADMIN_NODE_ID: "node-test",
      WORKFORCE_SESSION_ISSUER: "titan:workforce-auth",
      WORKFORCE_SESSION_KEY_ID: "workforce-test-key",
      WORKFORCE_SESSION_ALGORITHM: "EdDSA",
      WORKFORCE_SESSION_PUBLIC_KEY_PATH: workforceKeyPath,
      WORKFORCE_UPSTREAM_SESSION_ISSUER: "directadmin:https://panel.test.invalid",
      WORKFORCE_UPSTREAM_SESSION_AUDIENCE: "da-login",
      WORKFORCE_UPSTREAM_SESSION_KEY_ID: "upstream-test-key",
      WORKFORCE_UPSTREAM_SESSION_ALGORITHM: "EdDSA",
      WORKFORCE_UPSTREAM_SESSION_PUBLIC_KEY_PATH: upstreamKeyPath,
    });
    assert.equal(typeof dependencies.credentialVerifier.verify, "function");
    assert.equal(typeof dependencies.workOrders.complete, "function");
    const nowSeconds = Math.floor(Date.now() / 1000);
    const header = Buffer.from(JSON.stringify({ alg: "EdDSA", kid: "workforce-test-key", typ: "titan-session+jwt" })).toString("base64url");
    const claims = Buffer.from(JSON.stringify({
      identity_provider: provider, session_id: session.session_id, device_id: session.device_id,
      company_id: session.company_id, actor_id: session.actor_id, session_revision: session.session_revision,
      context_revision: session.context_revision, iss: "titan:workforce-auth", aud: "workforce",
      sub: "subject", node_id: "node-test", csrf_sha256: "c".repeat(43), da_role: "admin",
      iat: nowSeconds, exp: nowSeconds + 300,
    })).toString("base64url");
    const signingInput = header + "." + claims;
    const token = signingInput + "." + sign(null, Buffer.from(signingInput), workforceKeys.privateKey).toString("base64url");
    const verified = await dependencies.credentialVerifier.verify("Bearer " + token, { signal: new AbortController().signal });
    assert.equal(verified.session_id, "session-a", "the configured public KeyObject verifies a real signed session credential");
    assert.deepEqual(await dependencies.readiness({ signal: new AbortController().signal }), {
      authentication: true, authority: false, provider: false, evidence: false,
    }, "readiness reports absent authority/evidence and owner schema attestation as degraded");
    const placement = await dependencies.companyPlacementRegistry.findByCompanyId("a");
    assert.ok(placement);
    await assert.rejects(dependencies.companyStoreOpener.open(placement), /workforce-company-native-fsm-attestation-required/);

    runtime = createSqliteStorage(runtimePath);
    hostedIdentity = createSqliteStorage(identityPath);
    await createHostedRuntime(runtime, hostedIdentity, dependencies);
    assert.deepEqual(await dependencies.readiness({ signal: new AbortController().signal }), {
      authentication: true, authority: true, provider: false, evidence: true,
    }, "runtime/evidence are durable but provider readiness stays closed until owner attestation exists");
    const identityProbe = createSqliteStorage(identityPath);
    try {
      const placements = await identityProbe.query("SELECT company_id FROM titan_company_storage_placements");
      assert.equal(placements.rowCount, 1, "the composition and readiness probe do not create or rewrite placements");
    } finally { await identityProbe.close(); }
  } finally {
    await dependencies?.close?.({ signal: new AbortController().signal });
    await hostedIdentity?.close();
    await runtime?.close();
    if (identity) await identity.close().catch(() => undefined);
    rmSync(root, { recursive: true, force: true });
  }
});

test("production factory fails on an empty identity file without migrating it", async () => {
  const root = mkdtempSync(join(tmpdir(), "titan-workforce-empty-identity-"));
  const identityPath = join(root, "identity.sqlite");
  const runtimePath = join(root, "workforce.sqlite");
  const webPath = join(root, "titan-zero.db");
  const companyRoot = join(root, "company-stores");
  new Database(identityPath).close();
  const { environment } = productionEnvironment({ root, identityPath, runtimePath, webPath, companyRoot });
  try {
    await assert.rejects(createWorkforceDependencies(environment), /workforce-identity-schema-unavailable/);
    const check = new Database(identityPath, { readonly: true });
    try {
      const rows = check.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'titan_security_%'").all();
      assert.equal(rows.length, 0, "production startup did not create identity schema or provisioning tables");
    } finally { check.close(); }
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test("production dependency close releases owned stores even when its signal is already aborted", async () => {
  const root = mkdtempSync(join(tmpdir(), "titan-workforce-aborted-close-"));
  const identityPath = join(root, "identity.sqlite");
  const runtimePath = join(root, "workforce.sqlite");
  const webPath = join(root, "titan-zero.db");
  const companyRoot = join(root, "company-stores");
  const identity = createSqliteStorage(identityPath);
  let dependencies: Awaited<ReturnType<typeof createWorkforceDependencies>> | undefined;
  try {
    await createIdentitySessionRegistry({ storage: identity, storage_role: "GLOBAL_REGISTRY" });
    await initializeSqliteCompanyPlacementRegistry({ storage: identity, storage_role: "GLOBAL_REGISTRY" });
    await identity.close();
    const { environment } = productionEnvironment({ root, identityPath, runtimePath, webPath, companyRoot });
    const composed = await createWorkforceDependencies(environment);
    dependencies = composed;
    assert.ok(composed.close, "production dependencies own a close hook");
    const close = composed.close;
    const shutdown = new AbortController();
    shutdown.abort();
    await assert.rejects(close({ signal: shutdown.signal }), { name: "AbortError" });
    assert.deepEqual(await composed.readiness({ signal: new AbortController().signal }), {
      authentication: false, authority: false, provider: false, evidence: false,
    }, "an aborted shutdown signal does not skip closing owned storage connections");
  } finally {
    await dependencies?.close?.({ signal: new AbortController().signal }).catch(() => undefined);
    await identity.close().catch(() => undefined);
    rmSync(root, { recursive: true, force: true });
  }
});

test("production readiness rejects a company store that aliases the read-only web database", async () => {
  const root = mkdtempSync(join(tmpdir(), "titan-workforce-web-alias-"));
  const identityPath = join(root, "identity.sqlite");
  const runtimePath = join(root, "workforce.sqlite");
  const webPath = join(root, "titan-zero.db");
  const companyRoot = join(root, "company-stores");
  const companyStorePath = join(companyRoot, "placement-a.sqlite");
  const identity = createSqliteStorage(identityPath);
  let dependencies: Awaited<ReturnType<typeof createWorkforceDependencies>> | undefined;
  try {
    await createIdentitySessionRegistry({ storage: identity, storage_role: "GLOBAL_REGISTRY" });
    await initializeSqliteCompanyPlacementRegistry({ storage: identity, storage_role: "GLOBAL_REGISTRY" });
    await identity.query("INSERT INTO titan_company_storage_placements (company_id,placement_id,placement_revision,provider,schema_version,status) VALUES ('a','placement-a',1,'sqlite','native-v1','READY')");
    await identity.close();
    const { environment } = productionEnvironment({ root, identityPath, runtimePath, webPath, companyRoot });
    createNativeCompanyFile(webPath, "a");
    linkSync(webPath, companyStorePath);

    dependencies = await createWorkforceDependencies(environment);
    assert.deepEqual(await dependencies.readiness({ signal: new AbortController().signal }), {
      authentication: true, authority: false, provider: false, evidence: false,
    }, "an aliased company database cannot make provider readiness green");
    const placement = await dependencies.companyPlacementRegistry.findByCompanyId("a");
    assert.ok(placement);
    await assert.rejects(dependencies.companyStoreOpener.open(placement), /workforce-company-store-physical-isolation-required/);
  } finally {
    await dependencies?.close?.({ signal: new AbortController().signal });
    await identity.close().catch(() => undefined);
    rmSync(root, { recursive: true, force: true });
  }
});

test("production readiness rejects swapped physical company databases", async () => {
  const root = mkdtempSync(join(tmpdir(), "titan-workforce-swapped-stores-"));
  const identityPath = join(root, "identity.sqlite");
  const runtimePath = join(root, "workforce.sqlite");
  const webPath = join(root, "titan-zero.db");
  const companyRoot = join(root, "company-stores");
  const identity = createSqliteStorage(identityPath);
  let dependencies: Awaited<ReturnType<typeof createWorkforceDependencies>> | undefined;
  try {
    await createIdentitySessionRegistry({ storage: identity, storage_role: "GLOBAL_REGISTRY" });
    await initializeSqliteCompanyPlacementRegistry({ storage: identity, storage_role: "GLOBAL_REGISTRY" });
    await identity.query("INSERT INTO titan_company_storage_placements (company_id,placement_id,placement_revision,provider,schema_version,status) VALUES ('a','placement-a',1,'sqlite','native-v1','READY'),('b','placement-b',1,'sqlite','native-v1','READY')");
    await identity.close();
    const { environment } = productionEnvironment({ root, identityPath, runtimePath, webPath, companyRoot });
    createNativeCompanyFile(join(companyRoot, "placement-a.sqlite"), "b");
    createNativeCompanyFile(join(companyRoot, "placement-b.sqlite"), "a");

    dependencies = await createWorkforceDependencies(environment);
    assert.deepEqual(await dependencies.readiness({ signal: new AbortController().signal }), {
      authentication: true, authority: false, provider: false, evidence: false,
    }, "the registered company is checked against the actual physical database contents");
    const placement = await dependencies.companyPlacementRegistry.findByCompanyId("a");
    assert.ok(placement);
    await assert.rejects(dependencies.companyStoreOpener.open(placement), /workforce-company-store-identity-mismatch/);
  } finally {
    await dependencies?.close?.({ signal: new AbortController().signal });
    await identity.close().catch(() => undefined);
    rmSync(root, { recursive: true, force: true });
  }
});
