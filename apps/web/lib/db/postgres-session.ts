import type { SessionPayload } from "@/lib/auth/session";
import type { DbClient } from "@/lib/db-contract";

/**
 * Apply Titan's PostgreSQL transaction-local identity used by RLS policies.
 * Keep this PostgreSQL-only primitive centralized so portable callers can
 * branch before invoking it and MySQL/MariaDB never sees set_config().
 */
export async function applyPostgresSessionContext(
  client: DbClient,
  session: SessionPayload,
  accountId: string = session.accountId,
): Promise<void> {
  await client.query(
    `SELECT set_config('app.current_user_id', $1, true),
            set_config('app.current_account_id', $2, true),
            set_config('app.current_role', $3, true)`,
    [session.userId, accountId, session.role],
  );
}
