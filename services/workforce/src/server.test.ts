import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { connect } from "node:net";
import test from "node:test";

import { createWorkforceServer, type WorkforceServerOptions } from "./server.js";

async function temporaryWorkforceServer(options: WorkforceServerOptions = {}) {
  const directory = await mkdtemp(join(tmpdir(), "titan-workforce-"));
  const databasePath = join(directory, "workforce.db");
  const host = await createWorkforceServer({ ...options, storagePath: databasePath });
  return {
    host,
    databasePath,
    async cleanup() {
      await host.close();
      await rm(directory, { recursive: true, force: true });
    },
  };
}

async function listen(host: Awaited<ReturnType<typeof createWorkforceServer>>): Promise<string> {
  await new Promise<void>((resolve, reject) => {
    host.server.once("error", reject);
    host.server.listen(0, "127.0.0.1", resolve);
  });
  const address = host.server.address();
  assert.ok(address && typeof address !== "string");
  return `http://127.0.0.1:${address.port}`;
}

test("Server Node exposes the authenticated Workforce lifecycle without a demo fallback", async () => {
  const workforce = await temporaryWorkforceServer({
    conversation: {
      auth: { async resolve() {
        return { company_id: "company-1", actor_id: "actor-1", device_id: "device-1", surface: "zero", session_id: "session-1", context_revision: "rev-1" };
      } },
      runtime: { async dispatch(input) {
        return { accepted: true, events: [{ id: "event-1", kind: "work.state", company_id: input.company_id, conversation_id: input.conversation_id, surface: "zero", state: "WAITING" }], continuation_token: "continue-1" };
      } },
    },
  });
  const baseUrl = await listen(workforce.host);
  try {
    const response = await fetch(`${baseUrl}/v1/workforce/conversations`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: "Bearer test" },
      body: JSON.stringify({
        action: "start", company_id: "company-1", actor_id: "actor-1", device_id: "device-1",
        surface: "zero", session_id: "session-1", context_revision: "rev-1",
        conversation_id: "conversation-1", interaction_id: "interaction-1", client_message_id: "message-1",
        request_id: "request-1", operation_id: "operation-1", correlation_id: "correlation-1",
        trace_id: "trace-1", idempotency_key: "idempotency-1", text: "Inspect",
      }),
    });
    assert.equal(response.status, 200);
    const body = await response.json() as Record<string, unknown>;
    assert.equal(body.schema_version, "titan.workforce.conversation.v1");
    assert.equal(body.continuation_token, "continue-1");
  } finally {
    await workforce.cleanup();
  }
});

test("unconfigured Server Node fails closed instead of serving demo conversations", async () => {
  const workforce = await temporaryWorkforceServer();
  const baseUrl = await listen(workforce.host);
  try {
    const response = await fetch(`${baseUrl}/v1/workforce/conversations`, { method: "POST", body: "{}" });
    assert.equal(response.status, 503);
    assert.equal((await response.json() as Record<string, unknown>).error, "conversation-host-not-configured");
    const method = await fetch(`${baseUrl}/v1/workforce/conversations`, { method: "GET" });
    assert.equal(method.status, 405);
    assert.equal(method.headers.get("allow"), "POST");
  } finally {
    await workforce.cleanup();
  }
});

test("malformed request targets return 400 without terminating the workforce host", async () => {
  const workforce = await temporaryWorkforceServer();
  const baseUrl = await listen(workforce.host);
  try {
    const response = await new Promise<string>((resolve, reject) => {
      const socket = connect(Number(new URL(baseUrl).port), "127.0.0.1");
      let received = "";
      socket.setEncoding("utf8");
      socket.setTimeout(5000, () => socket.destroy(new Error("request timed out")));
      socket.on("error", reject);
      socket.on("data", chunk => { received += chunk; });
      socket.on("end", () => resolve(received));
      socket.on("connect", () => {
        socket.write("GET http://[ HTTP/1.1\r\nHost: localhost\r\nConnection: close\r\n\r\n");
      });
    });
    assert.match(response, /^HTTP\/1\.1 400 /);
    assert.match(response, /invalid_request_target/);
    assert.equal((await fetch(`${baseUrl}/health`)).status, 200);
    assert.equal((await fetch(`${baseUrl}/ready`)).status, 200);
  } finally {
    await workforce.cleanup();
  }
});

test("workforce readiness checks the configured durable database and survives host restart", async () => {
  const workforce = await temporaryWorkforceServer();
  const baseUrl = await listen(workforce.host);
  try {
    const health = await fetch(`${baseUrl}/health`);
    assert.equal(health.status, 200);
    assert.deepEqual(await health.json(), { status: "ok", service: "workforce", checks: { process: "ok" } });
    const ready = await fetch(`${baseUrl}/ready`);
    assert.equal(ready.status, 200);
    assert.deepEqual(await ready.json(), { status: "ok", service: "workforce", checks: { storage: "ok" } });
    const method = await fetch(`${baseUrl}/ready`, { method: "POST" });
    assert.equal(method.status, 405);
    assert.equal(method.headers.get("allow"), "GET");
    const missing = await fetch(`${baseUrl}/unknown`);
    assert.equal(missing.status, 404);
    await workforce.host.close();
    const database = await readFile(workforce.databasePath);
    assert.ok(database.byteLength > 0);

    const restartedHost = await createWorkforceServer({ storagePath: workforce.databasePath });
    const restartedUrl = await listen(restartedHost);
    try {
      const afterRestart = await fetch(`${restartedUrl}/ready`);
      assert.equal(afterRestart.status, 200);
      assert.deepEqual(await afterRestart.json(), { status: "ok", service: "workforce", checks: { storage: "ok" } });
    } finally {
      await restartedHost.close();
    }
  } finally {
    await rm(workforce.databasePath.replace(/workforce\.db$/, ""), { recursive: true, force: true });
  }
});
