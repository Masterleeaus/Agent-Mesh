import type { DatabaseClient } from "./db-client.js";
import { databaseDialect } from "./db-client.js";
import { logger } from "./logger.js";

export interface ExpireEstimatesResult {
  expired: number;
  errors: number;
}

/**
 * Marks sent estimates as expired when their expires_at date has passed.
 * Runs on every worker poll iteration — no automation record required.
 * Safe to run repeatedly; the WHERE clause is idempotent.
 */
export async function expireEstimates(client: DatabaseClient): Promise<ExpireEstimatesResult> {
  try {
    const dialect = databaseDialect(client);
    const due = await client.query<{ id: string; account_id: string }>(
      `SELECT id, account_id FROM estimates
       WHERE status = 'sent' AND expires_at IS NOT NULL
         AND expires_at < CURRENT_TIMESTAMP`
    );
    for (const row of due.rows) {
      const placeholder = dialect === "mysql" ? "?" : "$1";
      await client.query(
        `UPDATE estimates SET status = 'expired', updated_at = CURRENT_TIMESTAMP
         WHERE id = ${placeholder} AND status = 'sent'`,
        [row.id]
      );
    }
    const result = { rows: due.rows, rowCount: due.rows.length };
    const expired = result.rowCount ?? 0;
    if (expired > 0) {
      logger.info("expire-estimates: marked expired", {
        count: expired,
        ids: result.rows.map((r) => r.id),
      });
    }

    return { expired, errors: 0 };
  } catch (error) {
    logger.error("expire-estimates: failed", error);
    return { expired: 0, errors: 1 };
  }
}
