import type { DatabaseClient } from "../db-client.js";
import { logger } from "../logger.js";
import {
  getCurrentSeason,
  isInSeason,
  nextSeasonStartDate,
} from "../seasonal-reminder.js";
import type { AutomationRow, RunResult } from "./types.js";

async function advanceAfter(
  client: DatabaseClient,
  automation: AutomationRow,
  delayMs: number,
): Promise<void> {
  const now = new Date();
  const next = new Date(now.getTime() + delayMs);
  await client.query(
    `UPDATE automations
        SET last_run_at = $1,
            next_run_at = $2,
            updated_at = $1
      WHERE id = $3`,
    [now.toISOString(), next.toISOString(), automation.id],
  );
}

export async function advanceVisitReminderNextRun(client: DatabaseClient, automation: AutomationRow, _result: RunResult): Promise<void> {
  await advanceAfter(client, automation, 60 * 60_000);
}
export async function advanceInvoiceFollowupNextRun(client: DatabaseClient, automation: AutomationRow, _result: RunResult): Promise<void> {
  await advanceAfter(client, automation, 60 * 60_000);
}
export async function advanceLeadFollowupNextRun(client: DatabaseClient, automation: AutomationRow, _result: RunResult): Promise<void> {
  await advanceAfter(client, automation, 60 * 60_000);
}
export async function advanceReviewRequestNextRun(client: DatabaseClient, automation: AutomationRow, _result: RunResult): Promise<void> {
  await advanceAfter(client, automation, 60 * 60_000);
}
export async function advanceBookingConfirmedNextRun(client: DatabaseClient, automation: AutomationRow, _result: RunResult): Promise<void> {
  await advanceAfter(client, automation, 30 * 60_000);
}
export async function advanceEstimateFollowupNextRun(client: DatabaseClient, automation: AutomationRow, _result: RunResult): Promise<void> {
  await advanceAfter(client, automation, 4 * 60 * 60_000);
}
export async function advanceStaleJobNudgeNextRun(client: DatabaseClient, automation: AutomationRow, _result: RunResult): Promise<void> {
  await advanceAfter(client, automation, 6 * 60 * 60_000);
}
export async function advancePropertyIssueScanNextRun(client: DatabaseClient, automation: AutomationRow, _result: RunResult): Promise<void> {
  await advanceAfter(client, automation, 24 * 60 * 60_000);
}
export async function advanceDatabaseClientReactivationNextRun(client: DatabaseClient, automation: AutomationRow, _result: RunResult): Promise<void> {
  await advanceAfter(client, automation, 24 * 60 * 60_000);
}
export async function advanceRecurringInspectionNextRun(client: DatabaseClient, automation: AutomationRow, _result: RunResult): Promise<void> {
  await advanceAfter(client, automation, 24 * 60 * 60_000);
}

export async function advanceSeasonalNextRun(
  client: DatabaseClient,
  automation: AutomationRow,
  _result: RunResult,
): Promise<void> {
  const season = getCurrentSeason(automation.type);
  const now = new Date();

  if (!isInSeason(season)) {
    const nextStart = nextSeasonStartDate(season);
    await client.query(
      `UPDATE automations
          SET last_run_at = $1, next_run_at = $2, updated_at = $1
        WHERE id = $3`,
      [now.toISOString(), nextStart.toISOString(), automation.id],
    );
    logger.info("seasonal-reminder: out of season, advancing next_run_at", {
      automationId: automation.id,
      season,
      nextStart,
    });
    return;
  }

  await advanceAfter(client, automation, 7 * 24 * 60 * 60_000);
}

// Backwards-compatible export retained for existing tests/callers.
export const advanceClientReactivationNextRun = advanceDatabaseClientReactivationNextRun;
