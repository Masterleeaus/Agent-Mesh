import test from "node:test";
import assert from "node:assert/strict";
import { createWorkforceServer } from "./server.js";

test("Server Node exposes the authenticated Workforce lifecycle without a demo fallback", async () => {
  const workforce = await createWorkforceServer({
    conversation: {
      auth: { async resolve() {
        return { company_id: "company-1", actor_id: "actor-1", device_id: "device-1", surface: "zero", session_id: "session-1", context_revision: "rev-1" };
      } },
      runtime: { async dispatch(input) {
        return { accepted: true, events: [{ id: "event-1", kind: "work.state", company_id: input.company_id, conversation_id: input.conversation_id, surface: "zero", state: "WAITING" }], continuation_token: "continue-1" };
      } },
    },
  });
  await new Promise<void>(resolve => workforce.server.listen(0, "127.0.0.1", () => resolve()));
  try {
    const address = workforce.server.address();
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
    await workforce.close();
  }
});

test("unconfigured Server Node fails closed instead of serving demo conversations", async () => {
  const workforce = await createWorkforceServer();
  await new Promise<void>(resolve => workforce.server.listen(0, "127.0.0.1", () => resolve()));
  try {
    const address = workforce.server.address();
    assert.ok(address && typeof address !== "string");
    const response = await fetch(`http://127.0.0.1:${address.port}/v1/workforce/conversations`, { method: "POST", body: "{}" });
    assert.equal(response.status, 503);
    assert.equal((await response.json() as Record<string, unknown>).error, "conversation-host-not-configured");
  } finally {
    await workforce.close();
  }
});

test("workforce host exposes truthful health and ready state backed by durable storage", async () => {
  const { mkdtemp, readFile } = await import("node:fs/promises");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  const directory = await mkdtemp(join(tmpdir(), "titan-workforce-"));
  const databasePath = join(directory, "workforce.db");
  const previousPath = process.env.WORKFORCE_SQLITE_PATH;
  process.env.WORKFORCE_SQLITE_PATH = databasePath;
  const host = await createWorkforceServer();
  await new Promise<void>((resolve) => host.server.listen(0, "127.0.0.1", resolve));
  const address = host.server.address();
  assert.ok(address && typeof address !== "string");
  const baseUrl = `http://127.0.0.1:${address.port}`;
  try {
    const health = await fetch(`${baseUrl}/health`);
    assert.equal(health.status, 200);
    const healthBody = await health.json() as Record<string, unknown>;
    assert.equal(healthBody.status, "ok");
    assert.equal(healthBody.service, "workforce");
    const ready = await fetch(`${baseUrl}/ready`);
    assert.equal(ready.status, 200);
    assert.match(await ready.text(), /"service":"workforce"/);
    await host.close();
    const database = await readFile(databasePath);
    assert.ok(database.byteLength > 0);
  } finally {
    if (previousPath === undefined) delete process.env.WORKFORCE_SQLITE_PATH;
    else process.env.WORKFORCE_SQLITE_PATH = previousPath;
  }
});
