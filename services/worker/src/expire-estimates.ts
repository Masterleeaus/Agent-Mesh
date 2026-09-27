import type { DatabaseClient } from "./db-client.js";
import { databaseDialect } from "./db-client.js";
import { logger } from "./logger.js";

export interface ExpireEstimatesResult { expired: number; errors: number; }

export async function expireEstimates(client: DatabaseClient): Promise<ExpireEstimatesResult> {
  try {
    const dialect = databaseDialect(client);
    const now = dialect === "sqlite" ? "datetime('now')" : dialect === "mysql" ? "current_timestamp" : "now()";
    const candidates = await client.query<{ id: string; account_id: string }>(
      `SELECT id, account_id FROM estimates
       WHERE status = 'sent' AND expires_at IS NOT NULL AND expires_at < ${now}`,
    );
    if (candidates.rows.length === 0) return { expired: 0, errors: 0 };
    await client.query(
      `UPDATE estimates SET status = 'expired', updated_at = ${now}
       WHERE status = 'sent' AND expires_at IS NOT NULL AND expires_at < ${now}`,
    );
    logger.info("expire-estimates: marked expired", { count: candidates.rows.length, ids: candidates.rows.map((row) => row.id) });
    return { expired: candidates.rows.length, errors: 0 };
  } catch (error) {
    logger.error("expire-estimates: failed", error);
    return { expired: 0, errors: 1 };
  }
}
