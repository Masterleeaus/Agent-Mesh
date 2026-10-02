import { randomUUID } from "node:crypto";
import { singleFlight } from "../single-flight.js";
import type { DatabaseClient } from "../db-client.js";
import { databaseDialect } from "../db-client.js";
import { sendEmail } from "../mailer.js";
import { logger } from "../logger.js";
import { getRules, checkGovernor, updateCooldown } from "./governor.js";

interface QueueRow {
  id: string; account_id: string; client_id: string | null; automation_type: string;
  priority: number; to_address: string; subject: string; html_body: string;
  idempotency_key: string; attempt_count: number; max_attempts: number;
  entity_type: string | null; entity_id: string | null; metadata: Record<string, unknown>;
  lease_id: string | null; failure_reason: string | null;
}
export interface DispatchResult { sent: number; failed: number; retried: number; delayed: number; cancelled: number; }
const CLAIMED = "delivery-claimed";
const UNKNOWN = "delivery-outcome-unknown";
const LEASE_MS = 5 * 60_000;
const BACKOFF_MS = [0, 5 * 60_000, 30 * 60_000, 2 * 3_600_000, 6 * 3_600_000];

function timestamp(client: DatabaseClient, value = new Date()): string {
  const iso = value.toISOString();
  return databaseDialect(client) === "mysql" ? iso.replace("T", " ").replace("Z", "") : iso;
}
function comparable(client: DatabaseClient, expression: string): string {
  // SQLite may contain both CURRENT_TIMESTAMP and ISO timestamps. Compare their
  // instants instead of lexicographic space-versus-T ordering.
  return databaseDialect(client) === "sqlite" ? `julianday(${expression})` : expression;
}
async function transaction<T>(client: DatabaseClient, operation: () => Promise<T>): Promise<T> {
  await client.query(databaseDialect(client) === "sqlite" ? "BEGIN IMMEDIATE" : "BEGIN");
  try { const value = await operation(); await client.query("COMMIT"); return value; }
  catch (error) { await client.query("ROLLBACK"); throw error; }
}
function ownsLease(leaseParameter: number): string {
  return `((lease_id = $${leaseParameter}) OR (lease_id IS NULL AND $${leaseParameter} IS NULL))`;
}

async function claim(client: DatabaseClient, result: DispatchResult): Promise<QueueRow[]> {
  return transaction(client, async () => {
    const now = timestamp(client);
    const lock = databaseDialect(client) === "sqlite" ? "" : " FOR UPDATE SKIP LOCKED";
    const expired = await client.query<QueueRow>(
      `SELECT id,account_id,lease_id,failure_reason FROM notification_queue
       WHERE status = 'processing' AND (locked_until IS NULL OR ${comparable(client, "locked_until")} <= ${comparable(client, "$1")})
       ORDER BY locked_until,id LIMIT 20${lock}`, [now]);
    for (const row of expired.rows) {
      // Only our explicit pre-provider marker proves safe replay. Legacy/null or
      // in-flight leases may already have sent SMTP DATA and require review.
      const safeToReplay = row.failure_reason === CLAIMED;
      const updated = await client.query(
        `UPDATE notification_queue SET status=$1,failure_reason=$2,failed_at=$3,
         lease_id=NULL,locked_at=NULL,locked_until=NULL
         WHERE id=$4 AND account_id=$5 AND status='processing' AND ${ownsLease(6)}`,
        [safeToReplay ? "pending" : "dead_letter", safeToReplay ? null : UNKNOWN, safeToReplay ? null : now,
          row.id,row.account_id,row.lease_id]);
      if (!safeToReplay && updated.rowCount === 1) result.failed++;
    }
    const candidates = await client.query<QueueRow>(
      `SELECT id,account_id,client_id,automation_type,priority,to_address,subject,html_body,
       idempotency_key,attempt_count,max_attempts,entity_type,entity_id,metadata,lease_id,failure_reason
       FROM notification_queue WHERE status='pending'
       AND ${comparable(client, "next_attempt_at")} <= ${comparable(client, "$1")}
       AND (locked_until IS NULL OR ${comparable(client, "locked_until")} <= ${comparable(client, "$1")})
       ORDER BY priority,next_attempt_at,id LIMIT 20${lock}`, [now]);
    const claimed: QueueRow[] = [];
    for (const row of candidates.rows) {
      if (!Number.isSafeInteger(row.attempt_count) || !Number.isSafeInteger(row.max_attempts) ||
          row.attempt_count < 0 || row.max_attempts < 1 || row.attempt_count >= row.max_attempts) {
        const exhausted = await client.query(
          `UPDATE notification_queue SET status='dead_letter',failure_reason='attempt-limit',failed_at=$1
           WHERE id=$2 AND account_id=$3 AND status='pending'`, [now,row.id,row.account_id]);
        if (exhausted.rowCount === 1) result.failed++;
        continue;
      }
      const lease = randomUUID();
      const updated = await client.query(
        `UPDATE notification_queue SET status='processing',lease_id=$1,locked_at=$2,locked_until=$3,failure_reason=$4
         WHERE id=$5 AND account_id=$6 AND status='pending'`,
        [lease,now,timestamp(client,new Date(Date.now()+LEASE_MS)),CLAIMED,row.id,row.account_id]);
      if (updated.rowCount === 1) claimed.push({ ...row, lease_id: lease, failure_reason: CLAIMED });
    }
    return claimed;
  });
}

/** Existing queue delivery only. SMTP acknowledgement is transport evidence, not
 * a verified business outcome. No transaction remains open across provider I/O. */
const dispatchers = new WeakMap<DatabaseClient, () => Promise<DispatchResult>>();
export function dispatchNotificationQueue(client: DatabaseClient): Promise<DispatchResult> {
  let dispatch = dispatchers.get(client);
  if (!dispatch) { dispatch = singleFlight(() => runNotificationDispatch(client)); dispatchers.set(client, dispatch); }
  return dispatch();
}

async function runNotificationDispatch(client: DatabaseClient): Promise<DispatchResult> {
  const result: DispatchResult = { sent: 0, failed: 0, retried: 0, delayed: 0, cancelled: 0 };
  const rows = await claim(client,result);
  const rulesCache = new Map<string, Awaited<ReturnType<typeof getRules>>>();
  for (const row of rows) {
    try {
      if (!rulesCache.has(row.account_id)) rulesCache.set(row.account_id,await getRules(client,row.account_id));
      const governor = await checkGovernor(client,row,rulesCache.get(row.account_id)!);
      if (!governor.ok) {
        const updated = await client.query(
          `UPDATE notification_queue SET status='pending',next_attempt_at=$1,
           lease_id=NULL,locked_at=NULL,locked_until=NULL,failure_reason=NULL
           WHERE id=$2 AND account_id=$3 AND lease_id=$4 AND status='processing'`,
          [timestamp(client,governor.delayUntil ?? new Date(Date.now()+3_600_000)),row.id,row.account_id,row.lease_id]);
        if (updated.rowCount === 1) result.delayed++; else result.cancelled++;
        continue;
      }
      const startedAt = timestamp(client);
      const started = await client.query(
        `UPDATE notification_queue SET attempt_count=attempt_count+1,failure_reason=$1
         WHERE id=$2 AND account_id=$3 AND lease_id=$4 AND status='processing'
         AND attempt_count=$5 AND attempt_count < max_attempts
         AND ${comparable(client,"locked_until")} > ${comparable(client,"$6")}`,
        [UNKNOWN,row.id,row.account_id,row.lease_id,row.attempt_count,startedAt]);
      if (started.rowCount !== 1) { result.cancelled++; continue; }
      let delivery: Awaited<ReturnType<typeof sendEmail>>;
      try { delivery = await sendEmail({ to:row.to_address,subject:row.subject,html:row.html_body }); }
      catch { delivery = { ok:false,error:UNKNOWN,deliveryOutcome:"unknown" }; }
      const attempt = row.attempt_count+1;
      const ambiguous = !delivery.ok && delivery.deliveryOutcome !== "not-sent";
      const terminal = !delivery.ok && (ambiguous || attempt >= row.max_attempts);
      const status = delivery.ok ? "sent" : terminal ? "dead_letter" : "pending";
      const attemptStatus = delivery.ok ? "delivered" : terminal ? "dead_letter" : "failed";
      const finishedAt = timestamp(client);
      const error = delivery.ok ? null : ambiguous ? UNKNOWN : delivery.error ?? "SMTP rejected";
      await transaction(client,async () => {
        const completed = await client.query(
          `UPDATE notification_queue SET status=$1,sent_at=$2,failed_at=$3,failure_reason=$4,
           provider_message_id=$5,next_attempt_at=$6,lease_id=NULL,locked_at=NULL,locked_until=NULL
           WHERE id=$7 AND account_id=$8 AND lease_id=$9 AND status='processing'`,
          [status,delivery.ok ? finishedAt : null,terminal ? finishedAt : null,error,delivery.providerMessageId ?? null,
            timestamp(client,new Date(Date.now()+BACKOFF_MS[Math.min(attempt,BACKOFF_MS.length-1)])),row.id,row.account_id,row.lease_id]);
        if (completed.rowCount !== 1) throw new Error("notification-lease-lost");
        await client.query(
          `INSERT INTO notification_delivery_attempts
           (id,notification_id,account_id,attempt_number,status,provider,provider_message_id,error,started_at,finished_at)
           VALUES($1,$2,$3,$4,$5,'smtp',$6,$7,$8,$9)`,
          [randomUUID(),row.id,row.account_id,attempt,attemptStatus,delivery.providerMessageId ?? null,error,startedAt,finishedAt]);
        if (delivery.ok && row.client_id) {
          await updateCooldown(client,row.account_id,row.client_id);
          await client.query(
            `INSERT INTO communications_log (id,account_id,client_id,channel,direction,outcome,body_preview,external_id)
             VALUES($1,$2,$3,'email','outbound','sent',$4,$5)`,
            [randomUUID(),row.account_id,row.client_id,`${row.automation_type}: ${row.subject}`.slice(0,200),delivery.providerMessageId ?? row.id]);
        }
      });
      if (delivery.ok) result.sent++;
      else if (terminal) result.failed++;
      else result.retried++;
    } catch (error) {
      // A DB failure after a possible send leaves the durable UNKNOWN marker.
      // Expiry quarantines it rather than duplicating delivery after restart.
      result.failed++;
      logger.error("notification dispatch failed",error,{notificationId:row.id,accountId:row.account_id});
    }
  }
  return result;
}
