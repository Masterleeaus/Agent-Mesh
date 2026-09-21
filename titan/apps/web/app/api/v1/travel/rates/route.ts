import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withRole } from "@/lib/auth/middleware";
import type { AuthSession } from "@/lib/auth/middleware";
import { portableQuery, withPortableTransaction } from "@/lib/db/portable";
import { randomUUID } from "node:crypto";
import { appendAuditLog } from "@/lib/db/audit";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  rate_cents: z.number().int().min(0).max(10000),
  effective_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  source: z.enum(["irs", "custom", "business"]).default("custom"),
  description: z.string().max(500).nullable().optional(),
  is_active: z.boolean().default(true),
  /** When true (default), deactivate other active rates. */
  make_exclusive_active: z.boolean().default(true),
});

export const GET = withRole(["owner", "admin"], async (_req: NextRequest, session: AuthSession) => {
  try {
    const rows = await portableQuery(
      `SELECT id, rate_cents, effective_date, source, description, is_active, created_at
       FROM mileage_rates WHERE account_id = $1
       ORDER BY effective_date DESC, created_at DESC LIMIT 50`, [session.accountId]);
    return NextResponse.json({ data: rows });
  } catch (error) {
    logger.error("GET /api/v1/travel/rates", error, { traceId: session.traceId });
    return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: "Failed to list mileage rates", traceId: session.traceId } }, { status: 500 });
  }
});

export const POST = withRole(["owner", "admin"], async (request: NextRequest, session: AuthSession) => {
  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Invalid mileage rate", details: parsed.error.flatten().fieldErrors, traceId: session.traceId } }, { status: 422 });
  const data = parsed.data;
  try {
    const row = await withPortableTransaction(async (client) => {
      if (data.is_active && data.make_exclusive_active) {
        await client.query(`UPDATE mileage_rates SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE account_id = $1 AND is_active = true`, [session.accountId]);
      }
      const id = randomUUID();
      await client.query(
        `INSERT INTO mileage_rates (id, account_id, rate_cents, effective_date, source, description, is_active, created_by)
         VALUES ($1, $2, $3, COALESCE($4, CURRENT_DATE), $5, $6, $7, $8)`,
        [id, session.accountId, data.rate_cents, data.effective_date ?? null, data.source, data.description ?? null, data.is_active, session.userId]);
      if (data.is_active) await client.query(`UPDATE business_travel_settings SET default_mileage_rate_cents = $1, updated_at = CURRENT_TIMESTAMP WHERE account_id = $2`, [data.rate_cents, session.accountId]);
      const result = await client.query(`SELECT id, rate_cents, effective_date, source, description, is_active, created_at FROM mileage_rates WHERE id = $1 AND account_id = $2`, [id, session.accountId]);
      const created = result.rows[0] as Record<string, unknown>;
      await appendAuditLog(client, { account_id: session.accountId, entity_type: "account", entity_id: session.accountId, action: "insert", actor_id: session.userId, trace_id: session.traceId, new_value: { mileage_rate: created } });
      return created;
    });
    return NextResponse.json({ data: row }, { status: 201 });
  } catch (error) {
    logger.error("POST /api/v1/travel/rates", error, { traceId: session.traceId });
    return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: "Failed to create mileage rate", traceId: session.traceId } }, { status: 500 });
  }
});
