import type { DatabaseClient } from "../db-client.js";
import { sendEmail } from "../mailer.js";
import { logger } from "../logger.js";
import { checkGovernor, getRules, updateCooldown } from "./governor.js";

interface QueueRow {
  id: string;
  account_id: string;
  client_id: string | null;
  automation_type: string;
  priority: number;
  to_address: string;
  subject: string;
  html_body: string;
  idempotency_key: string;
  attempt_count: number;
  max_attempts: number;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  lease_id?: string | null;
}

export interface DispatchResult {
  sent: number;
  failed: number;
  retried: number;
  delayed: number;
  cancelled: number;
}

const LEASE_MINUTES = 5;

function leaseId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `lease-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function nextAttemptAt(attemptCount: number): Date {
  const delays = [0, 5 * 60_000, 30 * 60_000, 2 * 3_600_000, 6 * 3_600_000];
  return new Date(Date.now() + delays[Math.min(attemptCount, delays.length - 1)]);
}

/**
 * Claims notification rows in a short transaction, then performs provider I/O
 * only after the claim is committed. Every provider result is recorded in the
 * durable attempt table and the queue lease is released atomically.
 */
export async function dispatchNotificationQueue(client: DatabaseClient): Promise<DispatchResult> {
  const result: DispatchResult = { sent: 0, failed: 0, retried: 0, delayed: 0, cancelled: 0 };
  const lease = leaseId();

  await client.query("BEGIN");
  let rows: QueueRow[] = [];
  try {
    const claim = await client.query<QueueRow>(
      `WITH candidates AS (
         SELECT id
         FROM notification_queue
         WHERE status = 'pending'
           AND next_attempt_at <= now()
           AND (locked_until IS NULL OR locked_until < now())
         ORDER BY priority ASC, next_attempt_at ASC
         LIMIT 20
         FOR UPDATE SKIP LOCKED
       )
       UPDATE notification_queue nq
       SET status = 'processing',
           lease_id = $6::uuid,
           locked_at = now(),
           locked_until = now() + interval '${LEASE_MINUTES} minutes'
       FROM candidates
       WHERE nq.id = candidates.id
       RETURNING nq.id, nq.account_id, nq.client_id, nq.automation_type, nq.priority,
                 nq.to_address, nq.subject, nq.html_body, nq.idempotency_key,
                 nq.attempt_count, nq.max_attempts, nq.entity_type, nq.entity_id,
                 nq.metadata, nq.lease_id`
    );
    rows = claim.rows ?? [];
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }

  if (rows.length === 0) return result;
  const rulesCache = new Map<string, Awaited<ReturnType<typeof getRules>>>();

  for (const row of rows) {
    try {
      if (!rulesCache.has(row.account_id)) rulesCache.set(row.account_id, await getRules(client, row.account_id));
      const rules = rulesCache.get(row.account_id)!;
      const governor = await checkGovernor(client, row, rules);

      if (!governor.ok) {
        const delayUntil = governor.delayUntil ?? new Date(Date.now() + 3_600_000);
        await client.query(
          `UPDATE notification_queue
           SET status = 'pending',
               attempt_count   = GREATEST(attempt_count - 1, 0),
               lease_id = NULL, locked_at = NULL, locked_until = $1
           WHERE id = $2 AND lease_id = $3::uuid`,
          [delayUntil.toISOString(), row.id, row.lease_id ?? null]
        );
        result.delayed++;
        continue;
      }

      await client.query(
        `UPDATE notification_queue
         SET attempt_count = attempt_count + 1
         WHERE id = $1 AND lease_id = $2::uuid`,
        [row.id, row.lease_id ?? lease]
      );

      const sendResult = await sendEmail({ to: row.to_address, subject: row.subject, html: row.html_body });
      const attemptNumber = row.attempt_count + 1;

      if (sendResult.ok) {
        await client.query(
          `INSERT INTO notification_delivery_attempts
             (notification_id, account_id, attempt_number, status, provider, provider_message_id, error)
           VALUES ($1, $2, $3, 'delivered', 'smtp', $4, NULL)`,
          [row.id, row.account_id, attemptNumber, sendResult.providerMessageId ?? null]
        );
        await client.query(
          `UPDATE notification_queue
           SET status = 'sent', sent_at = now(), provider_message_id = $1,
               lease_id = NULL, locked_at = NULL, locked_until = NULL
           WHERE id = $2 AND lease_id = $3::uuid`,
          [sendResult.providerMessageId ?? null, row.id, row.lease_id ?? lease]
        );
        if (row.client_id) await updateCooldown(client, row.account_id, row.client_id);
        result.sent++;
      } else {
        const terminal = attemptNumber >= row.max_attempts;
        await client.query(
          `INSERT INTO notification_delivery_attempts
             (notification_id, account_id, attempt_number, status, provider, provider_message_id, error)
           VALUES ($1, $2, $3, '${terminal ? "dead_letter" : "failed"}', 'smtp', NULL, $4)`,
          [row.id, row.account_id, attemptNumber, sendResult.error ?? "unknown"]
        );
        await client.query(
          `UPDATE notification_queue
           SET status = '${terminal ? "dead_letter" : "pending"}',
               failure_reason = $1, failed_at = ${terminal ? "now()" : "NULL"},
               next_attempt_at = $2, lease_id = NULL, locked_at = NULL, locked_until = NULL
           WHERE id = $3 AND lease_id = $4::uuid`,
          [sendResult.error ?? "unknown", nextAttemptAt(attemptNumber).toISOString(), row.id, row.lease_id ?? lease]
        );
        if (terminal) result.failed++;
        else result.retried++;
      }
    } catch (error) {
      result.failed++;
      logger.error("notification dispatch failed", error, { notificationId: row.id });
    }
  }
  return result;
}
