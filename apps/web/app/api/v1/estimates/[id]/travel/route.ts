import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withRole } from "@/lib/auth/middleware";
import type { AuthSession } from "@/lib/auth/middleware";
import { portableQuery, withPortableTransaction } from "@/lib/db/portable";
import { appendAuditLog } from "@/lib/db/audit";
import { logger } from "@/lib/logger";
import { calculateTravelForAccount } from "@/lib/travel/calculate";
import { applyTravelToEstimate, insertTravelSnapshot } from "@/lib/travel/snapshots";
import { loadTravelSettings } from "@/lib/travel/settings";

export const dynamic = "force-dynamic";

const applySchema = z.object({
  charge_mode: z.enum(["include_in_labor", "separate_line", "waive", "custom"]),
  custom_total_cents: z.number().int().min(0).nullable().optional(),
  trip_count: z.number().int().min(1).max(60).nullable().optional(),
  trip_direction: z.enum(["round_trip", "one_way"]).nullable().optional(),
  trip_calculation_method: z.enum(["once_for_project", "once_per_visit", "once_per_workday", "custom"]).nullable().optional(),
  planned_visits: z.number().int().min(1).max(60).nullable().optional(),
  planned_workdays: z.number().int().min(1).max(60).nullable().optional(),
  manual_one_way_miles: z.number().min(0).max(2000).nullable().optional(),
  manual_one_way_minutes: z.number().int().min(0).max(24 * 60).nullable().optional(),
  override_reason: z.string().max(1000).nullable().optional(),
  recalculate: z.boolean().default(true),
});

function estimateIdFromPath(pathname: string): string {
  const parts = pathname.split("/").filter(Boolean);
  return parts[parts.indexOf("estimates") + 1];
}

export const POST = withRole(["owner", "admin"], async (request: NextRequest, session: AuthSession) => {
  const estimateId = estimateIdFromPath(request.nextUrl.pathname);
  const parsed = applySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Invalid travel apply body", details: parsed.error.flatten().fieldErrors, traceId: session.traceId } }, { status: 422 });
  }
  const data = parsed.data;
  try {
    const result = await withPortableTransaction(async (client) => {
      const est = await client.query<{ id: string; status: string; client_id: string; property_id: string | null; job_id: string | null; total_cents: number; travel_snapshot_id: string | null; presentation_mode: string | null }>(
        `SELECT id, status, client_id, property_id, job_id, total_cents, travel_snapshot_id, presentation_mode FROM estimates WHERE id = $1 AND account_id = $2`,
        [estimateId, session.accountId]
      );
      if (!est.rowCount) return { response: NextResponse.json({ error: { code: "NOT_FOUND", message: "Estimate not found", traceId: session.traceId } }, { status: 404 }) };
      const estimate = est.rows[0];
      if (estimate.presentation_mode === "multi_option") return { response: NextResponse.json({ error: { code: "UNSUPPORTED_PRESENTATION_MODE", message: "Travel charging for multi-option estimates is not supported yet — convert to standard or apply surcharge on the chosen option after approval.", traceId: session.traceId } }, { status: 409 }) };
      if (estimate.status === "approved" || estimate.status === "accepted") return { response: NextResponse.json({ error: { code: "IMMUTABLE_ENTITY", message: "Cannot modify travel on an approved estimate without creating a revision. Convert to invoice or revise the estimate first.", traceId: session.traceId } }, { status: 409 }) };

      const calc = await calculateTravelForAccount(client, session.accountId, {
        property_id: estimate.property_id,
        client_id: estimate.client_id,
        project_value_cents: estimate.total_cents,
        trip_count: data.trip_count,
        trip_direction: data.trip_direction,
        trip_calculation_method: data.trip_calculation_method,
        planned_visits: data.planned_visits,
        planned_workdays: data.planned_workdays,
        charge_mode: data.charge_mode,
        custom_total_cents: data.custom_total_cents,
        manual_one_way_miles: data.manual_one_way_miles,
        manual_one_way_minutes: data.manual_one_way_minutes,
      });

      const overridden = data.charge_mode === "waive" || data.charge_mode === "custom" || data.manual_one_way_miles != null;
      if (overridden && !data.override_reason?.trim() && (data.charge_mode === "waive" || data.charge_mode === "custom")) {
        return { response: NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Override/waiver reason is required for waive or custom travel amounts.", traceId: session.traceId } }, { status: 422 }) };
      }

      const snapshot = await insertTravelSnapshot(client, {
        account_id: session.accountId,
        origin_address: calc.origin_address,
        destination_address: calc.destination_address,
        result: calc.calculation,
        calculation_source: calc.calculation_source,
        trip_calculation_method: calc.trip_calculation_method,
        mileage_rate_id: calc.mileage_rate_id,
        manually_overridden: overridden,
        override_reason: data.override_reason ?? null,
        estimate_id: estimateId,
        job_id: estimate.job_id,
        kind: "estimate",
        created_by: session.userId,
      });
      const settings = await loadTravelSettings(client, session.accountId);
      await applyTravelToEstimate(client, { accountId: session.accountId, estimateId, snapshot, settingsLineTitle: settings.customer_facing_line_title, settingsLineDescription: settings.customer_facing_description });
      await appendAuditLog(client, { account_id: session.accountId, entity_type: "estimate", entity_id: estimateId, action: "update", actor_id: session.userId, trace_id: session.traceId, new_value: { travel_snapshot_id: snapshot.id, charge_mode: data.charge_mode, total_travel_charge_cents: snapshot.total_travel_charge_cents } });
      return { snapshot, calc };
    });
    if ("response" in result) return result.response;
    return NextResponse.json({ data: { snapshot: result.snapshot, calculation: result.calc.calculation, origin_address: result.calc.origin_address, destination_address: result.calc.destination_address, geocode_failed: result.calc.geocode_failed } });
  } catch (error) {
    logger.error("POST /api/v1/estimates/[id]/travel", error, { traceId: session.traceId });
    return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: "Failed to apply travel", traceId: session.traceId } }, { status: 500 });
  }
});

export const GET = withRole(["owner", "admin", "tech"], async (request: NextRequest, session: AuthSession) => {
  const estimateId = estimateIdFromPath(request.nextUrl.pathname);
  const est = await portableQuery<{ travel_snapshot_id: string | null; travel_charge_mode: string | null }>(`SELECT travel_snapshot_id, travel_charge_mode FROM estimates WHERE id = $1 AND account_id = $2`, [estimateId, session.accountId]);
  if (!est.length) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Estimate not found", traceId: session.traceId } }, { status: 404 });
  if (!est[0].travel_snapshot_id) return NextResponse.json({ data: null });
  const snap = await portableQuery(`SELECT * FROM travel_calculation_snapshots WHERE id = $1 AND account_id = $2`, [est[0].travel_snapshot_id, session.accountId]);
  return NextResponse.json({ data: snap[0] ?? null, charge_mode: est[0].travel_charge_mode });
});
