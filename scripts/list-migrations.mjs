#!/usr/bin/env node
/** Return migration filenames in locale-independent full-filename order. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export function orderMigrationNames(names) {
  return names
    .filter((name) => name.endsWith(".sql"))
    .sort((left, right) => (left < right ? -1 : left > right ? 1 : 0));
}

export function migrationNamesFromDir(directory) {
  const names = fs.readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name);
  const ordered = orderMigrationNames(names);
  if (ordered.some((name) => name.includes("\n") || name.includes("\r"))) {
    throw new Error("migration filenames cannot contain line breaks");
  }
  return ordered;
}

function isMain() {
  const self = fileURLToPath(import.meta.url);
  const invoked = process.argv[1] ? path.resolve(process.argv[1]) : "";
  return path.resolve(self) === invoked;
}

if (isMain()) {
  const directory = process.argv[2];
  if (!directory) {
    console.error("Usage: list-migrations.mjs <migration-directory>");
    process.exit(2);
  }
  try {
    process.stdout.write(`${migrationNamesFromDir(directory).join("\n")}\n`);
  } catch (error) {
    console.error(`Could not list migrations: ${error.message}`);
    process.exit(1);
  }
}
