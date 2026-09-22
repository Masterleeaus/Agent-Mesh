import { describe, expect, it } from "vitest";
import { projectCommunicationThread } from "../thread-projection";
import type { CommunicationEnvelope } from "../contracts";

function message(id: string, company_id: string, conversation_id: string, created_at: string): CommunicationEnvelope {
  return {
    id,
    company_id,
    conversation_id,
    correlation_id: `corr-${id}`,
    channel: id === "email" ? "email" : "sms",
    direction: "outbound",
    participants: [{ address: "customer" }],
    created_at,
    provenance: { source: "test" },
  };
}

describe("projectCommunicationThread", () => {
  it("projects multiple channels into one ordered conversation without cloning state", () => {
    const thread = projectCommunicationThread({
      company_id: "company-1",
      conversation_id: "conv-1",
      messages: [
        message("email", "company-1", "conv-1", "2026-09-22T04:01:00.000Z"),
        message("sms", "company-1", "conv-1", "2026-09-22T04:00:00.000Z"),
      ],
      receipts: [{
        company_id: "company-1",
        message_id: "email",
        conversation_id: "conv-1",
        correlation_id: "corr-email",
        channel: "email",
        state: "delivered",
        attempt: 1,
        occurred_at: "2026-09-22T04:02:00.000Z",
      }],
    });
    expect(thread.messages.map((item) => item.id)).toEqual(["sms", "email"]);
    expect(thread.messages[1].delivery_state).toBe("delivered");
  });

  it("fails closed across company and conversation boundaries by excluding foreign evidence", () => {
    const thread = projectCommunicationThread({
      company_id: "company-1",
      conversation_id: "conv-1",
      messages: [
        message("good", "company-1", "conv-1", "2026-09-22T04:00:00.000Z"),
        message("foreign-company", "company-2", "conv-1", "2026-09-22T04:01:00.000Z"),
        message("foreign-thread", "company-1", "conv-2", "2026-09-22T04:02:00.000Z"),
      ],
    });
    expect(thread.messages.map((item) => item.id)).toEqual(["good"]);
  });
});
