/** Provider-neutral inventory, procurement and asset-readiness contracts. */

export type SupplyContext = {
  company_id: string;
  actor_id: string;
  correlation_id: string;
  idempotency_key: string;
};

export type StockProjection = {
  company_id: string;
  item_id: string;
  on_hand: number;
  reserved: number;
  revision: number;
};

export type ReservationPlan = {
  kind: "RESERVE" | "PROCURE" | "ESCALATE";
  company_id: string;
  item_id: string;
  quantity: number;
  expected_revision: number;
  idempotency_key: string;
  correlation_id: string;
  reason?: "INSUFFICIENT_STOCK" | "SUPPLIER_FAILURE";
};

export type ReceiptPlan =
  | { kind: "RECONCILE"; company_id: string; item_id: string; quantity: number; expected_revision: number }
  | { kind: "ESCALATE"; reason: "COMPANY_MISMATCH" | "OVER_RECEIPT" | "SUPPLIER_FAILURE" };

export type AssetReadiness = "READY" | "MAINTENANCE_DUE" | "UNAVAILABLE";

function assertContext(context: SupplyContext): void {
  for (const [key, value] of Object.entries(context)) {
    if (typeof value !== "string" || value.trim() === "") throw new Error(`supply_context_${key}_required`);
  }
}

export function planResourceReservation(
  context: SupplyContext,
  stock: StockProjection,
  quantity: number,
): ReservationPlan {
  assertContext(context);
  if (!Number.isSafeInteger(quantity) || quantity <= 0) throw new Error("supply_quantity_invalid");
  if (stock.company_id !== context.company_id) throw new Error("supply_company_mismatch");
  const available = stock.on_hand - stock.reserved;
  if (available >= quantity) {
    return { kind: "RESERVE", company_id: stock.company_id, item_id: stock.item_id, quantity, expected_revision: stock.revision, idempotency_key: context.idempotency_key, correlation_id: context.correlation_id };
  }
  return { kind: "PROCURE", company_id: stock.company_id, item_id: stock.item_id, quantity: quantity - Math.max(available, 0), expected_revision: stock.revision, idempotency_key: context.idempotency_key, correlation_id: context.correlation_id, reason: "INSUFFICIENT_STOCK" };
}

export function planReceiptReconciliation(
  context: SupplyContext,
  stock: StockProjection,
  ordered_quantity: number,
  received_quantity: number,
): ReceiptPlan {
  assertContext(context);
  if (stock.company_id !== context.company_id) return { kind: "ESCALATE", reason: "COMPANY_MISMATCH" };
  if (!Number.isSafeInteger(ordered_quantity) || !Number.isSafeInteger(received_quantity) || ordered_quantity <= 0 || received_quantity < 0) {
    return { kind: "ESCALATE", reason: "SUPPLIER_FAILURE" };
  }
  if (received_quantity > ordered_quantity) return { kind: "ESCALATE", reason: "OVER_RECEIPT" };
  return { kind: "RECONCILE", company_id: stock.company_id, item_id: stock.item_id, quantity: received_quantity, expected_revision: stock.revision };
}

export function assertAssetReady(company_id: string, expected_company_id: string, readiness: AssetReadiness): void {
  if (!company_id.trim() || company_id !== expected_company_id) throw new Error("asset_company_mismatch");
  if (readiness !== "READY") throw new Error(`asset_${readiness.toLowerCase()}`);
}

