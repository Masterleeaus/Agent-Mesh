import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { JOB_SUB_STATUSES } from "@ai-fsm/domain";
import { withRole } from "@/lib/auth/middleware";
import { withPortableTransaction } from "@/lib/db/portable";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  sub_status: z.enum(JOB_SUB_STATUSES).nullable(),
});

export const PATCH = withRole(["owner", "admin"], async (request: NextRequest, session) => {
  const id = request.url.match(/\/jobs\/([^/]+)\/sub-status/)?.[1];
  if (!id) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Job not found", traceId: session.traceId } },
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
    const row = await withPortableTransaction(async (client) => {
      const existing = await client.query<{ id: string }>(
        `SELECT id FROM jobs WHERE id = $1 AND account_id = $2 FOR UPDATE`,
        [id, session.accountId],
      );
      if (!existing.rows[0]) return null;

      await client.query(
        `UPDATE jobs
         SET sub_status = $1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2 AND account_id = $3`,
        [parsed.data.sub_status, id, session.accountId]
      );
      const persisted = await client.query<{ id: string; sub_status: string | null }>(
        `SELECT id, sub_status FROM jobs WHERE id = $1 AND account_id = $2`,
        [id, session.accountId],
      );
      return persisted.rows[0] ?? null;
    });

    if (!row) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Job not found", traceId: session.traceId } },
        { status: 404 }
      );
    }

    return NextResponse.json(row);
  } catch (err) {
    logger.error("[jobs sub-status PATCH]", err, { traceId: session.traceId });
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to update job sub-status", traceId: session.traceId } },
      { status: 500 }
    );
  }
});
