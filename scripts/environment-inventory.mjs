#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputPath = path.join(root, "docs/working/issue-1236/environment-inventory.json");
const sourceExtensions = new Set([".cjs", ".js", ".jsx", ".mjs", ".php", ".ts", ".tsx"]);
const excludedSegments = new Set([".git", ".next", "node_modules", "dist", ".test-dist", "coverage", "archive", "tests", "__tests__"]);
const ignoredSourceDirs = new Set(["apps/web/marketing-source"]);
const ignoredSourceFiles = /(?:\.test|\.spec)\.[^.]+$/;

function trackedFiles() {
  const files = [];
  function visit(directory) {
    for (const entry of fs.readdirSync(path.join(root, directory), { withFileTypes: true })) {
      const file = `${directory}/${entry.name}`;
      if (entry.isDirectory()) {
        if (!excludedSegments.has(entry.name)) visit(file);
      } else if (sourceExtensions.has(path.extname(file)) && !ignoredSourceFiles.test(file)
        && ![...ignoredSourceDirs].some((dir) => file.startsWith(`${dir}/`))) {
        files.push(file);
      }
    }
  }
  for (const directory of ["apps", "services", "packages"]) visit(directory);
  return files.sort();
}

function record(consumers, name, file) {
  (consumers[name] ??= new Set()).add(file);
}

const consumers = {};
for (const file of trackedFiles()) {
  const source = fs.readFileSync(path.join(root, file), "utf8");
  const patterns = [
    /process\.env(?:\.([A-Z][A-Z0-9_]*)|\[\s*["']([A-Z][A-Z0-9_]*)["']\s*\])/g,
    /getenv\(\s*["']([A-Z][A-Z0-9_]*)["']\s*\)/g,
    /(?:required|absolutePath|algorithm)\(environment,\s*["']([A-Z][A-Z0-9_]*)["']\s*\)/g,
    /loadPublicKey\(environment,[\s\S]{0,160}?["'](WORKFORCE_[A-Z0-9_]+)["']\s*,\s*["'](WORKFORCE_[A-Z0-9_]+)["']\s*\)/g,
  ];
  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) {
      for (const name of match.slice(1).filter(Boolean)) record(consumers, name, file);
    }
  }
}

const templateFiles = [".env.example", "infra/vps.env.example", "apps/marketing/nexjob/.env.example"];
const templates = {};
for (const file of templateFiles) {
  const content = fs.readFileSync(path.join(root, file), "utf8");
  const entries = { active: new Set(), commented: new Set() };
  for (const line of content.split(/\r?\n/)) {
    const match = line.match(/^\s*(#\s*)?([A-Z][A-Z0-9_]*)\s*=/);
    if (match) entries[match[1] ? "commented" : "active"].add(match[2]);
  }
  templates[file] = Object.fromEntries(Object.entries(entries).map(([state, names]) => [state, [...names].sort()]));
}

const compose = fs.readFileSync(path.join(root, "infra/compose.vps.yml"), "utf8");
const composeVariables = [...new Set([...compose.matchAll(/\$\{([A-Z][A-Z0-9_]*)/g)].map((match) => match[1]))].sort();
const inventory = {
  scope: "Statically discoverable environment references in active apps/, services/, and packages/ JavaScript, TypeScript, and PHP source. This includes tooling and test-only routes outside test directories. Unit-test files, generated output, archives, and apps/web/marketing-source are excluded. Dynamic property names and host-provided runtime variables are not inferred; this inventory is not a deployment-profile declaration.",
  templates,
  composeVariables,
  consumers: Object.fromEntries(Object.entries(consumers).sort(([a], [b]) => a.localeCompare(b)).map(([name, files]) => [name, [...files].sort()])),
};
const rendered = `${JSON.stringify(inventory, null, 2)}\n`;

if (process.argv.includes("--check")) {
  if (!fs.existsSync(outputPath) || fs.readFileSync(outputPath, "utf8") !== rendered) {
    console.error("Environment inventory is stale. Run: node scripts/environment-inventory.mjs");
    process.exitCode = 1;
  }
} else {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, rendered);
}
