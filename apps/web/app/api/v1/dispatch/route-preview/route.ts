import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withRole } from "@/lib/auth/middleware";
import type { AuthSession } from "@/lib/auth/middleware";
import { portableQuery } from "@/lib/db/portable";
import { buildFullAddress, lookupOneWayDistance } from "@/lib/travel/distance";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  from_visit_id: z.string().uuid(),
  to_visit_id: z.string().uuid(),
});

type RouteVisitRow = {
  id: string;
  assigned_user_id: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  latitude: number | null;
  longitude: number | null;
};

export const POST = withRole(["owner", "admin"], async (request: NextRequest, session: AuthSession) => {
  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Invalid route preview request", traceId: session.traceId } }, { status: 422 });
  }

  try {
    const rows = await portableQuery<RouteVisitRow>(
      `SELECT v.id, v.assigned_user_id,
              p.address, p.city, p.state, p.zip, p.latitude, p.longitude
         FROM visits v
         JOIN jobs j ON j.id = v.job_id AND j.account_id = v.account_id
         LEFT JOIN properties p ON p.id = j.property_id AND p.account_id = v.account_id
        WHERE v.account_id = $1
          AND v.id IN ($2, $3)`,
      [session.accountId, parsed.data.from_visit_id, parsed.data.to_visit_id],
    );
    const fromVisit = rows.find((row) => row.id === parsed.data.from_visit_id);
    const toVisit = rows.find((row) => row.id === parsed.data.to_visit_id);
    if (!fromVisit || !toVisit) {
      return NextResponse.json({ error: { code: "NOT_FOUND", message: "One or both visits were not found", traceId: session.traceId } }, { status: 404 });
    }
    if (fromVisit.assigned_user_id && toVisit.assigned_user_id && fromVisit.assigned_user_id !== toVisit.assigned_user_id) {
      return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Route preview requires visits assigned to the same technician", traceId: session.traceId } }, { status: 422 });
    }

    const originAddress = buildFullAddress(fromVisit);
    const destinationAddress = buildFullAddress(toVisit);
    const route = await lookupOneWayDistance({
      origin_address: originAddress,
      destination_address: destinationAddress,
      origin_coords: fromVisit.latitude != null && fromVisit.longitude != null ? { latitude: Number(fromVisit.latitude), longitude: Number(fromVisit.longitude) } : null,
      destination_coords: toVisit.latitude != null && toVisit.longitude != null ? { latitude: Number(toVisit.latitude), longitude: Number(toVisit.longitude) } : null,
    });

    return NextResponse.json({ data: route });
  } catch (error) {
    logger.error("POST /api/v1/dispatch/route-preview", error, { traceId: session.traceId });
    return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: "Failed to calculate route preview", traceId: session.traceId } }, { status: 500 });
  }
});
