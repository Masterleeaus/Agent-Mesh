import http from "node:http";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

export const CONTROL_PLANE_SCHEMA = "titan.server-node/v1";
const MAX_BODY_BYTES = 64 * 1024;
const DEFAULT_CAPABILITIES = new Set(["node.health.read", "node.dependencies.read", "node.lifecycle.request", "node.recovery.checkpoint"]);
const DEFAULT_DEPENDENCIES = ["workforce", "native_app", "redis", "database", "directadmin", "evidence_ledger", "backups"];
const SECRET_KEYS = new Set(["secret", "token", "password", "private_key", "credential"]);

function json(res, status, value) {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
  res.end(JSON.stringify(value));
}

function requestId(req) { return req.headers["x-titan-request-id"] || crypto.randomUUID(); }
function correlationId(req) { return req.headers["x-titan-correlation-id"]; }
function validId(value) { return typeof value === "string" && /^[A-Za-z0-9._:-]{1,160}$/.test(value); }
function containsSecretMaterial(value) {
  if (!value || typeof value !== "object") return false;
  for (const [key, item] of Object.entries(value)) {
    if (SECRET_KEYS.has(key.toLowerCase())) return true;
    if (typeof item === "string" && /-----BEGIN|\b(password|token|secret)=/i.test(item)) return true;
    if (item && typeof item === "object" && containsSecretMaterial(item)) return true;
  }
  return false;
}
function hash(value) { return crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex"); }
function safeEqual(left, right) {
  const a = Buffer.from(String(left ?? "")); const b = Buffer.from(String(right ?? ""));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

async function readBody(req) {
  const chunks = []; let size = 0;
  for await (const chunk of req) { size += chunk.length; if (size > MAX_BODY_BYTES) throw Object.assign(new Error("request body too large"), { status: 413 }); chunks.push(chunk); }
  if (!size) return {};
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8")); } catch { throw Object.assign(new Error("request body must be valid JSON"), { status: 400 }); }
}

export class ControlPlaneStore {
  constructor(filePath) { this.filePath = filePath; this.state = null; }
  async open() {
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
    try { this.state = JSON.parse(await fs.readFile(this.filePath, "utf8")); this.assertState(this.state); }
    catch (error) {
      if (error.code !== "ENOENT" && error.message !== "Unexpected end of JSON input") throw error;
      this.state = { schema_version: CONTROL_PLANE_SCHEMA, node_id: `node-${crypto.randomUUID()}`, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), intents: {}, checkpoints: {}, denials: [] };
      await this.flush();
    }
    return this;
  }
  assertState(state) { if (!state || state.schema_version !== CONTROL_PLANE_SCHEMA || !validId(state.node_id) || typeof state.intents !== "object" || typeof state.checkpoints !== "object" || !Array.isArray(state.denials ?? [])) throw new Error("unsupported or corrupt control-plane state"); }
  async flush() {
    const temp = `${this.filePath}.${process.pid}.tmp`;
    this.state.updated_at = new Date().toISOString();
    await fs.writeFile(temp, JSON.stringify(this.state, null, 2), { mode: 0o600 });
    await fs.rename(temp, this.filePath);
  }
  async recordIntent(record) { this.state.intents[record.idempotency_key] = record; await this.flush(); return record; }
  async recordDenial(record) { this.state.denials.push(record); this.state.denials = this.state.denials.slice(-500); await this.flush(); return record; }
  async checkpoint(manifest) { const item = { kind: "titan.server-node.checkpoint", schema_version: CONTROL_PLANE_SCHEMA, checkpoint_id: manifest.checkpoint_id, manifest_digest: manifest.manifest_digest, node_id: this.state.node_id, created_at: new Date().toISOString(), intent_count: Object.keys(this.state.intents).length }; this.state.checkpoints[item.checkpoint_id] = item; await this.flush(); return item; }
  exportSnapshot() { return { kind: "titan.server-node.snapshot", schema_version: CONTROL_PLANE_SCHEMA, node_id: this.state.node_id, updated_at: this.state.updated_at, intents: Object.values(this.state.intents).map(({ idempotency_key, company_id, capability_id, state, correlation_id, evidence_ref, created_at }) => ({ idempotency_key, company_id, capability_id, state, correlation_id, evidence_ref, created_at })), checkpoints: Object.values(this.state.checkpoints), denials: this.state.denials }; }
  async restoreSnapshot(snapshot) {
    if (!snapshot || snapshot.kind !== "titan.server-node.snapshot" || snapshot.schema_version !== CONTROL_PLANE_SCHEMA || !validId(snapshot.node_id) || !Array.isArray(snapshot.intents) || !Array.isArray(snapshot.checkpoints) || !Array.isArray(snapshot.denials ?? [])) throw new Error("incompatible or invalid control-plane snapshot");
    for (const item of snapshot.intents) if (!validId(item.idempotency_key) || !validId(item.company_id) || !validId(item.correlation_id)) throw new Error("snapshot contains invalid intent metadata");
    this.state.intents = Object.fromEntries(snapshot.intents.map((item) => [item.idempotency_key, item]));
    this.state.checkpoints = Object.fromEntries(snapshot.checkpoints.filter((item) => validId(item.checkpoint_id)).map((item) => [item.checkpoint_id, item]));
    this.state.denials = snapshot.denials;
    await this.flush();
  }
}

export function createServerNodeRuntime(options = {}) {
  const token = options.authToken ?? process.env.TITAN_NODE_AUTH_TOKEN;
  const store = options.store ?? new ControlPlaneStore(options.storePath ?? path.join(process.cwd(), ".titan-server-node", "control.json"));
  const capabilities = options.capabilities ?? DEFAULT_CAPABILITIES;
  const dependencyNames = options.dependencies ?? DEFAULT_DEPENDENCIES;
  const dependencyProbe = options.dependencyProbe ?? (async () => dependencyNames.map((name) => ({ name, status: "unknown", reason: "provider-not-configured" })));
  const governedExecutor = options.governedExecutor;
  const evidenceSink = options.evidenceSink;
  let opened = false;

  function authenticate(req, requiredCapability) {
    if (!token) return { status: 503, error: "node authentication is not configured" };
    const auth = req.headers.authorization;
    if (!auth?.startsWith("Bearer ") || !safeEqual(auth.slice(7), token)) return { status: 401, error: "authenticated node caller required" };
    const schema = req.headers["x-titan-schema-version"];
    if (schema !== "1") return { status: 426, error: "unsupported control-plane schema" };
    const correlation = correlationId(req);
    if (!validId(correlation)) return { status: 400, error: "correlation ID required" };
    const callerId = req.headers["x-titan-caller-id"];
    if (!validId(callerId)) return { status: 403, error: "caller identity required" };
    if (requiredCapability && !capabilities.has(requiredCapability)) return { status: 403, error: "capability unavailable" };
    return { correlation_id: correlation, caller_id: callerId };
  }

  async function handle(req, res) {
    const id = requestId(req); res.setHeader("x-titan-request-id", id);
    const url = new URL(req.url, "http://127.0.0.1");
    try {
      if (req.method === "GET" && url.pathname === "/live") return json(res, 200, { ok: true, service: "titan-server-node" });
      if (req.method === "GET" && url.pathname === "/ready") return json(res, opened ? 200 : 503, { ready: opened, schema: CONTROL_PLANE_SCHEMA });
      if (req.method === "GET" && url.pathname === "/v1/health") {
        const auth = authenticate(req, "node.health.read"); if (auth.status) return json(res, auth.status, { error: auth.error, request_id: id });
        const dependencies = await dependencyProbe();
        return json(res, 200, { schema: CONTROL_PLANE_SCHEMA, node_id: store.state.node_id, status: dependencies.some((item) => item.status === "failed") ? "degraded" : "ready", caller_id: auth.caller_id, correlation_id: auth.correlation_id, dependencies });
      }
      if (req.method === "GET" && url.pathname === "/v1/dependencies") {
        const auth = authenticate(req, "node.dependencies.read"); if (auth.status) return json(res, auth.status, { error: auth.error, request_id: id });
        const dependencies = await dependencyProbe();
        return json(res, 200, { schema: CONTROL_PLANE_SCHEMA, node_id: store.state.node_id, graph: dependencies.map((item) => ({ ...item, depends_on: item.depends_on ?? [] })), correlation_id: auth.correlation_id });
      }
      if (req.method === "GET" && url.pathname === "/v1/bootstrap") {
        const auth = authenticate(req); if (auth.status) return json(res, auth.status, { error: auth.error, request_id: id });
        return json(res, 200, { schema: CONTROL_PLANE_SCHEMA, node_id: store.state.node_id, capabilities: [...capabilities], control_metadata_only: true, company_data_owner: "company-physical-store", evidence_owner: "evidence-ledger", correlation_id: auth.correlation_id });
      }
      if (req.method === "POST" && url.pathname === "/v1/intents") {
        const auth = authenticate(req, "node.lifecycle.request"); if (auth.status) return json(res, auth.status, { error: auth.error, request_id: id });
        const body = await readBody(req); const required = ["kind", "company_id", "capability_id", "idempotency_key", "governed_execution_ref", "authority_decision_ref", "evidence_ref", "expires_at"];
        if (required.some((key) => !body[key]) || !validId(body.company_id) || !validId(body.idempotency_key) || !validId(body.capability_id)) return json(res, 400, { error: "complete governed lifecycle intent required", request_id: id });
        if (containsSecretMaterial(body)) return json(res, 400, { error: "secret material must be referenced, not submitted", request_id: id });
        if (body.company_id !== req.headers["x-titan-company-id"]) { await store.recordDenial({ reason: "company_context_mismatch", company_id: body.company_id, correlation_id: auth.correlation_id, created_at: new Date().toISOString() }); return json(res, 403, { error: "company context mismatch", request_id: id }); }
        if (Date.parse(body.expires_at) <= Date.now()) { await store.recordDenial({ reason: "stale_intent", company_id: body.company_id, correlation_id: auth.correlation_id, created_at: new Date().toISOString() }); return json(res, 409, { error: "stale lifecycle intent refused", request_id: id }); }
        const fingerprint = hash(body); const prior = store.state.intents[body.idempotency_key];
        if (prior) return json(res, prior.fingerprint === fingerprint ? 200 : 409, prior.fingerprint === fingerprint ? { ...prior.receipt, replay: true, request_id: id } : { error: "idempotency key reused with different intent", request_id: id });
        const record = { idempotency_key: body.idempotency_key, company_id: body.company_id, capability_id: body.capability_id, correlation_id: auth.correlation_id, evidence_ref: body.evidence_ref, fingerprint, state: "PENDING_CANONICAL_EXECUTION", created_at: new Date().toISOString(), receipt: { accepted: true, state: "PENDING_CANONICAL_EXECUTION", execution_boundary: "canonical-execution-gateway", provider_acknowledged: false, verified: false, correlation_id: auth.correlation_id } };
        if (governedExecutor) { const result = await governedExecutor({ ...body, caller_id: auth.caller_id, correlation_id: auth.correlation_id }); record.receipt = { ...record.receipt, ...result, verified: result?.verified === true && Boolean(result?.verification_ref) }; }
        await store.recordIntent(record); if (evidenceSink) await evidenceSink({ kind: "server-node.intent.accepted", evidence_ref: body.evidence_ref, company_id: body.company_id, correlation_id: auth.correlation_id }); return json(res, 202, { ...record.receipt, request_id: id });
      }
      if (req.method === "POST" && url.pathname === "/v1/recovery/checkpoint") {
        const auth = authenticate(req, "node.recovery.checkpoint"); if (auth.status) return json(res, auth.status, { error: auth.error, request_id: id });
        const body = await readBody(req); if (!validId(body.checkpoint_id) || !validId(body.manifest_digest)) return json(res, 400, { error: "checkpoint_id and manifest_digest required", request_id: id });
        return json(res, 201, { checkpoint: await store.checkpoint(body), correlation_id: auth.correlation_id, request_id: id });
      }
      if (req.method === "POST" && url.pathname === "/v1/recovery/restore") {
        const auth = authenticate(req, "node.recovery.checkpoint"); if (auth.status) return json(res, auth.status, { error: auth.error, request_id: id });
        const body = await readBody(req); if (body.manifest_digest !== body.snapshot?.checkpoints?.[0]?.manifest_digest) return json(res, 409, { error: "restore manifest does not match snapshot", request_id: id });
        await store.restoreSnapshot(body.snapshot); if (evidenceSink) await evidenceSink({ kind: "server-node.recovery.restored", evidence_ref: body.evidence_ref ?? "recovery", correlation_id: auth.correlation_id });
        return json(res, 200, { restored: true, node_id: store.state.node_id, correlation_id: auth.correlation_id, request_id: id });
      }
      return json(res, 404, { error: "not found", request_id: id });
    } catch (error) { return json(res, error.status ?? 500, { error: error.message, request_id: id }); }
  }

  const server = http.createServer((req, res) => void handle(req, res));
  return { store, server, async start() { await store.open(); await new Promise((resolve, reject) => server.listen(options.port ?? 0, options.host ?? "127.0.0.1", (error) => error ? reject(error) : resolve())); opened = true; return server.address(); }, async close() { opened = false; if (server.listening) await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve())); } };
}

if (process.argv.includes("--serve")) {
  const runtime = createServerNodeRuntime({ port: Number(process.env.TITAN_NODE_PORT ?? 3015) });
  await runtime.start();
  process.once("SIGTERM", () => runtime.close().finally(() => process.exit(0)));
  process.once("SIGINT", () => runtime.close().finally(() => process.exit(0)));
}
