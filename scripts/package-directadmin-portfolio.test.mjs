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
  fs.writeFileSync(path.join(source, "plugin.conf"), "name=Titan Dev Access\nversion=1.2.0\n");
  fs.writeFileSync(path.join(source, "admin/index.html"), "#!/usr/bin/env node\n");
  try { return run({ source, output }); } finally { fs.rmSync(root, { recursive: true, force: true }); }
}

test("portfolio packaging emits a flat named archive, mode-safe entrypoint, and provenance", (t) => fixture(({ source, output }) => {
  const tarCheck = spawnSync("tar", ["--sort=name", "--version"], { encoding: "utf8" });
  if (tarCheck.status !== 0 && /not supported|unknown option/i.test(tarCheck.stderr)) return t.skip("GNU tar deterministic options unavailable");
  const result = packagePortfolio({ outputDir: output, plugins: [{ id: "titan_dev_access", source: path.relative(path.resolve("scripts/.."), source), files: ["plugin.conf", "admin"] }] });
  assert.equal(result.artifacts[0].plugin_id, "titan_dev_access");
  assert.equal(path.basename(result.artifacts[0].archive), "titan_dev_access.tar.gz");
  const listing = spawnSync("tar", ["-tzf", result.artifacts[0].archive], { encoding: "utf8" });
  assert.equal(listing.status, 0, listing.stderr);
  assert.deepEqual(listing.stdout.trim().split("\n").sort(), ["admin/", "admin/index.html", "plugin.conf"]);
  assert.equal(fs.existsSync(result.provenance), true);
}));

test("portfolio packaging refuses to replace an existing archive with different bytes", (t) => fixture(({ source, output }) => {
  const tarCheck = spawnSync("tar", ["--sort=name", "--version"], { encoding: "utf8" });
  if (tarCheck.status !== 0 && /not supported|unknown option/i.test(tarCheck.stderr)) return t.skip("GNU tar deterministic options unavailable");
  const plugin = { id: "titan_dev_access", source: path.relative(path.resolve("scripts/.."), source), files: ["plugin.conf", "admin"] };
  const first = packagePortfolio({ outputDir: output, plugins: [plugin] });
  const archive = first.artifacts[0].archive;
  const original = fs.readFileSync(archive);
  fs.writeFileSync(path.join(source, "admin/index.html"), "<html>changed</html>\n");
  assert.throws(() => packagePortfolio({ outputDir: output, plugins: [plugin] }), /refusing to overwrite existing archive/);
  assert.deepEqual(fs.readFileSync(archive), original);
}));

test("portfolio packaging rejects symlinked package input", (t) => fixture(({ source, output }) => {
  try { fs.symlinkSync("plugin.conf", path.join(source, "escape")); } catch (error) { if (error.code === "EPERM") return t.skip("symlink creation unavailable"); throw error; }
  assert.throws(() => packagePortfolio({ outputDir: output, plugins: [{ id: "titan_dev_access", source: path.relative(path.resolve("scripts/.."), source), files: ["plugin.conf", "escape"] }] }), /symlink/);
}));
