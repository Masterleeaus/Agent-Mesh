import { randomUUID } from "crypto";
import type { DbClient } from "@/lib/db-contract";
import { mirrorTasksToCompletionCriteria } from "./task-time";

export type FieldJobTemplateTask = {
  id: string;
  label: string;
  required: boolean;
  sort_order: number;
};

export type FieldJobTemplate = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  active: boolean;
  tasks: FieldJobTemplateTask[];
};

export async function loadFieldJobTemplates(client: DbClient, accountId: string): Promise<FieldJobTemplate[]> {
  const templates = await client.query<{
    id: string; name: string; description: string | null; category: string | null; active: boolean;
  }>(
    `SELECT id, name, description, category, active
       FROM field_job_templates
      WHERE account_id = $1 AND active = true
      ORDER BY name ASC`,
    [accountId],
  );
  if (templates.rows.length === 0) return [];

  const out: FieldJobTemplate[] = [];
  for (const template of templates.rows) {
    const tasks = await client.query<FieldJobTemplateTask>(
      `SELECT id, label, required, sort_order
         FROM field_job_template_tasks
        WHERE account_id = $1 AND template_id = $2
        ORDER BY sort_order ASC, created_at ASC`,
      [accountId, template.id],
    );
    out.push({ ...template, tasks: tasks.rows });
  }
  return out;
}

export async function createFieldJobTemplate(
  client: DbClient,
  opts: {
    accountId: string;
    name: string;
    description?: string | null;
    category?: string | null;
    tasks: Array<{ label: string; required?: boolean }>;
  },
): Promise<string> {
  const templateId = randomUUID();
  await client.query(
    `INSERT INTO field_job_templates (id, account_id, name, description, category, active)
     VALUES ($1, $2, $3, $4, $5, true)`,
    [templateId, opts.accountId, opts.name.trim(), opts.description ?? null, opts.category ?? null],
  );
  let sort = 0;
  for (const task of opts.tasks) {
    const label = task.label.trim();
    if (!label) continue;
    await client.query(
      `INSERT INTO field_job_template_tasks
         (id, account_id, template_id, label, required, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [randomUUID(), opts.accountId, templateId, label.slice(0, 300), task.required !== false, sort++],
    );
  }
  return templateId;
}

export async function applyFieldJobTemplateToWorkOrder(
  client: DbClient,
  opts: { accountId: string; workOrderId: string; templateId: string; replace?: boolean },
): Promise<number> {
  const wo = await client.query<{ id: string; status: string }>(
    `SELECT id, status FROM work_orders WHERE id = $1 AND account_id = $2 FOR UPDATE`,
    [opts.workOrderId, opts.accountId],
  );
  if (!wo.rows[0]) throw new Error("Work order not found");
  if (wo.rows[0].status === "completed" || wo.rows[0].status === "cancelled") {
    throw new Error("Templates cannot change a completed or cancelled work order");
  }

  const template = await client.query<{ id: string }>(
    `SELECT id FROM field_job_templates WHERE id = $1 AND account_id = $2 AND active = true`,
    [opts.templateId, opts.accountId],
  );
  if (!template.rows[0]) throw new Error("Field job template not found");

  const tasks = await client.query<{ label: string; required: boolean; sort_order: number }>(
    `SELECT label, required, sort_order
       FROM field_job_template_tasks
      WHERE template_id = $1 AND account_id = $2
      ORDER BY sort_order ASC, created_at ASC`,
    [opts.templateId, opts.accountId],
  );

  if (opts.replace) {
    const timed = await client.query<{ task_id: string }>(
      `SELECT DISTINCT ae.task_id
         FROM activity_entries ae
         JOIN work_order_tasks t ON t.id = ae.task_id AND t.account_id = ae.account_id
        WHERE t.work_order_id = $1 AND ae.account_id = $2 AND ae.task_id IS NOT NULL`,
      [opts.workOrderId, opts.accountId],
    );
    const protectedIds = new Set(timed.rows.map((row) => row.task_id));
    const existing = await client.query<{ id: string }>(
      `SELECT id FROM work_order_tasks WHERE work_order_id = $1 AND account_id = $2`,
      [opts.workOrderId, opts.accountId],
    );
    for (const row of existing.rows) {
      if (protectedIds.has(row.id)) continue;
      await client.query(`DELETE FROM work_order_tasks WHERE id = $1 AND account_id = $2`, [row.id, opts.accountId]);
    }
  }

  const existingLabels = await client.query<{ label: string }>(
    `SELECT label FROM work_order_tasks WHERE work_order_id = $1 AND account_id = $2`,
    [opts.workOrderId, opts.accountId],
  );
  const seen = new Set(existingLabels.rows.map((r) => r.label.trim().toLowerCase()));
  let inserted = 0;
  for (const task of tasks.rows) {
    const key = task.label.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    await client.query(
      `INSERT INTO work_order_tasks
         (id, account_id, work_order_id, label, required, completed, status, sort_order, source)
       VALUES ($1, $2, $3, $4, $5, false, 'open', $6, 'manual')`,
      [randomUUID(), opts.accountId, opts.workOrderId, task.label, task.required, task.sort_order],
    );
    seen.add(key);
    inserted++;
  }
  await mirrorTasksToCompletionCriteria(client, opts.workOrderId, opts.accountId);
  return inserted;
}
