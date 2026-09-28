import type { PoolClient } from "pg";
import type { PoolConnection } from "mysql2/promise";
import * as dbModule from "@/lib/db";
import { getPool } from "@/lib/db";
import { getDatabaseDialect as configuredDatabaseDialect } from "./dialect";
import { getMysqlPool } from "./mysql";
import { getSqliteClient, withSqliteTransaction } from "./sqlite";
import { rewriteNumberedParamsForMysql, type DbClient, type DbQueryResult } from "@/lib/db-contract";
import type { SessionPayload } from "@/lib/auth/session";
import { requireTenantAccountId } from "./contracts";

function resolveDatabaseDialect(): "sqlite" | "mysql" | "postgres" {
  try {
    return configuredDatabaseDialect();
  } catch {
    return "postgres";
  }
}

function mysqlClient(connection: PoolConnection): DbClient {
  return {
    async query<T = Record<string, unknown>>(text: string, params: unknown[] = []): Promise<DbQueryResult<T>> {
      const rewritten = rewriteNumberedParamsForMysql(text, params);
      const execute = connection.execute as unknown as (sql: string, params: unknown[]) => Promise<[unknown, unknown]>;
      const [result] = await execute(rewritten.sql, rewritten.params);
      if (Array.isArray(result)) return { rows: result as T[], rowCount: result.length };
      const packet = result as { affectedRows?: number; insertId?: number };
      return { rows: [], rowCount: packet.affectedRows ?? 0 };
    },
  };
}

export async function portableQuery<T = Record<string, unknown>>(text: string, params: unknown[] = []): Promise<T[]> {
  const dialect = resolveDatabaseDialect();
  if (dialect === "sqlite") return (await getSqliteClient().query<T>(text, params)).rows;
  if (dialect === "mysql") {
    const rewritten = rewriteNumberedParamsForMysql(text, params);
    const execute = getMysqlPool().execute as unknown as (sql: string, params: unknown[]) => Promise<[unknown, unknown]>;
    const [rows] = await execute(rewritten.sql, rewritten.params);
    return rows as T[];
  }
  let configuredQuery: unknown;
  try {
    configuredQuery = (dbModule as { query?: unknown }).query;
  } catch {
    configuredQuery = undefined;
  }
  if (typeof configuredQuery === "function") {
    const result = await (configuredQuery as (sql: string, params: unknown[]) => Promise<T[]>)(text, params);
    return result;
  }
  const query = getPool().query as unknown as (
    sql: string,
    params: unknown[],
  ) => Promise<{ rows?: T[] } | T[]>;
  const result = await query(text, params);
  return Array.isArray(result) ? result : (result.rows ?? []);
}

export async function portableQueryOne<T = Record<string, unknown>>(text: string, params: unknown[] = []): Promise<T | null> {
  let configuredQueryOne: unknown;
  try {
    configuredQueryOne = (dbModule as { queryOne?: unknown }).queryOne;
  } catch {
    configuredQueryOne = undefined;
  }
  if (typeof configuredQueryOne === "function") {
    return await (configuredQueryOne as (sql: string, params: unknown[]) => Promise<T | null>)(text, params);
  }
  const rows = await portableQuery<T>(text, params);
  return rows[0] ?? null;
}

export async function withPortableTransaction<T>(fn: (client: DbClient) => Promise<T>): Promise<T> {
  const dialect = resolveDatabaseDialect();
  if (dialect === "sqlite") return withSqliteTransaction(fn);
  if (dialect === "mysql") {
    const connection = await getMysqlPool().getConnection();
    try {
      await connection.beginTransaction();
      const result = await fn(mysqlClient(connection));
      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
  const client: PoolClient = await getPool().connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function withTenantTransaction<T>(session: SessionPayload, fn: (client: DbClient, accountId: string) => Promise<T>): Promise<T> {
  const accountId = requireTenantAccountId(session);
  return withPortableTransaction(async (client) => {
    if (resolveDatabaseDialect() === "postgres") {
      await client.query(
        `SELECT set_config('app.current_user_id', $1, true), set_config('app.current_account_id', $2, true), set_config('app.current_role', $3, true)`,
        [session.userId, accountId, session.role],
      );
    }
    return fn(client, accountId);
  });
}
