import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withAuth } from "../../../../../lib/auth/middleware";
import type { AuthSession } from "../../../../../lib/auth/middleware";
import { portableQueryOne, withPortableTransaction } from "../../../../../lib/db/portable";
import { appendAuditLog } from "../../../../../lib/db/audit";
import { logger } from "../../../../../lib/logger";
import { computeCapStatus } from "../../../../../lib/visits/membership-cap";
import { MEMBERSHIP_VISIT_PHASES } from "@ai-fsm/domain";
import { getVisitScheduleConflicts } from "../../../../../lib/scheduling/visit-conflicts";

export const dynamic = "force-dynamic";

const membershipVisitPhaseSchema = z.enum(
  MEMBERSHIP_VISIT_PHASES as unknown as [string, ...string[]]
);

const ownerUpdateBody = z.object({
  assigned_user_id: z.string().uuid().nullable().optional(),
  scheduled_start: z.string().datetime().optional(),
  scheduled_end: z.string().datetime().optional(),
  tech_notes: z.string().nullable().optional(),
  materials_used: z.string().nullable().optional(),
  issue_description: z.string().nullable().optional(),
  membership_visit_phase: membershipVisitPhaseSchema.optional(),
  included_labor_minutes_used: z.number().int().nonnegative().optional(),
  membership_snapshot_sent: z.literal(true).optional(),
});

const techUpdateBody = z.object({
  tech_notes: z.string().nullable().optional(),
  materials_used: z.string().nullable().optional(),
  issue_description: z.string().nullable().optional(),
  membership_visit_phase: membershipVisitPhaseSchema.optional(),
  included_labor_minutes_used: z.number().int().nonnegative().optional(),
  membership_snapshot_sent: z.literal(true).optional(),
});

export const GET = withAuth(async (request: NextRequest, session: AuthSession) => {
  const id = request.url.match(/\/visits\/([^/]+)/)?.[1];
  if (!id) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Visit not found", traceId: session.traceId } },
      { status: 404 },
    );
  }

  const visit = await portableQueryOne<Record<string, unknown>>(
    `SELECT * FROM visits WHERE id = $1 AND account_id = $2`,
    [id, session.accountId],
  );
  if (!visit) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Visit not found", traceId: session.traceId } },
      { status: 404 },
    );
  }
  return NextResponse.json({ data: visit });
});

export const PATCH = withAuth(async (request: NextRequest, session: AuthSession) => {
  const id = request.url.match(/\/visits\/([^/]+)/)?.[1];
  if (!id) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Visit not found", traceId: session.traceId } },
      { status: 404 },
    );
  }

  const schema = session.role === "tech" ? techUpdateBody : ownerUpdateBody;
  const parsed = schema.safeParse(await request.json().catch(() => null));
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

  try {
    return await withPortableTransaction(async (client) => {
      const existing = await client.query<Record<string, unknown>>(
        `SELECT * FROM visits WHERE id = $1 AND account_id = $2 FOR UPDATE`,
        [id, session.accountId],
      );
      const old = existing.rows[0];
      if (!old) {
        return NextResponse.json(
          { error: { code: "NOT_FOUND", message: "Visit not found", traceId: session.traceId } },
          { status: 404 },
        );
      }

      const scheduleChanged =
        parsed.data.scheduled_start !== undefined ||
        parsed.data.scheduled_end !== undefined ||
        parsed.data.assigned_user_id !== undefined;
      if (scheduleChanged) {
        const scheduledStart = String(parsed.data.scheduled_start ?? old.scheduled_start ?? "");
        const scheduledEnd = String(parsed.data.scheduled_end ?? old.scheduled_end ?? "");
        const assignedUserId =
          parsed.data.assigned_user_id !== undefined
            ? parsed.data.assigned_user_id
            : (old.assigned_user_id as string | null | undefined) ?? null;
        if (!scheduledStart || !scheduledEnd || new Date(scheduledEnd).getTime() <= new Date(scheduledStart).getTime()) {
          return NextResponse.json(
            { error: { code: "VALIDATION_ERROR", message: "scheduled_end must be after scheduled_start", traceId: session.traceId } },
            { status: 422 },
          );
        }
        const conflicts = await getVisitScheduleConflicts(client, {
          accountId: session.accountId,
          jobId: String(old.job_id),
          assignedUserId,
          scheduledStart,
          scheduledEnd,
          excludeVisitId: id,
        });
        if (conflicts.technicianOverlapCount > 0) {
          return NextResponse.json(
            { error: { code: "TECHNICIAN_CONFLICT", message: "That technician already has another visit during this time.", traceId: session.traceId } },
            { status: 422 },
          );
        }
        if (conflicts.jobOverlapCount > 0) {
          return NextResponse.json(
            { error: { code: "VISIT_OVERLAP", message: "That time overlaps another visit on this project.", traceId: session.traceId } },
            { status: 422 },
          );
        }
      }

      const fields: string[] = [];
      const values: unknown[] = [];
      const add = (column: string, value: unknown) => {
        values.push(value);
        fields.push(`${column} = $${values.length}`);
      };
      const { membership_snapshot_sent, ...patchData } = parsed.data;
      for (const [key, value] of Object.entries(patchData)) {
        if (value !== undefined) add(key, value);
      }

      if (parsed.data.included_labor_minutes_used !== undefined) {
        const capMinutes = old.included_labor_cap_minutes as number | null;
        add(
          "membership_cap_status",
          computeCapStatus(parsed.data.included_labor_minutes_used, capMinutes),
        );
      }

      if (membership_snapshot_sent) {
        if (!old.generated_from_plan_id) {
          return NextResponse.json(
            {
              error: {
                code: "PRECONDITION_FAILED",
                message: "Only membership visits can have a visit summary marked as sent",
                traceId: session.traceId,
              },
            },
            { status: 422 },
          );
        }
        if (old.membership_visit_phase !== "reporting") {
          return NextResponse.json(
            {
              error: {
                code: "PRECONDITION_FAILED",
                message: "Advance to the Reporting phase before marking the visit summary as sent",
                traceId: session.traceId,
              },
            },
            { status: 422 },
          );
        }
        fields.push(
          "membership_snapshot_sent_at = COALESCE(membership_snapshot_sent_at, CURRENT_TIMESTAMP)",
        );
      }

      if (fields.length === 0) return NextResponse.json({ data: old });

      fields.push("updated_at = CURRENT_TIMESTAMP");
      values.push(id, session.accountId);
      await client.query(
        `UPDATE visits SET ${fields.join(", ")}
         WHERE id = $${values.length - 1} AND account_id = $${values.length}`,
        values,
      );
      const refreshed = await client.query<Record<string, unknown>>(
        `SELECT * FROM visits WHERE id = $1 AND account_id = $2`,
        [id, session.accountId],
      );
      const updated = refreshed.rows[0];

      await appendAuditLog(client, {
        account_id: session.accountId,
        entity_type: "visit",
        entity_id: id,
        action: "update",
        actor_id: session.userId,
        trace_id: session.traceId,
        old_value: old,
        new_value: updated,
      });
      return NextResponse.json({ data: updated });
    });
  } catch (err) {
    logger.error("[visits PATCH]", err, { traceId: session.traceId });
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to update visit", traceId: session.traceId } },
      { status: 500 },
    );
  }
});

export const DELETE = withAuth(async (request: NextRequest, session: AuthSession) => {
  if (!["owner", "admin"].includes(session.role)) {
    return NextResponse.json(
      { error: { code: "FORBIDDEN", message: "Owner or admin role required to delete visits", traceId: session.traceId } },
      { status: 403 },
    );
  }
  const id = request.url.match(/\/visits\/([^/]+)/)?.[1];
  if (!id) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Visit not found", traceId: session.traceId } },
      { status: 404 },
    );
  }

  try {
    return await withPortableTransaction(async (client) => {
      const existing = await client.query<{ id: string; status: string }>(
        `SELECT id, status FROM visits WHERE id = $1 AND account_id = $2 FOR UPDATE`,
        [id, session.accountId],
      );
      const visit = existing.rows[0];
      if (!visit) {
        return NextResponse.json(
          { error: { code: "NOT_FOUND", message: "Visit not found", traceId: session.traceId } },
          { status: 404 },
        );
      }
      if (["completed", "cancelled"].includes(visit.status)) {
        return NextResponse.json(
          {
            error: {
              code: "IMMUTABLE_ENTITY",
              message: `Cannot delete a visit in "${visit.status}" state.`,
              traceId: session.traceId,
            },
          },
          { status: 422 },
        );
      }

      await client.query(`DELETE FROM visits WHERE id = $1 AND account_id = $2`, [id, session.accountId]);
      await appendAuditLog(client, {
        account_id: session.accountId,
        entity_type: "visit",
        entity_id: id,
        action: "delete",
        actor_id: session.userId,
        trace_id: session.traceId,
        old_value: { status: visit.status },
      });
      return NextResponse.json({ deleted: true });
    });
  } catch (err) {
    logger.error("[visits DELETE]", err, { traceId: session.traceId });
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to delete visit", traceId: session.traceId } },
      { status: 500 },
    );
  }
});
