import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withAuth, type AuthSession } from "@/lib/auth/middleware";
import { withPortableTransaction } from "@/lib/db/portable";
import { canCreateEstimates } from "@/lib/auth/permissions";
import { logger } from "@/lib/logger";
import { seedWorkOrderTasksFromCriteria } from "@/lib/work-orders/task-time";

export const dynamic = "force-dynamic";
const splitSchema = z.object({ title: z.string().min(1).max(200).optional() });
function workOrderIdFromPath(request: NextRequest): string | undefined {
  const parts = request.nextUrl.pathname.split("/");
  const idx = parts.indexOf("work-orders");
  return idx >= 0 ? parts[idx + 1] : undefined;
}

export const POST = withAuth(async (request: NextRequest, session: AuthSession) => {
  if (!canCreateEstimates(session.role)) return NextResponse.json({ error: { code: "FORBIDDEN", message: "Not permitted", traceId: session.traceId } }, { status: 403 });
  const id = workOrderIdFromPath(request);
  if (!id) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Work order not found", traceId: session.traceId } }, { status: 404 });
  const parsed = splitSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Invalid request", traceId: session.traceId } }, { status: 400 });

  try {
    const result = await withPortableTransaction(async (client) => {
      const sourceRes = await client.query<{
        account_id: string; client_id: string; job_id: string | null; property_id: string | null; title: string;
        scope: string | null; site_notes: string | null; safety_notes: string | null; rooms: unknown; notes: string | null;
        completion_criteria: unknown; source_estimate_id: string | null; status: string;
      }>(
        `SELECT account_id, client_id, job_id, property_id, title, scope, site_notes, safety_notes, rooms, notes,
                completion_criteria, source_estimate_id, status
           FROM work_orders WHERE id = $1 AND account_id = $2 FOR UPDATE`,
        [id, session.accountId],
      );
      const source = sourceRes.rows[0];
      if (!source) return { kind: "not_found" as const };
      if (!source.job_id || source.status === "draft") return { kind: "precondition" as const };

      const newTitle = parsed.data.title?.trim() || `${source.title} (split)`;
      const newId = randomUUID();
      await client.query(
        `INSERT INTO work_orders
           (id, account_id, client_id, job_id, property_id, title, scope, site_notes, safety_notes, rooms, status, notes,
            completion_criteria, source_estimate_id, created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'ready',$11,$12,$13,$14)`,
        [newId, source.account_id, source.client_id, source.job_id, source.property_id, newTitle, source.scope, source.site_notes,
          source.safety_notes, JSON.stringify(source.rooms ?? []), source.notes, JSON.stringify(source.completion_criteria ?? []),
          source.source_estimate_id, session.userId],
      );
      await seedWorkOrderTasksFromCriteria(client, { accountId: session.accountId, workOrderId: newId, criteria: source.completion_criteria ?? [], source: "manual" });

      const mats = await client.query<{ description: string; quantity: number; unit_price_cents: number; total_cents: number; sort_order: number }>(
        `SELECT description, quantity, unit_price_cents, total_cents, sort_order
           FROM work_order_materials WHERE work_order_id = $1 ORDER BY sort_order`, [id],
      );
      let totalCents = 0;
      for (const m of mats.rows) {
        await client.query(
          `INSERT INTO work_order_materials (work_order_id, description, quantity, unit_price_cents, total_cents, sort_order)
           VALUES ($1,$2,$3,$4,$5,$6)`,
          [newId, m.description, m.quantity, m.unit_price_cents, m.total_cents, m.sort_order],
        );
        totalCents += m.total_cents;
      }
      await client.query(`UPDATE work_orders SET total_cents = $1 WHERE id = $2 AND account_id = $3`, [totalCents, newId, session.accountId]);
      return { kind: "ok" as const, id: newId, title: newTitle };
    });
    if (result.kind === "not_found") return NextResponse.json({ error: { code: "NOT_FOUND", message: "Work order not found", traceId: session.traceId } }, { status: 404 });
    if (result.kind === "precondition") return NextResponse.json({ error: { code: "PRECONDITION_FAILED", message: "Only project-linked work orders can be split", traceId: session.traceId } }, { status: 422 });
    return NextResponse.json({ data: { id: result.id, title: result.title } }, { status: 201 });
  } catch (error) {
    logger.error("POST /api/v1/work-orders/[id]/split error", error, { traceId: session.traceId });
    return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: "Failed to split work order", traceId: session.traceId } }, { status: 500 });
  }
});
