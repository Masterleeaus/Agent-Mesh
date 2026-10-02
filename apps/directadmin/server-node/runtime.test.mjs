import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createServerNodeRuntime, CONTROL_PLANE_SCHEMA } from "./runtime.mjs";

async function fixture(t) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "titan-server-node-"));
  const runtime = createServerNodeRuntime({ authToken: "test-token", storePath: path.join(dir, "control.json"), dependencies: ["workforce", "redis"], dependencyProbe: async () => [{ name: "workforce", status: "healthy" }, { name: "redis", status: "healthy" }] });
  const address = await runtime.start();
  t.after(async () => { await runtime.close(); await fs.rm(dir, { recursive: true, force: true }); });
  return { runtime, base: `http://127.0.0.1:${address.port}`, dir };
}
function headers(extra = {}) { return { authorization: "Bearer test-token", "x-titan-schema-version": "1", "x-titan-caller-id": "directadmin-test", "x-titan-company-id": "company-a", "x-titan-correlation-id": "corr-1", ...extra }; }
async function call(base, route, init = {}) { const response = await fetch(`${base}${route}`, { ...init, headers: { ...headers(), ...(init.headers ?? {}) } }); return { status: response.status, body: await response.json() }; }

test("serves authenticated health, bootstrap identity, and dependency graph projections", async t => {
  const f = await fixture(t); const result = await call(f.base, "/v1/health");
  assert.equal(result.status, 200); assert.equal(result.body.schema, CONTROL_PLANE_SCHEMA); assert.equal(result.body.dependencies[0].status, "healthy");
  assert.equal(result.body.status, "degraded"); assert.equal(result.body.canonical_execution, "unavailable");
  const bootstrap = await call(f.base, "/v1/bootstrap"); assert.equal(bootstrap.status, 200); assert.equal(bootstrap.body.control_metadata_only, true); assert.equal(bootstrap.body.capabilities.includes("node.lifecycle.request"), false);
  const graph = await call(f.base, "/v1/dependencies"); assert.ok(Array.isArray(graph.body.graph)); assert.deepEqual(graph.body.graph[0].depends_on, []);
});
test("rejects missing identity, schema, and unauthorized callers", async t => {
  const f = await fixture(t); assert.equal((await fetch(`${f.base}/v1/health`)).status, 401);
  assert.equal((await call(f.base, "/v1/health", { headers: { "x-titan-schema-version": "9" } })).status, 426);
  assert.equal((await call(f.base, "/v1/health", { headers: { authorization: "Bearer wrong" } })).status, 401);
});
test("refuses stale/cross-company and secret-bearing lifecycle envelopes before commissioning", async t => {
  const f = await fixture(t);
  const body = { kind: "service.restart", target_ref: "workforce", company_id: "company-a", capability_id: "node.lifecycle.request", idempotency_key: "intent-1", governed_execution_ref: "exec-1", authority_decision_ref: "decision-1", evidence_ref: "evidence-1", expires_at: new Date(Date.now() + 60000).toISOString() };
  const post = value => call(f.base, "/v1/intents", { method: "POST", body: JSON.stringify(value) });
  assert.equal((await post(body)).status, 503);
  assert.equal((await post({ ...body, company_id: "company-b" })).status, 403);
  assert.equal((await post({ ...body, expires_at: new Date(Date.now() - 1).toISOString() })).status, 409);
  assert.equal((await post({ ...body, token: "do-not-store" })).status, 400);
  assert.equal(Object.keys(f.runtime.store.state.intents).length, 0); assert.equal(f.runtime.store.state.denials.length, 3);
});
test("persists node identity across graceful service restart", async t => {
  const f = await fixture(t); const identity = f.runtime.store.state.node_id; await f.runtime.close();
  const runtime = createServerNodeRuntime({ authToken: "test-token", storePath: path.join(f.dir, "control.json") });
  await runtime.start(); assert.equal(runtime.store.state.node_id, identity); await runtime.close();
});
test("refuses unsupported schemas and missing restore integrity", async t => {
  const f = await fixture(t); const snapshot = f.runtime.store.exportSnapshot("company-a");
  const response = await call(f.base, "/v1/recovery/restore", { method: "POST", body: JSON.stringify({ snapshot, manifest_digest: "wrong" }) });
  assert.equal(response.status, 409);
  await assert.rejects(() => f.runtime.store.restoreSnapshot({ ...snapshot, schema_version: "titan.server-node/v0" }, { manifestDigest: snapshot.snapshot_digest, companyId: "company-a" }), /snapshot/);
});

import { request as httpRequest, createServer as createHttpServer } from "node:http";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { fileURLToPath } from "node:url";
import { createServerNodeHealthServer, validateDependencies } from "./runtime.mjs";

async function withServer(options, run) {
  const server = createServerNodeHealthServer(options);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  try { await run(`http://127.0.0.1:${address.port}`); }
  finally { await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve())); }
}

test("dependency definitions accept loopback health endpoints", () => {
  assert.equal(validateDependencies([{ id: "workforce", url: "http://127.0.0.1:3010/ready" }])[0].critical, true);
});

test("dependency definitions reject remote targets, credentials and redirects by URL", () => {
  for (const url of ["https://127.0.0.1/health", "http://example.com/health", "http://127.0.0.1.attacker.test/health", "http://localhost/health", "http://user:pass@127.0.0.1/health"]) {
    assert.throws(() => validateDependencies([{ id: "unsafe", url }]), /dependency_target_must_be_loopback_http/);
  }
});

test("liveness is distinct from degraded dependency readiness", async () => {
  await withServer({ dependencies: [{ id: "workforce", url: "http://127.0.0.1:3010/ready" }], fetchImpl: async () => { throw new Error("offline"); } }, async (base) => {
    const live = await fetch(`${base}/healthz`);
    assert.equal(live.status, 200);
    assert.equal((await live.json()).status, "alive");
    const ready = await fetch(`${base}/v1/status`);
    assert.equal(ready.status, 503);
    const body = await ready.json();
    assert.equal(body.ready, false);
    assert.equal(body.checks[0].status, "unreachable");
    assert.equal(ready.headers.get("cache-control"), "no-store");
  });
});

test("healthy dependencies produce ready status without exposing their URLs", async () => {
  await withServer({ dependencies: [{ id: "web", url: "http://127.0.0.1:3000/api/health" }], fetchImpl: async () => new Response("{}", { status: 200 }) }, async (base) => {
    const response = await fetch(`${base}/v1/status`);
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.schema, "titan.server-node.health.v1");
    assert.equal(body.checks[0].status, "healthy");
    assert.equal(JSON.stringify(body).includes("127.0.0.1"), false);
  });
});

test("control-plane health bridge exposes no mutation endpoint", async () => {
  await withServer({ dependencies: [] }, async (base) => {
    const response = await fetch(`${base}/v1/actions`, { method: "POST", body: "{}" });
    assert.equal(response.status, 405);
    assert.deepEqual(await response.json(), { error: "method_not_allowed" });
  });
});

test("duplicate dependency ids and invalid timeout fail closed", () => {
  assert.throws(() => validateDependencies([{ id: "web", url: "http://127.0.0.1/a" }, { id: "web", url: "http://127.0.0.1/b" }]), /dependency_id_duplicate/);
  assert.throws(() => validateDependencies([{ id: "web", url: "http://127.0.0.1/a", timeout_ms: 10 }]), /dependency_timeout_invalid/);
});
test("dependency count is capped to bound concurrent health probes", () => {
  const entries = Array.from({ length: 17 }, (_, index) => ({
    id: `dep_${index}`,
    url: `http://127.0.0.1:${3000 + index}/health`,
  }));
  assert.equal(validateDependencies(entries.slice(0, 16)).length, 16);
  assert.throws(() => validateDependencies(entries), /dependency_count_exceeded/);
});

test("an unconfigured bridge is alive but never claims readiness", async () => {
  await withServer({ dependencies: [] }, async (base) => {
    assert.equal((await fetch(`${base}/healthz`)).status, 200);
    const response = await fetch(`${base}/v1/status`);
    assert.equal(response.status, 503);
    const body = await response.json();
    assert.equal(body.ready, false);
    assert.equal(body.reason, "dependencies_not_configured");
    assert.deepEqual(body.checks, []);
  });
});

test("concurrent callers share one observation, excess callers fail closed, and liveness remains available", { timeout: 5000 }, async () => {
  let release;
  let probes = 0;
  const blocked = new Promise((resolve) => { release = resolve; });
  await withServer({
    maxStatusRequests: 2,
    dependencies: [{ id: "web", url: "http://127.0.0.1/health" }],
    fetchImpl: async () => { probes += 1; await blocked; return new Response("{}", { status: 200 }); },
  }, async (base) => {
    const calls = Array.from({ length: 3 }, () => fetch(`${base}/v1/status`));
    try {
      const refused = await Promise.race(calls);
      assert.equal(refused.status, 503);
      assert.deepEqual(await refused.clone().json(), { error: "status_busy", ready: false });
      assert.equal(probes, 1);
      assert.equal((await fetch(`${base}/healthz`)).status, 200);
    } finally { release(); }
    const responses = await Promise.all(calls);
    assert.deepEqual(responses.map((response) => response.status).sort(), [200, 200, 503]);
    const accepted = await Promise.all(responses.filter((response) => response.ok).map((response) => response.json()));
    assert.equal(accepted[0].checked_at, accepted[1].checked_at);
    assert.equal(probes, 1);
    assert.equal((await fetch(`${base}/v1/status`)).status, 200);
    assert.equal(probes, 2, "the next request observes fresh state rather than a cached result");
  });
});

test("health probes cancel unused provider bodies", async () => {
  let cancelled = false;
  await withServer({
    dependencies: [{ id: "web", url: "http://127.0.0.1/health" }],
    fetchImpl: async () => new Response(new ReadableStream({ cancel() { cancelled = true; } }), { status: 200 }),
  }, async (base) => {
    assert.equal((await fetch(`${base}/v1/status`)).status, 200);
    assert.equal(cancelled, true);
  });
});

function requestWithTarget(base, target, headers = {}) {
  return new Promise((resolve, reject) => {
    const origin = new URL(base);
    const hostname = origin.hostname.replace(/^\[|\]$/g, "");
    const request = httpRequest({ hostname, port: origin.port, method: "GET", path: target, headers }, (response) => {
      let body = "";
      response.setEncoding("utf8");
      response.on("data", (chunk) => { body += chunk; });
      response.on("end", () => resolve({ status: response.statusCode, body: JSON.parse(body) }));
    });
    request.on("error", reject);
    request.end(headers["content-length"] ? "x" : undefined);
  });
}

test("invalid request targets and body-bearing GET requests are refused without crashing the server", async () => {
  await withServer({ dependencies: [] }, async (base) => {
    for (const target of ["http://[", "//elsewhere.test/v1/status", "/v1/status#fragment"]) {
      const response = await requestWithTarget(base, target);
      assert.equal(response.status, 400);
      assert.deepEqual(response.body, { error: "invalid_request_target" });
    }
    const response = await requestWithTarget(base, "/v1/status", { "content-length": "1" });
    assert.equal(response.status, 400);
    assert.deepEqual(response.body, { error: "request_body_not_allowed" });
    assert.equal((await fetch(`${base}/healthz`)).status, 200);
  });
});

test("a real stalled dependency times out and the next observation can recover", { timeout: 5000 }, async () => {
  let healthy = false;
  const dependency = createHttpServer((_request, response) => {
    if (healthy) response.writeHead(200).end("{}");
  });
  await new Promise((resolve) => dependency.listen(0, "127.0.0.1", resolve));
  try {
    await withServer({ dependencies: [{ id: "web", url: `http://127.0.0.1:${dependency.address().port}/health`, timeout_ms: 100 }] }, async (base) => {
      const failed = await fetch(`${base}/v1/status`);
      assert.equal(failed.status, 503);
      assert.equal((await failed.json()).checks[0].status, "unreachable");
      healthy = true;
      const recovered = await fetch(`${base}/v1/status`);
      assert.equal(recovered.status, 200);
      assert.equal((await recovered.json()).ready, true);
    });
  } finally {
    dependency.closeAllConnections();
    await new Promise((resolve) => dependency.close(resolve));
  }
});

test("non-critical outages degrade health without preventing readiness", async () => {
  await withServer({ dependencies: [{ id: "optional", url: "http://127.0.0.1/health", critical: false }], fetchImpl: async () => new Response("{}", { status: 503 }) }, async (base) => {
    const response = await fetch(`${base}/v1/status`);
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.status, "degraded");
    assert.equal(body.ready, true);
  });
});

test("invalid status concurrency limits fail at bootstrap", () => {
  for (const maxStatusRequests of [0, -1, 33, 1.5, "2"]) {
    assert.throws(() => createServerNodeHealthServer({ maxStatusRequests }), /status_request_limit_invalid/);
  }
});

async function unusedPort(host) {
  const server = createHttpServer();
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, host, resolve);
  });
  const port = server.address().port;
  await new Promise((resolve) => server.close(resolve));
  return port;
}

function startBridge(t, host, port, { dependencies = [], environment = {} } = {}) {
  const child = spawn(process.execPath, [fileURLToPath(new URL("./runtime.mjs", import.meta.url))], {
    env: { ...process.env, ...environment, TITAN_SERVER_NODE_BIND: host, TITAN_SERVER_NODE_PORT: String(port), TITAN_SERVER_NODE_DEPENDENCIES: JSON.stringify(dependencies) },
    stdio: ["ignore", "pipe", "pipe"],
  });
  t.after(() => { if (child.exitCode === null && child.signalCode === null) child.kill("SIGKILL"); });
  const exit = once(child, "exit");
  let stdout = "";
  let stderr = "";
  child.stderr.on("data", (chunk) => { stderr += chunk; });
  const listening = new Promise((resolve, reject) => {
    child.on("error", reject);
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
      if (stdout.includes("\n")) {
        try { resolve(JSON.parse(stdout.split("\n")[0])); } catch (error) { reject(error); }
      }
    });
    exit.then(([code, signal]) => reject(new Error(`bridge exited before readiness: ${code}/${signal}: ${stderr}`)), reject);
  });
  return { child, exit, listening };
}

test("the standalone bridge starts on IPv4 loopback and shuts down cleanly", { timeout: 5000 }, async (t) => {
  const port = await unusedPort("127.0.0.1");
  const { child, exit, listening } = startBridge(t, "127.0.0.1", port);
  assert.equal((await listening).host, "127.0.0.1");
  assert.equal((await fetch(`http://127.0.0.1:${port}/healthz`)).status, 200);
  assert.equal((await fetch(`http://127.0.0.1:${port}/v1/status`)).status, 503);
  child.kill("SIGTERM");
  assert.deepEqual(await exit, [0, null]);
});

for (const configuredHost of ["::1", "[::1]"]) {
  test(`standalone IPv6 loopback bind accepts ${configuredHost}`, { timeout: 5000 }, async (t) => {
    let port;
    try { port = await unusedPort("::1"); }
    catch (error) {
      if (["EAFNOSUPPORT", "EADDRNOTAVAIL"].includes(error.code)) return t.skip("IPv6 loopback is unavailable on this host");
      throw error;
    }
    const { child, exit, listening } = startBridge(t, configuredHost, port);
    assert.equal((await listening).host, "::1");
    assert.equal((await requestWithTarget(`http://[::1]:${port}`, "/healthz")).status, 200);
    child.kill("SIGTERM");
    assert.deepEqual(await exit, [0, null]);
  });
}

test("the standalone bridge refuses a public bind before listening", { timeout: 5000 }, async (t) => {
  const { exit, listening } = startBridge(t, "0.0.0.0", 3099);
  await assert.rejects(listening, /bind_host_must_be_loopback/);
  const [code] = await exit;
  assert.notEqual(code, 0);
});

test("standalone loopback probes bypass environment proxies", { timeout: 5000 }, async (t) => {
  const dependency = createHttpServer((_request, response) => response.writeHead(200).end("{}"));
  await new Promise((resolve) => dependency.listen(0, "127.0.0.1", resolve));
  t.after(() => dependency.close());
  const port = await unusedPort("127.0.0.1");
  const { child, exit, listening } = startBridge(t, "127.0.0.1", port, {
    dependencies: [{ id: "web", url: `http://127.0.0.1:${dependency.address().port}/health` }],
    environment: { NODE_USE_ENV_PROXY: "1", HTTP_PROXY: "http://127.0.0.1:1", http_proxy: "http://127.0.0.1:1", NO_PROXY: "", no_proxy: "" },
  });
  await listening;
  const response = await requestWithTarget(`http://127.0.0.1:${port}`, "/v1/status");
  assert.equal(response.status, 200);
  assert.equal(response.body.ready, true);
  child.kill("SIGTERM");
  assert.deepEqual(await exit, [0, null]);
});

test("real HTTP redirects are reported unhealthy without following the target", async () => {
  let redirectedRequests = 0;
  const target = createHttpServer((_request, response) => { redirectedRequests += 1; response.writeHead(200).end("{}"); });
  await new Promise((resolve) => target.listen(0, "127.0.0.1", resolve));
  const source = createHttpServer((_request, response) => response.writeHead(302, { location: `http://127.0.0.1:${target.address().port}/health` }).end());
  await new Promise((resolve) => source.listen(0, "127.0.0.1", resolve));
  try {
    await withServer({ dependencies: [{ id: "web", url: `http://127.0.0.1:${source.address().port}/health` }] }, async (base) => {
      const response = await fetch(`${base}/v1/status`);
      assert.equal(response.status, 503);
      const body = await response.json();
      assert.equal(body.checks[0].status, "unhealthy");
      assert.equal(body.checks[0].http_status, 302);
      assert.equal(redirectedRequests, 0);
    });
  } finally {
    await Promise.all([source, target].map((server) => new Promise((resolve) => server.close(resolve))));
  }
});
