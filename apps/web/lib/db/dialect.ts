import { getEnv } from "../env";

export type DatabaseDialect = "sqlite" | "postgres" | "mysql";

export function inferDatabaseDialect(databaseUrl: string): DatabaseDialect {
  const explicit = (process.env.DATABASE_DIALECT ?? process.env.DB_DIALECT)?.trim().toLowerCase();
  if (explicit === "sqlite" || explicit === "mysql" || explicit === "mariadb" || explicit === "postgres") {
    return explicit === "mariadb" ? "mysql" : explicit;
  }

  const protocol = new URL(databaseUrl).protocol.toLowerCase();
  if (protocol === "file:" || protocol === "sqlite:") return "sqlite";
  if (protocol === "mysql:" || protocol === "mariadb:") return "mysql";
  if (protocol === "postgres:" || protocol === "postgresql:") return "postgres";
  throw new Error(`[startup] Unsupported DATABASE_URL protocol: ${protocol}`);
}

export function getDatabaseDialect(): DatabaseDialect {
  const env = getEnv();
  return env.DATABASE_DIALECT === "mariadb"
    ? "mysql"
    : env.DATABASE_DIALECT ?? inferDatabaseDialect(env.DATABASE_URL);
}
