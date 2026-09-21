export interface ChangeOrderAmount {
  status: string;
  total_cents: number;
}

/** Approved change orders add to the approved estimate/project commercial value. */
export function approvedChangeOrderTotalCents(changeOrders: ChangeOrderAmount[]): number {
  return changeOrders
    .filter((order) => order.status === "approved")
    .reduce((sum, order) => sum + Math.max(0, Math.round(order.total_cents)), 0);
}

export function reconciledProjectValueCents(
  estimateTotalCents: number,
  changeOrders: ChangeOrderAmount[]
): number {
  return Math.max(0, Math.round(estimateTotalCents)) + approvedChangeOrderTotalCents(changeOrders);
}
