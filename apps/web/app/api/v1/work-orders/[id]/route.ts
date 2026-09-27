import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withAuth, type AuthSession } from "@/lib/auth/middleware";
import { portableQuery, withPortableTransaction } from "@/lib/db/portable";
import { canCreateEstimates } from "@/lib/auth/permissions";
import { logger } from "@/lib/logger";
import { WORK_ORDER_STATUSES } from "@/lib/work-orders/constants";
import {
  enforceDraftOnlyFromAssessment,
  validateWorkOrderCompletion,
  validateWorkOrderForeignKeys,
} from "@/lib/work-orders/validate";
import {
  loadWorkOrderCompletionCriteria,
  syncWorkOrderTasksFromCriteriaList,
} from "@/lib/work-orders/task-time";

export const dynamic = "force-dynamic";

function idFromPath(request: NextRequest): string | undefined {
  return request.nextUrl.pathname.split("/").at(-1);
}
function err(code: string, message: string, status: number, traceId: string) {
  return NextResponse.json({ error: { code, message, traceId } }, { status });
}

const materialSchema = z.object({
  description: z.string().min(1).max(500),
  quantity: z.number().positive(),
  unit_price_cents: z.number().int().nonnegative(),
  total_cents: z.number().int().nonnegative(),
});
const roomSchema = z.object({
  name: z.string().max(120),
  dimensions: z.string().max(120).nullable().optional(),
  description: z.string().max(1000),
});

// All fields optional — only what's sent is updated. materials, when present,
// replaces the set.
const patchSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  scope: z.string().max(5000).nullable().optional(),
  site_notes: z.string().max(2000).nullable().optional(),
  safety_notes: z.string().max(2000).nullable().optional(),
  rooms: z.array(roomSchema).optional(),
  status: z.enum(WORK_ORDER_STATUSES).optional(),
  notes: z.string().max(2000).nullable().optional(),
  job_id: z.string().uuid().nullable().optional(),
  property_id: z.string().uuid().nullable().optional(),
  materials: z.array(materialSchema).optional(),
  completion_criteria: z
    .array(
      z.object({
        id: z.string(),
        label: z.string().min(1),
        required: z.boolean(),
        completed: z.boolean(),
      }),
    )
    .optional(),
});

export const GET = withAuth(async (request: NextRequest, session: AuthSession) => {
  if (!canCreateEstimates(session.role)) return err("FORBIDDEN", "Not permitted", 403, session.traceId);
  const id = idFromPath(request);
  if (!id) return err("NOT_FOUND", "Work order not found", 404, session.traceId);
  try {
    const rows = await portableQuery<Record<string, unknown>>(
      `SELECT w.*, c.name AS client_name, p.address AS property_address, j.title AS job_title
       FROM work_orders w
       LEFT JOIN clients c ON c.id = w.client_id
       LEFT JOIN properties p ON p.id = w.property_id
       LEFT JOIN jobs j ON j.id = w.job_id
       WHERE w.id = $1 AND w.account_id = $2`,
      [id, session.accountId],
    );
    const wo = rows[0];
    if (!wo) return err("NOT_FOUND", "Work order not found", 404, session.traceId);
    const materials = await portableQuery<Record<string, unknown>>(
      `SELECT id, description, quantity, unit_price_cents, total_cents, sort_order
       FROM work_order_materials WHERE work_order_id = $1 ORDER BY sort_order ASC`,
      [id],
    );
    return NextResponse.json({ data: { work_order: wo, materials } });
  } catch (error) {
    logger.error("GET /api/v1/work-orders/[id] error", error, { traceId: session.traceId });
    return err("INTERNAL_ERROR", "Failed to load work order", 500, session.traceId);
  }
});

export const PATCH = withAuth(async (request: NextRequest, session: AuthSession) => {
  if (!canCreateEstimates(session.role)) return err("FORBIDDEN", "Not permitted", 403, session.traceId);
  const id = idFromPath(request);
  if (!id) return err("NOT_FOUND", "Work order not found", 404, session.traceId);
  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return err("VALIDATION_ERROR", "Invalid request", 400, session.traceId);
  const d = parsed.data;

  try {
    const result = await withPortableTransaction(async (client) => {
      const existing = await client.query<{
        id: string;
        client_id: string;
        job_id: string | null;
        source_visit_id: string | null;
        source_assessment_id: string | null;
        status: string;
        completion_criteria: unknown;
      }>(
        `SELECT id, client_id, job_id, source_visit_id, source_assessment_id, status,
                completion_criteria
         FROM work_orders WHERE id = $1 AND account_id = $2 FOR UPDATE`,
        [id, session.accountId],
      );
      if (existing.rows.length === 0) return { kind: "missing" as const };
      const wo = existing.rows[0];

      const nextJobId = d.job_id !== undefined ? d.job_id : wo.job_id;
      const nextStatus = d.status ?? wo.status;
      const draftErr = enforceDraftOnlyFromAssessment({
        status: nextStatus,
        job_id: nextJobId,
        source_visit_id: wo.source_visit_id,
        source_assessment_id: wo.source_assessment_id,
      });
      if (draftErr) return { kind: "invalid" as const, message: draftErr, status: 400 };

      if (d.job_id !== undefined || d.property_id !== undefined) {
        const fkErr = await validateWorkOrderForeignKeys(client, session.accountId, {
          client_id: wo.client_id,
          job_id: nextJobId,
          property_id: d.property_id,
        });
        if (fkErr) return { kind: "invalid" as const, message: fkErr, status: 400 };
      }

      if (nextStatus === "completed" && wo.status !== "completed") {
        const criteria =
          d.completion_criteria ??
          (await loadWorkOrderCompletionCriteria(
            client,
            id,
            session.accountId,
            wo.completion_criteria,
          ));
        const completionErr = await validateWorkOrderCompletion(
          client,
          id,
          session.accountId,
          criteria,
        );
        if (completionErr) return { kind: "invalid" as const, message: completionErr, status: 422 };
      }

      const fields: string[] = [];
      const values: unknown[] = [];
      const add = (column: string, value: unknown) => {
        values.push(value);
        fields.push(`${column} = $${values.length}`);
      };

      if (d.title !== undefined) add("title", d.title);
      if (d.scope !== undefined) add("scope", d.scope);
      if (d.site_notes !== undefined) add("site_notes", d.site_notes);
      if (d.safety_notes !== undefined) add("safety_notes", d.safety_notes);
      if (d.rooms !== undefined) add("rooms", JSON.stringify(d.rooms));
      if (d.status !== undefined) {
        add("status", d.status);
        fields.push(
          d.status === "completed"
            ? "completed_at = COALESCE(completed_at, CURRENT_TIMESTAMP)"
            : "completed_at = NULL",
        );
      }
      if (d.notes !== undefined) add("notes", d.notes);
      if (d.job_id !== undefined) add("job_id", d.job_id);
      if (d.property_id !== undefined) add("property_id", d.property_id);
      if (d.completion_criteria !== undefined) {
        add("completion_criteria", JSON.stringify(d.completion_criteria));
      }

      if (fields.length > 0) {
        fields.push("updated_at = CURRENT_TIMESTAMP");
        values.push(id, session.accountId);
        await client.query(
          `UPDATE work_orders SET ${fields.join(", ")}
           WHERE id = $${values.length - 1} AND account_id = $${values.length}`,
          values,
        );
      }

      if (d.completion_criteria !== undefined) {
        await syncWorkOrderTasksFromCriteriaList(client, {
          accountId: session.accountId,
          workOrderId: id,
          criteria: d.completion_criteria,
          source: "manual",
        });
      }

      if (d.materials !== undefined) {
        const materials = d.materials.filter((m) => m.description.trim().length > 0);
        await client.query(`DELETE FROM work_order_materials WHERE work_order_id = $1`, [id]);
        for (let i = 0; i < materials.length; i++) {
          const m = materials[i];
          await client.query(
            `INSERT INTO work_order_materials (work_order_id, description, quantity, unit_price_cents, total_cents, sort_order)
             VALUES ($1,$2,$3,$4,$5,$6)`,
            [id, m.description, m.quantity, m.unit_price_cents, m.total_cents, i],
          );
        }
        const total = materials.reduce((sum, m) => sum + m.total_cents, 0);
        await client.query(
          `UPDATE work_orders SET total_cents = $1, updated_at = CURRENT_TIMESTAMP
           WHERE id = $2 AND account_id = $3`,
          [total, id, session.accountId],
        );
      }

      return { kind: "updated" as const };
    });

    if (result.kind === "missing") return err("NOT_FOUND", "Work order not found", 404, session.traceId);
    if (result.kind === "invalid") {
      return err("VALIDATION_ERROR", result.message, result.status, session.traceId);
    }
    return NextResponse.json({ data: { id } });
  } catch (error) {
    logger.error("PATCH /api/v1/work-orders/[id] error", error, { traceId: session.traceId });
    return err("INTERNAL_ERROR", "Failed to update work order", 500, session.traceId);
  }
});

/**
 * Delete an unused work order (draft or cancelled, no visits).
 * Visits.work_order_id is RESTRICT — never delete WOs that still own field days.
 */
export const DELETE = withAuth(async (request: NextRequest, session: AuthSession) => {
  if (!canCreateEstimates(session.role)) {
    return err("FORBIDDEN", "Not permitted", 403, session.traceId);
  }
  const id = idFromPath(request);
  if (!id) return err("NOT_FOUND", "Work order not found", 404, session.traceId);

  try {
    const result = await withPortableTransaction(async (client) => {
      const existing = await client.query<{
        id: string;
        status: string;
        visit_count: number | string;
      }>(
        `SELECT w.id, w.status,
                (SELECT COUNT(*) FROM visits v WHERE v.work_order_id = w.id) AS visit_count
         FROM work_orders w
         WHERE w.id = $1 AND w.account_id = $2
         FOR UPDATE`,
        [id, session.accountId],
      );
      const wo = existing.rows[0];
      if (!wo) return { kind: "missing" as const };

      const visits = Number(wo.visit_count) || 0;
      if (visits > 0) return { kind: "visits" as const, visits };
      if (wo.status !== "draft" && wo.status !== "cancelled") {
        return { kind: "status" as const, status: wo.status };
      }

      await client.query(
        `UPDATE visit_candidates SET work_order_id = NULL WHERE work_order_id = $1 AND account_id = $2`,
        [id, session.accountId],
      );
      await client.query(
        `DELETE FROM work_orders WHERE id = $1 AND account_id = $2`,
        [id, session.accountId],
      );
      return { kind: "deleted" as const };
    });

    if (result.kind === "missing") return err("NOT_FOUND", "Work order not found", 404, session.traceId);
    if (result.kind === "visits") {
      return err(
        "CONFLICT",
        `Cannot delete a work order that has ${result.visits} visit${result.visits === 1 ? "" : "s"}. Move or cancel those field days first.`,
        409,
        session.traceId,
      );
    }
    if (result.kind === "status") {
      return err(
        "CONFLICT",
        `Only draft or cancelled work orders can be deleted (current: ${result.status}). Cancel it first if unused.`,
        409,
        session.traceId,
      );
    }
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    logger.error("DELETE /api/v1/work-orders/[id] error", error, { traceId: session.traceId });
    return err("INTERNAL_ERROR", "Failed to delete work order", 500, session.traceId);
  }
});
