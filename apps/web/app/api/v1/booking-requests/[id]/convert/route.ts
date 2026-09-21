import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withRole } from "@/lib/auth/middleware";
import { withTenantTransaction } from "@/lib/db/portable";
import { logger } from "@/lib/logger";
import { recordStatusChange } from "../../../../../../lib/status-history";

export const dynamic = "force-dynamic";

function extractId(url: string) {
  return url.match(/\/booking-requests\/([^/]+)\/convert/)?.[1] ?? null;
}

const convertSchema = z.object({
  preferred_date: z.string().optional(),
  preferred_time_slot: z.enum(["morning", "afternoon", "evening", "flexible"]).optional().nullable(),
  assigned_user_id: z.string().uuid().optional().nullable(),
  review_notes: z.string().max(2000).optional().nullable(),
});

export const POST = withRole(["owner", "admin"], async (request: NextRequest, session) => {
  const id = extractId(request.url);
  if (!id) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "Not found", traceId: session.traceId } }, { status: 404 });
  }

  let body: unknown = {};
  try { body = await request.json(); } catch { /* empty body is fine */ }

  const parsed = convertSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Invalid body", details: parsed.error.issues, traceId: session.traceId } }, { status: 422 });
  }

  try {
    return await withTenantTransaction(session, async (client, accountId) => {
    // Lock the row to serialize concurrent convert requests
    const { rows: brRows } = await client.query(
      `SELECT * FROM booking_requests WHERE id = $1 AND account_id = $2 FOR UPDATE`,
      [id, accountId]
    );
    if (brRows.length === 0) {
      return NextResponse.json({ error: { code: "NOT_FOUND", message: "Booking request not found", traceId: session.traceId } }, { status: 404 });
    }
    const br = brRows[0];

    if (br.status === "converted") {
      return NextResponse.json({ error: { code: "CONFLICT", message: "Already converted", traceId: session.traceId } }, { status: 409 });
    }
    if (br.status === "cancelled" || br.status === "lost" || br.status === "duplicate") {
      return NextResponse.json({
        error: {
          code: "CONFLICT",
          message: `Cannot convert a ${br.status} request`,
          traceId: session.traceId,
        },
      }, { status: 409 });
    }
    if (br.visit_id) {
      return NextResponse.json({ error: { code: "CONFLICT", message: "A visit is already linked to this booking request", traceId: session.traceId } }, { status: 409 });
    }

    // Ensure there's a job to attach the visit to
    if (!br.job_id) {
      return NextResponse.json({ error: { code: "CONFLICT", message: "No job linked to this booking request", traceId: session.traceId } }, { status: 409 });
    }

    const { rows: jobRows } = await client.query(
      `SELECT status FROM jobs WHERE id = $1 AND account_id = $2 FOR UPDATE`,
      [br.job_id, accountId]
    );
    const jobStatus = jobRows[0]?.status ?? null;
    if (!jobStatus) {
      return NextResponse.json({ error: { code: "NOT_FOUND", message: "Linked job not found", traceId: session.traceId } }, { status: 404 });
    }
    const terminalStatuses = ["completed", "invoiced", "cancelled"];
    if (terminalStatuses.includes(jobStatus)) {
      return NextResponse.json({ error: { code: "CONFLICT", message: `Cannot schedule a site visit — job is already ${jobStatus}`, traceId: session.traceId } }, { status: 409 });
    }

    // Block if there's already an active site visit for this job (prevents duplicates)
    const { rows: activeSiteVisits } = await client.query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM visits
       WHERE job_id = $1 AND visit_type = 'site_visit' AND status IN ('scheduled','arrived','in_progress')`,
      [br.job_id]
    );
    if (parseInt(activeSiteVisits[0]?.count ?? "0", 10) > 0) {
      return NextResponse.json({ error: { code: "CONFLICT", message: "A site visit is already scheduled for this job", traceId: session.traceId } }, { status: 409 });
    }

    // Build visit window from preferred date/time
    const dateStr = parsed.data.preferred_date ?? br.preferred_date;
    const slot    = parsed.data.preferred_time_slot ?? br.preferred_time_slot ?? "morning";
    const startHourMap: Record<string, number> = { morning: 9, afternoon: 13, evening: 16 };
    const startHour = startHourMap[slot] ?? 9;

    const visitStart = new Date(`${dateStr}T00:00:00`);
    visitStart.setHours(startHour, 0, 0, 0);
    const visitEnd = new Date(visitStart);
    visitEnd.setHours(startHour + 2, 0, 0, 0);

    // Create site visit — assess and measure the project before estimating
    const visitId = randomUUID();
    await client.query(
      `INSERT INTO visits (id, account_id, job_id, scheduled_start, scheduled_end, status, visit_type, tech_notes, assigned_user_id)
       VALUES ($1, $2, $3, $4, $5, 'scheduled', 'site_visit', $6, $7)`,
      [
        visitId,
        accountId,
        br.job_id,
        visitStart.toISOString(),
        visitEnd.toISOString(),
        br.access_notes || null,
        parsed.data.assigned_user_id ?? null,
      ]
    );

    await recordStatusChange(client, {
      accountId: accountId,
      entityType: "visit",
      entityId: visitId,
      fromStatus: null,
      toStatus: "scheduled",
      changedBy: session.userId,
      note: "Site visit created from booking request — assess scope before estimating",
    });

    // Job stays in draft until estimate is created and approved.
    // Funnel: assessment scheduled → assessment_booked (converted only on estimate accept).
    await client.query(
      `UPDATE booking_requests
       SET status = CASE
             WHEN status IN ('converted', 'lost', 'cancelled', 'duplicate', 'estimated') THEN status
             ELSE 'assessment_booked'
           END,
           visit_id = COALESCE(visit_id, $3),
           reviewed_by = COALESCE(reviewed_by, $4),
           reviewed_at = COALESCE(reviewed_at, now()),
           review_notes = COALESCE($5, review_notes),
           updated_at = now()
       WHERE id = $1 AND account_id = $2`,
      [id, accountId, visitId, session.userId, parsed.data.review_notes ?? null]
    );
    const { rows: updatedRows } = await client.query(
      `SELECT * FROM booking_requests WHERE id = $1 AND account_id = $2`,
      [id, accountId]
    );

    if (br.status !== "assessment_booked" && updatedRows[0]?.status === "assessment_booked") {
      await recordStatusChange(client, {
        accountId: accountId,
        entityType: "booking_request",
        entityId: id,
        fromStatus: br.status,
        toStatus: "assessment_booked",
        changedBy: session.userId,
        note: parsed.data.review_notes ?? "Assessment visit scheduled",
      });
    }

    return NextResponse.json({ data: { booking_request: updatedRows[0], visit_id: visitId } }, { status: 201 });
    });
  } catch (err) {
    logger.error("POST /api/v1/booking-requests/[id]/convert error", err, { traceId: session.traceId });
    return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: "Failed to convert booking request", traceId: session.traceId } }, { status: 500 });
  }
});
