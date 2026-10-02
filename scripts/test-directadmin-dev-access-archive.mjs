import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const FORM_INTEGRATION = path.join(SCRIPT_DIR, "directadmin-dev-access-archive-integration.php");
const PORTAL_ID = "titan_dev_access";

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { encoding: "utf8", ...options });
  if (result.error) throw result.error;
  return result;
}

function manifestFields(manifest) {
  const fields = {};
  for (const line of manifest.split(/\r?\n/).filter(Boolean)) {
    const index = line.indexOf("=");
    assert.ok(index > 0, `invalid plugin.conf line: ${line.slice(0, 80)}`);
    fields[line.slice(0, index)] = line.slice(index + 1);
  }
  return fields;
}

function snapshotTree(root) {
  const entries = [];
  function visit(directory, relative = "") {
    for (const name of fs.readdirSync(directory).sort()) {
      const absolute = path.join(directory, name);
      const childRelative = path.posix.join(relative, name);
      const stat = fs.lstatSync(absolute);
      const mode = stat.mode & 0o777;
      if (stat.isSymbolicLink()) {
        entries.push([childRelative, "symlink", mode, fs.readlinkSync(absolute)]);
      } else if (stat.isDirectory()) {
        entries.push([childRelative, "directory", mode]);
        visit(absolute, childRelative);
      } else {
        assert.ok(stat.isFile(), `unsupported fixture entry: ${childRelative}`);
        const digest = createHash("sha256").update(fs.readFileSync(absolute)).digest("hex");
        entries.push([childRelative, "file", mode, digest]);
      }
    }
  }
  visit(root);
  return JSON.stringify(entries);
}

function removeTree(root) {
  fs.rmSync(root, { recursive: true, force: true });
}

function versionAtLeast(version, required) {
  const parse = (value) => value.split(/[-+]/, 1)[0].split(".").map((part) => Number(part));
  const left = parse(version);
  const right = parse(required);
  if (left.some((part) => !Number.isInteger(part)) || left.length !== 3) return false;
  for (let index = 0; index < 3; index += 1) {
    if (left[index] > right[index]) return true;
    if (left[index] < right[index]) return false;
  }
  return true;
}

function runHook(pluginRoot, hook) {
  const hookPath = path.join(pluginRoot, "scripts", `${hook}.sh`);
  const result = run(hookPath, [], { cwd: pluginRoot });
  return result;
}

function verifyArtifact(portfolioDir) {
  const archive = path.join(portfolioDir, `${PORTAL_ID}.tar.gz`);
  assert.ok(fs.statSync(archive).isFile(), `missing ${PORTAL_ID}.tar.gz`);
  const provenance = JSON.parse(fs.readFileSync(path.join(portfolioDir, "provenance.json"), "utf8"));
  const artifact = provenance.artifacts.find((entry) => entry.plugin_id === PORTAL_ID);
  assert.ok(artifact, `provenance is missing ${PORTAL_ID}`);
  assert.equal(artifact.archive, undefined, "provenance must not embed a workspace path");
  const archiveDigest = createHash("sha256").update(fs.readFileSync(archive)).digest("hex");
  assert.equal(artifact.sha256, archiveDigest, "provenance digest must identify the exact archive");
  assert.equal(path.basename(archive), "titan_dev_access.tar.gz");

  const listing = run("tar", ["-tzf", archive]);
  assert.equal(listing.status, 0, listing.stderr);
  const entries = listing.stdout.split(/\r?\n/).filter(Boolean).map((entry) => entry.replace(/^\.\//, ""));
  assert.ok(entries.includes("plugin.conf"), "plugin.conf must be at archive root");
  for (const required of ["admin/", "reseller/", "user/", "hooks/", "lib/", "scripts/"]) {
    assert.ok(entries.includes(required), `archive root is missing ${required}`);
  }
  assert.ok(!entries.some((entry) => entry.startsWith(`${PORTAL_ID}/`)), "archive must not add an enclosing plugin directory");

  const metadata = run("tar", ["-tvzf", archive]);
  assert.equal(metadata.status, 0, metadata.stderr);
  for (const relative of [
    "admin/index.html", "reseller/index.html", "user/index.html",
    "scripts/install.sh", "scripts/update.sh", "scripts/uninstall.sh",
  ]) {
    const line = metadata.stdout.split(/\r?\n/).find((entry) => entry.endsWith(` ${relative}`));
    assert.match(line ?? "", /^-rwxr-xr-x\s/, `${relative} must be executable in the archive`);
  }
  return { archive, artifact };
}

function verifyDisposableLifecycle(archive, packageFields) {
  const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), "titan-da-lifecycle-"));
  try {
    const installed = path.join(fixtureRoot, "installed-plugin");
    const staged = path.join(fixtureRoot, "staged-candidate");
    const protectedHome = path.join(fixtureRoot, "account-home");
    fs.mkdirSync(installed);
    fs.mkdirSync(staged);
    fs.mkdirSync(path.join(protectedHome, ".ssh"), { recursive: true, mode: 0o700 });
    const protectedKeys = path.join(protectedHome, ".ssh", "authorized_keys");
    fs.writeFileSync(protectedKeys, "ssh-ed25519 AAAAFIXTUREONLY preserved-test-key\n", { mode: 0o600 });
    fs.chmodSync(path.dirname(protectedKeys), 0o700);
    fs.chmodSync(protectedKeys, 0o600);

    for (const destination of [installed, staged]) {
      const extraction = run("tar", ["-xzf", archive, "-C", destination]);
      assert.equal(extraction.status, 0, extraction.stderr);
      const extractedManifest = manifestFields(fs.readFileSync(path.join(destination, "plugin.conf"), "utf8"));
      assert.equal(extractedManifest.version, packageFields.version);
      assert.equal(extractedManifest.name, packageFields.name);
    }

    const installedBefore = snapshotTree(installed);
    const homeBefore = snapshotTree(protectedHome);
    const install = runHook(installed, "install");
    assert.equal(install.status, 0, install.stderr);
    assert.match(install.stdout, /install validation passed/i);
    assert.equal(snapshotTree(installed), installedBefore, "install validator must be read-only on the extracted fixture");

    const update = runHook(installed, "update");
    assert.equal(update.status, 0, update.stderr);
    assert.match(update.stdout, /update validation passed/i);
    assert.equal(snapshotTree(installed), installedBefore, "update validator must be read-only on the extracted fixture");

    fs.rmSync(path.join(staged, "admin", "index.html"));
    const failedCandidate = runHook(staged, "update");
    assert.notEqual(failedCandidate.status, 0, "invalid staged candidate must fail validation");
    assert.equal(snapshotTree(installed), installedBefore, "failed staged validation must leave the prior fixture install intact");
    assert.equal(snapshotTree(protectedHome), homeBefore, "failed staged validation must preserve account SSH state");

    const uninstall = runHook(installed, "uninstall");
    assert.equal(uninstall.status, 0, uninstall.stderr);
    assert.equal(snapshotTree(installed), installedBefore, "uninstall hook must not delete files from the validation fixture");
    assert.equal(snapshotTree(protectedHome), homeBefore, "uninstall hook must preserve unrelated account SSH state");
    process.stdout.write("Disposable lifecycle fixture passed: clean extraction, install/update validation, failed-stage preservation, and SSH-state preservation. The shipped hooks validate only; no DirectAdmin replacement or rollback engine is claimed.\n");
  } finally {
    removeTree(fixtureRoot);
  }
}

function runCGIFormIntegration(pluginRoot) {
  const php = process.env.PHP_BINARY || "php";
  const phpVersion = run(php, ["-r", "echo PHP_VERSION_ID;"]);
  if (phpVersion.status !== 0 || !/^8[0-9]{4,5}$/.test(phpVersion.stdout.trim())) {
    throw new Error(`PHP 8 CLI is required for packaged CGI integration: ${phpVersion.stderr || phpVersion.stdout}`);
  }
  for (const file of ["admin/index.html", "reseller/index.html", "user/index.html", "lib/app.php", FORM_INTEGRATION]) {
    const lint = run(php, ["-l", file === FORM_INTEGRATION ? file : path.join(pluginRoot, file)]);
    assert.equal(lint.status, 0, lint.stderr || lint.stdout);
  }
  const integration = run(php, [FORM_INTEGRATION, pluginRoot], { cwd: pluginRoot });
  assert.equal(integration.status, 0, integration.stderr || integration.stdout);
  assert.match(integration.stdout, /Synthetic key integration passed:/i);
  process.stdout.write(integration.stdout);
}

const portfolioDir = path.resolve(process.argv[2] ?? "dist/directadmin");
const { archive, artifact } = verifyArtifact(portfolioDir);
const extractionRoot = fs.mkdtempSync(path.join(os.tmpdir(), "titan-da-archive-check-"));
try {
  const extraction = run("tar", ["-xzf", archive, "-C", extractionRoot]);
  assert.equal(extraction.status, 0, extraction.stderr);
  const fields = manifestFields(fs.readFileSync(path.join(extractionRoot, "plugin.conf"), "utf8"));
  assert.equal(artifact.version, fields.version, "provenance version must match the packaged manifest");
  const expectedDisplayName = fields.version === "1.2.0" ? "Titan Dev Access" : "Developer Portal";
  assert.equal(fields.name, expectedDisplayName, "display label must follow the versioned compatibility policy");
  if (versionAtLeast(fields.version, "1.3.3")) {
    assert.equal(artifact.plugin_id, PORTAL_ID);
    assert.equal(path.basename(archive), "titan_dev_access.tar.gz");
  }
  verifyDisposableLifecycle(archive, fields);
  if (versionAtLeast(fields.version, "1.3.3")) {
    runCGIFormIntegration(extractionRoot);
  } else {
    process.stdout.write(`CGI synthetic-key submit check not run for legacy ${fields.version}; that version predates the DirectAdmin POST bridge.\n`);
  }
  process.stdout.write(`Developer Portal archive checks passed for ${fields.version} (${artifact.plugin_id}, ${path.basename(archive)}).\n`);
} finally {
  removeTree(extractionRoot);
}
