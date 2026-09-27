import type { DatabaseClient } from "./db-client.js";
import { databaseDialect } from "./db-client.js";
import { logger } from "./logger.js";

const RETENTION_DAYS = 90;

export interface PruneAttentionEventsResult {
  deleted: number;
  errors: number;
}

export async function pruneAttentionEvents(client: DatabaseClient): Promise<PruneAttentionEventsResult> {
  try {
    const dialect = databaseDialect(client);
    const sql = dialect === "postgres"
      ? `DELETE FROM attention_events WHERE created_at < now() - ($1::text || ' days')::interval`
      : dialect === "mysql"
        ? `DELETE FROM attention_events WHERE created_at < DATE_SUB(CURRENT_TIMESTAMP, INTERVAL ? DAY)`
        : `DELETE FROM attention_events WHERE created_at < datetime('now', '-' || ? || ' days')`;
    const result = await client.query(sql, [String(RETENTION_DAYS)]);
    const deleted = result.rowCount ?? 0;
    if (deleted > 0) logger.info("prune-attention-events: deleted stale rows", { deleted });
    return { deleted, errors: 0 };
  } catch (error) {
    logger.error("prune-attention-events: failed", error);
    return { deleted: 0, errors: 1 };
  }
}
