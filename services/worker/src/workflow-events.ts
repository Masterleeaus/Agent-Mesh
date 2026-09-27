import type { DatabaseClient } from "./db-client.js";
import { logger } from "./logger.js";
import { cancelNotificationsForEntity } from "./notification/enqueue.js";

interface WorkflowEvent {
  id: string;
  account_id: string;
  event_type: string;
  entity_type: string;
  entity_id: string;
  payload: Record<string, unknown>;
}

const CANCEL_TRIGGERS = new Set([
  "visit.cancelled",
  "estimate.approved",
  "estimate.declined",
  "invoice.paid",
  "invoice.void",
  "membership.cancelled",
]);

export interface WorkflowEventProcessOptions { batchSize?: number; }

function retryDelaySeconds(attempt: number): number {
  return Math.min(3600, 5 * 2 ** Math.max(0, attempt - 1));
}

export const workflowEventOutboxInternals = { retryDelaySeconds };

export async function processWorkflowEvents(
  client: DatabaseClient,
  options: WorkflowEventProcessOptions = {},
): Promise<number> {
  const batchSize = Math.max(1, Math.min(100, options.batchSize ?? 100));
  const lockClause = client.dialect === "sqlite" || client.dialect === "mysql" ? "" : "FOR UPDATE SKIP LOCKED";
  const { rows } = await client.query<WorkflowEvent>(
    `SELECT id, account_id, event_type, entity_type, entity_id, payload
     FROM workflow_events
     WHERE processed = false
     ORDER BY created_at ASC
     LIMIT $1
     ${lockClause}`,
    [batchSize],
  );
  if (rows.length === 0) return 0;
  let processed = 0;
  for (const event of rows) {
    try {
      if (CANCEL_TRIGGERS.has(event.event_type)) {
        const cancelled = await cancelNotificationsForEntity(client, event.entity_type, event.entity_id, event.event_type);
        if (cancelled > 0) logger.info("workflow-events: cancelled pending notifications", { eventType: event.event_type, entityId: event.entity_id, cancelled });
      }
      await client.query(
        `UPDATE workflow_events SET processed = true, processed_at = CURRENT_TIMESTAMP, status = 'completed' WHERE id = $1`,
        [event.id],
      );
      processed++;
    } catch (err) {
      logger.error("workflow-events: failed to process event", err, { eventId: event.id });
    }
  }
  return processed;
}
