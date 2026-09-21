import { describe, expect, it } from "vitest";
import {
  resolveDatabaseDialect,
  rewriteNumberedParamsForMysql,
} from "./db-contract";

describe("database portability contract", () => {
  it("infers MySQL/MariaDB from DATABASE_URL when no explicit dialect is set", () => {
    expect(resolveDatabaseDialect(undefined, "mysql://user:pass@db/app")).toBe("mysql");
    expect(resolveDatabaseDialect(undefined, "mariadb://user:pass@db/app")).toBe("mysql");
    expect(resolveDatabaseDialect(undefined, "postgresql://user:pass@db/app")).toBe("postgres");
  });

  it("lets the explicit dialect override URL inference", () => {
    expect(resolveDatabaseDialect("postgres", "mysql://user:pass@db/app")).toBe("postgres");
    expect(resolveDatabaseDialect("mariadb", "postgres://user:pass@db/app")).toBe("mysql");
  });

  it("expands repeated and reordered PostgreSQL placeholders for MySQL", () => {
    expect(
      rewriteNumberedParamsForMysql(
        "SELECT * FROM t WHERE account_id = $2 AND id = $1 OR parent_id = $1",
        ["row-1", "tenant-9"],
      ),
    ).toEqual({
      sql: "SELECT * FROM t WHERE account_id = ? AND id = ? OR parent_id = ?",
      params: ["tenant-9", "row-1", "row-1"],
    });
  });

  it("fails closed when SQL references a missing parameter", () => {
    expect(() => rewriteNumberedParamsForMysql("SELECT $2", ["only-one"])).toThrow(
      "SQL placeholder $2 has no matching parameter",
    );
  });
});
