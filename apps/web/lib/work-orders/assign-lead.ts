import type { DbClient } from "@/lib/db-contract";

/** Set WO lead from visit scheduling; overwrites when visit assignee is explicit. */
export async function syncWorkOrderLeadFromVisit(
  client: DbClient,
  workOrderId: string,
  accountId: string,
  assignedUserId: string | null | undefined,
): Promise<void> {
  if (!assignedUserId) return;
  await client.query(
    `UPDATE work_orders SET assigned_user_id = $3, updated_at = now()
     WHERE id = $1 AND account_id = $2`,
    [workOrderId, accountId, assignedUserId],
  );
}