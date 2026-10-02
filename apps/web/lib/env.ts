import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required").default("file:./data/titan-zero.db"),
  DATABASE_DIALECT: z.enum(["sqlite", "postgres", "mysql", "mariadb"]).optional(),
  REDIS_URL: z.string().optional(),
  AUTH_SECRET: z.string().min(32, "AUTH_SECRET must be at least 32 characters — generate with: openssl rand -hex 32"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  TITAN_DEPLOYMENT_PROFILE: z.enum(["local", "test", "vps", "compatibility"]).default("local"),
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
}).superRefine((environment, context) => {
  if (environment.TITAN_DEPLOYMENT_PROFILE === "local") {
    if (environment.DATABASE_DIALECT && environment.DATABASE_DIALECT !== "sqlite") {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["DATABASE_DIALECT"], message: "local profile requires SQLite" });
    }
    if (!environment.DATABASE_URL.startsWith("file:")) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["DATABASE_URL"], message: "local profile requires a file-backed SQLite URL" });
    }
  }
  if (environment.TITAN_DEPLOYMENT_PROFILE === "vps") {
    if (environment.NODE_ENV !== "production") {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["NODE_ENV"], message: "VPS profile requires production mode" });
    }
    if (environment.DATABASE_DIALECT !== "sqlite") {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["DATABASE_DIALECT"], message: "VPS profile requires SQLite" });
    }
    if (!environment.DATABASE_URL.startsWith("file:")) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["DATABASE_URL"], message: "VPS profile requires a file-backed SQLite URL" });
    }
  }
});

let cachedEnv: ReturnType<typeof schema.parse> | null = null;

export function getEnv() {
  if (cachedEnv) return cachedEnv;
  if (process.env.NEXT_PHASE === "phase-production-build") {
    cachedEnv = schema.parse({
      DATABASE_URL: "file:./data/titan-zero.db",
      DATABASE_DIALECT: "sqlite",
      TITAN_DEPLOYMENT_PROFILE: "local",
      AUTH_SECRET: "placeholder-secret-must-be-at-least-32-characters!!",
      NODE_ENV: "production",
    });
    return cachedEnv;
  }
  const inferredProfile = process.env.NODE_ENV === "test" ? "test"
    : process.env.NODE_ENV === "production" ? "compatibility" : "local";
  const result = schema.safeParse({
    ...process.env,
    TITAN_DEPLOYMENT_PROFILE: process.env.TITAN_DEPLOYMENT_PROFILE ?? inferredProfile,
  });
  if (!result.success) {
    const messages = result.error.issues.map((i) => `  • ${i.path.join(".")}: ${i.message}`).join("\n");
    throw new Error(`[startup] Environment configuration error:\n${messages}`);
  }
  cachedEnv = result.data;
  return cachedEnv;
}

export function _resetEnvCache(): void {
  cachedEnv = null;
}
