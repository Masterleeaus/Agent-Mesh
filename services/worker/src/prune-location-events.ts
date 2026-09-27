import type { DatabaseClient } from "./db-client.js";
import { databaseDialect } from "./db-client.js";
import { logger } from "./logger.js";

export interface PruneLocationEventsResult {
  deleted: number;
  errors: number;
}

/** Delete raw GPS breadcrumbs beyond each account's retention policy. */
export async function pruneLocationEvents(client: DatabaseClient): Promise<PruneLocationEventsResult> {
  try {
    const dialect = databaseDialect(client);
    const sql = dialect === "postgres"
      ? `DELETE FROM location_events le USING accounts a WHERE le.account_id = a.id AND le.occurred_at < now() - (a.location_retention_days || ' days')::interval`
      : dialect === "mysql"
        ? `DELETE le FROM location_events le JOIN accounts a ON le.account_id = a.id WHERE le.occurred_at < DATE_SUB(CURRENT_TIMESTAMP, INTERVAL a.location_retention_days DAY)`
        : `DELETE FROM location_events
           WHERE EXISTS (
             SELECT 1 FROM accounts a
             WHERE a.id = location_events.account_id
               AND location_events.occurred_at < datetime('now', '-' || a.location_retention_days || ' days')
           )`;
    const result = await client.query(sql);
    const deleted = result.rowCount ?? 0;
    if (deleted > 0) logger.info("prune-location-events: deleted stale breadcrumbs", { deleted });
    return { deleted, errors: 0 };
  } catch (error) {
    logger.error("prune-location-events: failed", error);
    return { deleted: 0, errors: 1 };
  }
}
