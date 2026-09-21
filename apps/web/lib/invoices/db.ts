import type { DbClient } from "@/lib/db-contract";
import { withPortableTransaction } from "../db/portable";
import type { SessionPayload } from "../auth/session";

/**
 * Run fn within a PostgreSQL transaction with RLS session context set.
 * Mirrors withEstimateContext from lib/estimates/db.ts.
 *
 * Source evidence:
 *   Myprogram: supabase/migrations/003_rls_policies.sql (set_config pattern)
 *   AI-FSM: db/migrations/003_rls_policies.sql (app.* session vars)
 *   AI-FSM: apps/web/lib/estimates/db.ts (established pattern for this project)
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
