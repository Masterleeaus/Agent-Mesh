import { randomUUID } from "node:crypto";
import type { DatabaseClient } from "../db-client.js";
import { sendEmail } from "../mailer.js";
import { logger } from "../logger.js";
import { getRules, checkGovernor, updateCooldown } from "./governor.js";

interface QueueRow {
  id: string; account_id: string; client_id: string | null; automation_type: string;
  priority: number; to_address: string; subject: string; html_body: string;
  idempotency_key: string; attempt_count: number; max_attempts: number;
  entity_type: string | null; entity_id: string | null; metadata: Record<string, unknown> | string;
  lease_id: string;
}
export interface DispatchResult { sent: number; failed: number; retried: number; delayed: number; cancelled: number; }
const CLAIM_SIZE = 20;
const LEASE_MS = 60_000;
const MAX_BACKOFF_MS = 6 * 3_600_000;
function nextAttemptAt(attemptCount: number): Date {
  return new Date(Date.now() + Math.min(MAX_BACKOFF_MS, 5 * 60_000 * (2 ** Math.max(0, attemptCount - 1))));
}

async function claimNotificationBatch(client: DatabaseClient): Promise<QueueRow[]> {
  await client.query("BEGIN");
  try {
    const candidates = await client.query<{ id: string }>(
      `SELECT id FROM notification_queue
        WHERE next_attempt_at <= CURRENT_TIMESTAMP
          AND (status = 'pending' OR (status = 'processing' AND locked_until < CURRENT_TIMESTAMP))
        ORDER BY priority ASC, next_attempt_at ASC, created_at ASC
        LIMIT ${CLAIM_SIZE} FOR UPDATE SKIP LOCKED`,
    );
    const claimed: QueueRow[] = [];
    for (const candidate of candidates.rows) {
      const leaseId = randomUUID();
      const lockedUntil = new Date(Date.now() + LEASE_MS).toISOString();
      const updated = await client.query(
        `UPDATE notification_queue
            SET status = 'processing', attempt_count = attempt_count + 1,
                lease_id = $1, locked_at = CURRENT_TIMESTAMP, locked_until = $2
          WHERE id = $3`,
        [leaseId, lockedUntil, candidate.id],
      );
      if ((updated.rowCount ?? 0) === 0) continue;
      const row = await client.query<QueueRow>(
        `SELECT id, account_id, client_id, automation_type, priority, to_address, subject, html_body,
                idempotency_key, attempt_count, max_attempts, entity_type, entity_id, metadata, lease_id
           FROM notification_queue WHERE id = $1`,
        [candidate.id],
      );
      if (row.rows[0]) claimed.push(row.rows[0]);
    }
    await client.query("COMMIT");
    return claimed;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}

async function releaseForGovernorDelay(client: DatabaseClient, row: QueueRow, delayUntil: Date): Promise<boolean> {
  const result = await client.query(
    `UPDATE notification_queue
        SET status='pending', attempt_count=CASE WHEN attempt_count > 0 THEN attempt_count - 1 ELSE 0 END,
            next_attempt_at=$1, lease_id=NULL, locked_at=NULL, locked_until=NULL
      WHERE id=$2 AND lease_id=$3`,
    [delayUntil.toISOString(), row.id, row.lease_id],
  );
  return (result.rowCount ?? 0) > 0;
}

async function finishDelivery(
  client: DatabaseClient,
  row: QueueRow,
  outcome: { delivered: boolean; error?: string; providerMessageId?: string; startedAt: Date },
): Promise<"sent" | "retried" | "dead_letter" | "stale"> {
  const terminal = !outcome.delivered && row.attempt_count >= row.max_attempts;
  const status = outcome.delivered ? "sent" : terminal ? "dead_letter" : "pending";
  const retryAt = outcome.delivered || terminal ? null : nextAttemptAt(row.attempt_count);
  await client.query("BEGIN");
  try {
    const updated = await client.query(
      `UPDATE notification_queue
          SET status=$1,
              sent_at=CASE WHEN $1='sent' THEN CURRENT_TIMESTAMP ELSE sent_at END,
              failed_at=CASE WHEN $1='dead_letter' THEN CURRENT_TIMESTAMP ELSE NULL END,
              failure_reason=$2, provider_message_id=COALESCE($3, provider_message_id),
              next_attempt_at=COALESCE($4, next_attempt_at), lease_id=NULL, locked_at=NULL, locked_until=NULL
        WHERE id=$5 AND lease_id=$6`,
      [status, outcome.delivered ? null : outcome.error ?? "unknown", outcome.providerMessageId ?? null,
       retryAt?.toISOString() ?? null, row.id, row.lease_id],
    );
    if ((updated.rowCount ?? 0) === 0) { await client.query("ROLLBACK"); return "stale"; }

    const attemptExists = await client.query(
      `SELECT id FROM notification_delivery_attempts WHERE notification_id=$1 AND attempt_number=$2 LIMIT 1`,
      [row.id, row.attempt_count],
    );
    if (attemptExists.rows.length === 0) {
      await client.query(
        `INSERT INTO notification_delivery_attempts
           (id, notification_id, account_id, attempt_number, status, provider, provider_message_id, error, started_at, finished_at)
         VALUES ($1,$2,$3,$4,$5,'smtp',$6,$7,$8,CURRENT_TIMESTAMP)`,
        [randomUUID(), row.id, row.account_id, row.attempt_count,
         outcome.delivered ? "delivered" : terminal ? "dead_letter" : "failed",
         outcome.providerMessageId ?? null, outcome.delivered ? null : outcome.error ?? "unknown",
         outcome.startedAt.toISOString()],
      );
    }
    await client.query("COMMIT");
    return outcome.delivered ? "sent" : terminal ? "dead_letter" : "retried";
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}

export async function dispatchNotificationQueue(client: DatabaseClient): Promise<DispatchResult> {
  const result: DispatchResult = { sent: 0, failed: 0, retried: 0, delayed: 0, cancelled: 0 };
  const rows = await claimNotificationBatch(client);
  if (rows.length === 0) return result;
  const rulesCache = new Map<string, Awaited<ReturnType<typeof getRules>>>();
  for (const row of rows) {
    let startedAt = new Date();
    try {
      if (!rulesCache.has(row.account_id)) rulesCache.set(row.account_id, await getRules(client, row.account_id));
      const gov = await checkGovernor(client, row, rulesCache.get(row.account_id)!);
      if (!gov.ok) {
        if (await releaseForGovernorDelay(client, row, gov.delayUntil ?? new Date(Date.now() + 3_600_000))) result.delayed++;
        continue;
      }
      startedAt = new Date();
      const sendResult = await sendEmail({ to: row.to_address, subject: row.subject, html: row.html_body });
      const finished = await finishDelivery(client, row, {
        delivered: sendResult.ok, error: sendResult.error, providerMessageId: sendResult.providerMessageId, startedAt,
      });
      if (finished === "stale") { logger.warn("notification result ignored after lease loss", { notificationId: row.id, attempt: row.attempt_count }); continue; }
      if (finished === "sent") {
        if (row.client_id) {
          await updateCooldown(client, row.account_id, row.client_id);
          await client.query(
            `INSERT INTO communications_log (account_id, client_id, channel, direction, outcome, body_preview, external_id)
             VALUES ($1,$2,'email','outbound','sent',$3,$4)`,
            [row.account_id, row.client_id, `${row.automation_type}: ${row.subject}`.slice(0, 200), sendResult.providerMessageId ?? row.id],
          );
        }
        result.sent++;
      } else if (finished === "dead_letter") result.failed++;
      else result.retried++;
    } catch (error) {
      logger.error("dispatch loop error", error, { notificationId: row.id });
      try {
        const finished = await finishDelivery(client, row, { delivered: false, error: error instanceof Error ? error.message : "notification dispatch failed", startedAt });
        if (finished === "dead_letter") result.failed++; else if (finished === "retried") result.retried++;
      } catch (finishError) { logger.error("notification failure state could not be persisted", finishError, { notificationId: row.id }); }
    }
  }
  return result;
}
