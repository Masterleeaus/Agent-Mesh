import type { DatabaseClient } from "./db-client.js";
import { logger } from "./logger.js";
import { clientReactivationHtml } from "@titan-zero/email-templates";
import type { AutomationRow, RunResult } from "./automations/types.js";
import { enqueueNotification } from "./notification/enqueue.js";
import { PRIORITY } from "./notification/priority.js";

interface InactiveClient {
  id: string;
  account_id: string;
  name: string | null;
  email: string;
  last_job_at: string | null;
}

export async function findDueClientReactivations(client: DatabaseClient): Promise<AutomationRow[]> {
  const { rows } = await client.query<AutomationRow>(
    `SELECT id, account_id, type, config, enabled, next_run_at
     FROM automations
     WHERE type = 'client_reactivation'
       AND enabled = true
       AND next_run_at <= $1`,
    [new Date().toISOString()]
  );
  return rows;
}

export async function findInactiveClients(
  client: DatabaseClient,
  automation: AutomationRow
): Promise<InactiveClient[]> {
  const daysInactive = (automation.config as { days_inactive?: number }).days_inactive ?? 180;
  const cutoff = new Date(Date.now() - daysInactive * 86_400_000).toISOString();
  const { rows } = await client.query<InactiveClient>(
    `SELECT c.id, c.account_id, c.name, c.email, MAX(j.updated_at) AS last_job_at
     FROM clients c
     LEFT JOIN jobs j ON j.client_id = c.id AND j.account_id = c.account_id AND j.status = 'completed'
     WHERE c.account_id = $1 AND c.email IS NOT NULL
     GROUP BY c.id, c.account_id, c.name, c.email
     HAVING MAX(j.updated_at) < $2 OR MAX(j.updated_at) IS NULL
     ORDER BY MAX(j.updated_at) ASC
     LIMIT 50`,
    [automation.account_id, cutoff]
  );
  return rows;
}

function monthsSince(date: string | null): number {
  if (!date) return 12;
  const then = new Date(date);
  if (Number.isNaN(then.getTime())) return 1;
  return Math.max(1, Math.floor((Date.now() - then.getTime()) / (30.4375 * 86_400_000)));
}

async function alreadyReactivatedThisYear(client: DatabaseClient, inactive: InactiveClient, year: number): Promise<boolean> {
  const { rows } = await client.query<{ new_value: string | Record<string, unknown> | null }>(
    `SELECT new_value FROM audit_log WHERE entity_type = 'client_reactivation' AND entity_id = $1 AND account_id = $2`,
    [inactive.id, inactive.account_id]
  );
  return rows.some(({ new_value }) => {
    try {
      const value = typeof new_value === "string" ? JSON.parse(new_value) : new_value;
      return Number((value as Record<string, unknown> | null)?.year) === year;
    } catch { return false; }
  });
}

async function emitClientReactivation(client: DatabaseClient, inactive: InactiveClient, automationId: string): Promise<boolean> {
  const year = new Date().getFullYear();
  if (await alreadyReactivatedThisYear(client, inactive, year)) return false;
  const months = monthsSince(inactive.last_job_at);
  if (inactive.name) {
    const enqueueResult = await enqueueNotification(client, {
      accountId: inactive.account_id,
      clientId: inactive.id,
      automationType: "client_reactivation",
      priority: PRIORITY.LOW,
      toAddress: inactive.email,
      subject: `We'd love to work with you again, ${inactive.name.split(" ")[0]}!`,
      htmlBody: clientReactivationHtml({ clientName: inactive.name, monthsSinceLastService: months }),
      idempotencyKey: `client_reactivation:${inactive.id}:${year}`,
      entityType: "client",
      entityId: inactive.id,
      metadata: { automationId, monthsSinceLastJob: months },
    });
    if (enqueueResult === "suppressed") {
      logger.debug("client-reactivation: suppressed by governor", { clientId: inactive.id });
      return false;
    }
  }
  await client.query(
    `INSERT INTO audit_log (account_id, entity_type, entity_id, action, actor_id, old_value, new_value)
     VALUES ($1, 'client_reactivation', $2, 'insert', $3, NULL, $4)`,
    [inactive.account_id, inactive.id, automationId, JSON.stringify({ automation_id: automationId, client_name: inactive.name, months_since_last_job: months, year, queued_at: new Date().toISOString() })]
  );
  return true;
}

export async function processClientReactivation(client: DatabaseClient, automation: AutomationRow): Promise<RunResult> {
  const result: RunResult = { automationId: automation.id, accountId: automation.account_id, sent: 0, skipped: 0, errors: 0 };
  for (const inactive of await findInactiveClients(client, automation)) {
    try { if (await emitClientReactivation(client, inactive, automation.id)) result.sent++; else result.skipped++; }
    catch (error) { result.errors++; logger.error("client-reactivation: failed to emit", error, { clientId: inactive.id }); }
  }
  return result;
}
