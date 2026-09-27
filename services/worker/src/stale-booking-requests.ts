import type { DatabaseClient } from "./db-client.js";
import { databaseDialect } from "./db-client.js";
import { logger } from "./logger.js";

export interface StaleBookingRequestsResult { closed: number; errors: number; }

export async function closeStaleBookingRequests(client: DatabaseClient): Promise<StaleBookingRequestsResult> {
  try {
    const dialect = databaseDialect(client);
    const now = dialect === "sqlite" ? "datetime('now')" : dialect === "mysql" ? "current_timestamp" : "now()";
    const cutoff = dialect === "sqlite" ? "datetime('now','-60 days')" : dialect === "mysql" ? "date_sub(current_timestamp, interval 60 day)" : "now() - interval '60 days'";
    const result = await client.query<{ id: string; account_id: string }>(
      `UPDATE booking_requests SET status='lost', closed_reason='stale', closed_at=${now}, updated_at=${now}
       WHERE status IN ('pending','needs_info','reviewed','assessment_booked','estimated') AND updated_at < ${cutoff}
       RETURNING id, account_id`
    );
    const closed = result.rowCount ?? 0;
    if (closed > 0) {
      logger.info("stale-booking-requests: marked lost", { count: closed, ids: result.rows.map(r => r.id) });
      for (const row of result.rows) try {
        await client.query(`INSERT INTO status_history (account_id,entity_type,entity_id,from_status,to_status,changed_by,note) VALUES ($1,'booking_request',$2,NULL,'lost',NULL,'closed_reason=stale')`, [row.account_id,row.id]);
      } catch { /* best effort */ }
    }
    return { closed, errors: 0 };
  } catch (error) { logger.error("stale-booking-requests: failed", error); return { closed: 0, errors: 1 }; }
}
