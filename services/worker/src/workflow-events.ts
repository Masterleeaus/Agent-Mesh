import { randomUUID } from "node:crypto";
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
  attempts: number;
}

const CANCEL_TRIGGERS = new Set([
  "visit.cancelled",
  "estimate.approved",
  "estimate.declined",
  "invoice.paid",
  "invoice.void",
  "membership.cancelled",
]);

const DEFAULT_BATCH_SIZE = 100;
const DEFAULT_LEASE_SECONDS = 60;
const DEFAULT_MAX_ATTEMPTS = 8;
const MAX_RETRY_SECONDS = 60 * 60;

function retryDelaySeconds(attempt: number): number {
  // 5s, 10s, 20s ... capped at one hour. Jitter belongs at the scheduler/
  // provider layer; keeping this deterministic makes recovery easy to test.
  return Math.min(5 * 2 ** Math.max(0, attempt - 1), MAX_RETRY_SECONDS);
}

async function claimWorkflowEvents(
  client: DatabaseClient,
  batchSize: number,
  leaseSeconds: number,
): Promise<{ leaseId: string; events: WorkflowEvent[] }> {
  const leaseId = randomUUID();

  const { rows } = await client.query<WorkflowEvent>(
    `WITH candidates AS (
       SELECT id
       FROM workflow_events
       WHERE processed = false
         AND status IN ('pending', 'processing')
         AND next_attempt_at <= now()
         AND (locked_until IS NULL OR locked_until < now())
       ORDER BY created_at ASC
       FOR UPDATE SKIP LOCKED
       LIMIT $1
     )
     UPDATE workflow_events e
     SET status = 'processing',
         lease_id = $2::uuid,
         locked_at = now(),
         locked_until = now() + ($3::text || ' seconds')::interval
     FROM candidates c
     WHERE e.id = c.id
     RETURNING e.id, e.account_id, e.event_type, e.entity_type,
               e.entity_id, e.payload, e.attempts`,
    [batchSize, leaseId, leaseSeconds],
  );

  return { leaseId, events: rows };
}

async function markCompleted(client: DatabaseClient, eventId: string, leaseId: string): Promise<void> {
  await client.query(
    `UPDATE workflow_events
     SET processed = true,
         processed_at = now(),
         status = 'completed',
         lease_id = NULL,
         locked_at = NULL,
         locked_until = NULL,
         last_error = NULL
     WHERE id = $1 AND lease_id = $2::uuid`,
    [eventId, leaseId],
  );
}

async function markFailed(
  client: DatabaseClient,
  event: WorkflowEvent,
  leaseId: string,
  error: unknown,
  maxAttempts: number,
): Promise<void> {
  const attempt = event.attempts + 1;
  const message = error instanceof Error ? error.message : String(error);
  const deadLetter = attempt >= maxAttempts;
  const delay = retryDelaySeconds(attempt);

  await client.query(
    `UPDATE workflow_events
     SET attempts = $3,
         status = CASE WHEN $4 THEN 'dead_letter' ELSE 'pending' END,
         next_attempt_at = CASE WHEN $4 THEN next_attempt_at
                                ELSE now() + ($5::text || ' seconds')::interval END,
         lease_id = NULL,
         locked_at = NULL,
         locked_until = NULL,
         last_error = $6,
         dead_lettered_at = CASE WHEN $4 THEN now() ELSE dead_lettered_at END
     WHERE id = $1 AND lease_id = $2::uuid`,
    [event.id, leaseId, attempt, deadLetter, delay, message.slice(0, 4000)],
  );

  logger.error("workflow-events: failed to process event", error, {
    eventId: event.id,
    attempt,
    deadLetter,
    retryInSeconds: deadLetter ? undefined : delay,
  });
}

export async function processWorkflowEvents(
  client: DatabaseClient,
  options: {
    batchSize?: number;
    leaseSeconds?: number;
    maxAttempts?: number;
  } = {},
): Promise<number> {
  const batchSize = options.batchSize ?? DEFAULT_BATCH_SIZE;
  const leaseSeconds = options.leaseSeconds ?? DEFAULT_LEASE_SECONDS;
  const maxAttempts = options.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;
  const { leaseId, events } = await claimWorkflowEvents(client, batchSize, leaseSeconds);

  let processed = 0;
  for (const event of events) {
    try {
      if (CANCEL_TRIGGERS.has(event.event_type)) {
        const cancelled = await cancelNotificationsForEntity(
          client,
          event.entity_type,
          event.entity_id,
          event.event_type,
        );
        if (cancelled > 0) {
          logger.info("workflow-events: cancelled pending notifications", {
            eventType: event.event_type,
            entityId: event.entity_id,
            cancelled,
          });
        }
      }

      await markCompleted(client, event.id, leaseId);
      processed++;
    } catch (error) {
      await markFailed(client, event, leaseId, error, maxAttempts);
    }
  }

  return processed;
}

export const workflowEventOutboxInternals = {
  retryDelaySeconds,
};
