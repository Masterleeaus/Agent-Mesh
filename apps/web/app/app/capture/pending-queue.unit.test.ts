import { describe, expect, it } from "vitest";
import { buildPendingStorageKey, normalizePendingCompanyId } from "./pending-queue";

describe("pending capture storage company scope", () => {
  it("requires company_id", () => {
    expect(() => normalizePendingCompanyId("")).toThrow(/company_id is required/i);
  });

  it("namespaces the same capture id by company", () => {
    expect(buildPendingStorageKey("company-a", "capture-1"))
      .not.toBe(buildPendingStorageKey("company-b", "capture-1"));
  });

  it("builds a stable encoded key", () => {
    expect(buildPendingStorageKey("company/a", "capture 1")).toBe("company%2Fa|capture%201");
  });
});
