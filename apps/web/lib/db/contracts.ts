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

/** Canonical Titan persistence boundary. Legacy tenant/account identifiers normalize here. */
export interface CompanyContext {
  companyId: string;
  userId?: string;
}

export interface CompanyDbContext {
  company: CompanyContext;
  db: DbExecutor;
}

export function normalizeCompanyId(input: {
  companyId?: string | null;
  accountId?: string | null;
  tenantCompanyId?: string | null;
  tenantId?: string | null;
}): string {
  const values = [input.companyId, input.accountId, input.tenantCompanyId, input.tenantId]
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    .map((value) => value.trim());
  const distinct = [...new Set(values)];
  if (distinct.length === 0) throw new Error("company_id context is required");
  if (distinct.length > 1) throw new Error("Conflicting company identifiers rejected");
  return distinct[0];
}

/** Session accountId is a compatibility input only; storage receives canonical company_id. */
export function requireCompanyId(session: SessionPayload): string {
  return normalizeCompanyId({
    companyId: "companyId" in session ? (session as SessionPayload & { companyId?: string }).companyId : undefined,
    accountId: session.accountId,
  });
}

/** @deprecated Use requireCompanyId. Kept temporarily for compatibility callers. */
export const requireTenantAccountId = requireCompanyId;

export function assertCompanyRow(
  companyId: string,
  row: { company_id?: unknown; account_id?: unknown } | null | undefined,
): void {
  if (!row) return;
  const rowCompanyId = row.company_id ?? row.account_id;
  if (rowCompanyId !== companyId) throw new Error("Cross-company row access blocked");
}

/** @deprecated Normalize to company_id and use assertCompanyRow. */
export function assertTenantRow(session: SessionPayload, row: { company_id?: unknown; account_id?: unknown } | null | undefined): void {
  assertCompanyRow(requireCompanyId(session), row);
}
