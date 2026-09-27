/**
 * Database-portable contract used by domain/services code.
 *
 * Deliberately structural: PostgreSQL, SQLite and MySQL/MariaDB adapters can
 * satisfy the same contract without leaking provider-specific client types
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

export type DatabaseDialect = "sqlite" | "postgres" | "mysql";

export function normalizeDatabaseDialect(value: string | undefined): DatabaseDialect {
  const normalized = (value ?? "postgres").trim().toLowerCase();
  if (normalized === "sqlite") return "sqlite";
  if (normalized === "postgres" || normalized === "postgresql") return "postgres";
  if (normalized === "mysql" || normalized === "mariadb") return "mysql";
  throw new Error(`Unsupported DATABASE_DIALECT: ${value}`);
}

export function resolveDatabaseDialect(
  explicit: string | undefined,
  databaseUrl?: string,
): DatabaseDialect {
  if (explicit?.trim()) return normalizeDatabaseDialect(explicit);
  if (databaseUrl) {
    try {
      const protocol = new URL(databaseUrl).protocol.toLowerCase();
      if (protocol === "file:" || protocol === "sqlite:") return "sqlite";
      if (protocol === "mysql:" || protocol === "mariadb:") return "mysql";
      if (protocol === "postgres:" || protocol === "postgresql:") return "postgres";
    } catch {
      // Fall through to the existing PostgreSQL default; env validation reports
      // malformed URLs at the connection boundary.
    }
  }
  return "postgres";
}

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
