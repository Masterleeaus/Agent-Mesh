import type { DbClient } from "@/lib/db-contract";
import type { CompletionCriterion } from "@ai-fsm/domain";
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
     WHERE id = $1 AND account_id = $2 AND assigned_user_id = $3 FOR UPDATE`,
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