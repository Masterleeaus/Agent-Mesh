import assert from "node:assert/strict";
import test from "node:test";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { checkMigrationPrefixes, filenamesFromDir, GRANDFATHERED } from "./check-migration-prefixes.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("current grandfathered sets pass", () => {
  const files = Object.values(GRANDFATHERED).flat();
  files.push("176_something.sql", "177_invoice_kind_progress.sql");
  const result = checkMigrationPrefixes(files);
  assert.equal(result.ok, true, result.errors.join("; "));
});

test("current migration directory matches the exact frozen collision inventory", () => {
  const files = filenamesFromDir(path.join(repoRoot, "db", "migrations"));
  const result = checkMigrationPrefixes(files);
  assert.equal(result.ok, true, result.errors.join("; "));
});

test("a new file on a frozen prefix fails", () => {
  const files = [...GRANDFATHERED[175], "175_new_thing.sql"];
  const result = checkMigrationPrefixes(files);
  assert.equal(result.ok, false);
  assert.match(result.errors[0], /prefix 175 is frozen/);
});

test("each newly frozen prefix rejects a third migration without renumbering existing files", () => {
  for (const prefix of ["151", "152", "177", "178", "179", "180", "181", "182", "183"]) {
    const files = [...GRANDFATHERED[prefix], `${prefix}_new_migration.sql`];
    const result = checkMigrationPrefixes(files);
    assert.equal(result.ok, false, `prefix ${prefix} must stay frozen`);
    assert.match(result.errors[0], new RegExp(`prefix ${prefix} is frozen`));
  }
});

test("a second file on a unique prefix fails", () => {
  const result = checkMigrationPrefixes(["189_one.sql", "189_two.sql"]);
  assert.equal(result.ok, false);
  assert.match(result.errors[0], /prefix 189 collides/);
});

test("seed files and unprefixed names are ignored", () => {
  const result = checkMigrationPrefixes(["002_seed_dev.sql", "README.sql", "189_ok.sql"]);
  assert.equal(result.ok, true, result.errors.join("; "));
});
