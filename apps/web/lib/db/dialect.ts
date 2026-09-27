import { getEnv } from "../env";

export type DatabaseDialect = "postgres" | "mysql";

export function inferDatabaseDialect(databaseUrl: string): DatabaseDialect {
  const explicit = process.env.DB_DIALECT?.trim().toLowerCase();
  if (explicit === "mysql" || explicit === "postgres") return explicit;

  const protocol = new URL(databaseUrl).protocol.toLowerCase();
  if (protocol === "mysql:" || protocol === "mariadb:") return "mysql";
  if (protocol === "postgres:" || protocol === "postgresql:") return "postgres";
  throw new Error(`[startup] Unsupported DATABASE_URL protocol: ${protocol}`);
}

export function getDatabaseDialect(): DatabaseDialect {
  const env = getEnv();
  return env.DB_DIALECT ?? inferDatabaseDialect(env.DATABASE_URL);
}
