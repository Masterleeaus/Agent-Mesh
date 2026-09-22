import { beforeEach, describe, expect, it, vi } from "vitest";

const portableQuery = vi.fn();
vi.mock("@/lib/db", () => ({ getDatabaseDialect: () => "postgres" }));
vi.mock("@/lib/db/portable", () => ({
  portableQuery,
  portableQueryOne: vi.fn(),
}));

import { logCommunicationForCompany } from "@/lib/communications-log";

describe("logCommunicationForCompany", () => {
  beforeEach(() => portableQuery.mockReset());

  it("normalizes canonical company_id onto the legacy storage column", async () => {
    portableQuery.mockResolvedValue([]);
    await logCommunicationForCompany({
      company_id: "company-1",
      channel: "sms",
      direction: "inbound",
      outcome: "received",
      externalId: "provider-1",
    });
    expect(portableQuery).toHaveBeenCalledWith(
      expect.stringContaining("account_id"),
      expect.arrayContaining(["company-1", "provider-1"]),
    );
  });

  it("fails closed before storage when company_id is missing", async () => {
    await expect(logCommunicationForCompany({
      company_id: "",
      channel: "email",
      direction: "outbound",
      outcome: "sent",
    })).rejects.toThrow("company_id is required");
    expect(portableQuery).not.toHaveBeenCalled();
  });
});
