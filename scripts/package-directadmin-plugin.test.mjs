import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { packagePlugin } from "./package-directadmin-plugin.mjs";

const files = {
  "plugin.conf": "name=titan-server-node\nversion=0.1.0\ndescription=Server Node\n",
  "install.sh": "#!/usr/bin/env bash\nexit 0\n",
  "update.sh": "#!/usr/bin/env bash\nexit 0\n",
  "uninstall.sh": "#!/usr/bin/env bash\nexit 0\n",
  "health.sh": "#!/usr/bin/env bash\nexit 0\n",
  "runtime.mjs": "export const ready = true;\n",
};

function fixture(run) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "titan-da-package-test-"));
  const sourceDir = path.join(root, "source");
  const outputDir = path.join(root, "output");
  fs.mkdirSync(sourceDir);
  for (const [name, content] of Object.entries(files)) fs.writeFileSync(path.join(sourceDir, name), content);
  try { return run({ root, sourceDir, outputDir }); }
  finally { fs.rmSync(root, { recursive: true, force: true }); }
}

test("package has a deterministic archive-root layout and executable scripts", () => fixture(({ sourceDir, outputDir }) => {
  const first = packagePlugin({ sourceDir, outputDir });
  const second = packagePlugin({ sourceDir, outputDir });
  assert.equal(first.plugin_id, "titan-server-node");
  assert.equal(first.archive.endsWith("/titan-server-node.tar.gz"), true);
  assert.equal(first.sha256, second.sha256);

  const listing = spawnSync("tar", ["-tzf", first.archive], { encoding: "utf8" });
  assert.equal(listing.status, 0, listing.stderr);
  assert.deepEqual(listing.stdout.trim().split("\n").sort(), Object.keys(files).sort());

  const details = spawnSync("tar", ["-tvzf", first.archive], { encoding: "utf8" });
  assert.equal(details.status, 0, details.stderr);
  for (const name of ["install.sh", "update.sh", "uninstall.sh", "health.sh"]) {
    assert.match(details.stdout, new RegExp("^-rwxr-xr-x.*\\s" + name + "$"));
  }
}));

test("package rejects unsafe symlink inputs", () => fixture(({ sourceDir, outputDir }) => {
  fs.unlinkSync(path.join(sourceDir, "runtime.mjs"));
  fs.symlinkSync("/etc/passwd", path.join(sourceDir, "runtime.mjs"));
  assert.throws(() => packagePlugin({ sourceDir, outputDir }), /regular file/);
}));

test("package rejects invalid plugin identity before writing an artifact", () => fixture(({ sourceDir, outputDir }) => {
  fs.writeFileSync(path.join(sourceDir, "plugin.conf"), "name=../escape\nversion=0.1.0\ndescription=invalid\n");
  assert.throws(() => packagePlugin({ sourceDir, outputDir }), /invalid plugin id/);
  assert.equal(fs.existsSync(outputDir), false);
}));
