import test from "node:test";
import assert from "node:assert/strict";
import { handleConversationRequest, normalizeConversationRequest, writeConversationResponse, type ConversationAuth, type ConversationHostRuntime } from "./conversation-api.js";
import { createServer } from "node:http";

const context = {
  company_id: "company-1", actor_id: "actor-1", device_id: "device-1",
  surface: "zero" as const, session_id: "session-1", context_revision: "rev-7",
};
const auth: ConversationAuth = {
  async resolve() { return context; },
};
const events = [
  { id: "event-1", kind: "message.delta", company_id: "company-1", conversation_id: "conversation-1", surface: "zero" as const, delta: "hello" },
  { id: "event-2", kind: "work.state", company_id: "company-1", conversation_id: "conversation-1", surface: "zero" as const, state: "WAITING" },
];
const runtime: ConversationHostRuntime = {
  async dispatch(input) {
    assert.equal(input.company_id, "company-1");
    assert.equal(input.actor_id, "actor-1");
    assert.equal(input.conversation_id, "conversation-1");
    return { accepted: true, events, continuation_token: "continuation-1" };
  },
  async cancel() { return { accepted: true, events: [events[1]] }; },
};

function request(overrides: Record<string, unknown> = {}) {
  return normalizeConversationRequest({
    action: "start", company_id: "company-1", actor_id: "actor-1", device_id: "device-1",
    surface: "zero", session_id: "session-1", context_revision: "rev-7",
    conversation_id: "conversation-1", interaction_id: "interaction-1", client_message_id: "message-1",
    request_id: "request-1", operation_id: "operation-1", correlation_id: "correlation-1",
    trace_id: "trace-1", idempotency_key: "idem-1", text: "Inspect", ...overrides,
  });
}

test("conversation lifecycle preserves authenticated context and all correlation identities", async () => {
  const result = await handleConversationRequest(request(), auth, runtime, "Bearer session");
  assert.equal(result.schema_version, "titan.workforce.conversation.v1");
  assert.equal(result.company_id, "company-1");
  assert.equal(result.context_revision, "rev-7");
  assert.equal(result.request_id, "request-1");
  assert.equal(result.operation_id, "operation-1");
  assert.equal(result.idempotency_key, "idem-1");
  assert.deepEqual(result.events, events);
  assert.equal(result.continuation_token, "continuation-1");
});

test("mismatched company, actor, device, surface, session, and stale revision fail closed", async () => {
  for (const field of ["company_id", "actor_id", "device_id", "surface", "session_id", "context_revision"]) {
    await assert.rejects(() => handleConversationRequest(request({ [field]: field === "surface" ? "hub" : "wrong" }), auth, runtime, undefined), /conversation-(company|actor|device|surface|session)-mismatch|conversation-context-stale/);
  }
});

test("cancel is a separate lifecycle action and never dispatches a user command", async () => {
  let dispatched = false;
  const cancelRuntime: ConversationHostRuntime = {
    async dispatch() { dispatched = true; throw new Error("must-not-dispatch"); },
    async cancel(input) { assert.equal(input.continuation_token, "continuation-1"); return { accepted: true, events: [] }; },
  };
  const result = await handleConversationRequest(request({ action: "cancel", continuation_token: "continuation-1", text: undefined }), auth, cancelRuntime, undefined);
  assert.equal(result.accepted, true);
  assert.equal(dispatched, false);
});

test("SSE resume emits ordered events after Last-Event-ID and does not duplicate prior events", async () => {
  const server = createServer((_, response) => writeConversationResponse(response, {
    accepted: true, schema_version: "titan.workforce.conversation.v1", ...context,
    conversation_id: "conversation-1", request_id: "request-1", operation_id: "operation-1",
    correlation_id: "correlation-1", trace_id: "trace-1", idempotency_key: "idem-1", events,
  }, true, "event-1"));
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", () => resolve()));
  try {
    const address = server.address();
    assert.ok(address && typeof address !== "string");
    const response = await fetch(`http://127.0.0.1:${address.port}`);
    const body = await response.text();
    assert.equal(response.headers.get("content-type"), "text/event-stream");
    assert.match(body, /event-2/);
    assert.doesNotMatch(body, /event-1/);
  } finally {
    await new Promise<void>(resolve => server.close(() => resolve()));
  }
});

test("identity fields are bounded and malformed lifecycle input is rejected", () => {
  assert.throws(() => normalizeConversationRequest({}), /conversation-company-id-required/);
  assert.throws(() => request({ text: "x".repeat(20 * 1024 + 1) }), /conversation-text-too-large/);
});
