import { beforeEach, describe, expect, it, vi } from "vitest";

const recordDeliveryReceipt = vi.fn().mockResolvedValue(true);
vi.mock("@/lib/communications-log", () => ({ recordDeliveryReceipt }));
import { executeGovernedOutbound, executeGovernedOutboundWithFallback } from "../outbound-orchestrator";

const message = {
  id: "msg-1",
  company_id: "company-1",
  conversation_id: "conv-1",
  correlation_id: "corr-1",
  channel: "sms" as const,
  direction: "outbound" as const,
  participants: [{ address: "+61400000000" }],
  created_at: "2026-09-22T06:00:00.000Z",
  provenance: { source: "command-bus", actor_id: "user-1" },
};
const allowed = {
  consent: "granted" as const,
  opted_out: false,
  quiet_hours: false,
  channel_allowed: true,
  privacy_allowed: true,
  funding_allowed: true,
  authority_allowed: true,
};
const rate = { limit: 10, used: 0, resets_at: "2026-09-22T07:00:00.000Z" };

describe("executeGovernedOutbound", () => {
  let sequence = 0;
  beforeEach(() => {
    recordDeliveryReceipt.mockClear();
    sequence += 1;
  });
  const uniqueMessage = () => ({
    ...message,
    id: `${message.id}-${sequence}`,
    correlation_id: `${message.correlation_id}-${sequence}`,
  });
  it("does not invoke providers when authority is denied", async () => {
    const send = vi.fn();
    const result = await executeGovernedOutbound({
      message: uniqueMessage(),
      policy: { ...allowed, authority_allowed: false },
      rate_limit: rate,
      candidates: [{ provider_id: "gateway", channel: "sms", available: true, funded: true, policy_allowed: true }],
      adapters: [{ provider_id: "gateway", send }],
    });
    expect(result).toMatchObject({ ok: false, denied: true, reason: "authority-required" });
    expect(send).not.toHaveBeenCalled();
    expect(recordDeliveryReceipt).not.toHaveBeenCalled();
  });

  it("selects an eligible provider and emits canonical delivery evidence", async () => {
    const send = vi.fn().mockResolvedValue({ ok: true, provider_message_id: "provider-1" });
    const result = await executeGovernedOutbound({
      message: uniqueMessage(),
      policy: allowed,
      rate_limit: rate,
      candidates: [
        { provider_id: "down", channel: "sms", available: false, funded: true, policy_allowed: true },
        { provider_id: "gateway", channel: "sms", available: true, funded: true, policy_allowed: true },
      ],
      adapters: [{ provider_id: "gateway", send }],
    });
    expect(send).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({
      ok: true,
      provider_id: "gateway",
      persisted: true,
      receipt: { company_id: "company-1", state: "sent", provider_message_id: "provider-1" },
    });
    expect(recordDeliveryReceipt).toHaveBeenCalledWith(expect.objectContaining({ company_id: "company-1", state: "sent" }));
  });

  it("returns bounded retry evidence after a retryable provider failure", async () => {
    const send = vi.fn().mockResolvedValue({ ok: false, error_code: "gateway-timeout" });
    const result = await executeGovernedOutbound({
      message: uniqueMessage(),
      policy: allowed,
      rate_limit: rate,
      candidates: [{ provider_id: "gateway", channel: "sms", available: true, funded: true, policy_allowed: true }],
      adapters: [{ provider_id: "gateway", send }],
      attempt: 1,
      retry_policy: { max_attempts: 3, base_delay_ms: 1000, max_delay_ms: 5000 },
    });
    expect(result).toMatchObject({
      ok: false,
      denied: false,
      reason: "provider-failed",
      provider_id: "gateway",
      receipt: { state: "failed", error_code: "gateway-timeout", attempt: 1 },
      retry: { next_attempt: 2, delay_ms: 1000 },
    });
  });

  it("stops retrying when the configured attempt limit is reached", async () => {
    const send = vi.fn().mockResolvedValue({ ok: false, error_code: "gateway-timeout" });
    const result = await executeGovernedOutbound({
      message: uniqueMessage(),
      policy: allowed,
      rate_limit: rate,
      candidates: [{ provider_id: "gateway", channel: "sms", available: true, funded: true, policy_allowed: true }],
      adapters: [{ provider_id: "gateway", send }],
      attempt: 3,
      retry_policy: { max_attempts: 3, base_delay_ms: 1000, max_delay_ms: 5000 },
    });
    expect(result).toMatchObject({ ok: false, reason: "provider-failed" });
    expect("retry" in result ? result.retry : undefined).toBeUndefined();
  });

  it("falls back to the next eligible provider and preserves attempt evidence", async () => {
    const primary = vi.fn().mockResolvedValue({ ok: false, error_code: "primary-down" });
    const fallback = vi.fn().mockResolvedValue({ ok: true, provider_message_id: "fallback-1" });
    const { result, attempts } = await executeGovernedOutboundWithFallback({
      message: uniqueMessage(),
      policy: allowed,
      rate_limit: rate,
      candidates: [
        { provider_id: "primary", channel: "sms", available: true, funded: true, policy_allowed: true },
        { provider_id: "unfunded", channel: "sms", available: true, funded: false, policy_allowed: true },
        { provider_id: "fallback", channel: "sms", available: true, funded: true, policy_allowed: true },
      ],
      adapters: [
        { provider_id: "primary", send: primary },
        { provider_id: "unfunded", send: vi.fn() },
        { provider_id: "fallback", send: fallback },
      ],
    });
    expect(result).toMatchObject({ ok: true, provider_id: "fallback" });
    expect(attempts.map((item) => [item.provider_id, item.receipt.state])).toEqual([
      ["primary", "failed"],
      ["fallback", "sent"],
    ]);
    expect(recordDeliveryReceipt).toHaveBeenCalledTimes(2);
  });

  it("never falls back across communication channels", async () => {
    const email = vi.fn().mockResolvedValue({ ok: true });
    const { result } = await executeGovernedOutboundWithFallback({
      message: uniqueMessage(),
      policy: allowed,
      rate_limit: rate,
      candidates: [{ provider_id: "email-provider", channel: "email", available: true, funded: true, policy_allowed: true }],
      adapters: [{ provider_id: "email-provider", send: email }],
    });
    expect(result).toMatchObject({ ok: false, reason: "no-provider" });
    expect(email).not.toHaveBeenCalled();
  });
  it("suppresses a duplicate before a second provider execution", async () => {
    const send = vi.fn().mockResolvedValue({ ok: true, provider_message_id: "provider-dedupe" });
    const duplicateMessage = uniqueMessage();
    const input = {
      message: duplicateMessage,
      policy: allowed,
      rate_limit: rate,
      candidates: [{ provider_id: "gateway", channel: "sms" as const, available: true, funded: true, policy_allowed: true }],
      adapters: [{ provider_id: "gateway", send }],
    };
    const first = await executeGovernedOutbound(input);
    const second = await executeGovernedOutbound(input);
    expect(first).toMatchObject({ ok: true });
    expect(second).toEqual({ ok: false, denied: false, reason: "duplicate" });
    expect(send).toHaveBeenCalledTimes(1);
  });

});
