import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withAuth, type AuthSession } from "@/lib/auth/middleware";
import { withPortableTransaction } from "@/lib/db/portable";
import { canViewReports } from "@/lib/auth/permissions";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

// EPIC-007 TASK-046: account-level location capture controls (owner/admin).
// Master enable/disable + a temporary pause. The ingest endpoint also requires
// an active Start-Day workday session before processing events.

const patchSchema = z.object({
  enabled: z.boolean().optional(),
  // ISO timestamp to pause until, or null to resume now.
  paused_until: z.string().datetime().nullable().optional(),
  // Day-review settings (migration 137)
  day_review_cutoff_time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  min_stop_dwell_minutes: z.number().int().min(1).max(60).optional(),
  visit_confidence_threshold: z.number().int().min(0).max(100).optional(),
  suppress_weekend_start_prompt: z.boolean().optional(),
  close_day_followup_hours: z.number().int().min(1).max(24).nullable().optional(),
  tracking_start_time: z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
  tracking_end_time: z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
  location_retention_days: z.number().int().min(30).max(90).optional(),
});

export const PATCH = withAuth(async (request: NextRequest, session: AuthSession) => {
  if (!canViewReports(session.role)) return NextResponse.json({ error: { code: "FORBIDDEN", message: "Not permitted", traceId: session.traceId } }, { status: 403 });
  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Invalid request", traceId: session.traceId } }, { status: 400 });
  const d = parsed.data;
  if (!Object.values(d).some((v) => v !== undefined)) return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Nothing to update", traceId: session.traceId } }, { status: 400 });
  try {
    const row = await withPortableTransaction(async (client) => {
      const currentResult = await client.query<Record<string, unknown>>(
        `SELECT location_tracking_enabled, location_paused_until, day_review_cutoff_time,
                min_stop_dwell_minutes, visit_confidence_threshold, suppress_weekend_start_prompt,
                close_day_followup_hours, tracking_start_time, tracking_end_time, location_retention_days
         FROM accounts WHERE id = $1`, [session.accountId]);
      const current = currentResult.rows[0];
      if (!current) throw new Error("ACCOUNT_NOT_FOUND");
      const next = {
        location_tracking_enabled: d.enabled ?? current.location_tracking_enabled,
        location_paused_until: d.paused_until !== undefined ? d.paused_until : current.location_paused_until,
        day_review_cutoff_time: d.day_review_cutoff_time ?? current.day_review_cutoff_time,
        min_stop_dwell_minutes: d.min_stop_dwell_minutes ?? current.min_stop_dwell_minutes,
        visit_confidence_threshold: d.visit_confidence_threshold ?? current.visit_confidence_threshold,
        suppress_weekend_start_prompt: d.suppress_weekend_start_prompt ?? current.suppress_weekend_start_prompt,
        close_day_followup_hours: d.close_day_followup_hours !== undefined ? d.close_day_followup_hours : current.close_day_followup_hours,
        tracking_start_time: d.tracking_start_time !== undefined ? d.tracking_start_time : current.tracking_start_time,
        tracking_end_time: d.tracking_end_time !== undefined ? d.tracking_end_time : current.tracking_end_time,
        location_retention_days: d.location_retention_days ?? current.location_retention_days,
      };
      await client.query(
        `UPDATE accounts SET location_tracking_enabled=$2, location_paused_until=$3,
          day_review_cutoff_time=$4, min_stop_dwell_minutes=$5, visit_confidence_threshold=$6,
          suppress_weekend_start_prompt=$7, close_day_followup_hours=$8, tracking_start_time=$9,
          tracking_end_time=$10, location_retention_days=$11, updated_at=CURRENT_TIMESTAMP WHERE id=$1`,
        [session.accountId, next.location_tracking_enabled, next.location_paused_until, next.day_review_cutoff_time,
         next.min_stop_dwell_minutes, next.visit_confidence_threshold, next.suppress_weekend_start_prompt,
         next.close_day_followup_hours, next.tracking_start_time, next.tracking_end_time, next.location_retention_days]);
      return next;
    });
    return NextResponse.json({ data: row });
  } catch (error) {
    logger.error("PATCH /api/v1/location-settings error", error, { traceId: session.traceId });
    return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: "Failed to update settings", traceId: session.traceId } }, { status: 500 });
  }
});
