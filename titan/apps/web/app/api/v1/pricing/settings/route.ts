import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withRole } from "@/lib/auth/middleware";
import type { AuthSession } from "@/lib/auth/middleware";
import { withPortableTransaction } from "@/lib/db/portable";
import { appendAuditLog } from "@/lib/db/audit";
import { logger } from "@/lib/logger";
import { loadPricingSettings, rowToPricingSettings } from "@/lib/pricing/settings";
import { buildPricingRules } from "@ai-fsm/domain";

export const dynamic = "force-dynamic";

const patchSchema = z
  .object({
    labor_cost_cents_per_hour: z.number().int().min(0).max(50_000).optional(),
    labor_billing_cents_per_hour: z.number().int().min(0).max(100_000).optional(),
    margin_floor_pct: z.number().min(0).max(1).optional(),
    ma_labor_rate_delta: z.number().min(0).max(1).optional(),
    minimum_service_fee_cents: z.number().int().min(0).optional(),
    half_day_rate_cents: z.number().int().min(0).optional(),
    full_day_rate_cents: z.number().int().min(0).optional(),
  })
  .refine(
    (d) => {
      // When both provided, bill must cover cost
      if (
        d.labor_cost_cents_per_hour != null &&
        d.labor_billing_cents_per_hour != null
      ) {
        return d.labor_billing_cents_per_hour >= d.labor_cost_cents_per_hour;
      }
      return true;
    },
    { message: "Billing rate must be at least the cost rate" }
  );

export const GET = withRole(["owner", "admin", "tech"], async (_req: NextRequest, session: AuthSession) => {
  try {
    const settings = await withPortableTransaction((client) => loadPricingSettings(client, session.accountId));
    const rules = buildPricingRules(settings);
    return NextResponse.json({
      data: {
        ...settings,
        effective_margin_if_tm_only_pct:
          settings.labor_billing_cents_per_hour > 0
            ? Math.round(((settings.labor_billing_cents_per_hour - settings.labor_cost_cents_per_hour) /
                settings.labor_billing_cents_per_hour) * 1000) / 10
            : 0,
        ma_billing_cents_per_hour: Math.round(
          settings.labor_billing_cents_per_hour * (1 + settings.ma_labor_rate_delta)
        ),
        rules_version: rules.version,
      },
    });
  } catch (error) {
    logger.error("GET /api/v1/pricing/settings", error, { traceId: session.traceId });
    return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: "Failed to load pricing settings", traceId: session.traceId } }, { status: 500 });
  }
});

export const PATCH = withRole(["owner", "admin"], async (request: NextRequest, session: AuthSession) => {
  const body = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Invalid pricing settings", details: parsed.error.flatten().fieldErrors, traceId: session.traceId } }, { status: 422 });
  }
  try {
    const settings = await withPortableTransaction(async (client) => {
      const current = await loadPricingSettings(client, session.accountId);
      const data = parsed.data;
      const next = {
        labor_cost_cents_per_hour: data.labor_cost_cents_per_hour ?? current.labor_cost_cents_per_hour,
        labor_billing_cents_per_hour: data.labor_billing_cents_per_hour ?? current.labor_billing_cents_per_hour,
        margin_floor_pct: data.margin_floor_pct ?? current.margin_floor_pct,
        ma_labor_rate_delta: data.ma_labor_rate_delta ?? current.ma_labor_rate_delta,
        minimum_service_fee_cents: data.minimum_service_fee_cents ?? current.minimum_service_fee_cents,
        half_day_rate_cents: data.half_day_rate_cents ?? current.half_day_rate_cents,
        full_day_rate_cents: data.full_day_rate_cents ?? current.full_day_rate_cents,
      };
      if (next.labor_billing_cents_per_hour < next.labor_cost_cents_per_hour) {
        throw new Error("PRICING_BILL_BELOW_COST");
      }
      await client.query(
        `UPDATE business_pricing_settings SET
           labor_cost_cents_per_hour = $2,
           labor_billing_cents_per_hour = $3,
           margin_floor_pct = $4,
           ma_labor_rate_delta = $5,
           minimum_service_fee_cents = $6,
           half_day_rate_cents = $7,
           full_day_rate_cents = $8,
           updated_at = CURRENT_TIMESTAMP
         WHERE account_id = $1`,
        [session.accountId, next.labor_cost_cents_per_hour, next.labor_billing_cents_per_hour,
         next.margin_floor_pct, next.ma_labor_rate_delta, next.minimum_service_fee_cents,
         next.half_day_rate_cents, next.full_day_rate_cents]
      );
      await appendAuditLog(client, { account_id: session.accountId, entity_type: "account", entity_id: session.accountId,
        action: "update", actor_id: session.userId, trace_id: session.traceId, new_value: { pricing_settings: next } });
      return next;
    });
    return NextResponse.json({ data: settings });
  } catch (error) {
    if (error instanceof Error && error.message === "PRICING_BILL_BELOW_COST") {
      return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Billing rate must be at least the cost (pay) rate", traceId: session.traceId } }, { status: 422 });
    }
    logger.error("PATCH /api/v1/pricing/settings", error, { traceId: session.traceId });
    return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: "Failed to save pricing settings", traceId: session.traceId } }, { status: 500 });
  }
});
