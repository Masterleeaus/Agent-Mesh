import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withAuth, type AuthSession } from "@/lib/auth/middleware";
import { withPortableTransaction } from "@/lib/db/portable";
import {
  loadSelectableTasksForJob,
  loadVisitPlannedTasks,
  markTaskPartialWithRemainder,
  setVisitPlannedTasks,
} from "@/lib/work-orders/job-tasks";
import { applyTaskCompletionToggles, mirrorTasksToCompletionCriteria } from "@/lib/work-orders/task-time";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

function visitIdFrom(request: NextRequest): string | null {
  return request.url.match(/\/visits\/([^/]+)\/tasks/)?.[1] ?? null;
}

/** GET /api/v1/visits/[id]/tasks?selectable=1 */
export const GET = withAuth(async (request: NextRequest, session: AuthSession) => {
  const visitId = visitIdFrom(request);
  if (!visitId) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Visit not found", traceId: session.traceId } }, { status: 404 });
  const wantSelectable = new URL(request.url).searchParams.get("selectable") === "1";
  try {
    const data = await withPortableTransaction(async (client) => {
      const visit = await client.query<{ job_id: string; work_order_id: string | null }>(
        `SELECT job_id, work_order_id FROM visits WHERE id = $1 AND account_id = $2`,
        [visitId, session.accountId],
      );
      if (!visit.rows[0]) return null;
      const tasks = await loadVisitPlannedTasks(client, visitId, session.accountId);
      const selectable = wantSelectable
        ? await loadSelectableTasksForJob(client, visit.rows[0].job_id, session.accountId, visit.rows[0].work_order_id)
        : undefined;
      return { tasks, selectable };
    });
    if (!data) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Visit not found", traceId: session.traceId } }, { status: 404 });
    return NextResponse.json({ data });
  } catch (err) {
    logger.error("GET visit tasks", err, { traceId: session.traceId });
    return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: "Could not load day tasks", traceId: session.traceId } }, { status: 500 });
  }
});

const putBody = z.object({ task_ids: z.array(z.string().uuid()).max(100) });

/** PUT /api/v1/visits/[id]/tasks — replace planned tasks for this field day. */
export const PUT = withAuth(async (request: NextRequest, session: AuthSession) => {
  const visitId = visitIdFrom(request);
  if (!visitId) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Visit not found", traceId: session.traceId } }, { status: 404 });
  const parsed = putBody.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Invalid body", traceId: session.traceId } }, { status: 422 });
  try {
    const data = await withPortableTransaction(async (client) => {
      const visit = await client.query<{ job_id: string; work_order_id: string | null }>(
        `SELECT job_id, work_order_id FROM visits WHERE id = $1 AND account_id = $2 FOR UPDATE`,
        [visitId, session.accountId],
      );
      if (!visit.rows[0]) return null;
      await setVisitPlannedTasks(client, {
        accountId: session.accountId,
        visitId,
        jobId: visit.rows[0].job_id,
        workOrderId: visit.rows[0].work_order_id,
        taskIds: parsed.data.task_ids,
      });
      return { tasks: await loadVisitPlannedTasks(client, visitId, session.accountId) };
    });
    if (!data) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Visit not found", traceId: session.traceId } }, { status: 404 });
    return NextResponse.json({ data });
  } catch (err) {
    logger.error("PUT visit tasks", err, { traceId: session.traceId });
    return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: err instanceof Error ? err.message : "Could not save day tasks", traceId: session.traceId } }, { status: 422 });
  }
});

const patchBody = z.discriminatedUnion("action", [
  z.object({ action: z.literal("done"), task_id: z.string().uuid() }),
  z.object({ action: z.literal("partial"), task_id: z.string().uuid(), remainder_label: z.string().min(2).max(300), note: z.string().max(1000).optional() }),
  z.object({ action: z.literal("complete").optional(), task_id: z.string().uuid(), completed: z.boolean() }),
]);

/** PATCH /api/v1/visits/[id]/tasks — done/partial/legacy completion mutation. */
export const PATCH = withAuth(async (request: NextRequest, session: AuthSession) => {
  const visitId = visitIdFrom(request);
  if (!visitId) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Visit not found", traceId: session.traceId } }, { status: 404 });
  const body = await request.json().catch(() => null);
  const normalized = body && typeof body === "object" && !("action" in body) && "completed" in body
    ? { ...body, action: body.completed ? "done" : "reopen" }
    : body;
  const parsed = z.union([patchBody, z.object({ action: z.literal("reopen"), task_id: z.string().uuid() })]).safeParse(normalized);
  if (!parsed.success) return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Invalid body", traceId: session.traceId } }, { status: 422 });

  try {
    const result = await withPortableTransaction(async (client) => {
      const data = parsed.data as { action?: string; task_id: string; completed?: boolean; remainder_label?: string; note?: string };
      const link = await client.query<{ work_order_id: string; completed: boolean; status: string }>(
        `SELECT t.work_order_id, t.completed, t.status
           FROM visit_tasks vt
           JOIN work_order_tasks t ON t.id = vt.task_id AND t.account_id = vt.account_id
          WHERE vt.visit_id = $1 AND vt.account_id = $2 AND vt.task_id = $3`,
        [visitId, session.accountId, data.task_id],
      );
      if (!link.rows[0]) return { kind: "not_found" as const };

      const workOrderId = link.rows[0].work_order_id;
      const alreadyDone = link.rows[0].completed || link.rows[0].status === "done";
      const action = data.action === "done" || data.completed === true ? "done"
        : data.action === "partial" ? "partial"
        : data.action === "reopen" || data.completed === false ? "reopen" : "done";
      if (alreadyDone && action !== "done") return { kind: "locked" as const };

      let remainderId: string | null = null;
      if (action === "done") {
        await applyTaskCompletionToggles(client, { workOrderId, accountId: session.accountId, toggles: [{ id: data.task_id, completed: true }] });
      } else if (action === "partial") {
        const partial = await markTaskPartialWithRemainder(client, {
          accountId: session.accountId, workOrderId, taskId: data.task_id,
          remainderLabel: data.remainder_label ?? "", note: data.note ?? null,
        });
        remainderId = partial.remainderId;
        await client.query(
          `INSERT INTO visit_tasks (id, account_id, visit_id, task_id) VALUES ($1, $2, $3, $4)`,
          [randomUUID(), session.accountId, visitId, remainderId],
        );
      } else {
        await applyTaskCompletionToggles(client, { workOrderId, accountId: session.accountId, toggles: [{ id: data.task_id, completed: false }] });
      }
      await mirrorTasksToCompletionCriteria(client, workOrderId, session.accountId);
      const tasks = await loadVisitPlannedTasks(client, visitId, session.accountId);
      return { kind: "ok" as const, tasks, remainder_task_id: remainderId };
    });
    if (result.kind === "not_found") return NextResponse.json({ error: { code: "NOT_FOUND", message: "Task is not planned on this day", traceId: session.traceId } }, { status: 404 });
    if (result.kind === "locked") return NextResponse.json({ error: { code: "PRECONDITION_FAILED", message: "This task is done and cannot be changed. Work remaining belongs on a follow-up task.", traceId: session.traceId } }, { status: 422 });
    return NextResponse.json({ data: { tasks: result.tasks, remainder_task_id: result.remainder_task_id } });
  } catch (err) {
    logger.error("PATCH visit tasks", err, { traceId: session.traceId });
    return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: err instanceof Error ? err.message : "Could not update task", traceId: session.traceId } }, { status: 422 });
  }
});
