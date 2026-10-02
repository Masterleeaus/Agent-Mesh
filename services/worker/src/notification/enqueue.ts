import type { DatabaseClient } from "../db-client.js";
import { databaseDialect } from "../db-client.js";
import { PRIORITY, COOLDOWN_BYPASS_MINIMUM } from "./priority.js";

export interface EnqueueOpts {
  accountId: string;
  clientId: string | null;
  automationType: string;
  priority: number;
  toAddress: string;
  subject: string;
  htmlBody: string;
  idempotencyKey: string;
  entityType?: string;
  entityId?: string;
  cancelOnEvents?: string[];
  scheduledFor?: Date;
  metadata?: Record<string, unknown>;
}

export type EnqueueResult = "enqueued" | "duplicate" | "suppressed";

export async function enqueueNotification(client: DatabaseClient, opts: EnqueueOpts): Promise<EnqueueResult> {
  const existing = await client.query<{ account_id: string; status: string; attempt_count: number; max_attempts: number; failure_reason: string | null }>(
    `SELECT account_id,status,attempt_count,max_attempts,failure_reason FROM notification_queue WHERE idempotency_key = $1 LIMIT 1`,
    [opts.idempotencyKey]
  );
  const prior = existing.rows[0];
  if (prior?.account_id !== undefined && prior.account_id !== opts.accountId) throw new Error("notification-idempotency-company-mismatch");
  if (prior && (prior.status !== "failed" || prior.attempt_count >= prior.max_attempts ||
      prior.failure_reason?.startsWith("delivery-outcome-unknown"))) return "duplicate";

  if (opts.priority > COOLDOWN_BYPASS_MINIMUM && opts.clientId) {
    const cooldown = await client.query<{ last_sent_at: string; cooldown_hours: number }>(
      `SELECT nc.last_sent_at, COALESCE(ar.cooldown_hours, 4) AS cooldown_hours
       FROM notification_cooldowns nc
       LEFT JOIN automation_settings ar ON ar.account_id = nc.account_id
       WHERE nc.account_id = $1 AND nc.client_id = $2`,
      [opts.accountId, opts.clientId]
    );
    if (cooldown.rows.length > 0) {
      const { last_sent_at, cooldown_hours } = cooldown.rows[0];
      const elapsed = (Date.now() - new Date(last_sent_at).getTime()) / 3_600_000;
      if (elapsed < cooldown_hours) return "suppressed";
    }
  }

  if (opts.priority >= PRIORITY.LOW && opts.clientId) {
    const dayStart = new Date();
    dayStart.setUTCHours(0, 0, 0, 0);
    const cap = await client.query<{ today_count: number; max_per_day: number }>(
      `SELECT COUNT(nq.id) AS today_count, COALESCE(MAX(ar.max_per_day), 2) AS max_per_day
       FROM notification_queue nq
       LEFT JOIN automation_settings ar ON ar.account_id = nq.account_id
       WHERE nq.account_id = $1
         AND nq.client_id = $2
         AND nq.status = 'sent'
         AND nq.sent_at >= $3`,
      [opts.accountId, opts.clientId, dayStart.toISOString()]
    );
    if (cap.rows.length > 0 && Number(cap.rows[0].today_count) >= Number(cap.rows[0].max_per_day)) return "suppressed";
  }

  const nextAttemptAt = opts.scheduledFor ?? new Date();
  const mysql = databaseDialect(client) === "mysql";
  const eligible = mysql
    ? "account_id=VALUES(account_id) AND status='failed' AND attempt_count < max_attempts AND (failure_reason IS NULL OR failure_reason NOT LIKE 'delivery-outcome-unknown%')"
    : "notification_queue.account_id=excluded.account_id AND notification_queue.status='failed' AND notification_queue.attempt_count < notification_queue.max_attempts AND (notification_queue.failure_reason IS NULL OR notification_queue.failure_reason NOT LIKE 'delivery-outcome-unknown%')";
  // Revalidate at the write: another poll may quarantine this key after SELECT.
  // Do not reset attempt_count: numbered history and retry ceilings are durable.
  const upsert = mysql
    ? `ON DUPLICATE KEY UPDATE next_attempt_at=IF(${eligible},VALUES(next_attempt_at),next_attempt_at),
       failure_reason=IF(${eligible},NULL,failure_reason),status=IF(${eligible},'pending',status)`
    : `ON CONFLICT (idempotency_key) DO UPDATE SET status='pending',failure_reason=NULL,
       next_attempt_at=excluded.next_attempt_at WHERE ${eligible}`;
  const instant = nextAttemptAt.toISOString();
  const inserted = await client.query(
    `INSERT INTO notification_queue
       (account_id, client_id, automation_type, priority, to_address,
        subject, html_body, idempotency_key, entity_type, entity_id,
        cancel_on_events, next_attempt_at, metadata)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
     ${upsert}`,
    [opts.accountId, opts.clientId, opts.automationType, opts.priority, opts.toAddress,
      opts.subject, opts.htmlBody, opts.idempotencyKey, opts.entityType ?? null,
      opts.entityId ?? null, databaseDialect(client) === "postgres" ? opts.cancelOnEvents ?? [] : JSON.stringify(opts.cancelOnEvents ?? []),
      mysql ? instant.replace("T", " ").replace("Z", "") : instant,
      JSON.stringify(opts.metadata ?? {})]
  );
  if (mysql) {
    // mysql2 FOUND_ROWS may report one affected row for a guarded no-op.
    // Observe the actual queue disposition before claiming enqueue success.
    const current = await client.query<{account_id:string;status:string}>(
      "SELECT account_id,status FROM notification_queue WHERE idempotency_key=$1 LIMIT 1", [opts.idempotencyKey]);
    return current.rows[0]?.account_id === opts.accountId && current.rows[0]?.status === "pending" ? "enqueued" : "duplicate";
  }
  return (inserted.rowCount ?? 0) > 0 ? "enqueued" : "duplicate";
}

export async function cancelNotificationsForEntity(
  client: DatabaseClient,
  entityType: string,
  entityId: string,
  eventType: string
): Promise<number> {
  if (databaseDialect(client) === "postgres") {
    const result = await client.query(
      `UPDATE notification_queue SET status = 'cancelled'
       WHERE entity_type = $1 AND entity_id = $2 AND status = 'pending'
         AND $3 = ANY(cancel_on_events)`,
      [entityType, entityId, eventType]
    );
    return result.rowCount ?? 0;
  }

  const pending = await client.query<{ id: string; cancel_on_events: string | null }>(
    `SELECT id, cancel_on_events FROM notification_queue
     WHERE entity_type = $1 AND entity_id = $2 AND status = 'pending'`,
    [entityType, entityId]
  );
  let cancelled = 0;
  for (const row of pending.rows) {
    let events: string[] = [];
    try { events = JSON.parse(row.cancel_on_events ?? "[]") as string[]; } catch { events = []; }
    if (!events.includes(eventType)) continue;
    const result = await client.query(
      `UPDATE notification_queue SET status = 'cancelled' WHERE id = $1 AND status = 'pending'`,
      [row.id]
    );
    cancelled += result.rowCount ?? 0;
  }
  return cancelled;
}
