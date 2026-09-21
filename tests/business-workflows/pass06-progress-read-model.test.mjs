import test from "node:test";
import assert from "node:assert/strict";
import { buildTitanBusinessWorkflowRunPlan } from "../../packages/.tmp-business-workflows-build/runner-contract.js";
import { createTitanBusinessWorkflowExecutionState, transitionTitanBusinessWorkflowExecutionState } from "../../packages/.tmp-business-workflows-build/execution-state.js";
import { buildTitanBusinessWorkflowRepairPlan } from "../../packages/.tmp-business-workflows-build/compensation-repair.js";
import { assertTitanBusinessWorkflowProgressReadable, buildTitanBusinessWorkflowProgressReadModel } from "../../packages/.tmp-business-workflows-build/progress-read-model.js";

function state() {
  const plan = buildTitanBusinessWorkflowRunPlan({ workflowId: "create_invoice_v1", companyId: "company-1", correlationId: "corr-1", idempotencyKey: "idem-1", input: {} });
  return createTitanBusinessWorkflowExecutionState({ plan, maxAttempts: 3 });
}

test("pending workflow exposes a stable read-only projection without internal mutation state", () => {
  const model = buildTitanBusinessWorkflowProgressReadModel({ state: state() });
  assert.equal(model.phase, "PENDING");
  assert.equal(model.progress_percent, 0);
  assert.equal(model.read_only, true);
  assert.equal(model.mutation_permitted, false);
  assert.equal(model.mutable_internal_state_exposed, false);
  assert.equal("processed_event_ids" in model, false);
  assert.equal("idempotency_key" in model, false);
});

test("retry and reconciliation repair commands become actionable blockers without write authority", () => {
  const s0 = state();
  const s1 = transitionTitanBusinessWorkflowExecutionState({ state: s0, expectedRevision: 0, event: { eventId: "start-1", type: "START" } });
  const s2 = transitionTitanBusinessWorkflowExecutionState({ state: s1, expectedRevision: 1, event: { eventId: "fail-1", type: "RETRYABLE_FAILURE", errorCode: "timeout" } });
  const repairPlan = buildTitanBusinessWorkflowRepairPlan({
    companyId: "company-1",
    correlationId: "corr-1",
    planId: "repair-1",
    effects: [
      { company_id: "company-1", correlation_id: "corr-1", effect_id: "invoice-create", workflow_id: "create_invoice_v1", canonical_domain_surface: "/api/v1/invoices", idempotency_key: "idem-1", state: "FAILED", externally_completed: false, result_ref: null, error_code: "timeout" },
      { company_id: "company-1", correlation_id: "corr-1", effect_id: "invoice-lookup", workflow_id: "create_invoice_v1", canonical_domain_surface: "/api/v1/invoices", idempotency_key: "idem-lookup", state: "UNKNOWN", externally_completed: false, result_ref: null, error_code: null },
    ],
  });
  const model = buildTitanBusinessWorkflowProgressReadModel({ state: s2, repairPlan });
  assert.equal(model.phase, "BLOCKED");
  assert.deepEqual(model.blockers.map((x) => x.action_required), ["RETRY", "RECONCILE"]);
  assert.ok(model.blockers.every((x) => x.destructive_rollback_forbidden === true));
});

test("successful workflow exposes completion and result ref without internal error detail", () => {
  const s0 = state();
  const s1 = transitionTitanBusinessWorkflowExecutionState({ state: s0, expectedRevision: 0, event: { eventId: "start-1", type: "START" } });
  const s2 = transitionTitanBusinessWorkflowExecutionState({ state: s1, expectedRevision: 1, event: { eventId: "ok-1", type: "SUCCEEDED", resultRef: "invoice-42" } });
  const model = buildTitanBusinessWorkflowProgressReadModel({ state: s2 });
  assert.equal(model.phase, "COMPLETE");
  assert.equal(model.progress_percent, 100);
  assert.equal(model.terminal, true);
  assert.equal(model.result_ref, "invoice-42");
  assert.equal("error_code" in model, false);
});

test("cross-company repair plans fail closed", () => {
  const repairPlan = buildTitanBusinessWorkflowRepairPlan({
    companyId: "company-2",
    correlationId: "corr-1",
    planId: "repair-2",
    effects: [{ company_id: "company-2", correlation_id: "corr-1", effect_id: "invoice-create", workflow_id: "create_invoice_v1", canonical_domain_surface: "/api/v1/invoices", idempotency_key: "idem-2", state: "FAILED", externally_completed: false, result_ref: null, error_code: "timeout" }],
  });
  assert.throws(() => buildTitanBusinessWorkflowProgressReadModel({ state: state(), repairPlan }), /repair-company-mismatch/);
});

test("read access is company and correlation scoped and cannot be upgraded into mutation authority", () => {
  const model = buildTitanBusinessWorkflowProgressReadModel({ state: state() });
  assert.equal(assertTitanBusinessWorkflowProgressReadable({ model, companyId: "company-1", correlationId: "corr-1" }), model);
  assert.throws(() => assertTitanBusinessWorkflowProgressReadable({ model, companyId: "company-2", correlationId: "corr-1" }), /company-mismatch/);
  assert.throws(() => assertTitanBusinessWorkflowProgressReadable({ model, companyId: "company-1", correlationId: "corr-x" }), /correlation-mismatch/);
});
