import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { packagePortfolio } from "./package-directadmin-portfolio.mjs";

function fixture(run) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "titan-da-portfolio-test-"));
  const source = path.join(root, "plugin");
  const output = path.join(root, "dist");
  fs.mkdirSync(path.join(source, "admin"), { recursive: true });
  fs.mkdirSync(path.join(source, "scripts"), { recursive: true });
  fs.writeFileSync(path.join(source, "plugin.conf"), "name=Developer Portal\nversion=1.3.3\n");
  fs.writeFileSync(path.join(source, "admin/index.html"), "#!/usr/bin/env node\n");
  fs.writeFileSync(path.join(source, "scripts/update.sh"), "#!/bin/sh\nexit 0\n", { mode: 0o644 });
  fs.chmodSync(path.join(source, "scripts/update.sh"), 0o644);
  try { return run({ source, output }); } finally { fs.rmSync(root, { recursive: true, force: true }); }
}

function developerPortal(source, files = ["plugin.conf", "admin", "scripts/update.sh"]) {
  return {
    id: "titan_dev_access",
    displayName: "Developer Portal",
    legacyDisplayNames: { "1.2.0": "Titan Dev Access" },
    source: path.relative(path.resolve("scripts/.."), source),
    files,
  };
}

test("portfolio packaging emits a flat named archive, mode-safe entrypoint, and provenance", (t) => fixture(({ source, output }) => {
  const tarCheck = spawnSync("tar", ["--sort=name", "--version"], { encoding: "utf8" });
  if (tarCheck.status !== 0 && /not supported|unknown option/i.test(tarCheck.stderr)) return t.skip("GNU tar deterministic options unavailable");
  assert.equal(fs.statSync(path.join(source, "scripts/update.sh")).mode & 0o777, 0o644);
  const result = packagePortfolio({ outputDir: output, plugins: [developerPortal(source)] });
  assert.equal(result.artifacts[0].plugin_id, "titan_dev_access");
  assert.equal(path.basename(result.artifacts[0].archive), "titan_dev_access.tar.gz");
  const listing = spawnSync("tar", ["-tzf", result.artifacts[0].archive], { encoding: "utf8" });
  assert.equal(listing.status, 0, listing.stderr);
  assert.deepEqual(listing.stdout.trim().split("\n").sort(), ["admin/", "admin/index.html", "plugin.conf", "scripts/update.sh"]);
  const details = spawnSync("tar", ["-tvzf", result.artifacts[0].archive], { encoding: "utf8" });
  assert.equal(details.status, 0, details.stderr);
  const updateEntry = details.stdout.split(/\r?\n/).find((line) => line.endsWith(" scripts/update.sh"));
  assert.match(updateEntry ?? "", /^-rwxr-xr-x\s/);
  const provenance = JSON.parse(fs.readFileSync(result.provenance, "utf8"));
  assert.equal(provenance.artifacts[0].plugin_id, "titan_dev_access");
  assert.equal(fs.existsSync(result.provenance), true);
}));

test("portfolio packaging refuses to replace an existing archive with different bytes", (t) => fixture(({ source, output }) => {
  const tarCheck = spawnSync("tar", ["--sort=name", "--version"], { encoding: "utf8" });
  if (tarCheck.status !== 0 && /not supported|unknown option/i.test(tarCheck.stderr)) return t.skip("GNU tar deterministic options unavailable");
  const plugin = developerPortal(source);
  const first = packagePortfolio({ outputDir: output, plugins: [plugin] });
  const archive = first.artifacts[0].archive;
  const original = fs.readFileSync(archive);
  fs.writeFileSync(path.join(source, "admin/index.html"), "<html>changed</html>\n");
  assert.throws(() => packagePortfolio({ outputDir: output, plugins: [plugin] }), /refusing to overwrite existing archive/);
  assert.deepEqual(fs.readFileSync(archive), original);
}));

test("portfolio packaging rejects symlinked package input", (t) => fixture(({ source, output }) => {
  try { fs.symlinkSync("plugin.conf", path.join(source, "escape")); } catch (error) { if (error.code === "EPERM") return t.skip("symlink creation unavailable"); throw error; }
  assert.throws(() => packagePortfolio({ outputDir: output, plugins: [developerPortal(source, ["plugin.conf", "escape"])] }), /symlink/);
}));

test("portfolio packaging accepts the exact historical display-name/version pair", (t) => fixture(({ source, output }) => {
  const plugin = developerPortal(source, ["plugin.conf"]);
  fs.writeFileSync(path.join(source, "plugin.conf"), "name=Titan Dev Access\nversion=1.2.0\n");
  const result = packagePortfolio({ outputDir: output, plugins: [plugin] });
  assert.equal(result.artifacts[0].plugin_id, "titan_dev_access");
  assert.equal(path.basename(result.artifacts[0].archive), "titan_dev_access.tar.gz");
}));

test("portfolio packaging rejects a display-name mismatch without changing the stable plugin ID", (t) => fixture(({ source, output }) => {
  const plugin = developerPortal(source, ["plugin.conf"]);
  fs.writeFileSync(path.join(source, "plugin.conf"), "name=Unexpected Portal\nversion=1.3.3\n");
  assert.equal(plugin.id, "titan_dev_access");
  assert.throws(() => packagePortfolio({ outputDir: output, plugins: [plugin] }), /manifest display name mismatch/);
}));

test("portfolio packaging rejects the historical display name on the current version", (t) => fixture(({ source, output }) => {
  const plugin = developerPortal(source, ["plugin.conf"]);
  fs.writeFileSync(path.join(source, "plugin.conf"), "name=Titan Dev Access\nversion=1.3.3\n");
  assert.throws(() => packagePortfolio({ outputDir: output, plugins: [plugin] }), /manifest display name mismatch/);
}));
