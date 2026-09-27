import { Pool } from "pg";
import type { PoolClient } from "pg";
import { getEnv } from "./env";
import type { SessionPayload } from "./auth/session";
import type { DbClient } from "@/lib/db-contract";
import { getDatabaseDialect as resolveDatabaseDialect } from "./db/dialect";
import { requireCompanyId } from "./db/contracts";

let pool: Pool | null = null;

/** PostgreSQL compatibility adapter. Canonical runtime callers should use query/withDbSession. */
export function getPool(): Pool {
  if (resolveDatabaseDialect() !== "postgres") {
    throw new Error("PostgreSQL pool requested while the active storage dialect is not postgres");
  }
  if (!pool) {
    pool = new Pool({ connectionString: getEnv().DATABASE_URL, max: 10 });
  }
  return pool;
}

export function getDatabaseDialect() {
  return resolveDatabaseDialect();
}

export async function query<T extends Record<string, unknown> = Record<string, unknown>>(
  text: string,
  params?: unknown[],
): Promise<T[]> {
  const { portableQuery } = await import("./db/portable");
  return portableQuery<T>(text, params);
}

export async function queryOne<T extends Record<string, unknown> = Record<string, unknown>>(
  text: string,
  params?: unknown[],
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}

export async function withDbSession<T>(
  session: SessionPayload,
  fn: (client: DbClient) => Promise<T>,
): Promise<T> {
  const companyId = requireCompanyId(session);
  const { withPortableTransaction } = await import("./db/portable");
  return withPortableTransaction(async (client) => {
    if (resolveDatabaseDialect() === "postgres") {
      await client.query(
        `SELECT set_config('app.current_user_id', $1, true),
                set_config('app.current_account_id', $2, true),
                set_config('app.current_role', $3, true)`,
        [session.userId, companyId, session.role],
      );
    }
    return fn(client);
  });
}

export async function queryForSession<
  T extends Record<string, unknown> = Record<string, unknown>,
>(
  session: SessionPayload,
  text: string,
  params?: unknown[],
): Promise<T[]> {
  requireCompanyId(session);
  return withDbSession(session, async (client) => (await client.query<T>(text, params)).rows);
}

export async function queryOneForSession<
  T extends Record<string, unknown> = Record<string, unknown>,
>(
  session: SessionPayload,
  text: string,
  params?: unknown[],
): Promise<T | null> {
  const rows = await queryForSession<T>(session, text, params);
  return rows[0] ?? null;
}

/** Explicit compatibility type for code that genuinely requires PostgreSQL. */
export type PostgresPoolClient = PoolClient;
