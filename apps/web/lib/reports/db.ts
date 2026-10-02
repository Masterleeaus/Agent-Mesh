/**
 * Business Reality compatibility note:
 * This base-web module currently projects UI/report state directly from legacy
 * operational tables. Treat results as operational/derived observations unless
 * backed by canonical #913 verification/evidence. Target #1046/#393 consumers
 * should use company-scoped Business Reality projection APIs with freshness,
 * provenance and verification state; provider/Frappe status does not self-certify.
 */
import type { PoolClient } from "pg";
import { getPool } from "@/lib/db";
import type { SessionPayload } from "@/lib/auth/session";

/**
 * Run fn within a PostgreSQL transaction with RLS session context set.
 *
 * Mirrors withExpenseContext — sets app.current_user_id, app.current_account_id,
 * app.current_role as LOCAL (transaction-scoped) config vars so RLS policies
 * enforce tenant isolation on period_closes and any other report-adjacent tables.
 */
export async function withReportContext<T>(
  session: SessionPayload,
  fn: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT set_config('app.current_user_id', $1, true)", [
      session.userId,
    ]);
    await client.query(
      "SELECT set_config('app.current_account_id', $1, true)",
      [session.accountId]
    );
    await client.query("SELECT set_config('app.current_role', $1, true)", [
      session.role,
    ]);
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
