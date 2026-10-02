#!/usr/bin/env node
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
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

function assertManifestLedger(url, { legacyFilenameOnly = false } = {}) {
  const rows = psql(url, "SELECT filename || E'\\t' || COALESCE(checksum, '<NULL>') FROM schema_migrations ORDER BY filename")
    .split(/\r?\n/)
    .filter(Boolean)
    .map((row) => row.split("\t"));
  assert.equal(rows.length, manifest.entries.length, "ledger row count must match the immutable manifest");
  const applied = new Map(rows.map(([filename, checksum]) => [filename, checksum]));
  for (const entry of manifest.entries) {
    assert.equal(
      applied.get(entry.filename),
      legacyFilenameOnly ? "<NULL>" : entry.sha256,
      `ledger checksum mismatch for ${entry.filename}`,
    );
  }
}

function schemaFingerprint(url) {
  const dump = spawnSync("pg_dump", [url, "--schema-only", "--no-owner", "--no-privileges"], { encoding: "utf8" });
  assert.equal(dump.status, 0, `schema-only pg_dump failed: ${dump.stderr}`);
  const normalizedDump = dump.stdout
    .replace(/^-- Dumped on .*\r?\n/m, "")
    .replace(/^\\(?:un)?restrict .*\r?\n/gm, "");
  return createHash("sha256").update(normalizedDump).digest("hex");
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

function runHistoricalPrefix(url, throughFilename) {
  const stopIndex = manifest.entries.findIndex((entry) => entry.filename === throughFilename);
  assert.notEqual(stopIndex, -1, `unknown historical checkpoint ${throughFilename}`);
  const entries = manifest.entries.slice(0, stopIndex + 1);
  const names = new Set(entries.map((entry) => entry.filename));
  const collisions = manifest.prefix_collisions.filter((collision) => collision.files.every((filename) => names.has(filename)));
  const root = mkdtempSync(path.join(os.tmpdir(), "titan-migration-checkpoint-"));
  try {
    mkdirSync(path.join(root, "scripts"), { recursive: true });
    mkdirSync(path.join(root, "db/migrations"), { recursive: true });
    cpSync(path.join(repoRoot, "scripts/db-migrate.sh"), path.join(root, "scripts/db-migrate.sh"));
    cpSync(path.join(repoRoot, "scripts/check-migration-prefixes.mjs"), path.join(root, "scripts/check-migration-prefixes.mjs"));
    for (const entry of entries) {
      cpSync(path.join(repoRoot, "db/migrations", entry.filename), path.join(root, "db/migrations", entry.filename));
    }
    writeFileSync(path.join(root, "db/migrations/MANIFEST.json"), `${JSON.stringify({
      ...manifest,
      entries,
      prefix_collisions: collisions,
    }, null, 2)}\n`);
    const result = spawnSync("bash", [path.join(root, "scripts/db-migrate.sh")], {
      cwd: root,
      encoding: "utf8",
      env: { ...process.env, DATABASE_URL: url, MIGRATION_DATABASE_URL: url },
    });
    assert.equal(result.status, 0, `historical prefix runner failed:\n${result.stdout}\n${result.stderr}`);
    return entries;
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
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
const checkpointDb = "titan_migration_checkpoint_test";
const restoreDb = "titan_migration_restore_test";
const backupDirectory = mkdtempSync(path.join(os.tmpdir(), "titan-migration-backup-"));
const backupFile = path.join(backupDirectory, "fresh.dump");
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
  assertManifestLedger(freshUrl);
  const exportEvidence = () => {
    const result = spawnSync("node", ["scripts/export-migration-history-evidence.mjs"], {
      cwd: repoRoot,
      encoding: "utf8",
      env: { ...process.env, MIGRATION_DATABASE_URL: freshUrl },
    });
    assert.equal(result.status, 0, `sanitized evidence export failed: ${result.stderr}`);
    return JSON.parse(result.stdout);
  };
  const exportedEvidence = exportEvidence();
  const repeatedEvidence = exportEvidence();
  assert.equal(exportedEvidence.data_included, false);
  assert.match(exportedEvidence.schema_fingerprint_sha256, /^[a-f0-9]{64}$/);
  assert.equal(repeatedEvidence.schema_fingerprint_sha256, exportedEvidence.schema_fingerprint_sha256,
    "schema-only evidence fingerprint must be repeatable for an unchanged database");
  console.log(`fresh schema fingerprint (schema only, no business rows): ${exportedEvidence.schema_fingerprint_sha256}`);
  assert.equal(exportedEvidence.applied_history.length, manifest.entries.length);
  assert.ok(exportedEvidence.applied_history.every((row) => row.status === "checksum-matched"));
  assert.ok(exportedEvidence.applied_history.every((row) => Object.hasOwn(row, "applied_order")));
  assert.equal(exportedEvidence.duplicate_prefix_status.length, manifest.prefix_collisions.length);
  runMigrator(freshUrl);
  assert.equal(scalar(freshUrl, "SELECT COUNT(*) FROM schema_migrations"), expectedCount, "a full replay must be idempotent");
  assertManifestLedger(freshUrl);

  const backup = spawnSync("pg_dump", ["--format=custom", "--no-owner", "--no-privileges", "--file", backupFile, freshUrl], { encoding: "utf8" });
  assert.equal(backup.status, 0, `pg_dump backup failed: ${backup.stderr}`);
  recreateDatabase(restoreDb);
  const restoreUrl = databaseUrl(restoreDb);
  const restore = spawnSync("pg_restore", ["--exit-on-error", "--no-owner", "--no-privileges", "--dbname", restoreUrl, backupFile], { encoding: "utf8" });
  assert.equal(restore.status, 0, `pg_restore failed: ${restore.stderr}`);
  assertManifestLedger(restoreUrl);
  assert.equal(schemaFingerprint(restoreUrl), schemaFingerprint(freshUrl), "restored schema fingerprint must match the backup source");
  assert.equal(scalar(restoreUrl, "SELECT COUNT(*) FROM price_book WHERE code IN ('9010','9011','9012','9013')"), "4");

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
  assertManifestLedger(seedUrl, { legacyFilenameOnly: true });

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
  assertManifestLedger(enumRetryUrl);

  const first151 = manifest.entries.findIndex((entry) => entry.filename === "151_business_pricing_settings.sql");
  const second151 = manifest.entries.findIndex((entry) => entry.filename === "151_field_completion_evidence.sql");
  assert.equal(second151, first151 + 1, "collision members must be adjacent in the canonical sequence");

  // Historical checkpoint after only the first member of the duplicate prefix.
  recreateDatabase(checkpointDb);
  const checkpointUrl = databaseUrl(checkpointDb);
  const appliedPrefix = runHistoricalPrefix(checkpointUrl, manifest.entries[first151].filename);
  assert.equal(appliedPrefix.length, first151 + 1);
  assert.equal(scalar(checkpointUrl, "SELECT COUNT(*) FROM schema_migrations WHERE filename='151_business_pricing_settings.sql'"), "1");
  assert.equal(scalar(checkpointUrl, "SELECT COUNT(*) FROM schema_migrations WHERE filename='151_field_completion_evidence.sql'"), "0");
  runMigrator(checkpointUrl);
  assertManifestLedger(checkpointUrl);

  // A supported installation may have recorded only the second colliding file.
  recreateDatabase(checkpointDb);
  const reverseCheckpointUrl = databaseUrl(checkpointDb);
  runHistoricalPrefix(reverseCheckpointUrl, manifest.entries[first151 - 1].filename);
  const laterFile = manifest.entries[second151].filename;
  const laterSql = readFileSync(path.join(repoRoot, "db/migrations", laterFile), "utf8");
  psql(reverseCheckpointUrl, `BEGIN;\n${laterSql}\nINSERT INTO schema_migrations (filename, checksum) VALUES ('${laterFile}', '${manifest.entries[second151].sha256}');\nCOMMIT;`);
  assert.equal(scalar(reverseCheckpointUrl, `SELECT COUNT(*) FROM schema_migrations WHERE filename='${laterFile}'`), "1");
  runMigrator(reverseCheckpointUrl);
  assertManifestLedger(reverseCheckpointUrl);

  console.log("postgres migration integration: PASS (fresh rollback/resume/replay, atomic legacy seed, migration 089 enum-stage retry, and both partial 151 collision checkpoints)");
} finally {
  psql(adminUrl, `DROP DATABASE IF EXISTS ${freshDb} WITH (FORCE)`);
  psql(adminUrl, `DROP DATABASE IF EXISTS ${seedDb} WITH (FORCE)`);
  psql(adminUrl, `DROP DATABASE IF EXISTS ${enumRetryDb} WITH (FORCE)`);
  psql(adminUrl, `DROP DATABASE IF EXISTS ${checkpointDb} WITH (FORCE)`);
  psql(adminUrl, `DROP DATABASE IF EXISTS ${restoreDb} WITH (FORCE)`);
  rmSync(backupDirectory, { recursive: true, force: true });
}
