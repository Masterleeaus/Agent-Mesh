import type { DbClient } from "@/lib/db-contract";

export type ExpenseAttribution = {
  job_id: string | null;
  client_id: string | null;
  property_id: string | null;
};

/**
 * Resolve expense attribution inside the tenant transaction.
 * A linked job is authoritative for its client/property; callers cannot attach
 * a job expense to a different customer's commercial history.
 */
export async function resolveExpenseAttribution(
  client: DbClient,
  accountId: string,
  input: { jobId?: string | null; clientId?: string | null },
): Promise<ExpenseAttribution> {
  if (!input.jobId) {
    return { job_id: null, client_id: input.clientId ?? null, property_id: null };
  }
  const job = await client.query<{ id: string; client_id: string; property_id: string | null }>(
    `SELECT id, client_id, property_id
     FROM jobs WHERE id = $1 AND account_id = $2`,
    [input.jobId, accountId],
  );
  const row = job.rows[0];
  if (!row) throw Object.assign(new Error("Job not found"), { code: "INVALID_JOB" });
  if (input.clientId && input.clientId !== row.client_id) {
    throw Object.assign(new Error("Job belongs to a different client"), { code: "ATTRIBUTION_MISMATCH" });
  }
  return { job_id: row.id, client_id: row.client_id, property_id: row.property_id };
}
