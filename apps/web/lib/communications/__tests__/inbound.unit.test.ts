import { describe, expect, it } from "vitest";
import { normalizeInboundProviderEvent, routeInboundCommunication } from "../inbound";

const inbound = {
  id: "msg-in-1",
  company_id: "company-1",
  conversation_id: "conv-1",
  correlation_id: "corr-1",
  channel: "sms" as const,
  direction: "inbound" as const,
  participants: [{ address: "+61400000000" }],
  body: "Can we move the booking?",
  created_at: "2026-09-22T06:00:00.000Z",
  provenance: { source: "sms-gateway", provider_id: "gateway-1" },
};

describe("routeInboundCommunication", () => {
  it("preserves canonical company/conversation/correlation identity", () => {
    expect(routeInboundCommunication({
      message: inbound,
      classification: { kind: "business", confidence: "high", intent: "scheduling" },
    })).toEqual({
      company_id: "company-1",
      conversation_id: "conv-1",
      correlation_id: "corr-1",
      message_id: "msg-in-1",
      channel: "sms",
      kind: "business",
      intent: "scheduling",
      requires_human_review: false,
      execution_authority: false,
    });
  });

  it("forces low-confidence inbound classifications to human review", () => {
    const routed = routeInboundCommunication({
      message: inbound,
      classification: { kind: "business", confidence: "low", intent: "approval" },
    });
    expect(routed.requires_human_review).toBe(true);
    expect(routed.execution_authority).toBe(false);
  });

  it("rejects outbound messages at the inbound routing boundary", () => {
    expect(() => routeInboundCommunication({
      message: { ...inbound, direction: "outbound" },
      classification: { kind: "business", confidence: "high" },
    })).toThrow("inbound communication required");
  });

  it("normalizes provider evidence into a canonical inbound envelope", () => {
    expect(normalizeInboundProviderEvent({
      company_id: "company-1",
      message_id: "provider-msg-1",
      conversation_id: "conv-1",
      correlation_id: "corr-1",
      channel: "messaging",
      participants: [{ address: "customer-1" }],
      body: "Hello",
      occurred_at: "2026-09-22T06:30:00.000Z",
      provider_id: "provider-a",
    })).toMatchObject({
      id: "provider-msg-1",
      company_id: "company-1",
      conversation_id: "conv-1",
      direction: "inbound",
      provenance: { source: "provider-inbound", provider_id: "provider-a" },
    });
  });

  it("fails closed when provider input lacks canonical company scope", () => {
    expect(() => normalizeInboundProviderEvent({
      company_id: "",
      message_id: "provider-msg-1",
      conversation_id: "conv-1",
      correlation_id: "corr-1",
      channel: "sms",
      participants: [{ address: "+61400000000" }],
      occurred_at: "2026-09-22T06:30:00.000Z",
      provider_id: "gateway",
    })).toThrow("company_id is required");
  });
});
