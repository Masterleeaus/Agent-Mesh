import { describe, expect, it } from "vitest";
import { DatabaseSync } from "node:sqlite";
import { rewriteSqliteParams } from "./sqlite-params";

describe("SQLite parameter rewriting", () => {
  it("binds repeated and out-of-order parameters to their numbered values", () => {
    const db = new DatabaseSync(":memory:");
    try {
      const rewritten = rewriteSqliteParams(
        "SELECT $2 AS later, $1 AS first, $2 AS repeated",
        ["one", "two"],
      );
      expect({ ...db.prepare(rewritten.sql).get(...rewritten.params) }).toEqual({
        later: "two",
        first: "one",
        repeated: "two",
      });
    } finally {
      db.close();
    }
  });

  it("refuses an unbound numbered parameter", () => {
    expect(() => rewriteSqliteParams("SELECT $2", ["one"])).toThrow(/not bound/);
  });
});
