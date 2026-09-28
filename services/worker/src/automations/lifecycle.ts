import type { DatabaseClient } from "../db-client.js";
import { databaseDialect } from "../db-client.js";
import { logger } from "../logger.js";
import { getCurrentSeason, isInSeason, nextSeasonStartDate } from "../seasonal-reminder.js";
import type { AutomationRow, RunResult } from "./types.js";

async function advanceBy(client: DatabaseClient, automationId: string, amount: number, unit: "minutes" | "hours" | "days"): Promise<void> {
  const dialect = databaseDialect(client);
  if (dialect === "postgres") {
    await client.query(`UPDATE automations SET last_run_at = now(), next_run_at = now() + interval '${amount} ${unit}', updated_at = now() WHERE id = $1`, [automationId]);
    return;
  }
  if (dialect === "mysql") {
    const mysqlUnit = unit === "minutes" ? "MINUTE" : unit === "hours" ? "HOUR" : "DAY";
    await client.query(`UPDATE automations SET last_run_at=CURRENT_TIMESTAMP, next_run_at=DATE_ADD(CURRENT_TIMESTAMP, INTERVAL ${amount} ${mysqlUnit}), updated_at=CURRENT_TIMESTAMP WHERE id=$1`, [automationId]);
    return;
  }
  await client.query(`UPDATE automations SET last_run_at=datetime('now'), next_run_at=datetime('now', $1), updated_at=datetime('now') WHERE id=$2`, [`+${amount} ${unit}`, automationId]);
}

export const advanceVisitReminderNextRun = (c: DatabaseClient, a: AutomationRow, _r: RunResult) => advanceBy(c, a.id, 1, "hours");
export const advanceInvoiceFollowupNextRun = (c: DatabaseClient, a: AutomationRow, _r: RunResult) => advanceBy(c, a.id, 1, "hours");
export const advanceLeadFollowupNextRun = (c: DatabaseClient, a: AutomationRow, _r: RunResult) => advanceBy(c, a.id, 1, "hours");
export const advanceReviewRequestNextRun = (c: DatabaseClient, a: AutomationRow, _r: RunResult) => advanceBy(c, a.id, 1, "hours");
export const advanceBookingConfirmedNextRun = (c: DatabaseClient, a: AutomationRow, _r: RunResult) => advanceBy(c, a.id, 30, "minutes");
export const advanceEstimateFollowupNextRun = (c: DatabaseClient, a: AutomationRow, _r: RunResult) => advanceBy(c, a.id, 4, "hours");
export const advanceStaleJobNudgeNextRun = (c: DatabaseClient, a: AutomationRow, _r: RunResult) => advanceBy(c, a.id, 6, "hours");
export const advancePropertyIssueScanNextRun = (c: DatabaseClient, a: AutomationRow, _r: RunResult) => advanceBy(c, a.id, 24, "hours");
export const advanceClientReactivationNextRun = (c: DatabaseClient, a: AutomationRow, _r: RunResult) => advanceBy(c, a.id, 24, "hours");
export const advanceRecurringInspectionNextRun = (c: DatabaseClient, a: AutomationRow, _r: RunResult) => advanceBy(c, a.id, 24, "hours");

export async function advanceSeasonalNextRun(client: DatabaseClient, automation: AutomationRow, _result: RunResult): Promise<void> {
  const season = getCurrentSeason(automation.type);
  if (!isInSeason(season)) {
    const nextStart = nextSeasonStartDate(season).toISOString();
    const dialect = databaseDialect(client);
    const now = dialect === "postgres" ? "now()" : dialect === "mysql" ? "CURRENT_TIMESTAMP" : "datetime('now')";
    await client.query(`UPDATE automations SET last_run_at = ${now}, next_run_at = $1, updated_at = ${now} WHERE id = $2`, [nextStart, automation.id]);
    logger.info("seasonal-reminder: out of season, advancing next_run_at", { automationId: automation.id, season, nextStart });
    return;
  }
  await advanceBy(client, automation.id, 7, "days");
}
