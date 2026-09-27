/**
 * Database-portable contract used by domain/services code.
 *
 * Deliberately structural: PostgreSQL PoolClient satisfies this today, while a
 * MySQL/MariaDB adapter can satisfy the same contract without leaking pg types
 * through the Business Ops codebase.
 */
export interface DbQueryResult<T = Record<string, unknown>> {
  rows: T[];
  rowCount?: number | null;
}

export interface DbClient {
  readonly dialect?: DatabaseDialect;
  query<T = Record<string, unknown>>(text: string, params?: unknown[]): Promise<DbQueryResult<T>>;
}

export type DatabaseDialect = "postgres" | "mysql";

export function normalizeDatabaseDialect(value: string | undefined): DatabaseDialect {
  const normalized = (value ?? "postgres").trim().toLowerCase();
  if (normalized === "postgres" || normalized === "postgresql") return "postgres";
  if (normalized === "mysql" || normalized === "mariadb") return "mysql";
  throw new Error(`Unsupported DATABASE_DIALECT: ${value}`);
}

/**
 * Resolve the database dialect from an explicit setting first, then from the
 * DATABASE_URL protocol. This keeps local PostgreSQL installs working while a
 * standalone Titan Business Ops deployment can use mysql:// / mariadb://
 * without needing an extension-specific bootstrap step.
 */
export function resolveDatabaseDialect(
  explicit: string | undefined,
  databaseUrl?: string,
): DatabaseDialect {
  if (explicit?.trim()) return normalizeDatabaseDialect(explicit);
  if (databaseUrl) {
    try {
      const protocol = new URL(databaseUrl).protocol.toLowerCase();
      if (protocol === "mysql:" || protocol === "mariadb:") return "mysql";
      if (protocol === "postgres:" || protocol === "postgresql:") return "postgres";
    } catch {
      // Fall through to the existing PostgreSQL default; env validation will
      // report malformed URLs at the connection boundary.
    }
  }
  return "postgres";
}

/**
 * Convert PostgreSQL-style numbered placeholders to MySQL `?` placeholders.
 *
 * The parameter list is expanded in placeholder order, which is important for
 * queries that reuse or reorder placeholders (for example `$2 ... $1 ... $2`).
 * A naive regex replacement with the original params array silently binds the
 * wrong values in those cases.
 */
export function rewriteNumberedParamsForMysql(
  text: string,
  params: readonly unknown[] = [],
): { sql: string; params: unknown[] } {
  const expanded: unknown[] = [];
  const sql = text.replace(/\$(\d+)/g, (_match, rawIndex: string) => {
    const index = Number(rawIndex) - 1;
    if (!Number.isInteger(index) || index < 0 || index >= params.length) {
      throw new Error(`SQL placeholder $${rawIndex} has no matching parameter`);
    }
    expanded.push(params[index]);
    return "?";
  });
  return { sql, params: expanded };
}
