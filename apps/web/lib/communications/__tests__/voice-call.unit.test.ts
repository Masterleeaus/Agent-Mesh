import { describe, expect, it } from "vitest";
import { normalizeVoiceCallEvent } from "../voice-call";

const base = {
  company_id: "company-1",
  message_id: "call-msg-1",
  conversation_id: "conv-1",
  correlation_id: "corr-1",
  channel: "call" as const,
  participants: [{ address: "+61400000000" }],
  provider_id: "voice-provider",
  provider_call_id: "provider-call-1",
  occurred_at: "2026-09-22T07:00:00.000Z",
};

describe("normalizeVoiceCallEvent", () => {
  it("projects completed calls onto canonical delivery evidence", () => {
    const result = normalizeVoiceCallEvent({ ...base, state: "completed" });
    expect(result).toMatchObject({
      message: {
        company_id: "company-1",
        conversation_id: "conv-1",
        correlation_id: "corr-1",
        channel: "call",
      },
      receipt: {
        company_id: "company-1",
        state: "delivered",
        provider_message_id: "provider-call-1",
      },
      call_state: "completed",
    });
  });

  it("records no-answer as failed evidence without granting authority", () => {
    const result = normalizeVoiceCallEvent({ ...base, channel: "voice", state: "no_answer" });
    expect(result.receipt).toMatchObject({ state: "failed", error_code: "no_answer" });
    expect(result.message.provenance.source).toBe("voice-provider");
  });

  it("rejects voice events without canonical company scope", () => {
    expect(() => normalizeVoiceCallEvent({ ...base, company_id: "", state: "answered" }))
      .toThrow("company_id is required");
  });
});
