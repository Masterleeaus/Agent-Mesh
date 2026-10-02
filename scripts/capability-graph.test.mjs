import test from "node:test";
import assert from "node:assert/strict";
import { runCapabilityGraphTests } from "../packages/tools/capability-graph.test.mjs";

test("canonical capability graph certification", () => {
  assert.deepEqual(runCapabilityGraphTests(), { ok: true, tests: 18 });
});

