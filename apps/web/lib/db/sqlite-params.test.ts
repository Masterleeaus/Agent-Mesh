import { test } from "vitest";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { rewriteSqliteParams } from "./sqlite-params";

test("SQLite binds repeated and out-of-order parameters to their numbered values", () => {
  const db = new DatabaseSync(":memory:");
  try {
    const rewritten = rewriteSqliteParams("SELECT $2 AS later, $1 AS first, $2 AS repeated", ["one", "two"]);
    assert.deepEqual({ ...db.prepare(rewritten.sql).get(...rewritten.params) }, { later: "two", first: "one", repeated: "two" });
  } finally { db.close(); }
});

test("SQLite refuses an unbound numbered parameter", () => {
  assert.throws(() => rewriteSqliteParams("SELECT $2", ["one"]), /not bound/);
});
