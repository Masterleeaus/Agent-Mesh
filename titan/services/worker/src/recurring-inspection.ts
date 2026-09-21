import type { DatabaseClient } from "./db-client.js";
import { logger } from "./logger.js";
import { recurringInspectionHtml } from "@ai-fsm/email-templates";
import type { AutomationRow, RunResult } from "./automations/types.js";
import { enqueueNotification } from "./notification/enqueue.js";
import { PRIORITY } from "./notification/priority.js";
import { generateDueRecurringWork } from "./recurring-work.js";

interface InspectionDuePlan {
  id: string;
  account_id: string;
  client_id: string;
  name: string;
  client_name: string | null;
  client_email: string | null;
  property_address: string | null;
  last_completed_at: string | Date | null;
  created_at: string | Date;
}

function cutoffIso(days: number, now: Date = new Date()): string {
  return new Date(now.getTime() - days * 86_400_000).toISOString();
}

function daysSince(value: string | Date | null, fallback: string | Date, now: Date = new Date()): number {
  const raw = value ?? fallback;
  const date = raw instanceof Date ? raw : new Date(raw);
  return Math.max(0, Math.floor((now.getTime() - date.getTime()) / 86_400_000));
}

export async function findDueRecurringInspections(client: DatabaseClient): Promise<AutomationRow[]> {
  const { rows } = await client.query<AutomationRow>(
    `SELECT id, account_id, type, config, enabled, next_run_at
     FROM automations
     WHERE type = 'recurring_inspection'
       AND enabled = true
       AND next_run_at <= CURRENT_TIMESTAMP`
  );
  return rows;
}

export async function findPlansNeedingInspection(
  client: DatabaseClient,
  automation: AutomationRow
): Promise<Array<InspectionDuePlan & { days_since_last_inspection: number }>> {
  const inspectionIntervalDays = Number((automation.config as { interval_days?: number }).interval_days ?? 365);
  const cutoff = cutoffIso(inspectionIntervalDays);

  const { rows } = await client.query<InspectionDuePlan>(
    `SELECT
       mp.id, mp.account_id, c.id AS client_id, mp.name,
       c.name AS client_name, c.email AS client_email,
       p.address AS property_address,
       mp.created_at,
       (SELECT MAX(v.completed_at)
          FROM visits v
          JOIN jobs j ON j.id = v.job_id
         WHERE j.client_id = c.id
           AND j.account_id = mp.account_id
           AND v.status = 'completed'
           AND v.generated_from_plan_id = mp.id) AS last_completed_at
     FROM maintenance_plans mp
     JOIN clients c ON c.id = mp.client_id AND c.account_id = mp.account_id
     LEFT JOIN properties p ON p.id = mp.property_id AND p.account_id = mp.account_id
     WHERE mp.account_id = $1
       AND mp.status = 'active'
       AND c.email IS NOT NULL
       AND NOT EXISTS (
         SELECT 1 FROM audit_log al
         WHERE al.entity_type = 'recurring_inspection'
           AND al.entity_id = mp.id
           AND al.account_id = mp.account_id
           AND al.created_at > $2
       )
     ORDER BY mp.created_at ASC
     LIMIT 100`,
    [automation.account_id, cutoff]
  );

  return rows
    .map((row) => ({ ...row, days_since_last_inspection: daysSince(row.last_completed_at, row.created_at) }))
    .filter((row) => row.days_since_last_inspection >= inspectionIntervalDays)
    .sort((a, b) => b.days_since_last_inspection - a.days_since_last_inspection)
    .slice(0, 50);
}

async function emitRecurringInspection(
  client: DatabaseClient,
  plan: InspectionDuePlan & { days_since_last_inspection: number },
  automationId: string,
  intervalDays: number
): Promise<boolean> {
  const { rows } = await client.query<{ count: number | string }>(
    `SELECT COUNT(*) AS count FROM audit_log
     WHERE entity_type = 'recurring_inspection'
       AND entity_id = $1
       AND account_id = $2
       AND created_at > $3`,
    [plan.id, plan.account_id, cutoffIso(intervalDays)]
  );
  if (Number(rows[0]?.count ?? 0) > 0) return false;

  if (plan.client_name && plan.client_email) {
    const enqueueResult = await enqueueNotification(client, {
      accountId: plan.account_id,
      clientId: plan.client_id,
      automationType: "recurring_inspection",
      priority: PRIORITY.MEDIUM,
      toAddress: plan.client_email,
      subject: `Time for your annual inspection — ${plan.name}`,
      htmlBody: recurringInspectionHtml({
        clientName: plan.client_name,
        planName: plan.name,
        propertyAddress: plan.property_address,
      }),
      idempotencyKey: `recurring_inspection:${plan.id}:${new Date().getFullYear()}`,
      entityType: "maintenance_plan",
      entityId: plan.id,
      cancelOnEvents: ["membership.cancelled"],
      metadata: { automationId, daysSinceLastInspection: plan.days_since_last_inspection },
    });
    if (enqueueResult === "suppressed") {
      logger.debug("recurring-inspection: suppressed by governor", { planId: plan.id });
      return false;
    }
  }

  await client.query(
    `INSERT INTO audit_log
       (account_id, entity_type, entity_id, action, actor_id, old_value, new_value)
     VALUES ($1, 'recurring_inspection', $2, 'insert', $3, NULL, $4)`,
    [
      plan.account_id,
      plan.id,
      automationId,
      JSON.stringify({
        automation_id: automationId,
        plan_name: plan.name,
        client_name: plan.client_name,
        days_since_last_inspection: plan.days_since_last_inspection,
        queued_at: new Date().toISOString(),
      }),
    ]
  );
  return true;
}

export async function processRecurringInspections(
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

  const generation = await generateDueRecurringWork(client, automation.account_id);
  if (generation.generated > 0 || generation.errors > 0) {
    logger.info("recurring-work: generation complete", {
      accountId: automation.account_id,
      ...generation,
    });
  }
  result.skipped += generation.skipped;
  result.errors += generation.errors;

  const intervalDays = Number((automation.config as { interval_days?: number }).interval_days ?? 365);
  const plans = await findPlansNeedingInspection(client, automation);

  for (const plan of plans) {
    try {
      const emitted = await emitRecurringInspection(client, plan, automation.id, intervalDays);
      if (emitted) result.sent++;
      else result.skipped++;
    } catch (error) {
      result.errors++;
      logger.error("recurring-inspection: failed to emit", error, { planId: plan.id });
    }
  }

  return result;
}
