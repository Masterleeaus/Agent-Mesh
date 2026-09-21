/**
 * POST /api/v1/jobs/[id]/visits/bulk
 *
 * Create multiple scheduled visits (multi-day) under one project / work order.
 */
import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  checkSchedulingPreconditions,
  EXECUTION_VISIT_TYPES,
  FIELD_ACTIVE_VISIT_STATUSES,
  VISIT_TYPES,
} from "@ai-fsm/domain";
import type { VisitType } from "@ai-fsm/domain";
import { withRole, type AuthSession } from "@/lib/auth/middleware";
import { withPortableTransaction } from "@/lib/db/portable";
import { appendAuditLog } from "@/lib/db/audit";
import { logger } from "@/lib/logger";
import { syncWorkOrderLeadFromVisit } from "@/lib/work-orders/assign-lead";
import {
  resolveWorkOrderForVisit,
  syncWorkOrderStatus,
} from "@/lib/work-orders/sync-status";
import { setVisitPlannedTasks } from "@/lib/work-orders/job-tasks";
import { getVisitScheduleConflicts } from "@/lib/scheduling/visit-conflicts";

export const dynamic = "force-dynamic";

const daySchema = z
  .object({
    scheduled_start: z.string().datetime(),
    scheduled_end: z.string().datetime(),
  })
  .refine(
    (d) => new Date(d.scheduled_end).getTime() > new Date(d.scheduled_start).getTime(),
    { message: "scheduled_end must be after scheduled_start", path: ["scheduled_end"] },
  );

const bulkBody = z.object({
  assigned_user_id: z.string().uuid().optional(),
  work_order_id: z.string().uuid().optional(),
  visit_type: z.enum([...VISIT_TYPES] as [VisitType, ...VisitType[]]).default("standard"),
  tech_notes: z.string().optional(),
  days: z.array(daySchema).min(1).max(31),
  /** Same planned tasks applied to every day in the batch. */
  task_ids: z.array(z.string().uuid()).max(100).optional(),
});

export const POST = withRole(
  ["owner", "admin"],
  async (request: NextRequest, session: AuthSession) => {
    const jobId = request.url.match(/\/jobs\/([^/]+)\/visits\/bulk/)?.[1];
    if (!jobId) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Job not found", traceId: session.traceId } },
        { status: 404 },
      );
    }

    const body = await request.json().catch(() => null);
    const parsed = bulkBody.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid request body",
            details: parsed.error.flatten().fieldErrors,
            traceId: session.traceId,
          },
        },
        { status: 422 },
      );
    }

    const { assigned_user_id, work_order_id, visit_type, tech_notes, days, task_ids } = parsed.data;
    const sorted = [...days].sort(
      (a, b) => new Date(a.scheduled_start).getTime() - new Date(b.scheduled_start).getTime(),
    );
    for (let i = 1; i < sorted.length; i++) {
      if (new Date(sorted[i].scheduled_start) < new Date(sorted[i - 1].scheduled_end)) {
        return NextResponse.json(
          {
            error: {
              code: "VISIT_OVERLAP",
              message: "Selected days overlap each other. Adjust times or dates.",
              traceId: session.traceId,
            },
          },
          { status: 422 },
        );
      }
    }

    try {
      return await withPortableTransaction(async (client) => {
        const { rows: jobRows } = await client.query<{ status: string }>(
          `SELECT status FROM jobs WHERE id = $1 AND account_id = $2 FOR UPDATE`,
          [jobId, session.accountId],
        );
        const { rows: fieldActiveRows } = await client.query<{ count: string | number }>(
          `SELECT COUNT(*) AS count FROM visits
           WHERE job_id = $1 AND account_id = $2
             AND status IN (${FIELD_ACTIVE_VISIT_STATUSES.map((status) => `'${status}'`).join(", ")})`,
          [jobId, session.accountId],
        );

        let jobOverlapCount = 0;
        for (const day of sorted) {
          const conflicts = await getVisitScheduleConflicts(client, {
            accountId: session.accountId,
            jobId,
            assignedUserId: assigned_user_id ?? null,
            scheduledStart: day.scheduled_start,
            scheduledEnd: day.scheduled_end,
          });
          jobOverlapCount += conflicts.jobOverlapCount;
          if (conflicts.technicianOverlapCount > 0) {
            return NextResponse.json(
              {
                error: {
                  code: "TECHNICIAN_CONFLICT",
                  message: "That technician already has another visit during one or more selected times.",
                  traceId: session.traceId,
                },
              },
              { status: 422 },
            );
          }
        }

        const guard = checkSchedulingPreconditions({
          jobStatus: jobRows[0]?.status ?? null,
          fieldActiveVisitCount: Number(fieldActiveRows[0]?.count ?? 0),
          overlappingVisitCount: jobOverlapCount,
        });
        if (!guard.ok) {
          const message =
            guard.error === "ACTIVE_VISIT_EXISTS"
              ? "A visit is already in progress for this project. Finish or cancel it before scheduling more days."
              : guard.error === "VISIT_OVERLAP"
                ? "One or more days overlap an existing visit. Adjust the schedule."
                : guard.error === "JOB_NOT_SCHEDULABLE"
                  ? "This project is not open for new visits."
                  : guard.error;
          return NextResponse.json(
            { error: { code: guard.error, message, traceId: session.traceId } },
            { status: 422 },
          );
        }

        let resolvedWorkOrderId: string | null = null;
        if ((EXECUTION_VISIT_TYPES as readonly string[]).includes(visit_type)) {
          resolvedWorkOrderId = await resolveWorkOrderForVisit(
            client,
            jobId,
            session.accountId,
            work_order_id,
          );
          if (!resolvedWorkOrderId) {
            return NextResponse.json(
              {
                error: {
                  code: "PRECONDITION_FAILED",
                  message: work_order_id
                    ? "Work order not found or not schedulable for this project"
                    : "Select a work order — this project has multiple active work orders",
                  traceId: session.traceId,
                },
              },
              { status: 422 },
            );
          }
        }

        const created: Array<Record<string, unknown>> = [];
        for (const day of sorted) {
          const visitId = randomUUID();
          await client.query(
            `INSERT INTO visits (
               id, account_id, job_id, work_order_id, assigned_user_id,
               scheduled_start, scheduled_end, tech_notes, visit_type
             ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [
              visitId,
              session.accountId,
              jobId,
              resolvedWorkOrderId,
              assigned_user_id ?? null,
              day.scheduled_start,
              day.scheduled_end,
              tech_notes ?? null,
              visit_type,
            ],
          );
          const inserted = await client.query<Record<string, unknown>>(
            `SELECT * FROM visits WHERE id = $1 AND account_id = $2`,
            [visitId, session.accountId],
          );
          const visit = inserted.rows[0];
          if (!visit) throw new Error(`Visit ${visitId} was inserted but could not be reloaded`);
          created.push(visit);

          if (task_ids && task_ids.length > 0) {
            await setVisitPlannedTasks(client, {
              accountId: session.accountId,
              visitId,
              jobId,
              workOrderId: resolvedWorkOrderId,
              taskIds: task_ids,
            });
          }
          await appendAuditLog(client, {
            account_id: session.accountId,
            entity_type: "visit",
            entity_id: visitId,
            action: "insert",
            actor_id: session.userId,
            trace_id: session.traceId,
            new_value: visit,
          });
        }

        const jobStatus = jobRows[0]?.status;
        if (jobStatus === "draft" || jobStatus === "quoted") {
          await client.query(
            `UPDATE jobs SET status = 'scheduled', updated_at = CURRENT_TIMESTAMP
             WHERE id = $1 AND account_id = $2`,
            [jobId, session.accountId],
          );
          await appendAuditLog(client, {
            account_id: session.accountId,
            entity_type: "job",
            entity_id: jobId,
            action: "update",
            actor_id: session.userId,
            trace_id: session.traceId,
            old_value: { status: jobStatus },
            new_value: { status: "scheduled" },
          });
        }

        if (resolvedWorkOrderId) {
          await syncWorkOrderLeadFromVisit(
            client,
            resolvedWorkOrderId,
            session.accountId,
            assigned_user_id ?? null,
          );
          await syncWorkOrderStatus(client, resolvedWorkOrderId, session.accountId);
        }

        return NextResponse.json(
          { data: { visits: created, count: created.length } },
          { status: 201 },
        );
      });
    } catch (err) {
      logger.error("[visits bulk POST]", err, { traceId: session.traceId });
      return NextResponse.json(
        {
          error: {
            code: "INTERNAL_ERROR",
            message: "Failed to create visits",
            traceId: session.traceId,
          },
        },
        { status: 500 },
      );
    }
  },
);
