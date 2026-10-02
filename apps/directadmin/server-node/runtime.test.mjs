import test from "node:test";
import assert from "node:assert/strict";
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
