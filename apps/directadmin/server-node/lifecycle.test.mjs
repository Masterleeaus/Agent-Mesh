import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const sourceDir = path.dirname(fileURLToPath(import.meta.url));

for (const [script, expectedState] of [
  ["install.sh", "install_blocked"],
  ["update.sh", "update_blocked"],
  ["uninstall.sh", "uninstall_blocked"],
]) {
  test(`${script} refuses to report success before governed lifecycle exists`, async () => {
    const fixture = await mkdtemp(path.join(os.tmpdir(), "titan-server-node-lifecycle-"));
    try {
      for (const file of [script, "plugin.conf", "health.sh"]) {
        await writeFile(path.join(fixture, file), await readFile(path.join(sourceDir, file)));
      }
      const before = (await readdir(fixture)).sort();
      const result = spawnSync("bash", [path.join(fixture, script)], { encoding: "utf8" });
      assert.equal(result.status, 78);
      const report = JSON.parse(result.stdout);
      assert.equal(report.plugin, "titan-server-node");
      assert.equal(report.lifecycle, expectedState);
      assert.equal(report.completed, false);
      assert.match(report.reason, /not_implemented/);
      assert.deepEqual((await readdir(fixture)).sort(), before);
    } finally {
      await rm(fixture, { recursive: true, force: true });
    }
  });
}
