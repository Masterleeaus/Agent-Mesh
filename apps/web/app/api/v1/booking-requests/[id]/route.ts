import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withRole } from "@/lib/auth/middleware";
import { portableQuery, withPortableTransaction } from "@/lib/db/portable";
import { logger } from "@/lib/logger";
import { recordStatusChange } from "../../../../../lib/status-history";
import {
  bookingRequestClosedReasonSchema,
  bookingRequestPatchStatusSchema,
} from "@ai-fsm/domain";

export const dynamic = "force-dynamic";

function extractId(url: string) {
  return url.match(/\/booking-requests\/([^/]+)/)?.[1] ?? null;
}

export const GET = withRole(["owner", "admin"], async (request: NextRequest, session) => {
  const id = extractId(request.url);
  if (!id) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Not found", traceId: session.traceId } }, { status: 404 });

  try {
    const rows = await portableQuery(
      `SELECT br.*, u.full_name AS reviewed_by_name, j.title AS job_title, j.status AS job_status
       FROM booking_requests br
       LEFT JOIN users u ON u.id = br.reviewed_by AND u.account_id = br.account_id
       LEFT JOIN jobs j ON j.id = br.job_id AND j.account_id = br.account_id
       WHERE br.id = $1 AND br.account_id = $2`,
      [id, session.accountId]
    );
    if (rows.length === 0) {
      return NextResponse.json({ error: { code: "NOT_FOUND", message: "Booking request not found", traceId: session.traceId } }, { status: 404 });
    }
    return NextResponse.json({ data: rows[0] });
  } catch (err) {
    logger.error("GET /api/v1/booking-requests/[id] error", err, { traceId: session.traceId });
    return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: "Failed to fetch booking request", traceId: session.traceId } }, { status: 500 });
  }
});

const patchSchema = z.object({
  status: bookingRequestPatchStatusSchema.optional(),
  review_notes: z.string().max(2000).nullable().optional(),
  pricing_mode: z.enum(["flat_rate", "hourly_internal"]).optional(),
  routing_path: z
    .enum(["site_visit", "remote_estimate", "book_work", "pending"])
    .optional(),
  closed_reason: bookingRequestClosedReasonSchema.optional().nullable(),
});

export const PATCH = withRole(["owner", "admin"], async (request: NextRequest, session) => {
  const id = extractId(request.url);
  if (!id) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Not found", traceId: session.traceId } }, { status: 404 });

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Invalid JSON", traceId: session.traceId } }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Invalid body", details: parsed.error.issues, traceId: session.traceId } }, { status: 422 });
  }

  const { status, review_notes, pricing_mode, routing_path, closed_reason } = parsed.data;
  try {
    const result = await withPortableTransaction(async (client) => {
      const { rows: existing } = await client.query<{ status: string }>(
        `SELECT status FROM booking_requests WHERE id = $1 AND account_id = $2`, [id, session.accountId]
      );
      if (existing.length === 0) return { kind: "not_found" as const };
      if (["converted", "lost", "cancelled"].includes(existing[0].status)) {
        return { kind: "closed" as const, status: existing[0].status };
      }

      const setClauses: string[] = ["updated_at = now()"];
      const params: unknown[] = [id, session.accountId];
      let idx = 3;
      if (status !== undefined) {
        setClauses.push(`status = $${idx++}`); params.push(status);
        setClauses.push(`reviewed_by = $${idx++}`); params.push(session.userId);
        setClauses.push("reviewed_at = now()");
        if (status === "lost" || status === "cancelled") {
          setClauses.push("closed_at = now()");
          const reason = closed_reason ?? (status === "lost" ? "customer_declined" : "spam");
          setClauses.push(`closed_reason = $${idx++}`); params.push(reason);
        }
      }
      if (review_notes !== undefined) { setClauses.push(`review_notes = $${idx++}`); params.push(review_notes); }
      if (pricing_mode !== undefined) { setClauses.push(`pricing_mode = $${idx++}`); params.push(pricing_mode); }
      if (routing_path !== undefined) { setClauses.push(`routing_path = $${idx++}`); params.push(routing_path); }

      await client.query(`UPDATE booking_requests SET ${setClauses.join(", ")} WHERE id = $1 AND account_id = $2`, params);
      if (status !== undefined && status !== existing[0].status) {
        await recordStatusChange(client, { accountId: session.accountId, entityType: "booking_request", entityId: id,
          fromStatus: existing[0].status, toStatus: status, changedBy: session.userId, note: review_notes ?? closed_reason ?? null });
      }
      const { rows } = await client.query(`SELECT * FROM booking_requests WHERE id = $1 AND account_id = $2`, [id, session.accountId]);
      return { kind: "ok" as const, row: rows[0] };
    });

    if (result.kind === "not_found") return NextResponse.json({ error: { code: "NOT_FOUND", message: "Booking request not found", traceId: session.traceId } }, { status: 404 });
    if (result.kind === "closed") return NextResponse.json({ error: { code: "CONFLICT", message: `Cannot update a ${result.status} booking request`, traceId: session.traceId } }, { status: 409 });
    return NextResponse.json({ data: result.row });
  } catch (err) {
    logger.error("PATCH /api/v1/booking-requests/[id] error", err, { traceId: session.traceId });
    return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: "Failed to update booking request", traceId: session.traceId } }, { status: 500 });
  }
});
