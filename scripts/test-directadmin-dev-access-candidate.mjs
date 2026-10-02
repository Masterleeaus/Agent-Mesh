import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { ENABLED_PLUGINS, packagePortfolio } from "./package-directadmin-portfolio.mjs";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CLAIM_REF = "refs/heads/agent/issue-1048";

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024, ...options });
  if (result.error) throw result.error;
  return result;
}

const remoteRef = run("git", ["ls-remote", "origin", CLAIM_REF], { cwd: ROOT });
assert.equal(remoteRef.status, 0, remoteRef.stderr);
const discoveredSha = remoteRef.stdout.trim().split(/\s+/)[0];
if (!discoveredSha) {
  process.stdout.write("No active #1048 claim ref is published; exact-candidate CGI integration was not run.\n");
  process.exit(0);
}

const fetch = run("git", ["fetch", "--no-tags", "origin", CLAIM_REF], { cwd: ROOT });
assert.equal(fetch.status, 0, fetch.stderr);
const fetched = run("git", ["rev-parse", "FETCH_HEAD"], { cwd: ROOT });
assert.equal(fetched.status, 0, fetched.stderr);
const candidateSha = fetched.stdout.trim();
const archiveSource = run("git", ["archive", "--format=tar", candidateSha, "apps/directadmin/dev-access"], {
  cwd: ROOT,
  encoding: null,
});
assert.equal(archiveSource.status, 0, archiveSource.stderr?.toString() ?? "git archive failed");

const temp = fs.mkdtempSync(path.join(os.tmpdir(), "titan-da-active-candidate-"));
try {
  const sourceTar = path.join(temp, "candidate-source.tar");
  fs.writeFileSync(sourceTar, archiveSource.stdout);
  const sourceTree = run("tar", ["-xf", sourceTar, "-C", temp]);
  assert.equal(sourceTree.status, 0, sourceTree.stderr);
  const pluginSource = path.join(temp, "apps/directadmin/dev-access");
  const descriptor = ENABLED_PLUGINS.find((plugin) => plugin.id === "titan_dev_access");
  assert.ok(descriptor, "portfolio must retain the stable Developer Portal plugin descriptor");
  const outputDir = path.join(temp, "portfolio");
  const candidatePackage = packagePortfolio({
    outputDir,
    plugins: [{ ...descriptor, source: pluginSource }],
  });
  const archive = path.join(outputDir, "titan_dev_access.tar.gz");
  const digest = candidatePackage.artifacts[0].sha256;
  process.stdout.write(`Exact active #1048 source ${candidateSha}; packaged candidate SHA-256 ${digest}.\n`);
  const test = run(process.execPath, [path.join(ROOT, "scripts/test-directadmin-dev-access-archive.mjs"), outputDir], { cwd: ROOT });
  process.stdout.write(test.stdout);
  if (test.status !== 0) throw new Error(test.stderr || `archive verification exited ${test.status}`);
  assert.ok(fs.statSync(archive).isFile(), "isolated candidate archive must remain in the disposable output directory");
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}
