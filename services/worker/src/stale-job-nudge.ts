import type { DatabaseClient } from "./db-client.js";
import { logger } from "./logger.js";
import type { AutomationRow, RunResult } from "./automations/types.js";

/**
 * Stale Job Nudge Automation
 *
 * Internal-only alert: flags jobs that have been scheduled/in_progress without
 * any future scheduled visit for config.days_without_visit days (default 14).
 *
 * No customer email is sent. Records an audit_log entry per stale job so the
 * operations dashboard can surface them. Fires at most once per (job, week)
 * to avoid alert fatigue.
 */

interface StaleJob {
  id: string;
  account_id: string;
  client_id: string;
  title: string;
  status: string;
  last_visit_at: string | null;
  days_without_visit: number;
}

export async function findDueStaleJobNudges(client: DatabaseClient): Promise<AutomationRow[]> {
  const { rows } = await client.query<AutomationRow>(
    `SELECT id, account_id, type, config, enabled, next_run_at
       FROM automations
      WHERE type = 'stale_job_nudge'
        AND enabled = true
        AND next_run_at <= CURRENT_TIMESTAMP`
  );
  return rows;
}

export async function findStaleJobs(
  client: DatabaseClient,
  automation: AutomationRow
): Promise<StaleJob[]> {
  const days = (automation.config as { days_without_visit?: number }).days_without_visit ?? 14;

  const now = new Date();
  const staleCutoff = new Date(now.getTime() - days * 24 * 60 * 60_000);
  const weeklyCutoff = new Date(now.getTime() - 7 * 24 * 60 * 60_000);
  type StaleJobRow = Omit<StaleJob, "days_without_visit"> & { updated_at: string };

  const { rows } = await client.query<StaleJobRow>(
    `SELECT j.id, j.account_id, j.client_id, j.title, j.status, j.updated_at,
            (SELECT MAX(v.completed_at)
               FROM visits v
              WHERE v.job_id = j.id
                AND v.account_id = j.account_id
                AND v.completed_at IS NOT NULL) AS last_visit_at
       FROM jobs j
      WHERE j.account_id = $1
        AND j.status IN ('scheduled', 'in_progress')
        AND NOT EXISTS (
          SELECT 1 FROM visits v2
           WHERE v2.job_id = j.id AND v2.account_id = j.account_id
             AND v2.status = 'scheduled'
             AND v2.scheduled_start > $2
        )
        AND COALESCE(
          (SELECT MAX(v3.completed_at)
             FROM visits v3
            WHERE v3.job_id = j.id
              AND v3.account_id = j.account_id
              AND v3.completed_at IS NOT NULL),
          j.updated_at
        ) < $3
        AND NOT EXISTS (
          SELECT 1 FROM audit_log al
           WHERE al.entity_type = 'stale_job_nudge'
             AND al.entity_id = j.id
             AND al.account_id = j.account_id
             AND al.created_at > $4
        )
      ORDER BY j.updated_at ASC`,
    [automation.account_id, now.toISOString(), staleCutoff.toISOString(), weeklyCutoff.toISOString()]
  );

  return rows.map((row) => {
    const basis = row.last_visit_at ?? row.updated_at;
    return {
      ...row,
      last_visit_at: row.last_visit_at ? new Date(row.last_visit_at).toISOString() : null,
      days_without_visit: Math.max(0, Math.floor((now.getTime() - new Date(basis).getTime()) / (24 * 60 * 60_000))),
    };
  });
}

async function emitStaleJobNudge(
  client: DatabaseClient,
  job: StaleJob,
  automationId: string
): Promise<boolean> {
  await client.query(
    `INSERT INTO audit_log
       (account_id, entity_type, entity_id, action, actor_id, old_value, new_value)
     VALUES ($1, 'stale_job_nudge', $2, 'insert', $3, NULL, $4)`,
    [
      job.account_id,
      job.id,
      automationId,
      JSON.stringify({
        automation_id: automationId,
        title: job.title,
        status: job.status,
        days_without_visit: job.days_without_visit,
        last_visit_at: job.last_visit_at,
        flagged_at: new Date().toISOString(),
      }),
    ]
  );
  return true;
}

export async function processStaleJobs(client: DatabaseClient, automation: AutomationRow): Promise<RunResult> {
  const result: RunResult = {
    automationId: automation.id,
    accountId: automation.account_id,
    sent: 0,
    skipped: 0,
    errors: 0,
  };

  const jobs = await findStaleJobs(client, automation);
  for (const job of jobs) {
    try {
      const emitted = await emitStaleJobNudge(client, job, automation.id);
      if (emitted) result.sent++;
      else result.skipped++;
    } catch (error) {
      result.errors++;
      logger.error("stale-job-nudge: failed to emit", error, { jobId: job.id });
    }
  }

  return result;
}
