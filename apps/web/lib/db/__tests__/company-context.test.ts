import { describe, expect, it } from "vitest";
import { assertCompanyRow, normalizeCompanyId } from "../contracts";

describe("canonical company storage boundary", () => {
  it("requires company context", () => {
    expect(() => normalizeCompanyId({})).toThrow("company_id context is required");
  });

  it("normalizes legacy account identifiers", () => {
    expect(normalizeCompanyId({ accountId: "company-a" })).toBe("company-a");
    expect(normalizeCompanyId({ tenantCompanyId: "company-a" })).toBe("company-a");
    expect(normalizeCompanyId({ tenantId: "company-a" })).toBe("company-a");
  });

  it("accepts matching compatibility identifiers", () => {
    expect(normalizeCompanyId({ companyId: "company-a", accountId: "company-a" })).toBe("company-a");
  });

  it("rejects conflicting company identifiers", () => {
    expect(() => normalizeCompanyId({ companyId: "company-a", accountId: "company-b" }))
      .toThrow("Conflicting company identifiers rejected");
  });

  it("blocks cross-company rows", () => {
    expect(() => assertCompanyRow("company-a", { company_id: "company-b" }))
      .toThrow("Cross-company row access blocked");
  });

  it("accepts rows belonging to the active company", () => {
    expect(() => assertCompanyRow("company-a", { company_id: "company-a" })).not.toThrow();
  });
});
