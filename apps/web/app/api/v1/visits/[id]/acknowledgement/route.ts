import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withAuth, type AuthSession } from "@/lib/auth/middleware";
import { portableQueryOne, withPortableTransaction } from "@/lib/db/portable";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  customer_name: z.string().trim().min(1).max(255),
  customer_email: z.string().trim().email().max(320).nullable().optional(),
  acknowledgement_notes: z.string().trim().max(1000).nullable().optional(),
});

type AckRow = Record<string, unknown> & {
  id: string;
  customer_name: string;
  customer_email: string | null;
  acknowledgement_notes: string | null;
  acknowledged_at: string | Date;
};

function visitId(request: NextRequest): string | null {
  return request.url.match(/\/visits\/([^/]+)\/acknowledgement/)?.[1] ?? null;
}

async function assertVisitAccess(id: string, session: AuthSession) {
  const visit = await portableQueryOne<{ id: string; assigned_user_id: string | null; status: string }>(
    `SELECT id, assigned_user_id, status FROM visits WHERE id = $1 AND account_id = $2`,
    [id, session.accountId],
  );
  if (!visit || (session.role === "tech" && visit.assigned_user_id !== session.userId)) return null;
  return visit;
}

export const GET = withAuth(async (request: NextRequest, session: AuthSession) => {
  const id = visitId(request);
  if (!id || !(await assertVisitAccess(id, session))) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "Visit not found", traceId: session.traceId } }, { status: 404 });
  }
  const acknowledgement = await portableQueryOne<AckRow>(
    `SELECT id, customer_name, customer_email, acknowledgement_notes, acknowledged_at
     FROM field_service_report_acknowledgements
     WHERE visit_id = $1 AND account_id = $2`,
    [id, session.accountId],
  );
  return NextResponse.json({ data: acknowledgement });
});

export const PUT = withAuth(async (request: NextRequest, session: AuthSession) => {
  const id = visitId(request);
  if (!id) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Visit not found", traceId: session.traceId } }, { status: 404 });
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Invalid acknowledgement", details: parsed.error.flatten().fieldErrors, traceId: session.traceId } }, { status: 422 });
  }
  try {
    const acknowledgement = await withPortableTransaction(async (client) => {
      const visitResult = await client.query<{ id: string; assigned_user_id: string | null; status: string }>(
        `SELECT id, assigned_user_id, status FROM visits WHERE id = $1 AND account_id = $2`,
        [id, session.accountId],
      );
      const visit = visitResult.rows[0];
      if (!visit || (session.role === "tech" && visit.assigned_user_id !== session.userId)) throw Object.assign(new Error("NOT_FOUND"), { status: 404 });
      if (visit.status !== "completed") throw Object.assign(new Error("NOT_COMPLETED"), { status: 409 });

      const existing = await client.query<{ id: string }>(
        `SELECT id FROM field_service_report_acknowledgements WHERE visit_id = $1 AND account_id = $2`,
        [id, session.accountId],
      );
      if (existing.rows[0]) {
        await client.query(
          `UPDATE field_service_report_acknowledgements
           SET customer_name = $1, customer_email = $2, acknowledgement_notes = $3,
               acknowledged_at = CURRENT_TIMESTAMP, captured_by = $4, updated_at = CURRENT_TIMESTAMP
           WHERE id = $5 AND account_id = $6`,
          [parsed.data.customer_name, parsed.data.customer_email || null, parsed.data.acknowledgement_notes || null, session.userId, existing.rows[0].id, session.accountId],
        );
      } else {
        await client.query(
          `INSERT INTO field_service_report_acknowledgements
           (id, account_id, visit_id, customer_name, customer_email, acknowledgement_notes, acknowledged_at, captured_by)
           VALUES ($1,$2,$3,$4,$5,$6,CURRENT_TIMESTAMP,$7)`,
          [randomUUID(), session.accountId, id, parsed.data.customer_name, parsed.data.customer_email || null, parsed.data.acknowledgement_notes || null, session.userId],
        );
      }
      const result = await client.query<AckRow>(
        `SELECT id, customer_name, customer_email, acknowledgement_notes, acknowledged_at
         FROM field_service_report_acknowledgements WHERE visit_id = $1 AND account_id = $2`,
        [id, session.accountId],
      );
      return result.rows[0];
    });
    return NextResponse.json({ data: acknowledgement });
  } catch (error) {
    const status = Number((error as { status?: number }).status ?? 500);
    if (status === 404) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Visit not found", traceId: session.traceId } }, { status });
    if (status === 409) return NextResponse.json({ error: { code: "NOT_COMPLETED", message: "Customer acknowledgement is available after visit completion", traceId: session.traceId } }, { status });
    logger.error("[visit acknowledgement PUT]", error, { traceId: session.traceId });
    return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: "Failed to save customer acknowledgement", traceId: session.traceId } }, { status: 500 });
  }
});
