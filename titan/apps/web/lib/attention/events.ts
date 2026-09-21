import type { DbClient } from "@/lib/db-contract";
import {
  ATTENTION_RETENTION_DAYS,
  type AttentionEventRow,
} from "./types";

export async function listAttentionEvents(
  client: DbClient,
  accountId: string,
  limit = 30,
): Promise<AttentionEventRow[]> {
  const capped = Math.min(Math.max(1, limit), 100);
  const cutoff = new Date(Date.now() - ATTENTION_RETENTION_DAYS * 86_400_000);
  const r = await client.query<AttentionEventRow>(
    `SELECT id, account_id, type, entity_type, entity_id, title, summary, href,
            dedupe_key, created_at, read_at
     FROM attention_events
     WHERE account_id = $1
       AND created_at >= $2
     ORDER BY created_at DESC
     LIMIT $3`,
    [accountId, cutoff, capped],
  );
  return r.rows;
}

export async function markAttentionEventRead(
  client: DbClient,
  accountId: string,
  eventId: string,
): Promise<boolean> {
  const r = await client.query(
    `UPDATE attention_events
     SET read_at = COALESCE(read_at, CURRENT_TIMESTAMP)
     WHERE id = $1 AND account_id = $2`,
    [eventId, accountId],
  );
  return (r.rowCount ?? 0) > 0;
}

export async function markAllAttentionEventsRead(
  client: DbClient,
  accountId: string,
): Promise<number> {
  const cutoff = new Date(Date.now() - ATTENTION_RETENTION_DAYS * 86_400_000);
  const r = await client.query(
    `UPDATE attention_events
     SET read_at = CURRENT_TIMESTAMP
     WHERE account_id = $1
       AND read_at IS NULL
       AND created_at >= $2`,
    [accountId, cutoff],
  );
  return r.rowCount ?? 0;
}

export async function pruneOldAttentionEvents(
  client: DbClient,
  retentionDays = ATTENTION_RETENTION_DAYS,
): Promise<number> {
  const cutoff = new Date(Date.now() - retentionDays * 86_400_000);
  const r = await client.query(
    `DELETE FROM attention_events
     WHERE created_at < $1`,
    [cutoff],
  );
  return r.rowCount ?? 0;
}
