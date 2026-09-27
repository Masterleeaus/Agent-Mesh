import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

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

function sqliteSql(sql: string, params: readonly unknown[]): { sql: string; params: unknown[] } {
  const expanded: unknown[] = [];
  const text = sql.replace(/\$(\d+)/g, (_match, rawIndex: string) => {
    const index = Number(rawIndex) - 1;
    if (index < 0 || index >= params.length) throw new Error(`sqlite parameter $${rawIndex} is not bound`);
    expanded.push(params[index]);
    return "?";
  });
  return { sql: text, params: expanded };
}

function ensureSqliteParent(filename: string): void {
  if (filename === ":memory:" || filename.startsWith("file:")) return;
  const parent = dirname(filename);
  if (parent && parent !== ".") mkdirSync(parent, { recursive: true });
}

export function createSqliteStorage(filename = process.env.SQLITE_PATH ?? ".titan/data/titan-zero.db"): StorageClient {
  ensureSqliteParent(filename);
  const db = new Database(filename);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.pragma("busy_timeout = 5000");
  db.pragma("synchronous = NORMAL");

  const client: StorageClient = {
    dialect: "sqlite",
    async query<T>(sql: string, params: readonly unknown[] = []) {
      const rewritten = sqliteSql(sql, params);
      const statement = db.prepare(rewritten.sql);
      if (statement.reader) {
        const rows = statement.all(...rewritten.params) as T[];
        return { rows, rowCount: rows.length };
      }
      const result = statement.run(...rewritten.params);
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
