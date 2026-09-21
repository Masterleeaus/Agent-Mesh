import mysql, { type Pool, type PoolConnection } from "mysql2/promise";
import { getEnv } from "../env";
import type { SessionPayload } from "../auth/session";
import { requireTenantAccountId, type DbExecutor, type QueryResult } from "./contracts";

let mysqlPool: Pool | null = null;

export function getMysqlPool(): Pool {
  if (!mysqlPool) {
    mysqlPool = mysql.createPool({
      uri: getEnv().DATABASE_URL,
      connectionLimit: 10,
      enableKeepAlive: true,
      decimalNumbers: true,
    });
  }
  return mysqlPool;
}

function executor(connection: PoolConnection): DbExecutor {
  return {
    async query<Row extends Record<string, unknown>>(sql: string, params: readonly unknown[] = []): Promise<QueryResult<Row>> {
      const [result] = await connection.execute(sql, [...params]);
      if (Array.isArray(result)) return { rows: result as Row[] };
      const packet = result as { affectedRows?: number; insertId?: number };
      return { rows: [], affectedRows: packet.affectedRows, insertId: packet.insertId };
    },
  };
}

export async function withMysqlTransaction<T>(fn: (db: DbExecutor) => Promise<T>): Promise<T> {
  const connection = await getMysqlPool().getConnection();
  try {
    await connection.beginTransaction();
    const result = await fn(executor(connection));
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * MySQL has no PostgreSQL-style per-request RLS session policy here. The
 * account id is therefore a mandatory application-level query input.
 */
export async function withMysqlTenantSession<T>(
  session: SessionPayload,
  fn: (db: DbExecutor, accountId: string) => Promise<T>,
): Promise<T> {
  const accountId = requireTenantAccountId(session);
  return withMysqlTransaction((db) => fn(db, accountId));
}
