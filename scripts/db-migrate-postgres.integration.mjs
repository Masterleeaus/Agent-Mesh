#!/usr/bin/env node
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifest = JSON.parse(readFileSync(path.join(repoRoot, "db/migrations/MANIFEST.json"), "utf8"));
const adminUrl = process.env.TEST_POSTGRES_ADMIN_URL;
assert.ok(adminUrl, "TEST_POSTGRES_ADMIN_URL must point to a disposable PostgreSQL admin database");

function databaseUrl(name) {
  const url = new URL(adminUrl);
  url.pathname = `/${name}`;
  return url.toString();
}

function psql(url, sql) {
  const result = spawnSync("psql", [url, "-X", "-v", "ON_ERROR_STOP=1", "-A", "-t", "-c", sql], {
    encoding: "utf8",
  });
  assert.equal(result.status, 0, `psql failed: ${result.stderr}\nSQL: ${sql}`);
  return result.stdout.trim();
}

function scalar(url, sql) {
  return psql(url, sql).split(/\r?\n/).at(-1);
}

function recreateDatabase(name) {
  psql(adminUrl, `DROP DATABASE IF EXISTS ${name} WITH (FORCE)`);
  psql(adminUrl, `CREATE DATABASE ${name}`);
}

function runMigrator(url, expectedSuccess = true) {
  const result = spawnSync("bash", ["scripts/db-migrate.sh"], {
    cwd: repoRoot,
    encoding: "utf8",
    env: { ...process.env, DATABASE_URL: url, MIGRATION_DATABASE_URL: url },
  });
  if (expectedSuccess) assert.equal(result.status, 0, `migrator failed:\n${result.stdout}\n${result.stderr}`);
  else assert.notEqual(result.status, 0, `migrator unexpectedly succeeded:\n${result.stdout}`);
  return result;
}

function addLedgerRejectTrigger(url, rejectFilename = null) {
  psql(url, `
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ DEFAULT now()
    );
    CREATE OR REPLACE FUNCTION reject_test_migration_ledger_write() RETURNS trigger AS $$
    BEGIN
      ${rejectFilename ? `IF NEW.filename = '${rejectFilename}' THEN` : ""}
        RAISE EXCEPTION 'test-injected migration ledger failure';
      ${rejectFilename ? "END IF;" : ""}
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    DROP TRIGGER IF EXISTS reject_test_migration_ledger_write ON schema_migrations;
    CREATE TRIGGER reject_test_migration_ledger_write BEFORE INSERT ON schema_migrations
      FOR EACH ROW EXECUTE FUNCTION reject_test_migration_ledger_write();
  `);
}

function removeLedgerRejectTrigger(url) {
  psql(url, `DROP TRIGGER IF EXISTS reject_test_migration_ledger_write ON schema_migrations;
    DROP FUNCTION IF EXISTS reject_test_migration_ledger_write()`);
}

const freshDb = "titan_migration_fresh_test";
const seedDb = "titan_migration_seed_test";
const enumRetryDb = "titan_migration_enum_retry_test";
try {
  recreateDatabase(freshDb);
  const freshUrl = databaseUrl(freshDb);
  addLedgerRejectTrigger(freshUrl);
  runMigrator(freshUrl, false);
  assert.equal(scalar(freshUrl, "SELECT COUNT(*) FROM schema_migrations"), "0", "failed migration must not write its ledger row");
  assert.equal(
    scalar(freshUrl, "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public' AND table_name='accounts'"),
    "0",
    "failed migration transaction must roll back schema changes",
  );
  removeLedgerRejectTrigger(freshUrl);

  runMigrator(freshUrl);
  const expectedCount = String(manifest.entries.length);
  assert.equal(scalar(freshUrl, "SELECT COUNT(*) FROM schema_migrations"), expectedCount);
  assert.equal(scalar(freshUrl, "SELECT COUNT(*) FROM schema_migrations WHERE checksum IS NULL"), "0");
  assert.equal(scalar(freshUrl, "SELECT COUNT(DISTINCT filename) FROM schema_migrations"), expectedCount);
  runMigrator(freshUrl);
  assert.equal(scalar(freshUrl, "SELECT COUNT(*) FROM schema_migrations"), expectedCount, "a full replay must be idempotent");

  recreateDatabase(seedDb);
  const seedUrl = databaseUrl(seedDb);
  const seedFailFile = manifest.entries[Math.floor(manifest.entries.length / 2)].filename;
  psql(seedUrl, "CREATE TABLE clients (id integer PRIMARY KEY)");
  addLedgerRejectTrigger(seedUrl, seedFailFile);
  runMigrator(seedUrl, false);
  assert.equal(scalar(seedUrl, "SELECT COUNT(*) FROM schema_migrations"), "0", "failed legacy adoption must roll back every seed row");
  removeLedgerRejectTrigger(seedUrl);
  runMigrator(seedUrl);
  assert.equal(scalar(seedUrl, "SELECT COUNT(*) FROM schema_migrations"), expectedCount);
  assert.equal(scalar(seedUrl, "SELECT COUNT(*) FROM schema_migrations WHERE checksum IS NOT NULL"), "0");

  recreateDatabase(enumRetryDb);
  const enumRetryUrl = databaseUrl(enumRetryDb);
  addLedgerRejectTrigger(enumRetryUrl, "089_flooring_catalog.sql");
  runMigrator(enumRetryUrl, false);
  assert.equal(
    scalar(enumRetryUrl, "SELECT COUNT(*) FROM schema_migrations WHERE filename='089_flooring_catalog.sql'"),
    "0",
    "migration 089 must not record completion when its final transaction fails",
  );
  assert.equal(
    scalar(enumRetryUrl, "SELECT COUNT(*) FROM pg_enum e JOIN pg_type t ON t.oid=e.enumtypid WHERE t.typname='price_book_category' AND e.enumlabel='flooring'"),
    "1",
    "migration 089 enum stage should already be committed before its dependent inserts",
  );
  assert.equal(
    scalar(enumRetryUrl, "SELECT COUNT(*) FROM scope_templates WHERE category='flooring'"),
    "1",
    "the pre-enum stage should have committed and be safe to replay",
  );
  removeLedgerRejectTrigger(enumRetryUrl);
  runMigrator(enumRetryUrl);
  assert.equal(scalar(enumRetryUrl, "SELECT COUNT(*) FROM schema_migrations"), expectedCount);
  assert.equal(scalar(enumRetryUrl, "SELECT COUNT(*) FROM price_book WHERE code IN ('9010','9011','9012','9013')"), "4");

  console.log("postgres migration integration: PASS (fresh rollback/resume/replay, atomic legacy seed, and migration 089 enum-stage retry)");
} finally {
  psql(adminUrl, `DROP DATABASE IF EXISTS ${freshDb} WITH (FORCE)`);
  psql(adminUrl, `DROP DATABASE IF EXISTS ${seedDb} WITH (FORCE)`);
  psql(adminUrl, `DROP DATABASE IF EXISTS ${enumRetryDb} WITH (FORCE)`);
}
