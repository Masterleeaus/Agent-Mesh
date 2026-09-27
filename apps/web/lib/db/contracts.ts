import type { SessionPayload } from "../auth/session";

export type SqlValue = string | number | boolean | Date | Buffer | null;

export interface QueryResult<Row extends Record<string, unknown> = Record<string, unknown>> {
  rows: Row[];
  affectedRows?: number;
  insertId?: string | number;
}

export interface DbExecutor {
  query<Row extends Record<string, unknown> = Record<string, unknown>>(
    sql: string,
    params?: readonly unknown[],
  ): Promise<QueryResult<Row>>;
}

export interface TransactionExecutor extends DbExecutor {
  commit(): Promise<void>;
  rollback(): Promise<void>;
  release(): void;
}

export interface TenantDbContext {
  session: SessionPayload;
  db: DbExecutor;
}

/**
 * Portable tenant invariant. PostgreSQL RLS remains defense-in-depth while
 * MySQL/MariaDB modules must enforce account_id explicitly in every query.
 */
export function requireTenantAccountId(session: SessionPayload): string {
  if (!session.accountId) throw new Error("Tenant account context is required");
  return session.accountId;
}

export function assertTenantRow(
  session: SessionPayload,
  row: { account_id?: unknown } | null | undefined,
): void {
  if (!row) return;
  if (row.account_id !== session.accountId) {
    throw new Error("Cross-tenant row access blocked");
  }
}
