#!/usr/bin/env node
/**
 * Validate the immutable legacy PostgreSQL migration manifest.
 *
 * Prefix collisions are resolved by stable filename identities and an explicit
 * sequence, not by renaming files whose deployed status is unknown. The
 * manifest freezes the exact current file set and bytes; an unregistered file,
 * new collision, reorder, or edited migration fails closed.
 */
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export function migrationOrder(a, b) {
  const ap = a.match(/^(\d+)_/)?.[1];
  const bp = b.match(/^(\d+)_/)?.[1];
  const lexical = a < b ? -1 : a > b ? 1 : 0;
  if (!ap || !bp) return lexical;
  return Number(ap) - Number(bp) || lexical;
}

export function groupMigrationFiles(filenames) {
  const byPrefix = new Map();
  for (const name of filenames) {
    if (!name.endsWith(".sql") || name.includes("seed")) continue;
    const match = name.match(/^(\d+)_/);
    if (!match) continue;
    const list = byPrefix.get(match[1]) ?? [];
    list.push(name);
    byPrefix.set(match[1], list);
  }
  for (const names of byPrefix.values()) names.sort();
  return byPrefix;
}

export function validateMigrationManifest(manifest, filenames, readMigration) {
  const errors = [];
  const expected = filenames
    .filter((name) => name.endsWith(".sql") && !name.includes("seed"))
    .sort(migrationOrder);
  const entries = manifest?.entries;
  if (manifest?.schema !== "titan-db-migration-manifest/v1" ||
      manifest?.stream !== "legacy-postgres-compatibility" ||
      manifest?.ordering !== "ascending numeric prefix, then exact filename; sequence is explicit" ||
      !Array.isArray(entries)) {
    return { ok: false, errors: ["migration manifest schema/stream/ordering is invalid"], unverifiedHistoryPrefixes: [] };
  }

  const actualNames = entries.map((entry) => entry?.filename);
  if (JSON.stringify(actualNames) !== JSON.stringify(expected)) {
    errors.push("manifest entries must exactly match the ordered non-seed SQL file set");
  }

  entries.forEach((entry, index) => {
    const filename = entry?.filename;
    const prefix = typeof filename === "string" ? filename.match(/^(\d+)_/)?.[1] : null;
    if (!prefix || entry.prefix !== prefix) errors.push(`entry ${index + 1} has an invalid numeric prefix`);
    if (entry.sequence !== index + 1) errors.push(`entry ${filename ?? index + 1} has a non-contiguous sequence`);
    if (entry.migration_id !== `db/migrations/${filename}`) errors.push(`entry ${filename ?? index + 1} has an unstable migration_id`);
    if (!/^[a-f0-9]{64}$/.test(entry.sha256 ?? "")) errors.push(`entry ${filename ?? index + 1} has an invalid SHA-256`);
    if (typeof readMigration === "function" && typeof filename === "string" && expected.includes(filename)) {
      const actualHash = createHash("sha256").update(readMigration(filename)).digest("hex");
      if (entry.sha256 !== actualHash) errors.push(`migration content changed without a manifest update: ${filename}`);
    }
  });

  const groups = groupMigrationFiles(expected);
  const actualCollisions = [...groups.entries()]
    .filter(([, names]) => names.length > 1)
    .map(([prefix, names]) => ({ prefix, files: names }));
  const declared = manifest.prefix_collisions;
  if (!Array.isArray(declared)) {
    errors.push("manifest prefix_collisions must explicitly classify every existing duplicate prefix");
  } else {
    const normalized = declared.map((item) => ({ prefix: item?.prefix, files: item?.files }));
    if (JSON.stringify(normalized) !== JSON.stringify(actualCollisions)) {
      errors.push("manifest prefix collision classifications do not exactly match the migration files");
    }
    for (const item of declared) {
      if (item?.resolution !== "immutable-filename-identity-and-explicit-sequence") {
        errors.push(`prefix ${item?.prefix ?? "?"} has no explicit deterministic resolution`);
      }
      if (item?.applied_history !== "unverified-no-installation-ledger-snapshot-available") {
        errors.push(`prefix ${item?.prefix ?? "?"} makes an unsupported applied-history claim`);
      }
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    unverifiedHistoryPrefixes: actualCollisions.map(({ prefix }) => prefix),
  };
}

export function filenamesFromDir(dir) {
  return fs.readdirSync(dir).filter((name) => name.endsWith(".sql"));
}

function isMain() {
  const self = fileURLToPath(import.meta.url);
  const invoked = process.argv[1] ? path.resolve(process.argv[1]) : "";
  return path.resolve(self) === invoked;
}

if (isMain()) {
  const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const dir = path.join(repoRoot, "db", "migrations");
  const manifestPath = path.join(dir, "MANIFEST.json");
  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  } catch (error) {
    console.error(`migration manifest missing or invalid: ${error.message}`);
    process.exit(1);
  }
  const result = validateMigrationManifest(
    manifest,
    filenamesFromDir(dir),
    (filename) => fs.readFileSync(path.join(dir, filename)),
  );
  if (!result.ok) {
    console.error("Invalid legacy PostgreSQL migration manifest:");
    for (const err of result.errors) console.error(`  - ${err}`);
    process.exit(1);
  }
  if (process.argv.includes("--list")) {
    for (const entry of manifest.entries) console.log(`${entry.filename}\t${entry.sha256}`);
  } else {
    console.log(`migration manifest: ${manifest.entries.length} immutable files verified`);
    console.log(`prefixes resolved by filename/order: ${result.unverifiedHistoryPrefixes.join(", ")}`);
    console.log("deployed applied-history status remains unverified; no migration was renumbered");
  }
}
