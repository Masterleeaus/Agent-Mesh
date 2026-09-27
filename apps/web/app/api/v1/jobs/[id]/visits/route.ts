import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  checkSchedulingPreconditions,
  EXECUTION_VISIT_TYPES,
  FIELD_ACTIVE_VISIT_STATUSES,
  VISIT_TYPES,
} from "@ai-fsm/domain";
import type { VisitType } from "@ai-fsm/domain";
import { syncWorkOrderLeadFromVisit } from "../../../../../../lib/work-orders/assign-lead";
import {
  resolveWorkOrderForVisit,
  syncWorkOrderStatus,
} from "../../../../../../lib/work-orders/sync-status";
import { withAuth, withRole } from "../../../../../../lib/auth/middleware";
import type { AuthSession } from "../../../../../../lib/auth/middleware";
import { portableQuery, withPortableTransaction } from "../../../../../../lib/db/portable";
import { randomUUID } from "crypto";
import { appendAuditLog } from "../../../../../../lib/db/audit";
import { logger } from "../../../../../../lib/logger";
import { advanceBookingRequestStage } from "../../../../../../lib/booking-requests/advance-stage";
import { setVisitPlannedTasks } from "../../../../../../lib/work-orders/job-tasks";
import { getVisitScheduleConflicts } from "../../../../../../lib/scheduling/visit-conflicts";

export const dynamic = "force-dynamic";

const createVisitBody = z.object({
  assigned_user_id: z.string().uuid().optional(),
  scheduled_start: z.string().datetime(),
  scheduled_end: z.string().datetime(),
  tech_notes: z.string().optional(),
  booking_request_id: z.string().uuid().optional(),
  work_order_id: z.string().uuid().optional(),
  visit_type: z.enum([...VISIT_TYPES] as [VisitType, ...VisitType[]]).default("standard"),
  /** Tasks planned for this field day (work_order_tasks ids). */
  task_ids: z.array(z.string().uuid()).max(100).optional(),
});

export const GET = withAuth(
  async (request: NextRequest, session: AuthSession) => {
    // Extract [id] from URL — HOF wrappers don't forward route params
    const jobId = request.url.match(/\/jobs\/([^/]+)\/visits/)?.[1];

    if (!jobId) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Job not found", traceId: session.traceId } },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 200);
    const offset = parseInt(searchParams.get("offset") ?? "0");

    // RLS automatically scopes tech to assigned visits — no extra filter needed
    const visits = await portableQuery(
      `SELECT * FROM visits WHERE job_id = $1 AND account_id = $2 ORDER BY scheduled_start ASC LIMIT $3 OFFSET $4`,
      [jobId, session.accountId, limit, offset]
    );

    return NextResponse.json({ data: visits, limit, offset });
  }
);

export const POST = withRole(
  ["owner", "admin"],
  async (request: NextRequest, session: AuthSession) => {
    const jobId = request.url.match(/\/jobs\/([^/]+)\/visits/)?.[1];

    if (!jobId) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Job not found", traceId: session.traceId } },
        { status: 404 }
      );
    }

    const body = await request.json().catch(() => null);
    const parsed = createVisitBody.safeParse(body);

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
        { status: 422 }
      );
    }

    const {
      assigned_user_id,
      scheduled_start,
      scheduled_end,
      tech_notes,
      booking_request_id,
      work_order_id,
      visit_type,
      task_ids,
    } = parsed.data;

    if (new Date(scheduled_end).getTime() <= new Date(scheduled_start).getTime()) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "scheduled_end must be after scheduled_start", traceId: session.traceId } },
        { status: 422 },
      );
    }

    try {
      return await withPortableTransaction(async (client) => {

      const { rows: jobRows } = await client.query<{ status: string }>(
        `SELECT status FROM jobs WHERE id = $1 AND account_id = $2 FOR UPDATE`,
        [jobId, session.accountId]
      );
      // Only field-active visits block booking — future `scheduled` days must coexist (multi-day).
      const { rows: fieldActiveRows } = await client.query<{ count: string }>(
        `SELECT COUNT(*) AS count FROM visits
         WHERE job_id = $1 AND account_id = $2
           AND status IN (${FIELD_ACTIVE_VISIT_STATUSES.map((status) => `'${status}'`).join(", ")})`,
        [jobId, session.accountId],
      );
      const conflicts = await getVisitScheduleConflicts(client, {
        accountId: session.accountId,
        jobId,
        assignedUserId: assigned_user_id ?? null,
        scheduledStart: scheduled_start,
        scheduledEnd: scheduled_end,
      });
      if (conflicts.technicianOverlapCount > 0) {
        return NextResponse.json(
          {
            error: {
              code: "TECHNICIAN_CONFLICT",
              message: "That technician already has another visit during this time.",
              traceId: session.traceId,
            },
          },
          { status: 422 },
        );
      }
      const guard = checkSchedulingPreconditions({
        jobStatus: jobRows[0]?.status ?? null,
        fieldActiveVisitCount: parseInt(fieldActiveRows[0]?.count ?? "0", 10),
        overlappingVisitCount: conflicts.jobOverlapCount,
      });

      if (!guard.ok) {
                const message =
          guard.error === "ACTIVE_VISIT_EXISTS"
            ? "A visit is already in progress for this project. Finish or cancel it before scheduling another day."
            : guard.error === "VISIT_OVERLAP"
              ? "That time overlaps an existing visit on this project. Pick a different day or time."
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

      const visitId = randomUUID();
      await client.query(
        `INSERT INTO visits (id, account_id, job_id, work_order_id, assigned_user_id, scheduled_start, scheduled_end, tech_notes, visit_type)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          visitId,
          session.accountId,
          jobId,
          resolvedWorkOrderId,
          assigned_user_id ?? null,
          scheduled_start,
          scheduled_end,
          tech_notes ?? null,
          visit_type,
        ]
      );
      const inserted = await client.query<Record<string, unknown>>(
        `SELECT * FROM visits WHERE id = $1 AND account_id = $2`,
        [visitId, session.accountId],
      );
      const visit = inserted.rows[0] as Record<string, unknown> & { id: string };

      if (task_ids && task_ids.length > 0) {
        try {
          await setVisitPlannedTasks(client, {
            accountId: session.accountId,
            visitId: visit.id,
            jobId,
            workOrderId: resolvedWorkOrderId,
            taskIds: task_ids,
          });
        } catch (e) {
                    return NextResponse.json(
            {
              error: {
                code: "VALIDATION_ERROR",
                message: e instanceof Error ? e.message : "Invalid tasks for this day",
                traceId: session.traceId,
              },
            },
            { status: 422 },
          );
        }
      }

      if (booking_request_id) {
        // Must belong to this job (or have no job yet).
        const brCheck = await client.query<{ id: string; job_id: string | null; status: string }>(
          `SELECT id, job_id, status FROM booking_requests
           WHERE id = $1 AND account_id = $2
           FOR UPDATE`,
          [booking_request_id, session.accountId]
        );
        const br = brCheck.rows[0];
        if (!br || (br.job_id != null && br.job_id !== jobId)) {
                    return NextResponse.json(
            {
              error: {
                code: "PRECONDITION_FAILED",
                message: "The booking request could not be linked for this visit.",
                traceId: session.traceId,
              },
            },
            { status: 422 }
          );
        }

        // Assessment / walkthrough → assessment_booked; work day → converted (book-work path).
        const isAssessment =
          visit_type === "site_visit" ||
          visit_type === "sales_walkthrough" ||
          visit_type === "realtor_baseline";
        const targetStage = isAssessment ? "assessment_booked" : "converted";

        await advanceBookingRequestStage(client, {
          accountId: session.accountId,
          requestId: booking_request_id,
          target: targetStage,
          actorId: session.userId,
          visitId: visit.id,
          jobId,
          note: isAssessment
            ? `Assessment visit scheduled (${visit_type})`
            : `Work visit scheduled (${visit_type})`,
        });
      }

      await appendAuditLog(client, {
        account_id: session.accountId,
        entity_type: "visit",
        entity_id: visit.id,
        action: "insert",
        actor_id: session.userId,
        trace_id: session.traceId,
        new_value: visit,
      });

      // Auto-advance job to 'scheduled' when a visit is created for it.
      // Keeps downstream auto-advances (visit started → in_progress, visit
      // completed → completed) reliable regardless of how the job was created.
      const jobStatus = jobRows[0]?.status;
      if (jobStatus === "draft" || jobStatus === "quoted") {
        await client.query(
          `UPDATE jobs SET status = 'scheduled', updated_at = CURRENT_TIMESTAMP
           WHERE id = $1 AND account_id = $2`,
          [jobId, session.accountId]
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

      return NextResponse.json({ data: visit }, { status: 201 });
      });
    } catch (err) {
            logger.error("[visits POST]", err, { traceId: session.traceId });
      return NextResponse.json(
        {
          error: {
            code: "INTERNAL_ERROR",
            message: "Failed to create visit",
            traceId: session.traceId,
          },
        },
        { status: 500 }
      );
    }
  }
);
