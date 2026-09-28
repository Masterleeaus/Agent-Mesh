import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import type { DbClient, DbQueryResult } from "@/lib/db-contract";
import { getEnv } from "../env";
import { rewriteSqliteParams } from "./sqlite-params";

let database: Database.Database | null = null;

function sqlitePath(databaseUrl: string): string {
  if (databaseUrl === "sqlite::memory:" || databaseUrl === "file::memory:") return ":memory:";
  const raw = databaseUrl.replace(/^(sqlite:|file:)/, "");
  return resolve(process.cwd(), raw.replace(/^\/\//, ""));
}

export function getSqliteDatabase(): Database.Database {
  if (database) return database;
  const path = sqlitePath(getEnv().DATABASE_URL);
  if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
  database = new Database(path);
  database.pragma("foreign_keys = ON");
  database.pragma("journal_mode = WAL");
  database.pragma("busy_timeout = 5000");
  database.pragma("synchronous = NORMAL");
  return database;
}

function sqliteClient(db: Database.Database): DbClient {
  return {
    dialect: "sqlite",
    async query<T = Record<string, unknown>>(text: string, params: unknown[] = []): Promise<DbQueryResult<T>> {
      const rewritten = rewriteSqliteParams(text, params);
      const statement = db.prepare(rewritten.sql);
      if (statement.reader) {
        const rows = statement.all(...rewritten.params) as T[];
        return { rows, rowCount: rows.length };
      }
      const result = statement.run(...rewritten.params);
      return { rows: [], rowCount: result.changes };
    },
  };
}

export function getSqliteClient(): DbClient {
  return sqliteClient(getSqliteDatabase());
}

export async function withSqliteTransaction<T>(fn: (client: DbClient) => Promise<T>): Promise<T> {
  const db = getSqliteDatabase();
  db.exec("BEGIN IMMEDIATE");
  try {
    const result = await fn(sqliteClient(db));
    db.exec("COMMIT");
    return result;
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}
