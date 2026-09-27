import { afterEach, describe, expect, it } from "vitest";
import { createWorkerDatabaseClient } from "./db-runtime.js";

const originalDialect = process.env.DATABASE_DIALECT;
const originalDatabaseUrl = process.env.DATABASE_URL;
const originalSqlitePath = process.env.SQLITE_PATH;

afterEach(() => {
  if (originalDialect === undefined) delete process.env.DATABASE_DIALECT;
  else process.env.DATABASE_DIALECT = originalDialect;
  if (originalDatabaseUrl === undefined) delete process.env.DATABASE_URL;
  else process.env.DATABASE_URL = originalDatabaseUrl;
  if (originalSqlitePath === undefined) delete process.env.SQLITE_PATH;
  else process.env.SQLITE_PATH = originalSqlitePath;
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
});
