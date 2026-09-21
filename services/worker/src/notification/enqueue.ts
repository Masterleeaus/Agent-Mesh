import type { DatabaseClient } from "../db-client.js";
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

function zonedDayStartUtc(now: Date, timeZone: string): Date {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
  }).formatToParts(now);
  const value = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  const localAsUtc = Date.UTC(value("year"), value("month") - 1, value("day"), value("hour") % 24, value("minute"), value("second"));
  const offsetMs = localAsUtc - now.getTime();
  return new Date(Date.UTC(value("year"), value("month") - 1, value("day")) - offsetMs);
}

function parseStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.map(String);
    } catch {
      if (value.startsWith("{") && value.endsWith("}")) {
        return value.slice(1, -1).split(",").map((v) => v.replace(/^"|"$/g, "").trim()).filter(Boolean);
      }
    }
  }
  return [];
}

export async function enqueueNotification(client: DatabaseClient, opts: EnqueueOpts): Promise<EnqueueResult> {
  const existing = await client.query<{ id: string; status: string }>(
    `SELECT id, status FROM notification_queue WHERE idempotency_key = $1 LIMIT 1`,
    [opts.idempotencyKey],
  );
  if (existing.rows.length > 0 && !["failed", "dead_letter"].includes(existing.rows[0].status)) return "duplicate";

  if (opts.priority > COOLDOWN_BYPASS_MINIMUM && opts.clientId) {
    const cooldown = await client.query<{ last_sent_at: string; cooldown_hours: number }>(
      `SELECT nc.last_sent_at, COALESCE(ar.cooldown_hours, 4) AS cooldown_hours
         FROM notification_cooldowns nc
         LEFT JOIN automation_settings ar ON ar.account_id = nc.account_id
        WHERE nc.account_id = $1 AND nc.client_id = $2`,
      [opts.accountId, opts.clientId],
    );
    if (cooldown.rows.length > 0) {
      const { last_sent_at, cooldown_hours } = cooldown.rows[0];
      const elapsed = (Date.now() - new Date(last_sent_at).getTime()) / 3_600_000;
      if (elapsed < cooldown_hours) return "suppressed";
    }
  }

  if (opts.priority >= PRIORITY.LOW && opts.clientId) {
    const settings = await client.query<{ max_per_day: number; working_hours_tz: string }>(
      `SELECT max_per_day, working_hours_tz FROM automation_settings WHERE account_id = $1`,
      [opts.accountId],
    );
    const maxPerDay = Number(settings.rows[0]?.max_per_day ?? 2);
    const tz = settings.rows[0]?.working_hours_tz ?? "America/New_York";
    const start = zonedDayStartUtc(new Date(), tz).toISOString();
    const cap = await client.query<{ today_count: number | string }>(
      `SELECT COUNT(id) AS today_count
         FROM notification_queue
        WHERE account_id = $1 AND client_id = $2 AND status = 'sent' AND sent_at >= $3`,
      [opts.accountId, opts.clientId, start],
    );
    if (Number(cap.rows[0]?.today_count ?? 0) >= maxPerDay) return "suppressed";
  }

  const nextAttemptAt = opts.scheduledFor ?? new Date();
  const params = [
    opts.accountId, opts.clientId, opts.automationType, opts.priority, opts.toAddress,
    opts.subject, opts.htmlBody, opts.idempotencyKey, opts.entityType ?? null,
    opts.entityId ?? null, JSON.stringify(opts.cancelOnEvents ?? []),
    nextAttemptAt.toISOString(), JSON.stringify(opts.metadata ?? {}),
  ];

  if (existing.rows.length > 0) {
    await client.query(
      `UPDATE notification_queue
          SET account_id = $1, client_id = $2, automation_type = $3, priority = $4,
              to_address = $5, subject = $6, html_body = $7, entity_type = $9,
              entity_id = $10, cancel_on_events = $11, metadata = $13,
              status = 'pending', attempt_count = 0, failure_reason = NULL, failed_at = NULL,
              lease_id = NULL, locked_at = NULL, locked_until = NULL, next_attempt_at = $12
        WHERE idempotency_key = $8`,
      params,
    );
  } else {
    await client.query(
      `INSERT INTO notification_queue
         (account_id, client_id, automation_type, priority, to_address, subject, html_body,
          idempotency_key, entity_type, entity_id, cancel_on_events, next_attempt_at, metadata)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
      params,
    );
  }
  return "enqueued";
}

export async function cancelNotificationsForEntity(
  client: DatabaseClient,
  entityType: string,
  entityId: string,
  eventType: string,
): Promise<number> {
  const candidates = await client.query<{ id: string; cancel_on_events: unknown }>(
    `SELECT id, cancel_on_events FROM notification_queue
      WHERE entity_type = $1 AND entity_id = $2 AND status = 'pending'`,
    [entityType, entityId],
  );
  let cancelled = 0;
  for (const row of candidates.rows) {
    if (!parseStringArray(row.cancel_on_events).includes(eventType)) continue;
    const result = await client.query(`UPDATE notification_queue SET status = 'cancelled' WHERE id = $1 AND status = 'pending'`, [row.id]);
    cancelled += result.rowCount ?? 0;
  }
  return cancelled;
}
