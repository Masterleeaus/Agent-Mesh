import type { DatabaseClient } from "./db-client.js";
import { logger } from "./logger.js";
import { reviewRequestEmailHtml } from "@ai-fsm/email-templates";
import type { AutomationRow, RunResult } from "./automations/types.js";
import { enqueueNotification } from "./notification/enqueue.js";
import { PRIORITY } from "./notification/priority.js";

/**
 * Review Request Automation
 *
 * After a job is completed, sends the client a "How did we do?" email to
 * solicit a review. Fires once per job — idempotency via audit_log.
 *
 * A job is eligible if:
 * 1. Job status is 'completed'
 * 2. completed_at is between (now - days_after - 1 day) and (now - days_after)
 *    — defaults to 1 day after completion (configurable via config.days_after)
 * 3. No 'review_request' audit entry exists for this job yet
 * 4. The client has an email address
 * 5. Any queued service-report delivery for the job has finished processing
 */

interface EligibleJob {
  id: string;
  account_id: string;
  client_id: string;
  title: string | null;
  client_name: string | null;
  client_email: string | null;
  tech_name: string | null;
}

export async function findDueReviewRequests(client: DatabaseClient): Promise<AutomationRow[]> {
  const { rows } = await client.query<AutomationRow>(
    `SELECT id, account_id, type, config, enabled, next_run_at
     FROM automations
     WHERE type = 'review_request'
       AND enabled = true
       AND next_run_at <= CURRENT_TIMESTAMP`
  );
  return rows;
}

export async function findEligibleJobs(
  client: DatabaseClient,
  automation: AutomationRow
): Promise<EligibleJob[]> {
  const daysAfter = (automation.config as { days_after?: number }).days_after ?? 1;

  const now = new Date();
  const windowEnd = new Date(now.getTime() - daysAfter * 24 * 60 * 60_000);
  const windowStart = new Date(windowEnd.getTime() - 24 * 60 * 60_000);

  const { rows } = await client.query<EligibleJob>(
    `SELECT j.id, j.account_id, c.id AS client_id, j.title,
            c.name AS client_name, c.email AS client_email,
            (SELECT u2.full_name
               FROM visits v
               JOIN users u2 ON u2.id = v.assigned_user_id
              WHERE v.job_id = j.id
                AND v.account_id = j.account_id
                AND v.completed_at IS NOT NULL
              ORDER BY v.completed_at DESC
              LIMIT 1) AS tech_name
       FROM jobs j
       JOIN clients c ON c.id = j.client_id AND c.account_id = j.account_id
      WHERE j.account_id = $1
        AND j.status = 'completed'
        AND j.updated_at >= $2
        AND j.updated_at < $3
        AND c.email IS NOT NULL
        AND NOT EXISTS (
          SELECT 1
            FROM visits rv
            JOIN notification_queue nq
              ON nq.entity_type = 'visit' AND nq.entity_id = rv.id
             AND nq.automation_type = 'service_report_delivery'
           WHERE rv.job_id = j.id AND rv.account_id = j.account_id
             AND nq.status IN ('pending', 'processing')
        )
        AND NOT EXISTS (
          SELECT 1 FROM audit_log al
           WHERE al.entity_type = 'review_request'
             AND al.entity_id = j.id
             AND al.account_id = j.account_id
        )
      ORDER BY j.updated_at ASC`,
    [automation.account_id, windowStart.toISOString(), windowEnd.toISOString()]
  );

  return rows;
}

async function emitReviewRequest(
  client: DatabaseClient,
  job: EligibleJob,
  automationId: string
): Promise<boolean> {
  const { rowCount } = await client.query(
    `SELECT 1 FROM audit_log
     WHERE entity_type = 'review_request'
       AND entity_id = $1
       AND account_id = $2
     LIMIT 1`,
    [job.id, job.account_id]
  );

  if (rowCount && rowCount > 0) {
    return false;
  }

  if (job.client_email && job.client_name && job.title) {
    const enqueueResult = await enqueueNotification(client, {
      accountId: job.account_id,
      clientId: job.client_id,
      automationType: "review_request",
      priority: PRIORITY.LOW,
      toAddress: job.client_email,
      subject: `How did we do? — ${job.title}`,
      htmlBody: reviewRequestEmailHtml({
        clientName: job.client_name,
        jobTitle: job.title,
        techName: job.tech_name,
      }),
      idempotencyKey: `review_request:${job.id}`,
      entityType: "job",
      entityId: job.id,
      metadata: { automationId },
    });
    if (enqueueResult === "suppressed") {
      logger.debug("review-request: suppressed by governor", { jobId: job.id });
      return false;
    }
  }

  await client.query(
    `INSERT INTO audit_log
       (account_id, entity_type, entity_id, action, actor_id, old_value, new_value)
     VALUES ($1, 'review_request', $2, 'insert', $3, NULL, $4)`,
    [
      job.account_id,
      job.id,
      automationId,
      JSON.stringify({
        automation_id: automationId,
        job_title: job.title,
        client_name: job.client_name,
        queued_at: new Date().toISOString(),
      }),
    ]
  );

  return true;
}

export async function processReviewRequests(
  client: DatabaseClient,
  automation: AutomationRow
): Promise<RunResult> {
  const result: RunResult = {
    automationId: automation.id,
    accountId: automation.account_id,
    sent: 0,
    skipped: 0,
    errors: 0,
  };

  const jobs = await findEligibleJobs(client, automation);

  for (const job of jobs) {
    try {
      const emitted = await emitReviewRequest(client, job, automation.id);
      if (emitted) {
        result.sent++;
      } else {
        result.skipped++;
      }
    } catch (error) {
      result.errors++;
      logger.error("review-request: failed to emit", error, { jobId: job.id });
    }
  }

  return result;
}
