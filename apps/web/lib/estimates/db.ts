import type { PoolClient } from "pg";
import { getPool } from "@/lib/db";
import type { SessionPayload } from "@/lib/auth/session";

// Re-export pure math helpers so callers can import from one place
export { calcTotals, lineItemTotal } from "./math";
export type { LineItemInput, Totals } from "./math";

/**
 * Native Titan FSM estimate persistence boundary.
 * The PostgreSQL/RLS implementation needs portability/company-context convergence,
 * but the mature quoting capability remains Titan-owned. Do not replace it with
 * Frappe merely because ERPNext provides quotations.
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
