import type { DatabaseClient } from "./db-client.js";
import { logger } from "./logger.js";
import { bookingConfirmedEmailHtml } from "@titan-zero/email-templates";
import type { AutomationRow, RunResult } from "./automations/types.js";
import { enqueueNotification } from "./notification/enqueue.js";
import { PRIORITY } from "./notification/priority.js";

interface EligibleBooking {
  id: string;
  account_id: string;
  job_id: string;
  client_id: string;
  scheduled_start: string;
  scheduled_end: string;
  job_title: string | null;
  client_name: string | null;
  client_email: string | null;
  property_address: string | null;
  tech_name: string | null;
}

export async function findDueBookingConfirmations(client: DatabaseClient): Promise<AutomationRow[]> {
  const { rows } = await client.query<AutomationRow>(
    `SELECT id, account_id, type, config, enabled, next_run_at
     FROM automations
     WHERE type = 'booking_confirmed' AND enabled = true AND next_run_at <= $1`,
    [new Date().toISOString()]
  );
  return rows;
}

export async function findEligibleBookings(client: DatabaseClient, automation: AutomationRow): Promise<EligibleBooking[]> {
  const hoursWindow = (automation.config as { hours_window?: number }).hours_window ?? 48;
  const now = new Date();
  const createdAfter = new Date(now.getTime() - hoursWindow * 3_600_000).toISOString();
  const { rows } = await client.query<EligibleBooking>(
    `SELECT v.id, v.account_id, v.job_id, c.id AS client_id,
            v.scheduled_start, v.scheduled_end, j.title AS job_title,
            c.name AS client_name, c.email AS client_email,
            p.address AS property_address, u.full_name AS tech_name
     FROM visits v
     JOIN jobs j ON j.id = v.job_id
     JOIN clients c ON c.id = j.client_id
     LEFT JOIN properties p ON p.id = j.property_id
     LEFT JOIN users u ON u.id = v.assigned_user_id
     WHERE v.account_id = $1 AND v.status = 'scheduled'
       AND v.scheduled_start > $2 AND v.created_at >= $3
       AND NOT EXISTS (
         SELECT 1 FROM audit_log al
         WHERE al.entity_type = 'booking_confirmed' AND al.entity_id = v.id AND al.account_id = v.account_id
       )
     ORDER BY v.created_at ASC`,
    [automation.account_id, now.toISOString(), createdAfter]
  );
  return rows;
}

async function emitBookingConfirmation(client: DatabaseClient, booking: EligibleBooking, automationId: string): Promise<boolean> {
  const existing = await client.query(
    `SELECT 1 FROM audit_log
     WHERE entity_type = 'booking_confirmed' AND entity_id = $1 AND account_id = $2 LIMIT 1`,
    [booking.id, booking.account_id]
  );
  if (existing.rows.length > 0) return false;

  if (booking.client_email && booking.client_name && booking.job_title) {
    const enqueueResult = await enqueueNotification(client, {
      accountId: booking.account_id,
      clientId: booking.client_id,
      automationType: "booking_confirmed",
      priority: PRIORITY.MEDIUM,
      toAddress: booking.client_email,
      subject: `Appointment Confirmed — ${booking.job_title}`,
      htmlBody: bookingConfirmedEmailHtml({
        clientName: booking.client_name,
        jobTitle: booking.job_title,
        scheduledStart: booking.scheduled_start,
        scheduledEnd: booking.scheduled_end,
        propertyAddress: booking.property_address,
        techName: booking.tech_name,
      }),
      idempotencyKey: `booking_confirmed:${booking.id}`,
      entityType: "visit",
      entityId: booking.id,
      cancelOnEvents: ["visit.cancelled"],
      metadata: { automationId, jobId: booking.job_id },
    });
    if (enqueueResult === "suppressed") {
      logger.debug("booking-confirmed: suppressed by governor", { visitId: booking.id });
      return false;
    }
  }

  await client.query(
    `INSERT INTO audit_log (account_id, entity_type, entity_id, action, actor_id, old_value, new_value)
     VALUES ($1, 'booking_confirmed', $2, 'insert', $3, NULL, $4)`,
    [booking.account_id, booking.id, automationId, JSON.stringify({
      automation_id: automationId,
      scheduled_start: booking.scheduled_start,
      job_title: booking.job_title,
      client_name: booking.client_name,
      queued_at: new Date().toISOString(),
    })]
  );
  return true;
}

export async function processBookingConfirmation(client: DatabaseClient, automation: AutomationRow): Promise<RunResult> {
  const result: RunResult = { automationId: automation.id, accountId: automation.account_id, sent: 0, skipped: 0, errors: 0 };
  for (const booking of await findEligibleBookings(client, automation)) {
    try {
      const emitted = await emitBookingConfirmation(client, booking, automation.id);
      if (emitted) result.sent++; else result.skipped++;
    } catch (error) {
      result.errors++;
      logger.error("booking-confirmed: failed to emit", error, { visitId: booking.id });
    }
  }
  return result;
}
