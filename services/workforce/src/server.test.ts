import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
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
  await new Promise<void>(resolve => workforce.host.server.listen(0, "127.0.0.1", resolve));
  try {
    const address = workforce.host.server.address();
    assert.ok(address && typeof address !== "string");
    const response = await fetch(`http://127.0.0.1:${address.port}/v1/workforce/conversations`, {
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
  await new Promise<void>(resolve => workforce.host.server.listen(0, "127.0.0.1", resolve));
  try {
    const address = workforce.host.server.address();
    assert.ok(address && typeof address !== "string");
    const response = await fetch(`http://127.0.0.1:${address.port}/v1/workforce/conversations`, { method: "POST", body: "{}" });
    assert.equal(response.status, 503);
    assert.equal((await response.json() as Record<string, unknown>).error, "conversation-host-not-configured");
  } finally {
    await workforce.cleanup();
  }
});

test("workforce host exposes truthful health and ready state backed by durable storage", async () => {
  const workforce = await temporaryWorkforceServer();
  await new Promise<void>((resolve) => workforce.host.server.listen(0, "127.0.0.1", resolve));
  try {
    const address = workforce.host.server.address();
    assert.ok(address && typeof address !== "string");
    const baseUrl = `http://127.0.0.1:${address.port}`;
    const health = await fetch(`${baseUrl}/health`);
    assert.equal(health.status, 200);
    const healthBody = await health.json() as Record<string, unknown>;
    assert.equal(healthBody.status, "ok");
    assert.equal(healthBody.service, "workforce");
    const ready = await fetch(`${baseUrl}/ready`);
    assert.equal(ready.status, 200);
    assert.match(await ready.text(), /"service":"workforce"/);
    await workforce.host.close();
    const database = await readFile(workforce.databasePath);
    assert.ok(database.byteLength > 0);
  } finally {
    await rm(workforce.databasePath.replace(/workforce\.db$/, ""), { recursive: true, force: true });
  }
});
