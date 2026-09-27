import { Client as PgClient } from "pg";
import mysql, { type PoolConnection } from "mysql2/promise";
import Database from "better-sqlite3";
import type { DatabaseClient, DatabaseDialect, DatabaseQueryResult } from "./db-client.js";

export interface WorkerDatabaseClient extends DatabaseClient {
  dialect: DatabaseDialect;
  close(): Promise<void>;
}

export function normalizeWorkerDialect(value: string | undefined): DatabaseDialect {
  const normalized = (value ?? "sqlite").trim().toLowerCase();
  if (normalized === "sqlite" || normalized === "sqlite3") return "sqlite";
  if (normalized === "postgres" || normalized === "postgresql") return "postgres";
  if (normalized === "mysql" || normalized === "mariadb") return "mysql";
  throw new Error(`Unsupported DATABASE_DIALECT: ${value}`);
}

function rewritePositionalSql(text: string, params: unknown[] = []): { sql: string; params: unknown[] } {
  const expanded: unknown[] = [];
  const sql = text.replace(/\$(\d+)/g, (_match, rawIndex: string) => {
    expanded.push(params[Number(rawIndex) - 1]);
    return "?";
  });
  return { sql, params: expanded };
}

class SqliteWorkerClient implements WorkerDatabaseClient {
  readonly dialect: DatabaseDialect = "sqlite";
  constructor(private readonly db: Database.Database) {}
  async query<T = Record<string, unknown>>(text: string, params: unknown[] = []): Promise<DatabaseQueryResult<T>> {
    const { sql, params: rewritten } = rewritePositionalSql(text, params);
    const stmt = this.db.prepare(sql);
    if (stmt.reader) {
      const rows = stmt.all(...rewritten) as T[];
      return { rows, rowCount: rows.length };
    }
    const result = stmt.run(...rewritten);
    return { rows: [], rowCount: result.changes };
  }
  async close(): Promise<void> { this.db.close(); }
}

class PgWorkerClient implements WorkerDatabaseClient {
  readonly dialect: DatabaseDialect = "postgres";
  constructor(private readonly client: PgClient) {}
  async query<T = Record<string, unknown>>(text: string, params: unknown[] = []): Promise<DatabaseQueryResult<T>> {
    const result = await this.client.query(text, params);
    return { rows: result.rows as T[], rowCount: result.rowCount };
  }
  async close(): Promise<void> { await this.client.end(); }
}

class MysqlWorkerClient implements WorkerDatabaseClient {
  readonly dialect: DatabaseDialect = "mysql";
  constructor(private readonly connection: PoolConnection) {}
  async query<T = Record<string, unknown>>(text: string, params: unknown[] = []): Promise<DatabaseQueryResult<T>> {
    const { sql, params: rewritten } = rewritePositionalSql(text, params);
    const [result] = await this.connection.execute(sql, rewritten as Parameters<PoolConnection["execute"]>[1]);
    if (Array.isArray(result)) return { rows: result as T[], rowCount: result.length };
    const packet = result as { affectedRows?: number };
    return { rows: [], rowCount: packet.affectedRows ?? 0 };
  }
  async close(): Promise<void> { this.connection.release(); }
}

export async function createWorkerDatabaseClient(databaseUrl?: string): Promise<WorkerDatabaseClient> {
  const dialect = normalizeWorkerDialect(process.env.DATABASE_DIALECT);
  if (dialect === "sqlite") {
    const path = process.env.SQLITE_PATH ?? (databaseUrl?.startsWith("file:") ? databaseUrl.slice(5) : databaseUrl) ?? "./data/titan-zero.sqlite";
    const db = new Database(path);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
    return new SqliteWorkerClient(db);
  }
  if (!databaseUrl) throw new Error("DATABASE_URL is required for non-SQLite worker storage");
  if (dialect === "mysql") {
    const pool = mysql.createPool({ uri: databaseUrl, connectionLimit: Number(process.env.WORKER_DB_POOL_SIZE ?? "2"), enableKeepAlive: true, decimalNumbers: true });
    const connection = await pool.getConnection();
    const client = new MysqlWorkerClient(connection);
    const close = client.close.bind(client);
    client.close = async () => { await close(); await pool.end(); };
    return client;
  }
  const pg = new PgClient({ connectionString: databaseUrl });
  await pg.connect();
  pg.on("error", () => { /* surfaced by query/reconnect path */ });
  return new PgWorkerClient(pg);
}
