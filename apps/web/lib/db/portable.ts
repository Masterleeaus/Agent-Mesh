import type { PoolClient } from "pg";
import type { PoolConnection } from "mysql2/promise";
import { getDatabaseDialect, getPool } from "@/lib/db";
import { getMysqlPool } from "./mysql";
import { rewriteNumberedParamsForMysql, type DbClient, type DbQueryResult } from "@/lib/db-contract";
import type { SessionPayload } from "@/lib/auth/session";
import { requireTenantAccountId } from "./contracts";

function mysqlClient(connection: PoolConnection): DbClient {
  return {
    async query<T = Record<string, unknown>>(text: string, params: unknown[] = []): Promise<DbQueryResult<T>> {
      const rewritten = rewriteNumberedParamsForMysql(text, params);
      const [result] = await connection.execute(rewritten.sql, rewritten.params);
      if (Array.isArray(result)) return { rows: result as T[], rowCount: result.length };
      const packet = result as { affectedRows?: number; insertId?: number };
      return { rows: [], rowCount: packet.affectedRows ?? 0 };
    },
  };
}

export async function portableQuery<T extends Record<string, unknown> = Record<string, unknown>>(
  text: string,
  params: unknown[] = [],
): Promise<T[]> {
  if (getDatabaseDialect() === "mysql") {
    const rewritten = rewriteNumberedParamsForMysql(text, params);
    const [rows] = await getMysqlPool().execute(rewritten.sql, rewritten.params);
    return rows as T[];
  }
  const result = await getPool().query<T>(text, params);
  return result.rows;
}

export async function portableQueryOne<T extends Record<string, unknown> = Record<string, unknown>>(
  text: string,
  params: unknown[] = [],
): Promise<T | null> {
  const rows = await portableQuery<T>(text, params);
  return rows[0] ?? null;
}

export async function withPortableTransaction<T>(fn: (client: DbClient) => Promise<T>): Promise<T> {
  if (getDatabaseDialect() === "mysql") {
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

/**
 * Portable tenant transaction. PostgreSQL keeps RLS as defense-in-depth;
 * MySQL/MariaDB receives the same explicit account id so callers must scope
 * every business query in application SQL.
 */
export async function withTenantTransaction<T>(
  session: SessionPayload,
  fn: (client: DbClient, accountId: string) => Promise<T>,
): Promise<T> {
  const accountId = requireTenantAccountId(session);
  return withPortableTransaction(async (client) => {
    if (getDatabaseDialect() === "postgres") {
      await client.query(
        `SELECT set_config('app.current_user_id', $1, true),
                set_config('app.current_account_id', $2, true),
                set_config('app.current_role', $3, true)`,
        [session.userId, accountId, session.role],
      );
    }
    return fn(client, accountId);
  });
}
