import type { WorkerDatabaseClient } from "./db-runtime.js";
import { createWorkerDatabaseClient, normalizeWorkerDialect } from "./db-runtime.js";
import { runAllDueAutomations } from "./automations/runner.js";
import { expireEstimates } from "./expire-estimates.js";
import { closeStaleBookingRequests } from "./stale-booking-requests.js";
import { pruneLocationEvents } from "./prune-location-events.js";
import { pruneAttentionEvents } from "./prune-attention-events.js";
import { processWorkflowEvents } from "./workflow-events.js";
import { dispatchNotificationQueue } from "./notification/dispatch.js";
import { runVehicleMaintenanceReminders } from "./vehicle-maintenance-reminder.js";
import { processCaptures } from "./process-captures.js";
import { logger } from "./logger.js";

const pollMs = Number(process.env.WORKER_POLL_MS ?? "30000");
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required");

async function runPollIteration(client: WorkerDatabaseClient): Promise<void> {
  try {
    const dueResult = await client.query<{ due_count: number | string }>(
      `SELECT COUNT(*) AS due_count FROM automations WHERE enabled = true AND next_run_at <= CURRENT_TIMESTAMP`,
    );
    const dueCount = Number(dueResult.rows[0]?.due_count ?? 0);
    logger.info("automation poll", { due: dueCount, dialect: client.dialect });

    if (dueCount > 0) await runAllDueAutomations(client);

    const dispatchResult = await dispatchNotificationQueue(client);
    const dispatchTotal = dispatchResult.sent + dispatchResult.failed + dispatchResult.retried + dispatchResult.delayed + dispatchResult.cancelled;
    if (dispatchTotal > 0) logger.info("notification-queue dispatched", { ...dispatchResult });

    // These existing worker slices still contain PostgreSQL-only SQL. They stay
    // enabled on PostgreSQL and are explicitly deferred on MySQL rather than
    // crashing the whole worker. Later convergence passes will unlock them.
    if (client.dialect === "postgres") {
      const processedEvents = await processWorkflowEvents(client);
      if (processedEvents > 0) logger.info("workflow-events processed", { count: processedEvents });

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
    }
  } catch (error) {
    logger.error("worker poll failed", error);
    const msg = (error as Error)?.message ?? "";
    if (msg.includes("connection") || msg.includes("not queryable") || msg.includes("terminated")) throw error;
  }
}

async function run() {
  let client = await createWorkerDatabaseClient(databaseUrl);
  logger.info("worker started", { pollMs, dialect: client.dialect });

  async function tick() {
    try {
      await runPollIteration(client);
    } catch (err) {
      logger.error("worker tick failed", err);
      const msg = (err as Error)?.message ?? "";
      const code = (err as NodeJS.ErrnoException).code ?? "";
      if (code === "ECONNRESET" || code === "ECONNREFUSED" || code === "EPIPE" || msg.toLowerCase().includes("connection")) {
        try { await client.close(); } catch { /* ignore */ }
        client = await createWorkerDatabaseClient(databaseUrl);
        logger.info("worker db reconnected", { dialect: client.dialect });
      }
    }
  }

  await tick();
  setInterval(() => { void tick(); }, pollMs);
}

// Validate the configured dialect before asynchronous boot for a clearer error.
normalizeWorkerDialect(process.env.DATABASE_DIALECT);
run().catch((error) => {
  logger.error("worker boot failed", error);
  process.exit(1);
});

export { runPollIteration };
