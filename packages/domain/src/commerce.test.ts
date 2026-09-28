import { describe, expect, it } from "vitest";
import { planOrderReconciliation, planRefund, assertCommerceContext, type CommerceOrder } from "./commerce";

const order: CommerceOrder = {
  company_id: "company-a", order_id: "order-1", external_ref: "ext-1", status: "CONFIRMED",
  revision: 2, total_cents: 1000, captured_cents: 1000, refunded_cents: 0,
};

describe("provider-neutral commerce contracts", () => {
  it("rejects cross-company observations and stale revisions", () => {
    expect(planOrderReconciliation(order, { ...order, company_id: "company-b" })).toEqual({ kind: "CONFLICT", reason: "COMPANY_MISMATCH" });
    expect(planOrderReconciliation(order, { ...order, revision: 1 })).toEqual({ kind: "CONFLICT", reason: "STALE_EXTERNAL_REVISION" });
  });

  it("applies newer observations and treats exact replay as a no-op", () => {
    expect(planOrderReconciliation(order, { ...order, status: "FULFILLED", revision: 3 })).toMatchObject({ kind: "APPLY", expected_revision: 2 });
    expect(planOrderReconciliation(order, { ...order })).toEqual({ kind: "NOOP", revision: 2 });
  });

  it("plans refunds as idempotent corrections without deleting payment history", () => {
    expect(planRefund({ company_id: "company-a", actor_id: "owner", correlation_id: "corr", idempotency_key: "idem" }, order, 250)).toEqual({
      kind: "REFUND", company_id: "company-a", order_id: "order-1", amount_cents: 250,
      idempotency_key: "idem", correlation_id: "corr",
    });
    expect(() => planRefund({ company_id: "company-a", actor_id: "owner", correlation_id: "corr", idempotency_key: "idem" }, order, 1001)).toThrow("refund_exceeds_captured");
  });

  it("fails closed when governed context is incomplete", () => {
    expect(() => assertCommerceContext({ company_id: "", actor_id: "a", correlation_id: "c", idempotency_key: "i" })).toThrow("commerce_context_company_id_required");
  });
});

