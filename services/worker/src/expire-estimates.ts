import type { DatabaseClient } from "./db-client.js";
import { databaseDialect } from "./db-client.js";
import { logger } from "./logger.js";

export interface ExpireEstimatesResult { expired: number; errors: number; }

export async function expireEstimates(client: DatabaseClient): Promise<ExpireEstimatesResult> {
  try {
    const dialect = databaseDialect(client);
    const now = dialect === "sqlite" ? "datetime('now')" : dialect === "mysql" ? "current_timestamp" : "now()";
    const result = await client.query<{ id: string; account_id: string }>(
      `UPDATE estimates SET status = 'expired', updated_at = ${now}
       WHERE status = 'sent' AND expires_at IS NOT NULL AND expires_at < ${now}
       RETURNING id, account_id`
    );
    const expired = result.rowCount ?? 0;
    if (expired > 0) logger.info("expire-estimates: marked expired", { count: expired, ids: result.rows.map(r => r.id) });
    return { expired, errors: 0 };
  } catch (error) { logger.error("expire-estimates: failed", error); return { expired: 0, errors: 1 }; }
}
