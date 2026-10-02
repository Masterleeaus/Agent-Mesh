import type { DbClient } from "@/lib/db-contract";
import { withPortableTransaction } from "../db/portable";
import type { SessionPayload } from "../auth/session";

/**
 * Compatibility transaction wrapper for the legacy base-web invoice store.
 *
 * Canonical finance/domain ownership is #263/#1054 with operational
 * materialization through #1051 where mapped. This wrapper must not be treated
 * as the long-term invoice system of record or tenant-isolation authority.
 * New business-domain writes should use Titan Domain/provider contracts.
 */
export async function withInvoiceContext<T>(
  session: SessionPayload,
  fn: (client: DbClient) => Promise<T>
): Promise<T> {
  return withPortableTransaction(fn);
}

/**
 * Generate the next invoice number for an account.
 * Format: INV-{zero-padded 4-digit sequence}
 * Example: INV-0001, INV-0042, INV-1234
 *
 * Allocates from the highest existing suffix + 1 (not a row count): a
 * count-based sequence reuses a live number after a non-latest invoice is
 * removed/voided and collides with the (account_id, invoice_number) unique
 * index. Gaps are acceptable. Must run inside a transaction to avoid races.
 */
export async function generateInvoiceNumber(
  client: DbClient,
  accountId: string
): Promise<string> {
  // Keep number allocation database-dialect neutral. Pull only the generator's
  // INV-* namespace and parse the numeric suffix in TypeScript rather than using
  // PostgreSQL regex/cast syntax. The unique account+invoice_number constraint
  // remains the final concurrency guard.
  const result = await client.query<{ invoice_number: string }>(
    `SELECT invoice_number
     FROM invoices
     WHERE account_id = $1 AND invoice_number LIKE 'INV-%'`,
    [accountId]
  );
  let max = 0;
  for (const row of result.rows) {
    const match = /^INV-(\d+)$/.exec(row.invoice_number);
    if (!match) continue;
    const n = Number.parseInt(match[1], 10);
    if (Number.isFinite(n) && n > max) max = n;
  }
  return `INV-${String(max + 1).padStart(4, "0")}`;
}

export async function loadCreditedInvoicesForEstimate(
  client: DbClient,
  estimateId: string,
  accountId: string,
): Promise<Array<{ invoice_number: string; total_cents: number; status: string }>> {
  const result = await client.query<{ invoice_number: string; total_cents: number; status: string }>(
    `SELECT invoice_number, total_cents, status
     FROM invoices
     WHERE estimate_id = $1
       AND account_id = $2
       AND invoice_kind IN ('deposit', 'progress')
     ORDER BY created_at ASC, id ASC`,
    [estimateId, accountId],
  );
  return result.rows;
}
