import assert from "node:assert/strict";
import test from "node:test";
import { createSurfaceCommandIntent, getDemoSurfaceProjection } from "./surface-contract.mjs";

test("owner presentation uses canonical zero surface while retaining Command label", () => {
  const projection = getDemoSurfaceProjection("zero");
  assert.equal(projection.surface, "zero");
  assert.equal(projection.data.presentation.name, "Titan Command");
  assert.equal(projection.identity_grants_authority, false);
});

test("command is not a second canonical surface boundary", () => {
  assert.throws(() => getDemoSurfaceProjection("command"), /canonical-surface-required/);
});

test("zero owner mutations remain governed command intents", () => {
  const projection = getDemoSurfaceProjection("zero");
  const intent = createSurfaceCommandIntent({
    projection,
    capability_id: "decision.resolve",
    operation: "approve",
    idempotency_key: "decision:1:approve",
    correlation_id: "corr-1",
    payload: { decision_id: "decision-1" },
  });
  assert.equal(intent.company_id, projection.company_id);
  assert.equal(intent.surface, "zero");
  assert.equal(intent.execution_authorised, false);
  assert.equal(intent.requires_server_acceptance, true);
  assert.equal(intent.requires_receipt, true);
});

test("Go maps capability remains available after owner normalization", () => {
  const projection = getDemoSurfaceProjection("go");
  assert.ok(projection.capabilities.some((item) => item.capability_id === "maps.navigate"));
});
