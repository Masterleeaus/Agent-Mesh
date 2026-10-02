
import test from "node:test";
import assert from "node:assert/strict";
import {
  DISTRIBUTION_FAMILIES,
  VERTICAL_PROFILE_SLOTS,
  buildDistributionCoverageSnapshot,
} from "../.test-dist/distribution-catalog.js";

test("launch catalogue represents all families and distinct technical adapters", () => {
  assert.equal(DISTRIBUTION_FAMILIES.length, 20);
  const adapterIds = DISTRIBUTION_FAMILIES.flatMap((family) => family.adapter_ids);
  assert.equal(adapterIds.length, 21);
  assert.equal(new Set(adapterIds).size, 21);
  const aiHosts = DISTRIBUTION_FAMILIES.find((family) => family.family_id === "ai-host-distribution");
  assert.deepEqual(aiHosts.adapter_ids, ["chatgpt", "claude"]);
});

test("coverage snapshot enumerates 300 configurations and 6300 adapter projections without certifying gaps", () => {
  const snapshot = buildDistributionCoverageSnapshot();
  assert.equal(snapshot.foundation_configurations.length, 300);
  assert.equal(snapshot.adapter_projections.length, 6300);
  assert.equal(new Set(snapshot.foundation_configurations.map((row) => row.configuration_id)).size, 300);
  assert.equal(new Set(snapshot.adapter_projections.map((row) => row.projection_id)).size, 6300);
  assert.ok(snapshot.foundation_configurations.every((row) => row.disposition === "BLOCKED" && row.input_revisions === null));
  assert.ok(snapshot.adapter_projections.every((row) => row.disposition === "BLOCKED" && row.adapter_revision === null));
  assert.equal(VERTICAL_PROFILE_SLOTS.filter((slot) => slot.disposition === "IDENTITY_PENDING").length, 10);
  assert.ok(VERTICAL_PROFILE_SLOTS.every((slot) => slot.disposition === "IDENTITY_PENDING" ? slot.label === null : slot.canonical_ref === null));
});
