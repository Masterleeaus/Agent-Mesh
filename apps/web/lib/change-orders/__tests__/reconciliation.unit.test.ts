import { describe, expect, it } from "vitest";
import { approvedChangeOrderTotalCents, reconciledProjectValueCents } from "../reconciliation";
describe("change-order reconciliation", () => {
  it("adds approved orders only", () => {
    const orders=[{status:"approved",total_cents:12500},{status:"sent",total_cents:9000},{status:"declined",total_cents:7000}];
    expect(approvedChangeOrderTotalCents(orders)).toBe(12500);
    expect(reconciledProjectValueCents(100000,orders)).toBe(112500);
  });
});
