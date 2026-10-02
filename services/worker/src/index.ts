import { runAllDueAutomations } from "./automations/runner.js";
import { expireEstimates } from "./expire-estimates.js";
import { closeStaleBookingRequests } from "./stale-booking-requests.js";
import { pruneLocationEvents } from "./prune-location-events.js";
import { pruneAttentionEvents } from "./prune-attention-events.js";
import { processWorkflowEvents } from "./workflow-events.js";
import { dispatchNotificationQueue } from "./notification/dispatch.js";
import { runVehicleMaintenanceReminders } from "./vehicle-maintenance-reminder.js";
import { processCaptures } from "./process-captures.js";
import { createWorkerDatabaseClient, type WorkerDatabaseClient } from "./db-runtime.js";
import { logger } from "./logger.js";
import { singleFlight } from "./single-flight.js";

const pollMs = Number(process.env.WORKER_POLL_MS ?? "30000");
const databaseUrl = process.env.DATABASE_URL;

async function runPollIteration(client: WorkerDatabaseClient): Promise<void> {
  try {
    const countSql = client.dialect === "postgres"
      ? `select count(*)::int as due_count from automations where enabled = true and next_run_at <= now()`
      : client.dialect === "mysql"
        ? `select count(*) as due_count from automations where enabled = true and next_run_at <= current_timestamp`
        : `select count(*) as due_count from automations where enabled = 1 and next_run_at <= datetime('now')`;
    const { rows } = await client.query<{due_count:number|string}>(countSql);
    const dueCount = Number(rows[0]?.due_count ?? 0);
    logger.info("automation poll", { due: dueCount, dialect: client.dialect });
    if (dueCount > 0) await runAllDueAutomations(client);

    const processedEvents = await processWorkflowEvents(client);
    if (processedEvents > 0) logger.info("workflow-events processed", { count: processedEvents });

    const dispatchResult = await dispatchNotificationQueue(client);
    const dispatchTotal = dispatchResult.sent + dispatchResult.failed + dispatchResult.retried + dispatchResult.delayed + dispatchResult.cancelled;
    if (dispatchTotal > 0) logger.info("notification-queue dispatched", { ...dispatchResult });

    const expireResult = await expireEstimates(client);
    if (expireResult.expired > 0) logger.info("expire-estimates complete", { expired: expireResult.expired });

    const staleBrResult = await closeStaleBookingRequests(client);
    if (staleBrResult.closed > 0) logger.info("stale-booking-requests complete", { closed: staleBrResult.closed });

    const pruneResult = await pruneLocationEvents(client);
    if (pruneResult.deleted > 0) logger.info("prune-location-events complete", { deleted: pruneResult.deleted });

    const attentionPrune = await pruneAttentionEvents(client);
    if (attentionPrune.deleted > 0) logger.info("prune-attention-events complete", { deleted: attentionPrune.deleted });

    await runVehicleMaintenanceReminders(client);
    const captureResult = await processCaptures(client);
    if (captureResult.processed > 0 || captureResult.errors > 0) logger.info("process-captures complete", { ...captureResult });
  } catch (error) {
    logger.error("worker poll failed", error);
    throw error;
  }
}

async function run() {
  let client = await createWorkerDatabaseClient(databaseUrl);
  logger.info("worker started", { pollMs, dialect: client.dialect });

  // Every operation shares this connection, so guard the entire poll and reconnect.
  const tick = singleFlight(async () => {
    try {
      await runPollIteration(client);
    } catch (err) {
      logger.error("worker tick failed", err);
      if (client.dialect !== "sqlite") {
        try { await client.close(); } catch { /* ignore */ }
        client = await createWorkerDatabaseClient(databaseUrl);
        logger.info("worker db reconnected", { dialect: client.dialect });
      }
    }
  });

  await tick();
  setInterval(() => { void tick().catch(error => logger.error("worker tick failed", error)); }, pollMs);
}

run().catch((error) => {
  logger.error("worker boot failed", error);
  process.exit(1);
});

export { runPollIteration };
