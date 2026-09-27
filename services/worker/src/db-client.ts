/** Database-portable worker query contract. SQLite is the canonical local/runtime dialect. */
export type DatabaseDialect = "sqlite" | "postgres" | "mysql";

export interface DatabaseQueryResult<T = Record<string, unknown>> {
  rows: T[];
  rowCount?: number | null;
}

export interface DatabaseClient {
  readonly dialect?: DatabaseDialect;
  query<T = Record<string, unknown>>(text: string, params?: unknown[]): Promise<DatabaseQueryResult<T>>;
}

export function databaseDialect(client: DatabaseClient): DatabaseDialect {
  return client.dialect ?? "sqlite";
}
