import { randomUUID } from "node:crypto";
import { getDatabaseDialect } from "@/lib/db";
import { portableQuery, portableQueryOne } from "@/lib/db/portable";

export interface LogCommunicationOpts {
  accountId: string;
  channel: "sms" | "email" | "phone";
  direction: "outbound" | "inbound";
  outcome: "sent" | "delivered" | "failed" | "no_answer" | "left_voicemail" | "replied" | "received";
  clientId?: string | null;
  bookingRequestId?: string | null;
  jobId?: string | null;
  visitId?: string | null;
  bodyPreview?: string | null;
  initiatedBy?: string | null;
  externalId?: string | null;
}

/**
 * Writes the canonical customer communications audit row on either supported DB.
 * Provider ids are tenant-scoped idempotency keys. The generated row id lets
 * callers link a communication to a job/visit later without database-specific
 * insert-result syntax.
 */
export async function logCommunication(opts: LogCommunicationOpts): Promise<string | null> {
  if (opts.externalId) {
    const duplicate = await portableQuery<{ id: string }>(
      `SELECT id FROM communications_log WHERE account_id = $1 AND external_id = $2 LIMIT 1`,
      [opts.accountId, opts.externalId],
    );
    if (duplicate.length > 0) return null;
  }

  const id = randomUUID();
  const verb = getDatabaseDialect() === "mysql" && opts.externalId ? "INSERT IGNORE" : "INSERT";
  await portableQuery(
    `${verb} INTO communications_log
       (id, account_id, channel, direction, outcome, client_id, booking_request_id,
        job_id, visit_id, body_preview, initiated_by, external_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
    [id, opts.accountId, opts.channel, opts.direction, opts.outcome,
      opts.clientId ?? null, opts.bookingRequestId ?? null, opts.jobId ?? null,
      opts.visitId ?? null, opts.bodyPreview ?? null, opts.initiatedBy ?? null,
      opts.externalId ?? null],
  );

  if (opts.externalId && getDatabaseDialect() === "mysql") {
    const persisted = await portableQuery<{ id: string }>(
      `SELECT id FROM communications_log WHERE account_id = $1 AND external_id = $2 LIMIT 1`,
      [opts.accountId, opts.externalId],
    );
    return persisted[0]?.id === id ? id : null;
  }
  return id;
}


export async function findCommunicationByExternalId(accountId: string, externalId: string) {
  return portableQueryOne<{ id: string; outcome: string }>(
    `SELECT id, outcome FROM communications_log WHERE account_id = $1 AND external_id = $2 LIMIT 1`,
    [accountId, externalId],
  );
}
