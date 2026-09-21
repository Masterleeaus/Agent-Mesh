import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { withAuth } from "@/lib/auth/middleware";
import type { AuthSession } from "@/lib/auth/middleware";
import { withPortableTransaction } from "@/lib/db/portable";
import { appendAuditLog } from "@/lib/db/audit";
import { getVisitScheduleConflicts } from "@/lib/scheduling/visit-conflicts";
import { logger } from "@/lib/logger";
import { isWithinAvailability, loadAvailability } from "@/lib/workforce/availability";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  visit_id: z.string().uuid(),
  assigned_user_id: z.string().uuid().nullable(),
  sync_work_order_lead: z.boolean().default(false),
});

type VisitRow = {
  id: string;
  job_id: string;
  work_order_id: string | null;
  assigned_user_id: string | null;
  scheduled_start: string | Date;
  scheduled_end: string | Date;
  status: string;
};

export const POST = withAuth(async (request: NextRequest, session: AuthSession) => {
  if (!['owner', 'admin'].includes(session.role)) {
    return NextResponse.json({ error: { code: "FORBIDDEN", message: "Owner or admin role required", traceId: session.traceId } }, { status: 403 });
  }
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Invalid assignment request", details: parsed.error.flatten().fieldErrors, traceId: session.traceId } }, { status: 422 });
  }

  try {
    const data = await withPortableTransaction(async (client) => {
      const visitResult = await client.query<VisitRow>(
        `SELECT id, job_id, work_order_id, assigned_user_id, scheduled_start, scheduled_end, status
           FROM visits
          WHERE id = $1 AND account_id = $2
          FOR UPDATE`,
        [parsed.data.visit_id, session.accountId],
      );
      const visit = visitResult.rows[0];
      if (!visit) throw new Error("VISIT_NOT_FOUND");
      if (["cancelled", "completed"].includes(visit.status)) throw new Error("VISIT_IMMUTABLE");

      if (parsed.data.assigned_user_id) {
        const member = await client.query<{ id: string }>(
          `SELECT bm.id FROM business_memberships bm
             JOIN users u ON u.id = bm.user_id AND u.account_id = bm.account_id
            WHERE bm.user_id = $1 AND bm.account_id = $2
              AND bm.status = 'active' AND bm.role IN ('tech','admin','owner')`,
          [parsed.data.assigned_user_id, session.accountId],
        );
        if (!member.rows[0]) throw new Error("TECH_NOT_FOUND");

        const conflicts = await getVisitScheduleConflicts(client, {
          accountId: session.accountId,
          scheduledStart: new Date(visit.scheduled_start).toISOString(),
          scheduledEnd: new Date(visit.scheduled_end).toISOString(),
          assignedUserId: parsed.data.assigned_user_id,
          jobId: visit.job_id,
          excludeVisitId: visit.id,
        });
        if (conflicts.technicianOverlapCount > 0) throw new Error("TECH_CONFLICT");

        const availability = await loadAvailability(client, session.accountId, [parsed.data.assigned_user_id]);
        const available = isWithinAvailability(availability, new Date(visit.scheduled_start), new Date(visit.scheduled_end));
        if (available === false) throw new Error("TECH_UNAVAILABLE");
      }

      await client.query(
        `UPDATE visits SET assigned_user_id = $1, updated_at = CURRENT_TIMESTAMP
          WHERE id = $2 AND account_id = $3`,
        [parsed.data.assigned_user_id, visit.id, session.accountId],
      );

      if (parsed.data.sync_work_order_lead && visit.work_order_id) {
        await client.query(
          `UPDATE work_orders SET assigned_user_id = $1, updated_at = CURRENT_TIMESTAMP
            WHERE id = $2 AND account_id = $3`,
          [parsed.data.assigned_user_id, visit.work_order_id, session.accountId],
        );
      }

      const updated = await client.query<VisitRow>(
        `SELECT id, job_id, work_order_id, assigned_user_id, scheduled_start, scheduled_end, status
           FROM visits WHERE id = $1 AND account_id = $2`,
        [visit.id, session.accountId],
      );
      const next = updated.rows[0];

      await appendAuditLog(client, {
        account_id: session.accountId,
        entity_type: "visit",
        entity_id: visit.id,
        action: "dispatch_assignment",
        actor_id: session.userId,
        trace_id: session.traceId,
        old_value: { assigned_user_id: visit.assigned_user_id },
        new_value: { assigned_user_id: parsed.data.assigned_user_id, sync_work_order_lead: parsed.data.sync_work_order_lead },
      });
      await client.query(
        `INSERT INTO workflow_events (id, account_id, entity_type, entity_id, event_type, payload, created_at)
         VALUES ($1, $2, 'visit', $3, 'visit.dispatch_assignment_changed', $4, CURRENT_TIMESTAMP)`,
        [randomUUID(), session.accountId, visit.id, JSON.stringify({ assigned_user_id: parsed.data.assigned_user_id })],
      ).catch(() => ({ rows: [], rowCount: 0 }));
      return next;
    });
    return NextResponse.json({ data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "VISIT_NOT_FOUND") return NextResponse.json({ error: { code: "NOT_FOUND", message: "Visit not found", traceId: session.traceId } }, { status: 404 });
    if (message === "TECH_NOT_FOUND") return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Technician is not an active account user", traceId: session.traceId } }, { status: 422 });
    if (message === "VISIT_IMMUTABLE") return NextResponse.json({ error: { code: "IMMUTABLE_ENTITY", message: "Completed or cancelled visits cannot be reassigned", traceId: session.traceId } }, { status: 409 });
    if (message === "TECH_UNAVAILABLE") return NextResponse.json({ error: { code: "TECH_UNAVAILABLE", message: "Technician is outside configured availability for this visit", traceId: session.traceId } }, { status: 409 });
    if (message === "TECH_CONFLICT") return NextResponse.json({ error: { code: "SCHEDULE_CONFLICT", message: "Technician already has overlapping work in this time window", traceId: session.traceId } }, { status: 409 });
    logger.error("[dispatch assign]", error, { traceId: session.traceId });
    return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: "Failed to update dispatch assignment", traceId: session.traceId } }, { status: 500 });
  }
});
