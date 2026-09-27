import { z } from "zod";

const schema = z.object({
  // SQLite is the canonical local-first persistence target. PostgreSQL/MySQL
  // remain compatibility/import deployment options.
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required").default("file:./data/titan-zero.db"),
  DATABASE_DIALECT: z.enum(["sqlite", "postgres", "mysql", "mariadb"]).optional(),
  REDIS_URL: z.string().optional(),
  /** AUTH_SECRET must be at least 32 characters. Generate with: openssl rand -hex 32 */
  AUTH_SECRET: z.string().min(32, "AUTH_SECRET must be at least 32 characters — generate with: openssl rand -hex 32"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PAPERLESS_URL: z.string().url().optional(),
  PAPERLESS_API_TOKEN: z.string().optional(),
  HOMEBOX_URL: z.string().url().optional(),
  HOMEBOX_USER: z.string().optional(),
  HOMEBOX_PASSWORD: z.string().optional(),
  APP_ENCRYPTION_KEY: z.string().optional(),
  SQUARE_WEBHOOK_URL: z.string().url().optional(),
  BOOKING_ACCOUNT_ID: z.string().uuid().optional(),
  VAPID_PUBLIC_KEY: z.string().optional(),
  VAPID_PRIVATE_KEY: z.string().optional(),
  VAPID_SUBJECT: z.string().optional(),
});

let cachedEnv: ReturnType<typeof schema.parse> | null = null;

export function getEnv() {
  if (cachedEnv) return cachedEnv;

  if (process.env.NEXT_PHASE === "phase-production-build") {
    cachedEnv = schema.parse({
      DATABASE_URL: "file:./data/titan-zero.db",
      DATABASE_DIALECT: "sqlite",
      AUTH_SECRET: "placeholder-secret-must-be-at-least-32-characters!!",
      NODE_ENV: "production",
    });
    return cachedEnv;
  }

  const result = schema.safeParse(process.env);
  if (!result.success) {
    const messages = result.error.issues
      .map((i) => `  • ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`[startup] Environment configuration error:\n${messages}`);
  }

  cachedEnv = result.data;
  return cachedEnv;
}

/** Reset the cached result. Test use only. */
export function _resetEnvCache(): void {
  cachedEnv = null;
}
