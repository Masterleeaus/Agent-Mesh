import { describe, expect, it } from "vitest";
import { assertAssetReady, planReceiptReconciliation, planResourceReservation } from "./supply";

const context = { company_id: "a", actor_id: "manager", correlation_id: "corr", idempotency_key: "idem" };
const stock = { company_id: "a", item_id: "filter", on_hand: 5, reserved: 2, revision: 4 };

describe("native supply continuity contracts", () => {
  it("reserves available stock with revision and replay metadata", () => {
    expect(planResourceReservation(context, stock, 3)).toMatchObject({ kind: "RESERVE", expected_revision: 4, idempotency_key: "idem" });
  });
  it("creates a procurement gap when stock is insufficient", () => {
    expect(planResourceReservation(context, stock, 8)).toMatchObject({ kind: "PROCURE", quantity: 5, reason: "INSUFFICIENT_STOCK" });
  });
  it("fails closed on company mismatch and reconciles partial receipts", () => {
    expect(() => planResourceReservation({ ...context, company_id: "b" }, stock, 1)).toThrow("supply_company_mismatch");
    expect(planReceiptReconciliation(context, stock, 5, 3)).toEqual({ kind: "RECONCILE", company_id: "a", item_id: "filter", quantity: 3, expected_revision: 4 });
    expect(planReceiptReconciliation(context, stock, 5, 6)).toEqual({ kind: "ESCALATE", reason: "OVER_RECEIPT" });
  });
  it("requires an explicitly ready asset", () => {
    expect(() => assertAssetReady("a", "a", "MAINTENANCE_DUE")).toThrow("asset_maintenance_due");
    expect(() => assertAssetReady("a", "b", "READY")).toThrow("asset_company_mismatch");
    expect(() => assertAssetReady("a", "a", "READY")).not.toThrow();
  });
});

