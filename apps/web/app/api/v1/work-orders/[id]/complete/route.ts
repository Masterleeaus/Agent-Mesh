import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "../../../../../../lib/auth/middleware";
import type { AuthSession } from "../../../../../../lib/auth/middleware";
import { completeAssignedWorkOrder, withLeadWorkOrderContext } from "../../../../../../lib/work-orders/lead-access";
import { logger } from "../../../../../../lib/logger";

export const dynamic = "force-dynamic";


export const POST = withAuth(
  async (request: NextRequest, session: AuthSession) => {
    const id = request.url.match(/\/work-orders\/([^/]+)\/complete/)?.[1];
    if (!id) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Work order not found", traceId: session.traceId } },
        { status: 404 },
      );
    }

    try {
      const result = await withLeadWorkOrderContext(session, (client) =>
        completeAssignedWorkOrder(client, id, session.accountId, session.userId),
      );

      if (result.kind === "forbidden") {
        return NextResponse.json(
          { error: { code: "FORBIDDEN", message: "Only the assigned lead can complete this work order", traceId: session.traceId } },
          { status: 403 },
        );
      }
      if (result.kind === "active_visit") {
        return NextResponse.json(
          { error: { code: "PRECONDITION_FAILED", message: "End the active visit before completing this work order", traceId: session.traceId } },
          { status: 422 },
        );
      }
      if (result.kind === "gate") {
        return NextResponse.json(
          { error: { code: "PRECONDITION_FAILED", message: result.message, traceId: session.traceId } },
          { status: 422 },
        );
      }
      return NextResponse.json({ data: { status: result.status } });
    } catch (err) {
      logger.error("[work-orders complete]", err, { traceId: session.traceId });
      return NextResponse.json(
        { error: { code: "INTERNAL_ERROR", message: "Failed to complete work order", traceId: session.traceId } },
        { status: 500 },
      );
    }
  },
);
