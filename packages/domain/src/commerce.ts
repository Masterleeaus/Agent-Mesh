/** Provider-neutral commerce contracts owned by Titan, not a channel adapter. */

export type CommerceListingStatus = "DRAFT" | "PUBLISHED" | "PAUSED" | "RETIRED";
export type CommerceOrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "FULFILLING"
  | "FULFILLED"
  | "CANCELLED"
  | "REFUND_PENDING"
  | "REFUNDED";

export type CommerceContext = {
  company_id: string;
  actor_id: string;
  correlation_id: string;
  idempotency_key: string;
};

export type CommerceListing = {
  company_id: string;
  listing_id: string;
  product_id: string;
  channel: string;
  external_ref: string | null;
  status: CommerceListingStatus;
  revision: number;
  price_cents: number;
  inventory_quantity: number;
};

export type CommerceOrder = {
  company_id: string;
  order_id: string;
  external_ref: string | null;
  status: CommerceOrderStatus;
  revision: number;
  total_cents: number;
  captured_cents: number;
  refunded_cents: number;
};

export type ObservedOrder = Pick<
  CommerceOrder,
  "company_id" | "external_ref" | "status" | "revision" | "total_cents" | "captured_cents" | "refunded_cents"
>;

export type ReconciliationPlan =
  | { kind: "NOOP"; revision: number }
  | { kind: "APPLY"; expected_revision: number; next: ObservedOrder }
  | { kind: "CONFLICT"; reason: "COMPANY_MISMATCH" | "STALE_EXTERNAL_REVISION" | "PAYMENT_REGRESSION" };

export type RefundPlan = {
  kind: "REFUND";
  company_id: string;
  order_id: string;
  amount_cents: number;
  idempotency_key: string;
  correlation_id: string;
};

export function assertCommerceContext(context: CommerceContext): CommerceContext {
  for (const [name, value] of Object.entries(context)) {
    if (typeof value !== "string" || value.trim() === "") {
      throw new Error(`commerce_context_${name}_required`);
    }
  }
  return context;
}

export function planOrderReconciliation(
  local: CommerceOrder,
  observed: ObservedOrder,
): ReconciliationPlan {
  if (local.company_id !== observed.company_id) return { kind: "CONFLICT", reason: "COMPANY_MISMATCH" };
  if (observed.revision < local.revision) return { kind: "CONFLICT", reason: "STALE_EXTERNAL_REVISION" };
  if (observed.captured_cents < local.captured_cents || observed.refunded_cents < local.refunded_cents) {
    return { kind: "CONFLICT", reason: "PAYMENT_REGRESSION" };
  }
  if (
    observed.revision === local.revision &&
    observed.status === local.status &&
    observed.total_cents === local.total_cents &&
    observed.captured_cents === local.captured_cents &&
    observed.refunded_cents === local.refunded_cents
  ) {
    return { kind: "NOOP", revision: local.revision };
  }
  return { kind: "APPLY", expected_revision: local.revision, next: observed };
}

export function planRefund(
  context: CommerceContext,
  order: CommerceOrder,
  amount_cents: number,
): RefundPlan {
  assertCommerceContext(context);
  if (!Number.isSafeInteger(amount_cents) || amount_cents <= 0) throw new Error("refund_amount_invalid");
  if (order.company_id !== context.company_id) throw new Error("refund_company_mismatch");
  if (amount_cents > order.captured_cents - order.refunded_cents) throw new Error("refund_exceeds_captured");
  return {
    kind: "REFUND",
    company_id: order.company_id,
    order_id: order.order_id,
    amount_cents,
    idempotency_key: context.idempotency_key,
    correlation_id: context.correlation_id,
  };
}

