#!/usr/bin/env node
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifest = JSON.parse(fs.readFileSync(path.join(repoRoot, "db/migrations/MANIFEST.json"), "utf8"));
const databaseUrl = process.env.MIGRATION_DATABASE_URL;

if (!databaseUrl) {
  console.error("MIGRATION_DATABASE_URL is required; no database was queried");
  process.exit(2);
}

function run(program, args) {
  const result = spawnSync(program, args, { encoding: "utf8", env: { ...process.env, PGCONNECT_TIMEOUT: "10" } });
  if (result.error || result.status !== 0) {
    console.error(`${program} failed (exit ${result.status ?? "unavailable"}); output suppressed to avoid disclosing connection details`);
    process.exit(2);
  }
  return result.stdout;
}

const tableExists = run("psql", [databaseUrl, "-X", "-A", "-t", "-v", "ON_ERROR_STOP=1", "-c",
  "SELECT to_regclass('public.schema_migrations') IS NOT NULL"])
  .trim() === "t";

let ledger = [];
if (tableExists) {
  const columns = new Set(run("psql", [databaseUrl, "-X", "-A", "-t", "-v", "ON_ERROR_STOP=1", "-c",
    "SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='schema_migrations'"])
    .trim().split(/\r?\n/).filter(Boolean));
  if (!columns.has("filename")) {
    console.error("schema_migrations exists without a filename column; output suppressed");
    process.exit(2);
  }
  const checksumExpr = columns.has("checksum") ? "COALESCE(checksum, '')" : "''";
  const rows = run("psql", [databaseUrl, "-X", "-A", "-t", "-F", "\t", "-v", "ON_ERROR_STOP=1", "-c",
    `SELECT filename, ${checksumExpr} FROM schema_migrations ORDER BY filename`]);
  ledger = rows.split(/\r?\n/).filter(Boolean).map((line) => {
    const [filename, checksum = ""] = line.split("\t");
    return { filename, checksum: checksum || null };
  });
}

const expected = new Map(manifest.entries.map((entry) => [entry.filename, entry.sha256]));
const recorded = new Map(ledger.map((row) => [row.filename, row.checksum]));
const history = ledger.map(({ filename, checksum }) => {
  const expectedChecksum = expected.get(filename);
  const status = expectedChecksum === undefined
    ? "unknown-to-manifest"
    : checksum === null
      ? "legacy-checksum-unverified"
      : checksum === expectedChecksum
        ? "checksum-matched"
        : "checksum-mismatch";
  return { filename, checksum, status };
});
const missingManifestFiles = manifest.entries
  .filter((entry) => !recorded.has(entry.filename))
  .map((entry) => entry.filename);
const collisionStatus = manifest.prefix_collisions.map(({ prefix, files }) => ({
  prefix,
  files: files.map((filename) => ({
    filename,
    status: !recorded.has(filename)
      ? "not-recorded"
      : recorded.get(filename) === null
        ? "recorded-checksum-unverified"
        : recorded.get(filename) === expected.get(filename)
          ? "checksum-matched"
          : "checksum-mismatch",
  })),
}));
const schemaDump = run("pg_dump", [databaseUrl, "--schema-only", "--no-owner", "--no-privileges"]);
const normalizedSchemaDump = schemaDump
  .replace(/^-- Dumped on .*\r?\n/m, "")
  .replace(/^\\(?:un)?restrict .*\r?\n/gm, "");

process.stdout.write(`${JSON.stringify({
  format: "titan-migration-history-evidence/v1",
  stream: manifest.stream,
  manifest_entries: manifest.entries.length,
  ledger_present: tableExists,
  applied_history: history,
  missing_manifest_files: missingManifestFiles,
  duplicate_prefix_status: collisionStatus,
  schema_fingerprint_sha256: createHash("sha256").update(normalizedSchemaDump).digest("hex"),
  data_included: false,
}, null, 2)}\n`);
