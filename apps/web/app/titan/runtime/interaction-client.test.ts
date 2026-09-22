import assert from "node:assert/strict";
import test from "node:test";
import {
  TitanInteractionClient,
  normalizeInteractionSurface,
  type InteractionTransport,
} from "./interaction-client";

test("surface aliases normalize before interaction scope is established", () => {
  assert.equal(normalizeInteractionSurface("command"), "zero");
  assert.equal(normalizeInteractionSurface("owner"), "zero");
  assert.equal(normalizeInteractionSurface("field"), "go");
  assert.equal(normalizeInteractionSurface("customer"), "hub");
});

test("interaction client fails closed when no transport is configured", async () => {
  const client = new TitanInteractionClient({
    company_id: "company_live_1",
    conversation_id: "conversation_1",
    surface: "zero",
  });
  assert.deepEqual(await client.send("What needs me?"), []);
});

test("interaction client accepts only events in its canonical company conversation and surface scope", async () => {
  const transport: InteractionTransport = {
    async send(input) {
      const message = (company_id: string, conversation_id: string, surface: "zero" | "go" | "hub", id: string) => ({
        id,
        kind: "message" as const,
        company_id,
        conversation_id,
        surface,
        message: { id: `message-${id}`, company_id, conversation_id, surface, from: "zero" as const, text: id, created_at: "2026-09-22T00:00:00.000Z" },
      });
      return {
        accepted: true,
        events: [
          message(input.company_id, input.conversation_id, "zero", "valid"),
          message("other-company", input.conversation_id, "zero", "wrong-company"),
          message(input.company_id, "other-conversation", "zero", "wrong-conversation"),
          message(input.company_id, input.conversation_id, "go", "wrong-surface"),
        ],
      };
    },
  };
  const client = new TitanInteractionClient({ company_id: "company_live_1", conversation_id: "conversation_1", surface: "zero", transport });
  const events = await client.send("status");
  assert.deepEqual(events.map((event) => event.id), ["valid"]);
});

test("legacy tenant authority is rejected at interaction boundary", () => {
  assert.throws(() => new TitanInteractionClient({
    company_id: "company_live_1",
    conversation_id: "conversation_1",
    surface: "zero",
    tenant_id: "legacy",
  } as never), /Legacy tenant authority is forbidden/);
});


test("drops an event whose nested message crosses the authenticated scope", async () => {
  const transport = {
    async send() {
      return {
        accepted: true,
        events: [{
          id: "event-cross-scope",
          kind: "message" as const,
          company_id: "company-a",
          conversation_id: "conversation-a",
          surface: "zero" as const,
          message: {
            id: "message-cross-scope",
            conversation_id: "conversation-a",
            company_id: "company-b",
            surface: "zero" as const,
            from: "zero" as const,
            text: "must not project",
            created_at: new Date().toISOString(),
          },
        }],
      };
    },
  };
  const client = new TitanInteractionClient({ company_id: "company-a", conversation_id: "conversation-a", surface: "zero", transport });
  assert.deepEqual(await client.send("hello"), []);
});
