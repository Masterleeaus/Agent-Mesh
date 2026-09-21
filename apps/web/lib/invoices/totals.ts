export function roundMoneyCents(value: number): number {
  if (!Number.isFinite(value)) throw new Error("Money value must be finite");
  return Math.round(value);
}

export function percentOfCents(baseCents: number, basisPoints: number): number {
  if (!Number.isInteger(baseCents) || !Number.isInteger(basisPoints)) {
    throw new Error("Currency cents and basis points must be integers");
  }
  return roundMoneyCents((baseCents * basisPoints) / 10_000);
}

export function calculateCommercialTotals(input: {
  lineSubtotalCents: number;
  discountCents?: number;
  surchargeCents?: number;
  taxCents?: number;
}) {
  const discount = Math.max(0, Math.trunc(input.discountCents ?? 0));
  const surcharge = Math.max(0, Math.trunc(input.surchargeCents ?? 0));
  const tax = Math.max(0, Math.trunc(input.taxCents ?? 0));
  const subtotal = Math.max(0, Math.trunc(input.lineSubtotalCents) - discount + surcharge);
  return { subtotal_cents: subtotal, tax_cents: tax, total_cents: subtotal + tax };
}
