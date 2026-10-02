import type { Client as PgConnection } from "pg";
import type { PoolConnection } from "mysql2/promise";
import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import type { DatabaseClient, DatabaseDialect, DatabaseQueryResult } from "./db-client.js";

export interface WorkerDatabaseClient extends DatabaseClient {
  dialect: DatabaseDialect;
  close(): Promise<void>;
}

export type WorkerDeploymentProfile = "local" | "test" | "vps" | "compatibility";

export function resolveWorkerDeploymentProfile(environment: NodeJS.ProcessEnv = process.env): WorkerDeploymentProfile {
  const inferred = environment.NODE_ENV === "test" ? "test"
    : environment.NODE_ENV === "production" ? "compatibility" : "local";
  const profile = environment.TITAN_DEPLOYMENT_PROFILE ?? inferred;
  if (profile !== "local" && profile !== "test" && profile !== "vps" && profile !== "compatibility") {
    throw new Error("worker-deployment-profile-invalid:TITAN_DEPLOYMENT_PROFILE");
  }
  const dialect = normalizeWorkerDialect(environment.DATABASE_DIALECT);
  if (profile === "local" || profile === "test" || profile === "vps") {
    if (dialect !== "sqlite") throw new Error(`worker-deployment-profile-requires-sqlite:${profile}:DATABASE_DIALECT`);
    const url = environment.DATABASE_URL;
    if (url !== undefined && url !== "" && !url.startsWith("file:")) {
      throw new Error(`worker-deployment-profile-requires-file-sqlite-url:${profile}:DATABASE_URL`);
    }
  }
  if (profile === "vps" && environment.NODE_ENV !== "production") {
    throw new Error("worker-deployment-profile-requires-production:vps:NODE_ENV");
  }
  return profile;
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
    const index = Number(rawIndex) - 1;
    if (index < 0 || index >= params.length) throw new Error(`sqlite/mysql parameter $${rawIndex} is not bound`);
    expanded.push(params[index]);
    return "?";
  });
  return { sql, params: expanded };
}

function ensureSqliteParent(path: string): void {
  if (path === ":memory:" || path.startsWith("file:")) return;
  const parent = dirname(path);
  if (parent && parent !== ".") mkdirSync(parent, { recursive: true });
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
  constructor(private readonly client: PgConnection) {}
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
  const configuredUrl = databaseUrl ?? process.env.DATABASE_URL;
  resolveWorkerDeploymentProfile({ ...process.env, DATABASE_URL: configuredUrl });
  const dialect = normalizeWorkerDialect(process.env.DATABASE_DIALECT);
  if (dialect === "sqlite") {
    const path = process.env.SQLITE_PATH ?? (configuredUrl?.startsWith("file:") ? configuredUrl.slice(5) : configuredUrl) ?? "./data/titan-zero.sqlite";
    ensureSqliteParent(path);
    const db = new Database(path);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
    db.pragma("busy_timeout = 5000");
    db.pragma("synchronous = NORMAL");
    return new SqliteWorkerClient(db);
  }
  if (!configuredUrl) throw new Error("DATABASE_URL is required for non-SQLite worker storage");
  if (dialect === "mysql") {
    const { default: mysql } = await import("mysql2/promise");
    const pool = mysql.createPool({ uri: configuredUrl, connectionLimit: Number(process.env.WORKER_DB_POOL_SIZE ?? "2"), enableKeepAlive: true, decimalNumbers: true });
    const connection = await pool.getConnection();
    const client = new MysqlWorkerClient(connection);
    const close = client.close.bind(client);
    client.close = async () => { await close(); await pool.end(); };
    return client;
  }
  const { Client: PgClient } = await import("pg");
  const pg = new PgClient({ connectionString: configuredUrl });
  await pg.connect();
  pg.on("error", () => { /* surfaced by query/reconnect path */ });
  return new PgWorkerClient(pg);
}
