import { randomUUID } from "node:crypto";
import { getDatabaseDialect } from "@/lib/db";
import { portableQuery, portableQueryOne } from "@/lib/db/portable";
import type { DeliveryReceipt } from "@/lib/communications/contracts";

export interface CanonicalLogCommunicationOpts {
  company_id: string;
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

/** Legacy input adapter only; accountId is normalized immediately to company_id. */
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
export async function logCommunicationForCompany(
  opts: CanonicalLogCommunicationOpts,
): Promise<string | null> {
  if (!opts.company_id.trim()) throw new Error("company_id is required");
  return logCommunicationStorage({ ...opts, accountId: opts.company_id });
}

export async function logCommunication(opts: LogCommunicationOpts): Promise<string | null> {
  return logCommunicationForCompany({
    company_id: opts.accountId,
    channel: opts.channel,
    direction: opts.direction,
    outcome: opts.outcome,
    clientId: opts.clientId,
    bookingRequestId: opts.bookingRequestId,
    jobId: opts.jobId,
    visitId: opts.visitId,
    bodyPreview: opts.bodyPreview,
    initiatedBy: opts.initiatedBy,
    externalId: opts.externalId,
  });
}

async function logCommunicationStorage(opts: LogCommunicationOpts): Promise<string | null> {
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


/**
 * Durable company-scoped idempotency claim using the existing communications
 * audit store. A successful insert owns the key; a duplicate returns false.
 * This complements the process-local replay guard for multi-instance runtimes.
 */
export async function claimCommunicationIdempotency(input: {
  company_id: string;
  external_id: string;
  channel: "sms" | "email" | "phone";
  initiated_by?: string | null;
}): Promise<boolean> {
  if (!input.company_id.trim()) throw new Error("company_id is required");
  if (!input.external_id.trim()) throw new Error("external_id is required");
  const id = await logCommunicationForCompany({
    company_id: input.company_id,
    channel: input.channel,
    direction: "outbound",
    outcome: "sent",
    initiatedBy: input.initiated_by ?? null,
    externalId: input.external_id,
  });
  return id !== null;
}

export async function findCommunicationByExternalId(accountId: string, externalId: string) {
  return portableQueryOne<{ id: string; outcome: string }>(
    `SELECT id, outcome FROM communications_log WHERE account_id = $1 AND external_id = $2 LIMIT 1`,
    [accountId, externalId],
  );
}


/**
 * Persist canonical provider delivery evidence into the existing communications
 * audit store. account_id is retained only as the legacy storage column; callers
 * must supply the canonical company_id carried by the receipt.
 */
export async function recordDeliveryReceipt(receipt: DeliveryReceipt): Promise<boolean> {
  if (!receipt.company_id.trim()) throw new Error("company_id is required");
  const rows = await portableQuery<{ id: string }>(
    `UPDATE communications_log
       SET outcome = $3
     WHERE account_id = $1
       AND external_id = $2
       AND channel = $4
       AND direction = 'outbound'`,
    [
      receipt.company_id,
      receipt.provider_message_id ?? receipt.message_id,
      receipt.state,
      receipt.channel === "call" || receipt.channel === "voice" ? "phone" : receipt.channel,
    ],
  );
  return rows.length > 0;
}
