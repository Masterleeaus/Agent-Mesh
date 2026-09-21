import type { InvoiceStatus } from "@ai-fsm/domain";
import type { DbClient } from "@/lib/db-contract";

/**
 * Pure payment math for invoices.
 *
 * Two deposit models exist (see migration 154 + billing.ts):
 *
 * 1. **Credit model** (`deposit_cents` on a final/standard invoice): money
 *    already billed on a separate deposit invoice. Reduces what this invoice
 *    may collect. DB generated column: `balance_cents = total - deposit`.
 *
 * 2. **First-payment model** (`deposit_type` percentage/fixed): a requested
 *    first payment on the same invoice. Does not change total; tracked via
 *    `paid_cents` only. `deposit_cents` stays 0.
 *
 * Collectible remaining = total − deposit_credit − paid_on_this_invoice.
 */

/** Remaining amount collectible on this invoice (never negative). */
export function amountDueCents(
  totalCents: number,
  paidCents: number,
  depositCreditCents = 0,
): number {
  const credit = Math.max(0, depositCreditCents);
  return Math.max(0, totalCents - credit - paidCents);
}

/**
 * True when this invoice's obligation is fully covered by payments on this
 * invoice plus any deposit credit already applied.
 *
 * Zero-total invoices are never treated as paid here — callers should use
 * status === "paid" for those edge cases (avoids PAID stamp on empty drafts).
 *
 * `depositCreditCents` is the credit model field (`invoices.deposit_cents`):
 * money already billed on a separate deposit invoice, not a first-payment
 * still due on this document (that uses `deposit_type` instead).
 */
export function isInvoiceFullyPaid(
  totalCents: number,
  paidCents: number,
  depositCreditCents = 0,
): boolean {
  if (totalCents <= 0) return false;
  return paidCents + Math.max(0, depositCreditCents) >= totalCents;
}

/**
 * Derive the expected invoice status after a payment changes paid_cents.
 *
 * Pure-logic equivalent of the DB trigger `sync_invoice_on_payment`.
 * Deposit credit counts toward "fully paid" so a final invoice that credits
 * a $1,500 deposit is paid once the remaining balance is collected.
 */
export function deriveInvoiceStatus(
  totalCents: number,
  paidCents: number,
  depositCreditCents = 0,
): InvoiceStatus {
  if (isInvoiceFullyPaid(totalCents, paidCents, depositCreditCents)) return "paid";
  if (paidCents > 0) return "partial";
  return "sent"; // fallback — should not happen after a payment
}

/**
 * Validate that a payment amount is acceptable for the given invoice.
 * Returns null if valid, or an error message string.
 */
export function validatePaymentAmount(
  amountCents: number,
  invoiceTotalCents: number,
  currentPaidCents: number,
  depositCreditCents = 0,
): string | null {
  if (!Number.isInteger(amountCents) || amountCents <= 0) {
    return "Payment amount must be a positive integer (cents)";
  }
  const remaining = amountDueCents(
    invoiceTotalCents,
    currentPaidCents,
    depositCreditCents,
  );
  if (remaining <= 0) {
    return "Invoice is already fully paid";
  }
  if (amountCents > remaining) {
    return `Payment amount ($${(amountCents / 100).toFixed(2)}) exceeds remaining balance ($${(remaining / 100).toFixed(2)})`;
  }
  return null;
}


/**
 * Recalculate paid_cents, status and balance from completed payment rows.
 * Cross-dialect equivalent of the legacy PostgreSQL payment trigger.
 */
export async function synchronizeInvoicePaymentState(
  client: DbClient,
  accountId: string,
  invoiceId: string,
  paidAt: string = new Date().toISOString(),
): Promise<{ status: InvoiceStatus; paid_cents: number; total_cents: number; deposit_cents: number; invoice_number: string }> {
  const invResult = await client.query<{
    status: InvoiceStatus; total_cents: number; paid_cents: number; deposit_cents: number; invoice_number: string;
  }>(
    `SELECT status, total_cents, paid_cents, deposit_cents, invoice_number
     FROM invoices WHERE id = $1 AND account_id = $2 FOR UPDATE`,
    [invoiceId, accountId],
  );
  if (invResult.rowCount === 0) throw new Error("Invoice not found while synchronizing payment state");
  const inv = invResult.rows[0];
  const paidResult = await client.query<{ paid_cents: number | string }>(
    `SELECT COALESCE(SUM(amount_cents), 0) AS paid_cents
     FROM payments WHERE invoice_id = $1 AND account_id = $2 AND status = 'paid'`,
    [invoiceId, accountId],
  );
  const paidCents = Number(paidResult.rows[0]?.paid_cents ?? 0);
  const status = deriveInvoiceStatus(inv.total_cents, paidCents, inv.deposit_cents);
  await client.query(
    `UPDATE invoices
     SET paid_cents = $1, status = $2,
         paid_at = CASE WHEN $2 = 'paid' THEN COALESCE(paid_at, $3) ELSE paid_at END,
         balance_cents = GREATEST(total_cents - $1 - deposit_cents, 0),
         updated_at = now()
     WHERE id = $4 AND account_id = $5`,
    [paidCents, status, paidAt, invoiceId, accountId],
  );
  return { ...inv, status, paid_cents: paidCents };
}
