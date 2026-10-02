import type { DbClient } from "@/lib/db-contract";
import type { CompletionCriterion } from "@titan-zero/domain";
import { withPortableTransaction } from "@/lib/db/portable";
import type { SessionPayload } from "@/lib/auth/session";

export async function setDbSessionContext(
  _client: DbClient,
  _session: Pick<SessionPayload, "userId" | "accountId" | "role">,
): Promise<void> {
  // Portable field-operation queries carry explicit account/user predicates.
  // Retained as a compatibility hook for callers/tests; no dialect session state required.
}

export async function withLeadWorkOrderContext<T>(
  _session: Pick<SessionPayload, "userId" | "accountId" | "role">,
  fn: (client: DbClient) => Promise<T>,
): Promise<T> {
  return withPortableTransaction(fn);
}

export async function assertAssignedLead(
  client: DbClient,
  workOrderId: string,
  accountId: string,
  userId: string,
): Promise<{ id: string; status: string; completion_criteria: unknown } | null> {
  const res = await client.query<{ id: string; status: string; completion_criteria: unknown }>(
    `SELECT id, status, completion_criteria FROM work_orders
     WHERE id = $1 AND account_id = $2 AND assigned_user_id = $3${client.dialect === "sqlite" ? "" : " FOR UPDATE"}`,
    [workOrderId, accountId, userId],
  );
  return res.rows[0] ?? null;
}

/** Apply client completion toggles; preserve server-owned label/required fields. */
export function mergeCompletionCriteriaToggles(
  existing: CompletionCriterion[],
  toggles: Array<{ id: string; completed: boolean }>,
): CompletionCriterion[] | { error: string } {
  const toggleById = new Map(toggles.map((t) => [t.id, t.completed]));
  for (const id of toggleById.keys()) {
    if (!existing.some((c) => c.id === id)) {
      return { error: `Unknown completion criterion: ${id}` };
    }
  }
  return existing.map((c) =>
    toggleById.has(c.id) ? { ...c, completed: toggleById.get(c.id)! } : c,
  );
}
/** Shared completion operation; callers must supply a transaction-scoped client. */
export async function completeAssignedWorkOrder(client: DbClient, id: string, companyId: string, actorId: string, authorityFence?: { assertCurrent(): void }) {
  const { loadWorkOrderCompletionCriteria } = await import("./task-time");
  const { validateWorkOrderCompletion } = await import("./validate");
  const wo = await assertAssignedLead(client, id, companyId, actorId);
  if (!wo) return { kind: "forbidden" as const };
  if (wo.status === "completed") return { kind: "ok" as const, status: "completed" as const };
  const active = await client.query(
    "SELECT 1 FROM visits WHERE work_order_id=$1 AND account_id=$2 AND status IN ('dispatched','traveling','arrived','in_progress','waiting') LIMIT 1",
    [id, companyId],
  );
  if (active.rowCount) return { kind: "active_visit" as const };
  const criteria = await loadWorkOrderCompletionCriteria(client, id, companyId, wo.completion_criteria);
  const message = await validateWorkOrderCompletion(client, id, companyId, criteria);
  if (message) return { kind: "gate" as const, message };
  authorityFence?.assertCurrent();
  await client.query(
    "UPDATE work_orders SET status='completed', completed_at=COALESCE(completed_at,CURRENT_TIMESTAMP), updated_at=CURRENT_TIMESTAMP WHERE id=$1 AND account_id=$2 AND assigned_user_id=$3 AND status <> 'completed'",
    [id, companyId, actorId],
  );
  return { kind: "ok" as const, status: "completed" as const };
}
