import { databaseDialect, type DatabaseClient } from "../db-client.js";
import { logger } from "../logger.js";
import { AUTOMATION_REGISTRY } from "./registry.js";
import type { AutomationDefinition } from "./registry.js";
import type { RunResult } from "./types.js";

export async function runAutomationType(
  def: AutomationDefinition,
  client: DatabaseClient
): Promise<RunResult[]> {
  const automations = await def.findDue(client);
  const results: RunResult[] = [];

  for (const automation of automations) {
    try {
      const result = await def.process(client, automation);
      await def.advanceNextRun(client, automation, result);
      results.push(result);
      logger.info(`${def.logLabel}: processed`, {
        automationId: automation.id,
        accountId: automation.account_id,
        sent: result.sent,
        skipped: result.skipped,
        errors: result.errors,
      });
    } catch (error) {
      logger.error(`${def.logLabel}: failed to process automation`, error, {
        automationId: automation.id,
      });
    }
  }

  return results;
}

export async function runAllDueAutomations(client: DatabaseClient): Promise<void> {
  for (const def of AUTOMATION_REGISTRY) {
    if (databaseDialect(client) === "mysql" && !def.mysqlCompatible) {
      logger.debug(`${def.logLabel}: skipped until MySQL query slice is converged`);
      continue;
    }
    const results = await runAutomationType(def, client);
    if (results.length > 0) {
      const totalSent = results.reduce((sum, r) => sum + r.sent, 0);
      const totalSkipped = results.reduce((sum, r) => sum + r.skipped, 0);
      const totalErrors = results.reduce((sum, r) => sum + r.errors, 0);
      logger.info(`${def.logLabel} complete`, {
        automations: results.length,
        sent: totalSent,
        skipped: totalSkipped,
        errors: totalErrors,
      });
    }
  }
}