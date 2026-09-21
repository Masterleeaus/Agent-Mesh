import type { DatabaseClient } from "./db-client.js";
import { logger } from "./logger.js";
import { estimateFollowupHtml } from "@ai-fsm/email-templates";
import { appUrl } from "./mailer.js";
import type { AutomationRow, RunResult } from "./automations/types.js";
import { enqueueNotification } from "./notification/enqueue.js";
import { PRIORITY } from "./notification/priority.js";

/**
 * Estimate Follow-up Automation
 *
 * Sends a gentle nudge to clients who received an estimate (status='sent')
 * but haven't actioned it after config.days_after_sent days.
 *
 * Eligible when:
 *  - status = 'sent'
 *  - sent_at is between (now - days - 1d) and (now - days)
 *  - client has an email
 *  - no prior 'estimate_followup' audit entry for this estimate
 */

interface EligibleEstimate {
  id: string;
  account_id: string;
  client_id: string;
  total_cents: number;
  sent_at: string;
  days_since_sent: number;
  client_name: string | null;
  client_email: string | null;
}

export async function findDueEstimateFollowups(client: DatabaseClient): Promise<AutomationRow[]> {
  const { rows } = await client.query<AutomationRow>(
    `SELECT id, account_id, type, config, enabled, next_run_at
       FROM automations
      WHERE type = 'estimate_followup'
        AND enabled = true
        AND next_run_at <= CURRENT_TIMESTAMP`
  );
  return rows;
}

export async function findEligibleEstimates(
  client: DatabaseClient,
  automation: AutomationRow
): Promise<EligibleEstimate[]> {
  const daysAfter = (automation.config as { days_after_sent?: number }).days_after_sent ?? 3;

  const now = new Date();
  const windowEnd = new Date(now.getTime() - daysAfter * 24 * 60 * 60_000);
  const windowStart = new Date(windowEnd.getTime() - 24 * 60 * 60_000);

  type EligibleEstimateRow = Omit<EligibleEstimate, "days_since_sent">;
  const { rows } = await client.query<EligibleEstimateRow>(
    `SELECT e.id, e.account_id, c.id AS client_id,
            e.total_cents,
            e.sent_at,
            c.name AS client_name, c.email AS client_email
       FROM estimates e
       JOIN clients c ON c.id = e.client_id AND c.account_id = e.account_id
      WHERE e.account_id = $1
        AND e.status = 'sent'
        AND e.sent_at IS NOT NULL
        AND e.sent_at <= $2
        AND e.sent_at > $3
        AND c.email IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM audit_log al
           WHERE al.entity_type = 'estimate_followup'
             AND al.entity_id = e.id
             AND al.account_id = e.account_id
        )
      ORDER BY e.sent_at ASC`,
    [automation.account_id, windowEnd.toISOString(), windowStart.toISOString()]
  );

  return rows.map((row) => ({
    ...row,
    sent_at: new Date(row.sent_at).toISOString(),
    days_since_sent: Math.max(0, Math.floor((now.getTime() - new Date(row.sent_at).getTime()) / (24 * 60 * 60_000))),
  }));
}

async function emitEstimateFollowup(
  client: DatabaseClient,
  est: EligibleEstimate,
  automationId: string
): Promise<boolean> {
  const { rowCount } = await client.query(
    `SELECT 1 FROM audit_log
      WHERE entity_type = 'estimate_followup'
        AND entity_id = $1
        AND account_id = $2
      LIMIT 1`,
    [est.id, est.account_id]
  );
  if (rowCount && rowCount > 0) return false;

  if (est.client_email && est.client_name) {
    const enqueueResult = await enqueueNotification(client, {
      accountId: est.account_id,
      clientId: est.client_id,
      automationType: "estimate_followup",
      priority: PRIORITY.MEDIUM,
      toAddress: est.client_email,
      subject: `Following up on your estimate (#${est.id.slice(0, 8)})`,
      htmlBody: estimateFollowupHtml({
        clientName: est.client_name,
        estimateNumber: est.id.slice(0, 8),
        totalCents: est.total_cents,
        daysSinceSent: est.days_since_sent,
        viewUrl: `${appUrl()}/app/estimates/${est.id}`,
      }),
      idempotencyKey: `estimate_followup:${est.id}`,
      entityType: "estimate",
      entityId: est.id,
      cancelOnEvents: ["estimate.approved", "estimate.declined"],
      metadata: { automationId },
    });
    if (enqueueResult === "suppressed") {
      logger.debug("estimate-followup: suppressed by governor", { estimateId: est.id });
      return false;
    }
  }

  await client.query(
    `INSERT INTO audit_log
       (account_id, entity_type, entity_id, action, actor_id, old_value, new_value)
     VALUES ($1, 'estimate_followup', $2, 'insert', $3, NULL, $4)`,
    [
      est.account_id,
      est.id,
      automationId,
      JSON.stringify({
        automation_id: automationId,
        estimate_number: est.id.slice(0, 8),
        client_name: est.client_name,
        queued_at: new Date().toISOString(),
      }),
    ]
  );
  return true;
}

export async function processEstimateFollowups(client: DatabaseClient, automation: AutomationRow): Promise<RunResult> {
  const result: RunResult = {
    automationId: automation.id,
    accountId: automation.account_id,
    sent: 0,
    skipped: 0,
    errors: 0,
  };

  const estimates = await findEligibleEstimates(client, automation);
  for (const est of estimates) {
    try {
      const emitted = await emitEstimateFollowup(client, est, automation.id);
      if (emitted) result.sent++;
      else result.skipped++;
    } catch (error) {
      result.errors++;
      logger.error("estimate-followup: failed to emit", error, { estimateId: est.id });
    }
  }

  return result;
}
