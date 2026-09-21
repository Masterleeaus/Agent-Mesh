/**
 * Create a default schedulable work order for a project (e.g. quick-book).
 */

import { randomUUID } from "crypto";
import type { DbClient } from "@/lib/db-contract";

export async function createDefaultWorkOrderForJob({
  client,
  accountId,
  clientId,
  jobId,
  title,
  scope,
  createdBy,
}: {
  client: DbClient;
  accountId: string;
  clientId: string;
  jobId: string;
  title: string;
  scope?: string | null;
  createdBy: string;
}): Promise<string> {
  // Generate UUID in the application so the insert behaves identically on
  // PostgreSQL and MySQL/MariaDB without relying on dialect-specific row-return clauses.
  const id = randomUUID();
  await client.query(
    `INSERT INTO work_orders (id, account_id, client_id, job_id, title, scope, status, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, 'ready', $7)`,
    [id, accountId, clientId, jobId, title, scope ?? null, createdBy],
  );
  return id;
}
