import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withRole } from "@/lib/auth/middleware";
import { withPortableTransaction } from "@/lib/db/portable";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";
const patchSchema = z.object({
  nickname: z.string().min(1).max(80).optional(), make: z.string().max(80).nullable().optional(),
  model: z.string().max(80).nullable().optional(), year: z.number().int().min(1900).max(2100).nullable().optional(),
  plate: z.string().max(20).nullable().optional(), is_active: z.boolean().optional(),
  bluetooth_id: z.string().max(120).nullable().optional(), is_default: z.boolean().optional(),
  kind: z.enum(["truck", "van", "trailer", "other"]).optional(), vin: z.string().max(64).nullable().optional(),
  purchase_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  purchase_price_cents: z.number().int().min(0).nullable().optional(),
});

type VehicleRow = Record<string, unknown>;
export const PATCH = withRole(["owner", "admin"], async (req: NextRequest, session) => {
  const pathId = req.nextUrl.pathname.split("/").at(-1) ?? "";
  const parsed = patchSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: { message: "Invalid input", details: parsed.error.issues } }, { status: 400 });
  const fields: string[] = []; const params: unknown[] = [];
  const allowed = ["nickname","make","model","year","plate","is_active","bluetooth_id","is_default","kind","vin","purchase_date","purchase_price_cents"] as const;
  for (const key of allowed) {
    const value = parsed.data[key];
    if (value !== undefined) { params.push(value); fields.push(`${key} = $${params.length}`); }
  }
  if (!fields.length) return NextResponse.json({ error: { message: "No fields to update" } }, { status: 400 });
  try {
    const row = await withPortableTransaction(async (client) => {
      const existing = await client.query<{ id: string; kind: string }>(`SELECT id, kind FROM vehicles WHERE id = $1 AND account_id = $2`, [pathId, session.accountId]);
      if (!existing.rows[0]) return null;
      if (parsed.data.kind === "trailer") {
        const active = await client.query<{ id: string }>(`SELECT id FROM technician_vehicle_assignments WHERE account_id = $1 AND vehicle_id = $2 AND unassigned_at IS NULL LIMIT 1`, [session.accountId, pathId]);
        if (active.rows[0]) throw new Error("ASSIGNED_VEHICLE_CANNOT_BECOME_TRAILER");
      }
      if (parsed.data.is_default === true) await client.query(`UPDATE vehicles SET is_default = false, updated_at = CURRENT_TIMESTAMP WHERE account_id = $1 AND id <> $2 AND is_default = true`, [session.accountId, pathId]);
      const finalParams = [...params, pathId, session.accountId];
      await client.query(`UPDATE vehicles SET ${fields.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE id = $${params.length + 1} AND account_id = $${params.length + 2}`, finalParams);
      const result = await client.query<VehicleRow>(`SELECT id, nickname, make, model, year, plate, kind, vin, purchase_date, purchase_price_cents, is_active, is_default, bluetooth_id, created_at FROM vehicles WHERE id = $1 AND account_id = $2`, [pathId, session.accountId]);
      return result.rows[0] ?? null;
    });
    if (!row) return NextResponse.json({ error: { message: "Not found" } }, { status: 404 });
    return NextResponse.json({ data: row });
  } catch (err) {
    if ((err as Error).message === "ASSIGNED_VEHICLE_CANNOT_BECOME_TRAILER") return NextResponse.json({ error: { message: "Unassign this vehicle from field staff before changing it to a trailer" } }, { status: 409 });
    logger.error("PATCH /api/v1/vehicles/[id]", err as Error, { traceId: session.traceId });
    return NextResponse.json({ error: { message: "Failed to update vehicle" } }, { status: 500 });
  }
});
