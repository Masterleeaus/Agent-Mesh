import { Client as PgClient } from "pg";
import mysql, { type PoolConnection } from "mysql2/promise";
import type { DatabaseClient, DatabaseDialect, DatabaseQueryResult } from "./db-client.js";

export interface WorkerDatabaseClient extends DatabaseClient {
  dialect: DatabaseDialect;
  close(): Promise<void>;
}

export function normalizeWorkerDialect(value: string | undefined): DatabaseDialect {
  const normalized = (value ?? "postgres").trim().toLowerCase();
  if (normalized === "postgres" || normalized === "postgresql") return "postgres";
  if (normalized === "mysql" || normalized === "mariadb") return "mysql";
  throw new Error(`Unsupported DATABASE_DIALECT: ${value}`);
}

function rewriteMysqlSql(text: string, params: unknown[] = []): { sql: string; params: unknown[] } {
  const expanded: unknown[] = [];
  const sql = text.replace(/\$(\d+)/g, (_match, rawIndex: string) => {
    const index = Number(rawIndex) - 1;
    expanded.push(params[index]);
    return "?";
  });
  return { sql, params: expanded };
}

class PgWorkerClient implements WorkerDatabaseClient {
  readonly dialect: DatabaseDialect = "postgres";
  constructor(private readonly client: PgClient) {}
  async query<T = Record<string, unknown>>(text: string, params: unknown[] = []): Promise<DatabaseQueryResult<T>> {
    const result = await this.client.query<T>(text, params);
    return { rows: result.rows, rowCount: result.rowCount };
  }
  async close(): Promise<void> { await this.client.end(); }
}

class MysqlWorkerClient implements WorkerDatabaseClient {
  readonly dialect: DatabaseDialect = "mysql";
  constructor(private readonly connection: PoolConnection) {}
  async query<T = Record<string, unknown>>(text: string, params: unknown[] = []): Promise<DatabaseQueryResult<T>> {
    const { sql, params: rewritten } = rewriteMysqlSql(text, params);
    const [result] = await this.connection.execute(sql, rewritten);
    if (Array.isArray(result)) return { rows: result as T[], rowCount: result.length };
    const packet = result as { affectedRows?: number };
    return { rows: [], rowCount: packet.affectedRows ?? 0 };
  }
  async close(): Promise<void> { this.connection.release(); }
}

export async function createWorkerDatabaseClient(databaseUrl: string): Promise<WorkerDatabaseClient> {
  const dialect = normalizeWorkerDialect(process.env.DATABASE_DIALECT);
  if (dialect === "mysql") {
    const pool = mysql.createPool({
      uri: databaseUrl,
      connectionLimit: Number(process.env.WORKER_DB_POOL_SIZE ?? "2"),
      enableKeepAlive: true,
      decimalNumbers: true,
    });
    const connection = await pool.getConnection();
    const client = new MysqlWorkerClient(connection);
    const close = client.close.bind(client);
    client.close = async () => {
      await close();
      await pool.end();
    };
    return client;
  }

  const pg = new PgClient({ connectionString: databaseUrl });
  await pg.connect();
  pg.on("error", () => { /* surfaced by query/reconnect path */ });
  return new PgWorkerClient(pg);
}
