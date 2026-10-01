import assert from "node:assert/strict";
import test from "node:test";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.dirname(fileURLToPath(import.meta.url));

for (const [script, lifecycle] of [["install.sh", "validated"], ["update.sh", "updated"], ["uninstall.sh", "uninstalled"]]) {
  test(`${script} reports an explicit safe lifecycle result`, (t) => {
    const result = spawnSync("bash", [path.join(root, script)], { cwd: root, encoding: "utf8" });
    if (result.error?.code === "ENOENT") return t.skip("bash is unavailable in this environment");
    assert.equal(result.status, 0, result.stderr);
    const report = JSON.parse(result.stdout);
    assert.equal(report.plugin, "titan-server-node");
    assert.equal(report.lifecycle, lifecycle);
  });
}
