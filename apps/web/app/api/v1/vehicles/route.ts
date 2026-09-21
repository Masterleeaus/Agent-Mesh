import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withRole } from "@/lib/auth/middleware";
import { portableQuery, withPortableTransaction } from "@/lib/db/portable";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  nickname: z.string().min(1).max(80),
  make: z.string().max(80).optional(),
  model: z.string().max(80).optional(),
  year: z.number().int().min(1900).max(2100).optional(),
  plate: z.string().max(20).optional(),
  kind: z.enum(["truck", "van", "trailer", "other"]).optional(),
});

type VehicleRow = {
  id: string; nickname: string; make: string | null; model: string | null; year: number | null;
  plate: string | null; kind: string; is_active: boolean; is_default: boolean;
  bluetooth_id: string | null; created_at: string; current_odometer: number | null;
  last_session_date: string | null; total_miles: string | number | null;
};

export const GET = withRole(["owner", "admin", "tech"], async (req: NextRequest, session) => {
  try {
    const mileageOnly = req.nextUrl.searchParams.get("mileage_only") === "1";
    const rows = await portableQuery<VehicleRow>(
      `SELECT v.id, v.nickname, v.make, v.model, v.year, v.plate, v.kind, v.is_active, v.is_default, v.bluetooth_id, v.created_at,
              (SELECT vs.end_odometer FROM vehicle_sessions vs
                WHERE vs.vehicle_id = v.id AND vs.account_id = v.account_id AND vs.end_odometer IS NOT NULL
                ORDER BY vs.session_date DESC, vs.created_at DESC LIMIT 1) AS current_odometer,
              (SELECT vs.session_date FROM vehicle_sessions vs
                WHERE vs.vehicle_id = v.id AND vs.account_id = v.account_id AND vs.end_odometer IS NOT NULL
                ORDER BY vs.session_date DESC, vs.created_at DESC LIMIT 1) AS last_session_date,
              (SELECT COALESCE(SUM(COALESCE(vs.miles, vs.end_odometer - vs.start_odometer)), 0)
                 FROM vehicle_sessions vs WHERE vs.vehicle_id = v.id AND vs.account_id = v.account_id
                   AND (vs.miles IS NOT NULL OR vs.end_odometer IS NOT NULL)) AS total_miles
       FROM vehicles v
       WHERE v.account_id = $1 ${mileageOnly ? "AND v.kind <> 'trailer'" : ""}
       ORDER BY v.is_active DESC, v.nickname ASC`,
      [session.accountId],
    );
    return NextResponse.json({ data: rows });
  } catch (err) {
    logger.error("GET /api/v1/vehicles", err as Error, { traceId: session.traceId });
    return NextResponse.json({ error: { message: "Failed to fetch vehicles" } }, { status: 500 });
  }
});

export const POST = withRole(["owner", "admin"], async (req: NextRequest, session) => {
  const parsed = createSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: { message: "Invalid input", details: parsed.error.issues } }, { status: 400 });
  const { nickname, make, model, year, plate, kind } = parsed.data;
  try {
    const id = randomUUID();
    const row = await withPortableTransaction(async (client) => {
      await client.query(
        `INSERT INTO vehicles (id, account_id, nickname, make, model, year, plate, kind)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [id, session.accountId, nickname, make ?? null, model ?? null, year ?? null, plate ?? null, kind ?? "truck"],
      );
      const result = await client.query<VehicleRow>(
        `SELECT id, nickname, make, model, year, plate, kind, is_active, is_default, bluetooth_id, created_at
           FROM vehicles WHERE id = $1 AND account_id = $2`, [id, session.accountId],
      );
      return result.rows[0] ?? null;
    });
    return NextResponse.json({ data: row }, { status: 201 });
  } catch (err) {
    logger.error("POST /api/v1/vehicles", err as Error, { traceId: session.traceId });
    return NextResponse.json({ error: { message: "Failed to create vehicle" } }, { status: 500 });
  }
});
