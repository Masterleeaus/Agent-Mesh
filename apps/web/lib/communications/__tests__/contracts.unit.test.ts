import { describe, expect, it } from "vitest";
import {
  assertCommunicationEnvelope,
  communicationIdempotencyKey,
  createDeliveryReceipt,
  evaluateOutboundCommunicationPolicy,
  type CommunicationEnvelope,
  type OutboundCommunicationPolicy,
} from "../contracts";

const allowed: OutboundCommunicationPolicy = {
  consent: "granted",
  opted_out: false,
  quiet_hours: false,
  channel_allowed: true,
  privacy_allowed: true,
  funding_allowed: true,
  authority_allowed: true,
};

describe("canonical communications contract", () => {
  it("requires company/conversation/correlation identity", () => {
    const envelope: CommunicationEnvelope = {
      id: "msg-1",
      company_id: "company-1",
      conversation_id: "conv-1",
      correlation_id: "corr-1",
      channel: "sms",
      direction: "outbound",
      participants: [{ address: "+61400000000" }],
      created_at: "2026-09-22T00:00:00.000Z",
      provenance: { source: "test" },
    };
    expect(assertCommunicationEnvelope(envelope)).toBe(envelope);
    expect(communicationIdempotencyKey(envelope)).toBe("company-1:sms:corr-1:msg-1");
  });

  it("fails outbound policy closed before provider execution", () => {
    expect(evaluateOutboundCommunicationPolicy(allowed)).toEqual({ allowed: true });
    expect(evaluateOutboundCommunicationPolicy({ ...allowed, opted_out: true })).toEqual({
      allowed: false,
      reason: "opted-out",
    });
    expect(evaluateOutboundCommunicationPolicy({ ...allowed, consent: "unknown" })).toEqual({
      allowed: false,
      reason: "consent-required",
    });
    expect(evaluateOutboundCommunicationPolicy({ ...allowed, funding_allowed: false })).toEqual({
      allowed: false,
      reason: "funding-policy",
    });
    expect(evaluateOutboundCommunicationPolicy({ ...allowed, authority_allowed: false })).toEqual({
      allowed: false,
      reason: "authority-required",
    });
  });

  it("rejects cross-contract envelopes without canonical company scope", () => {
    expect(() =>
      assertCommunicationEnvelope({
        id: "msg-1",
        company_id: " ",
        conversation_id: "conv-1",
        correlation_id: "corr-1",
        channel: "email",
        direction: "inbound",
        participants: [{ address: "customer@example.com" }],
        created_at: "2026-09-22T00:00:00.000Z",
        provenance: { source: "test" },
      })
    ).toThrow(/company_id/);
  });
  it("normalizes provider outcomes into canonical delivery receipts", () => {
    const receipt = createDeliveryReceipt({
      message: {
        id: "msg-2",
        company_id: "company-1",
        conversation_id: "conv-1",
        correlation_id: "corr-2",
        channel: "email",
      },
      result: { ok: true, provider_message_id: "smtp-123" },
      attempt: 2,
      occurred_at: "2026-09-22T01:00:00.000Z",
    });
    expect(receipt).toEqual({
      company_id: "company-1",
      message_id: "msg-2",
      conversation_id: "conv-1",
      correlation_id: "corr-2",
      channel: "email",
      state: "sent",
      provider_message_id: "smtp-123",
      attempt: 2,
      occurred_at: "2026-09-22T01:00:00.000Z",
      error_code: undefined,
    });

    expect(createDeliveryReceipt({
      message: {
        id: "msg-3",
        company_id: "company-1",
        conversation_id: "conv-2",
        correlation_id: "corr-3",
        channel: "push",
      },
      result: { ok: false, error_code: "provider-unavailable" },
      occurred_at: "2026-09-22T01:01:00.000Z",
    }).state).toBe("failed");
  });
});
