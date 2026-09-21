import { randomUUID } from "node:crypto";
import type { DatabaseClient } from "./db-client.js";
import {
  isMaintenanceFrequency,
  nextRecurrenceAfter,
  scheduledWindowForDate,
  utcDateOnly,
} from "./recurrence-rules.js";

interface DuePlanRow {
  id: string;
  account_id: string;
  client_id: string;
  property_id: string | null;
  name: string;
  frequency: string;
  services: unknown;
  notes: string | null;
  next_scheduled_date: string | Date;
  created_by: string | null;
  annual_visit_count: number | string | null;
  included_labor_minutes_per_visit: number | string | null;
}

export interface RecurringWorkResult {
  generated: number;
  skipped: number;
  errors: number;
}

function dateOnly(value: string | Date): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

function serviceSummary(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value !== "string" || value.trim() === "") return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
  } catch {
    // PostgreSQL text[] can arrive as a brace-delimited string in lightweight clients.
  }
  return value.replace(/^\{|\}$/g, "").split(",").map((v) => v.trim()).filter(Boolean);
}

async function resolveActorId(client: DatabaseClient, plan: DuePlanRow): Promise<string | null> {
  if (plan.created_by) return plan.created_by;
  const { rows } = await client.query<{ id: string }>(
    `SELECT id FROM users
     WHERE account_id = $1 AND role IN ('owner','admin')
     ORDER BY CASE WHEN role = 'owner' THEN 0 ELSE 1 END, created_at ASC
     LIMIT 1`,
    [plan.account_id],
  );
  return rows[0]?.id ?? null;
}

async function occurrenceAlreadyExists(
  client: DatabaseClient,
  plan: DuePlanRow,
  scheduledDate: string,
): Promise<boolean> {
  const { rows } = await client.query<{ count: number | string }>(
    `SELECT COUNT(*) AS count
     FROM visits
     WHERE account_id = $1
       AND generated_from_plan_id = $2
       AND DATE(scheduled_start) = $3
       AND status <> 'cancelled'`,
    [plan.account_id, plan.id, scheduledDate],
  );
  return Number(rows[0]?.count ?? 0) > 0;
}

async function generatePlanOccurrence(
  client: DatabaseClient,
  plan: DuePlanRow,
  today: string,
): Promise<"generated" | "skipped"> {
  if (!isMaintenanceFrequency(plan.frequency)) return "skipped";

  const actorId = await resolveActorId(client, plan);
  if (!actorId) throw new Error(`No owner/admin actor available for maintenance plan ${plan.id}`);

  const dueDate = dateOnly(plan.next_scheduled_date);
  const scheduledDate = dueDate < today ? today : dueDate;
  const nextScheduledDate = nextRecurrenceAfter(dueDate, plan.frequency, today);

  if (await occurrenceAlreadyExists(client, plan, scheduledDate)) {
    await client.query(
      `UPDATE maintenance_plans
       SET next_scheduled_date = $1, last_status = 'already_generated', updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND account_id = $3`,
      [nextScheduledDate, plan.id, plan.account_id],
    );
    return "skipped";
  }

  const jobId = randomUUID();
  const workOrderId = randomUUID();
  const visitId = randomUUID();
  const { start, end } = scheduledWindowForDate(scheduledDate);
  const services = serviceSummary(plan.services);
  const scope = [
    plan.notes?.trim() || null,
    services.length > 0 ? `Plan services: ${services.join(", ")}` : null,
  ].filter(Boolean).join("\n");
  const title = `Recurring — ${plan.name}`;

  await client.query("BEGIN");
  try {
    await client.query(
      `INSERT INTO jobs
         (id, account_id, client_id, property_id, title, description, status, job_type, priority, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, 'scheduled', 'maintenance', 0, $7)`,
      [jobId, plan.account_id, plan.client_id, plan.property_id, title, scope || null, actorId],
    );

    await client.query(
      `INSERT INTO work_orders
         (id, account_id, client_id, job_id, property_id, title, scope, status, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'scheduled', $8)`,
      [workOrderId, plan.account_id, plan.client_id, jobId, plan.property_id, title, scope || null, actorId],
    );

    await client.query(
      `INSERT INTO visits
         (id, account_id, job_id, work_order_id, scheduled_start, scheduled_end, visit_type,
          generated_from_plan_id, included_labor_cap_minutes, membership_visit_phase)
       VALUES ($1, $2, $3, $4, $5, $6, 'standard', $7, $8, 'health_check')`,
      [
        visitId,
        plan.account_id,
        jobId,
        workOrderId,
        start,
        end,
        plan.id,
        Number(plan.included_labor_minutes_per_visit ?? 0),
      ],
    );

    await client.query(
      `UPDATE maintenance_plans
       SET next_scheduled_date = $1,
           last_generated_at = CURRENT_TIMESTAMP,
           last_status = 'generated',
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND account_id = $3`,
      [nextScheduledDate, plan.id, plan.account_id],
    );

    await client.query(
      `INSERT INTO audit_log
         (account_id, entity_type, entity_id, action, actor_id, old_value, new_value)
       VALUES ($1, 'maintenance_plan', $2, 'update', $3, NULL, $4)`,
      [
        plan.account_id,
        plan.id,
        actorId,
        JSON.stringify({
          event: "recurring_work_generated",
          occurrence_date: scheduledDate,
          next_scheduled_date: nextScheduledDate,
          job_id: jobId,
          work_order_id: workOrderId,
          visit_id: visitId,
        }),
      ],
    );

    await client.query("COMMIT");
    return "generated";
  } catch (error) {
    try { await client.query("ROLLBACK"); } catch { /* preserve original failure */ }
    throw error;
  }
}

export async function generateDueRecurringWork(
  client: DatabaseClient,
  accountId: string,
  now: Date = new Date(),
): Promise<RecurringWorkResult> {
  const today = utcDateOnly(now);
  const { rows } = await client.query<DuePlanRow>(
    `SELECT id, account_id, client_id, property_id, name, frequency, services, notes,
            next_scheduled_date, created_by, annual_visit_count, included_labor_minutes_per_visit
     FROM maintenance_plans
     WHERE account_id = $1
       AND status = 'active'
       AND next_scheduled_date IS NOT NULL
       AND next_scheduled_date <= $2
     ORDER BY next_scheduled_date ASC, created_at ASC
     LIMIT 100`,
    [accountId, today],
  );

  const result: RecurringWorkResult = { generated: 0, skipped: 0, errors: 0 };
  for (const plan of rows) {
    try {
      const outcome = await generatePlanOccurrence(client, plan, today);
      result[outcome] += 1;
    } catch {
      result.errors += 1;
    }
  }
  return result;
}
