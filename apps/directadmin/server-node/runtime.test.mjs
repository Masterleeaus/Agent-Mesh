import test from "node:test";
import assert from "node:assert/strict";
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
