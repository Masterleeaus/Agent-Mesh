import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";

test("DirectAdmin package has root metadata and lifecycle entry points", () => {
  const output = execFileSync(process.execPath, ["scripts/validate-directadmin-plugin.mjs", "apps/directadmin/server-node"], { encoding: "utf8" });
  assert.equal(JSON.parse(output).valid, true);
});

