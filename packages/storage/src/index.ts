import Database from "better-sqlite3";

export type StorageDialect = "sqlite" | "postgres" | "mysql";
export interface QueryResult<T = Record<string, unknown>> { rows: T[]; rowCount: number; }
export interface StorageClient {
  readonly dialect: StorageDialect;
  query<T = Record<string, unknown>>(sql: string, params?: readonly unknown[]): Promise<QueryResult<T>>;
  transaction<T>(fn: (tx: StorageClient) => Promise<T>): Promise<T>;
  close(): Promise<void>;
}
export interface CompanyStorage {
  readonly companyId: string;
  query<T = Record<string, unknown>>(sql: string, params?: readonly unknown[]): Promise<QueryResult<T>>;
  transaction<T>(fn: (tx: CompanyStorage) => Promise<T>): Promise<T>;
}

export function requireCompanyId(value: string | undefined | null): string {
  const companyId = value?.trim();
  if (!companyId) throw new Error("company_id is required for company-scoped storage");
  return companyId;
}

export function normalizeCompanyContext(input: { company_id?: string; tenant_company_id?: string; tenant_id?: string }): string {
  return requireCompanyId(input.company_id ?? input.tenant_company_id ?? input.tenant_id);
}

function sqliteSql(sql: string): string { return sql.replace(/\$(\d+)/g, "?$1"); }

export function createSqliteStorage(filename = process.env.SQLITE_PATH ?? ".titan/data/titan-zero.db"): StorageClient {
  const db = new Database(filename);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.pragma("busy_timeout = 5000");
  db.pragma("synchronous = NORMAL");

  const client: StorageClient = {
    dialect: "sqlite",
    async query<T>(sql: string, params: readonly unknown[] = []) {
      const statement = db.prepare(sqliteSql(sql));
      if (statement.reader) {
        const rows = statement.all(...params) as T[];
        return { rows, rowCount: rows.length };
      }
      const result = statement.run(...params);
      return { rows: [], rowCount: result.changes };
    },
    async transaction<T>(fn: (tx: StorageClient) => Promise<T>) {
      db.exec("BEGIN IMMEDIATE");
      try { const result = await fn(client); db.exec("COMMIT"); return result; }
      catch (error) { db.exec("ROLLBACK"); throw error; }
    },
    async close() { db.close(); },
  };
  return client;
}

export function forCompany(storage: StorageClient, rawCompanyId: string): CompanyStorage {
  const companyId = requireCompanyId(rawCompanyId);
  return {
    companyId,
    query(sql, params = []) { return storage.query(sql, params); },
    transaction(fn) { return storage.transaction(() => fn(forCompany(storage, companyId))); },
  };
}
