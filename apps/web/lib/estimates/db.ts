import type { PoolClient } from "pg";
import { getPool } from "@/lib/db";
import type { SessionPayload } from "@/lib/auth/session";

// Re-export pure math helpers so callers can import from one place
export { calcTotals, lineItemTotal } from "./math";
export type { LineItemInput, Totals } from "./math";

/**
 * Compatibility transaction wrapper for the legacy base-web estimate store.
 *
 * The PostgreSQL/RLS/account_id path is migration compatibility, not current
 * canonical Titan tenancy or quote authority. Canonical logical identity is
 * company_id; mapped operational quote state converges through #1051 behind
 * Titan Domain/provider contracts. Preserve this path until parity is proven.
 */
export async function withEstimateContext<T>(
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
