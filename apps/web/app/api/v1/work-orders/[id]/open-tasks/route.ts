import { NextRequest, NextResponse } from "next/server";
import { withAuth, type AuthSession } from "@/lib/auth/middleware";
import { withPortableTransaction } from "@/lib/db/portable";
import { loadOpenTasksForWorkOrder } from "@/lib/work-orders/job-tasks";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export const GET = withAuth(async (request: NextRequest, session: AuthSession) => {
  const woId = request.url.match(/\/work-orders\/([^/]+)\/open-tasks/)?.[1];
  if (!woId) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Work order not found", traceId: session.traceId } }, { status: 404 });
  try {
    const data = await withPortableTransaction(async (client) => {
      const wo = await client.query<{ id: string }>(`SELECT id FROM work_orders WHERE id = $1 AND account_id = $2`, [woId, session.accountId]);
      if (!wo.rows[0]) return null;
      return { tasks: await loadOpenTasksForWorkOrder(client, woId, session.accountId) };
    });
    if (!data) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Work order not found", traceId: session.traceId } }, { status: 404 });
    return NextResponse.json({ data });
  } catch (err) {
    logger.error("GET open-tasks", err, { traceId: session.traceId });
    return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: "Could not load tasks", traceId: session.traceId } }, { status: 500 });
  }
});
