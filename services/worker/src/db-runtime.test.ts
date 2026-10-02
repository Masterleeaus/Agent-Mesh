import { afterEach, describe, expect, it } from "vitest";
import { createWorkerDatabaseClient, resolveWorkerDeploymentProfile } from "./db-runtime.js";

const originalDialect = process.env.DATABASE_DIALECT;
const originalDatabaseUrl = process.env.DATABASE_URL;
const originalSqlitePath = process.env.SQLITE_PATH;
const originalProfile = process.env.TITAN_DEPLOYMENT_PROFILE;
const originalNodeEnv = process.env.NODE_ENV;

afterEach(() => {
  if (originalDialect === undefined) delete process.env.DATABASE_DIALECT;
  else process.env.DATABASE_DIALECT = originalDialect;
  if (originalDatabaseUrl === undefined) delete process.env.DATABASE_URL;
  else process.env.DATABASE_URL = originalDatabaseUrl;
  if (originalSqlitePath === undefined) delete process.env.SQLITE_PATH;
  else process.env.SQLITE_PATH = originalSqlitePath;
  if (originalProfile === undefined) delete process.env.TITAN_DEPLOYMENT_PROFILE;
  else process.env.TITAN_DEPLOYMENT_PROFILE = originalProfile;
  if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
  else process.env.NODE_ENV = originalNodeEnv;
});

describe("worker database runtime", () => {
  it("boots and executes using SQLite with no DATABASE_URL", async () => {
    delete process.env.DATABASE_DIALECT;
    delete process.env.DATABASE_URL;
    process.env.SQLITE_PATH = ":memory:";

    const client = await createWorkerDatabaseClient();
    try {
      expect(client.dialect).toBe("sqlite");
      await client.query("CREATE TABLE boot_probe (company_id TEXT NOT NULL, value TEXT NOT NULL)");
      await client.query("INSERT INTO boot_probe(company_id,value) VALUES($1,$2)", ["company-a", "ready"]);
      const result = await client.query<{ value: string }>("SELECT value FROM boot_probe WHERE company_id=$1", ["company-a"]);
      expect(result.rows).toEqual([{ value: "ready" }]);
    } finally {
      await client.close();
    }
  });

  it("preserves repeated and out-of-order positional bindings in SQLite", async () => {
    process.env.DATABASE_DIALECT = "sqlite";
    process.env.SQLITE_PATH = ":memory:";

    const client = await createWorkerDatabaseClient();
    try {
      const result = await client.query<{ second: string; first: string; repeated: string }>(
        "SELECT $2 AS second, $1 AS first, $2 AS repeated",
        ["one", "two"],
      );
      expect(result.rows).toEqual([{ second: "two", first: "one", repeated: "two" }]);
    } finally {
      await client.close();
    }
  });

  it("accepts a VPS worker profile only with production SQLite settings", () => {
    process.env.NODE_ENV = "production";
    process.env.TITAN_DEPLOYMENT_PROFILE = "vps";
    process.env.DATABASE_DIALECT = "sqlite";
    process.env.DATABASE_URL = "file:/app/data/titan-zero.sqlite";
    expect(resolveWorkerDeploymentProfile()).toBe("vps");
  });

  it("rejects a VPS worker pointed at a shared PostgreSQL URL without exposing it", () => {
    process.env.NODE_ENV = "production";
    process.env.TITAN_DEPLOYMENT_PROFILE = "vps";
    process.env.DATABASE_DIALECT = "postgres";
    process.env.DATABASE_URL = "postgresql://user:secret@db.example/ai_fsm";
    let message = "";
    try { resolveWorkerDeploymentProfile(); } catch (error) { message = error instanceof Error ? error.message : String(error); }
    expect(message).toMatch(/requires-sqlite:vps:DATABASE_DIALECT/);
    expect(message).not.toContain("secret");
    expect(message).not.toContain("db.example");
  });

  it("keeps explicit compatibility mode available for legacy database providers", () => {
    process.env.TITAN_DEPLOYMENT_PROFILE = "compatibility";
    process.env.DATABASE_DIALECT = "postgres";
    process.env.DATABASE_URL = "postgresql://user:secret@db.example/legacy";
    expect(resolveWorkerDeploymentProfile()).toBe("compatibility");
  });

  it("rejects unknown deployment profiles without echoing values", () => {
    process.env.TITAN_DEPLOYMENT_PROFILE = "secret-profile-name";
    expect(() => resolveWorkerDeploymentProfile()).toThrow("worker-deployment-profile-invalid:TITAN_DEPLOYMENT_PROFILE");
  });

  it("validates a URL passed directly to the worker database constructor", async () => {
    process.env.TITAN_DEPLOYMENT_PROFILE = "local";
    process.env.DATABASE_DIALECT = "sqlite";
    delete process.env.DATABASE_URL;
    await expect(createWorkerDatabaseClient("postgresql://user:secret@db.example/ai_fsm"))
      .rejects.toThrow("worker-deployment-profile-requires-file-sqlite-url:local:DATABASE_URL");
  });
});
