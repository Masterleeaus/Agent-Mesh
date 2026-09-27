import { afterEach, describe, expect, it, vi } from "vitest";
import { clearZeroRuntimeDispatcher, dispatchZeroRuntime, registerZeroRuntimeDispatcher } from "./runtime-dispatch";

afterEach(() => clearZeroRuntimeDispatcher());

describe("Zero runtime dispatch port", () => {
  it("fails closed when no production runtime dispatcher is registered", async () => {
    await expect(dispatchZeroRuntime({
      company_id: "company-a",
      actor_id: "owner-a",
      conversation_id: "conv-a",
      interaction_id: "interaction-a",
      client_message_id: "message-a",
      text: "Emma is sick tomorrow. Sort it out.",
      correlation_id: "message-a",
    })).rejects.toMatchObject({ code: "ZERO_RUNTIME_UNAVAILABLE" });
  });

  it("preserves authenticated correlation fields when dispatching", async () => {
    const dispatch = vi.fn(async (input) => ({ accepted: true as const, events: [{ id: "event-1", kind: "message", company_id: input.company_id, conversation_id: input.conversation_id, surface: "zero" as const }] }));
    registerZeroRuntimeDispatcher({ dispatch });

    await dispatchZeroRuntime({
      company_id: "company-a",
      actor_id: "owner-a",
      conversation_id: "conv-a",
      interaction_id: "interaction-a",
      client_message_id: "message-a",
      text: "Emma is sick tomorrow. Sort it out.",
      correlation_id: "message-a",
    });

    expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({
      company_id: "company-a",
      actor_id: "owner-a",
      conversation_id: "conv-a",
      correlation_id: "message-a",
    }));
  });
});
