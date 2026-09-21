import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { VISIT_SUB_STATUSES } from "@ai-fsm/domain";
import { withRole } from "@/lib/auth/middleware";
import { portableQuery, portableQueryOne } from "@/lib/db/portable";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  sub_status: z.enum(VISIT_SUB_STATUSES).nullable(),
});

export const PATCH = withRole(["owner", "admin"], async (request: NextRequest, session) => {
  const id = request.url.match(/\/visits\/([^/]+)\/sub-status/)?.[1];
  if (!id) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Visit not found", traceId: session.traceId } },
      { status: 404 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid sub-status",
          details: parsed.error.flatten().fieldErrors,
          traceId: session.traceId,
        },
      },
      { status: 400 }
    );
  }

  try {
    const existing = await portableQueryOne<{ id: string }>(
      `SELECT id FROM visits WHERE id = $1 AND account_id = $2`,
      [id, session.accountId],
    );
    if (!existing) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Visit not found", traceId: session.traceId } },
        { status: 404 }
      );
    }

    await portableQuery(
      `UPDATE visits SET sub_status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND account_id = $3`,
      [parsed.data.sub_status, id, session.accountId],
    );
    return NextResponse.json({ id, sub_status: parsed.data.sub_status });
  } catch (err) {
    logger.error("[visits sub-status PATCH]", err, { traceId: session.traceId });
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to update visit sub-status", traceId: session.traceId } },
      { status: 500 }
    );
  }
});
