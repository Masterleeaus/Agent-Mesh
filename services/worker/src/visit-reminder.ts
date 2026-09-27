import type { DatabaseClient } from "./db-client.js";
import { logger } from "./logger.js";
import { visitReminderEmailHtml } from "@titan-zero/email-templates";
import { enqueueNotification } from "./notification/enqueue.js";
import { PRIORITY } from "./notification/priority.js";
import type { AutomationRow, RunResult } from "./automations/types.js";

export type { AutomationRow, RunResult };

export interface EligibleVisit {
  id: string;
  account_id: string;
  job_id: string;
  client_id: string;
  assigned_user_id: string | null;
  scheduled_start: string;
  job_title: string | null;
  client_name: string | null;
  client_email: string | null;
  property_address: string | null;
  tech_name: string | null;
}

export async function findDueReminders(client: DatabaseClient): Promise<AutomationRow[]> {
  const now = new Date().toISOString();
  const { rows } = await client.query<AutomationRow>(
    `SELECT id, account_id, type, config, enabled, next_run_at
     FROM automations
     WHERE type = 'visit_reminder' AND enabled = true AND next_run_at <= $1`,
    [now]
  );
  return rows;
}

export async function findEligibleVisits(client: DatabaseClient, automation: AutomationRow): Promise<EligibleVisit[]> {
  const hoursBefore = (automation.config.hours_before as number | undefined) ?? 24;
  const now = new Date();
  const windowEnd = new Date(now.getTime() + hoursBefore * 3_600_000);
  const { rows } = await client.query<EligibleVisit>(
    `SELECT v.id, v.account_id, v.job_id, c.id AS client_id, v.assigned_user_id,
            v.scheduled_start, j.title AS job_title, c.name AS client_name, c.email AS client_email,
            p.address AS property_address, u.full_name AS tech_name
     FROM visits v
     JOIN jobs j ON j.id = v.job_id
     JOIN clients c ON c.id = j.client_id
     LEFT JOIN properties p ON p.id = j.property_id
     LEFT JOIN users u ON u.id = v.assigned_user_id
     WHERE v.account_id = $1 AND v.status = 'scheduled'
       AND v.scheduled_start > $2 AND v.scheduled_start <= $3
       AND NOT EXISTS (
         SELECT 1 FROM audit_log al
         WHERE al.entity_type = 'visit_reminder' AND al.entity_id = v.id AND al.account_id = v.account_id
       )
     ORDER BY v.scheduled_start ASC`,
    [automation.account_id, now.toISOString(), windowEnd.toISOString()]
  );
  return rows;
}

export async function emitVisitReminder(client: DatabaseClient, visit: EligibleVisit, automationId: string): Promise<boolean> {
  const existing = await client.query(
    `SELECT 1 FROM audit_log
     WHERE entity_type = 'visit_reminder' AND entity_id = $1 AND account_id = $2 LIMIT 1`,
    [visit.id, visit.account_id]
  );
  if (existing.rows.length > 0) return false;

  if (visit.client_email && visit.client_name && visit.job_title) {
    const when = new Date(visit.scheduled_start).toLocaleString("en-US", {
      weekday: "long", month: "long", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit",
    });
    const enqueueResult = await enqueueNotification(client, {
      accountId: visit.account_id,
      clientId: visit.client_id,
      automationType: "visit_reminder",
      priority: PRIORITY.MEDIUM,
      toAddress: visit.client_email,
      subject: `Reminder: ${visit.job_title} visit on ${when}`,
      htmlBody: visitReminderEmailHtml({
        clientName: visit.client_name,
        jobTitle: visit.job_title,
        scheduledStart: visit.scheduled_start,
        propertyAddress: visit.property_address,
        techName: visit.tech_name,
      }),
      idempotencyKey: `visit_reminder:${visit.id}`,
      entityType: "visit",
      entityId: visit.id,
      cancelOnEvents: ["visit.cancelled"],
      metadata: { automationId, jobId: visit.job_id },
    });
    if (enqueueResult === "suppressed") {
      logger.debug("visit-reminder: suppressed by governor", { visitId: visit.id });
      return false;
    }
    await client.query(
      `INSERT INTO audit_log (account_id, entity_type, entity_id, action, actor_id, old_value, new_value)
       VALUES ($1, 'visit_reminder', $2, 'insert', $3, NULL, $4)`,
      [visit.account_id, visit.id, automationId, JSON.stringify({
        automation_id: automationId,
        visit_scheduled_start: visit.scheduled_start,
        job_id: visit.job_id,
        job_title: visit.job_title,
        client_name: visit.client_name,
        assigned_user_id: visit.assigned_user_id,
        reminder_queued_at: new Date().toISOString(),
      })]
    );
    return true;
  }
  return false;
}

export async function processVisitReminder(client: DatabaseClient, automation: AutomationRow): Promise<RunResult> {
  const result: RunResult = { automationId: automation.id, accountId: automation.account_id, sent: 0, skipped: 0, errors: 0 };
  const visits = await findEligibleVisits(client, automation);
  for (const visit of visits) {
    try {
      const emitted = await emitVisitReminder(client, visit, automation.id);
      if (emitted) result.sent++;
      else result.skipped++;
    } catch (error) {
      result.errors++;
      logger.error("visit-reminder: failed to emit for visit", error, { visitId: visit.id });
    }
  }
  return result;
}
