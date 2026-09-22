import { beforeEach, describe, expect, it, vi } from "vitest";

const mockPortableQuery = vi.fn();
const mockPortableQueryOne = vi.fn();
const mockDialect = vi.fn();
const mockRandomUUID = vi.fn(() => "generated");
vi.mock("@/lib/db/portable", () => ({
  portableQuery: (...args: unknown[]) => mockPortableQuery(...args),
  portableQueryOne: (...args: unknown[]) => mockPortableQueryOne(...args),
}));
vi.mock("@/lib/db", () => ({ getDatabaseDialect: () => mockDialect() }));
vi.mock("node:crypto", () => ({ randomUUID: () => mockRandomUUID() }));

import { logCommunication, recordDeliveryReceipt } from "../communications-log";

describe("logCommunication portable communications audit", () => {
  beforeEach(() => { vi.clearAllMocks(); mockDialect.mockReturnValue("mysql"); });

  it("returns null without inserting when provider external id is already logged", async () => {
    mockPortableQuery.mockResolvedValueOnce([{ id: "existing" }]);
    const id = await logCommunication({ accountId: "a1", channel: "email", direction: "outbound", outcome: "sent", externalId: "provider-1" });
    expect(id).toBeNull();
    expect(mockPortableQuery).toHaveBeenCalledTimes(1);
    expect(mockPortableQuery.mock.calls[0][0]).toMatch(/account_id = \$1 AND external_id = \$2/);
  });

  it("uses MySQL INSERT IGNORE and verifies ownership of the generated id", async () => {
    mockPortableQuery.mockResolvedValueOnce([]).mockResolvedValueOnce([]).mockResolvedValueOnce([{ id: "generated" }]);
    const id = await logCommunication({ accountId: "a1", channel: "sms", direction: "inbound", outcome: "received", clientId: "c1", bodyPreview: "hello", externalId: "provider-2" });
    expect(id).toBe("generated");
    expect(mockPortableQuery.mock.calls[1][0]).toMatch(/^INSERT IGNORE INTO communications_log/);
    expect(mockPortableQuery.mock.calls[1][1][0]).toBe("generated");
  });

  it("uses portable explicit-id insert when no external id is supplied", async () => {
    mockDialect.mockReturnValue("postgres");
    mockPortableQuery.mockResolvedValueOnce([]);
    const id = await logCommunication({ accountId: "a1", channel: "phone", direction: "outbound", outcome: "left_voicemail" });
    expect(id).toBe("generated");
    expect(mockPortableQuery.mock.calls[0][0]).not.toMatch(/RETURNING|ON CONFLICT/);
  });
});


describe("recordDeliveryReceipt", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("projects canonical company-scoped delivery evidence into the legacy audit table", async () => {
    mockPortableQuery.mockResolvedValue([{ id: "comm-1" }]);
    const updated = await recordDeliveryReceipt({
      company_id: "company-1",
      message_id: "msg-1",
      conversation_id: "conv-1",
      correlation_id: "corr-1",
      channel: "sms",
      state: "delivered",
      provider_message_id: "provider-1",
      attempt: 1,
      occurred_at: "2026-09-22T03:00:00.000Z",
    });
    expect(updated).toBe(true);
    expect(mockPortableQuery.mock.calls[0][1]).toEqual([
      "company-1",
      "provider-1",
      "delivered",
      "sms",
    ]);
  });

  it("maps voice/call evidence onto the existing phone storage channel", async () => {
    mockPortableQuery.mockResolvedValue([{ id: "comm-2" }]);
    await recordDeliveryReceipt({
      company_id: "company-1",
      message_id: "msg-2",
      conversation_id: "conv-2",
      correlation_id: "corr-2",
      channel: "voice",
      state: "failed",
      attempt: 1,
      occurred_at: "2026-09-22T03:01:00.000Z",
    });
    expect(mockPortableQuery.mock.calls[0][1][3]).toBe("phone");
  });
});
