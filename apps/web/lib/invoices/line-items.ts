import type { DbClient } from "@/lib/db-contract";
import { randomUUID } from "node:crypto";
import { LABOR_CUSTOMER_RATE_CENTS_PER_HOUR } from "@ai-fsm/domain";
import {
  roundedQuarterHoursFromMinutes,
  trackedLaborMinutesFromActivityEntries,
} from "./tracked-labor";

// Re-exported for existing importers (final-invoice.ts, tests) that import it
// from here; the definition now lives in tracked-labor.ts to avoid an import cycle.
export { roundedQuarterHoursFromMinutes };

export const INVOICE_LINE_ITEM_TYPES = ["labor", "materials", "handling_fee", "adjustment"] as const;
export type InvoiceLineItemType = (typeof INVOICE_LINE_ITEM_TYPES)[number];

export interface InvoiceTotals {
  subtotal_cents: number;
  tax_cents: number;
  total_cents: number;
  paid_cents: number;
  balance_cents: number;
}

export interface InvoiceLineItemRow {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price_cents: number;
  total_cents: number;
  line_item_type: InvoiceLineItemType;
  sort_order: number;
  created_at?: string;
}


export async function assertDraftInvoice(
  client: DbClient,
  invoiceId: string,
  accountId: string
): Promise<{ id: string; status: string; job_id: string | null; paid_cents: number; deposit_cents: number }> {
  const result = await client.query<{
    id: string;
    status: string;
    job_id: string | null;
    paid_cents: number;
    deposit_cents: number;
  }>(
    `SELECT id, status, job_id, paid_cents, deposit_cents
     FROM invoices
     WHERE id = $1 AND account_id = $2`,
    [invoiceId, accountId]
  );

  if ((result.rowCount ?? 0) === 0) {
    throw Object.assign(new Error("Invoice not found"), { code: "NOT_FOUND" });
  }

  const invoice = result.rows[0];
  if (invoice.status !== "draft") {
    throw Object.assign(new Error("Only draft invoices may be edited"), {
      code: "IMMUTABLE_ENTITY",
    });
  }

  return invoice;
}

export async function recalculateInvoiceTotals(
  client: DbClient,
  invoiceId: string,
  accountId: string
): Promise<InvoiceTotals> {
  const totals = await client.query<{ subtotal_cents: string }>(
    `SELECT COALESCE(SUM(total_cents), 0) AS subtotal_cents
     FROM invoice_line_items
     WHERE invoice_id = $1`,
    [invoiceId]
  );
  // Line items can include negative 'adjustment' (discount) lines, but the
  // invoice rollup can't go below $0 (the invoices subtotal/total checks are
  // >= 0, and you can't owe a negative amount). Clamp the discounted rollup at 0.
  const subtotalCents = Math.max(0, Number(totals.rows[0]?.subtotal_cents ?? 0));
  const taxCents = 0;
  const totalCents = subtotalCents + taxCents;

  await client.query(
    `UPDATE invoices
     SET subtotal_cents = $1,
         tax_cents = $2,
         total_cents = $3,
         balance_cents = GREATEST($3 - paid_cents - deposit_cents, 0),
         updated_at = now()
     WHERE id = $4 AND account_id = $5`,
    [subtotalCents, taxCents, totalCents, invoiceId, accountId]
  );
  const updated = await client.query<InvoiceTotals>(
    `SELECT subtotal_cents, tax_cents, total_cents, paid_cents, balance_cents
     FROM invoices WHERE id = $1 AND account_id = $2`,
    [invoiceId, accountId]
  );

  return updated.rows[0];
}

export async function createInvoiceLineItem(
  client: DbClient,
  invoiceId: string,
  input: {
    description: string;
    quantity: number;
    unit_price_cents: number;
    line_item_type: InvoiceLineItemType;
    sort_order?: number;
  }
): Promise<InvoiceLineItemRow> {
  const totalCents = Math.round(input.quantity * input.unit_price_cents);
  const lineItemId = randomUUID();
  const nextSort = input.sort_order ?? Number((await client.query<{ next_sort: number }>(
    `SELECT COALESCE(MAX(sort_order), -1) + 1 AS next_sort
     FROM invoice_line_items WHERE invoice_id = $1`,
    [invoiceId]
  )).rows[0]?.next_sort ?? 0);
  await client.query(
    `INSERT INTO invoice_line_items
       (id, invoice_id, description, quantity, unit_price_cents, total_cents, line_item_type, sort_order)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      lineItemId,
      invoiceId,
      input.description,
      input.quantity,
      input.unit_price_cents,
      totalCents,
      input.line_item_type,
      nextSort,
    ]
  );
  const result = await client.query<InvoiceLineItemRow>(
    `SELECT id, invoice_id, description, quantity, unit_price_cents, total_cents, line_item_type, sort_order, created_at
     FROM invoice_line_items WHERE id = $1 AND invoice_id = $2`,
    [lineItemId, invoiceId]
  );

  return result.rows[0];
}

export async function updateInvoiceLineItem(
  client: DbClient,
  invoiceId: string,
  lineItemId: string,
  input: {
    description: string;
    quantity: number;
    unit_price_cents: number;
    line_item_type: InvoiceLineItemType;
  }
): Promise<InvoiceLineItemRow> {
  const totalCents = Math.round(input.quantity * input.unit_price_cents);
  const updated = await client.query(
    `UPDATE invoice_line_items
     SET description = $1,
         quantity = $2,
         unit_price_cents = $3,
         total_cents = $4,
         line_item_type = $5
     WHERE id = $6 AND invoice_id = $7`,
    [
      input.description,
      input.quantity,
      input.unit_price_cents,
      totalCents,
      input.line_item_type,
      lineItemId,
      invoiceId,
    ]
  );

  if ((updated.rowCount ?? 0) === 0) {
    throw Object.assign(new Error("Line item not found"), { code: "NOT_FOUND" });
  }

  const result = await client.query<InvoiceLineItemRow>(
    `SELECT id, invoice_id, description, quantity, unit_price_cents, total_cents,
            line_item_type, sort_order, created_at
     FROM invoice_line_items
     WHERE id = $1 AND invoice_id = $2`,
    [lineItemId, invoiceId]
  );
  return result.rows[0];
}

export async function upsertLaborLineFromTrackedTime(
  client: DbClient,
  invoiceId: string,
  accountId: string,
  jobId: string
): Promise<{ lineItem: InvoiceLineItemRow; tracked_minutes: number; billable_hours: number }> {
  const trackedMinutes = await trackedLaborMinutesFromActivityEntries(client, accountId, jobId);
  const billableHours = roundedQuarterHoursFromMinutes(trackedMinutes);
  if (billableHours <= 0) {
    throw Object.assign(new Error("No completed visit time is available for this job"), {
      code: "NO_TRACKED_TIME",
    });
  }

  const existing = await client.query<{ id: string }>(
    `SELECT id
     FROM invoice_line_items
     WHERE invoice_id = $1 AND line_item_type = 'labor'
     ORDER BY sort_order ASC, created_at ASC
     LIMIT 1`,
    [invoiceId]
  );

  // Prefer account pricing settings when the table is available
  let billRate = LABOR_CUSTOMER_RATE_CENTS_PER_HOUR;
  try {
    const { loadPricingSettings } = await import("@/lib/pricing/settings");
    const settings = await loadPricingSettings(client, accountId);
    billRate = settings.labor_billing_cents_per_hour;
  } catch {
    /* table may not exist pre-migration — keep default */
  }

  const input = {
    description: "Labor",
    quantity: billableHours,
    unit_price_cents: billRate,
    line_item_type: "labor" as const,
  };

  const lineItem =
    (existing.rowCount ?? 0) > 0
      ? await updateInvoiceLineItem(client, invoiceId, existing.rows[0].id, input)
      : await createInvoiceLineItem(client, invoiceId, input);

  return { lineItem, tracked_minutes: Math.round(trackedMinutes), billable_hours: billableHours };
}
