import test from "node:test";
import assert from "node:assert/strict";
import {
  assertTitanBusinessWorkflowRepairCommandExecutable,
  buildTitanBusinessWorkflowRepairPlan,
} from "../../packages/.tmp-business-workflows-build/compensation-repair.js";

const base = {
  company_id: "company-1",
  correlation_id: "corr-1",
};

function effect(overrides = {}) {
  return {
    ...base,
    effect_id: "invoice-created",
    workflow_id: "create_invoice_v1",
    canonical_domain_surface: "/api/v1/invoices",
    idempotency_key: "idem-invoice-1",
    state: "FAILED",
    externally_completed: false,
    result_ref: null,
    error_code: "upstream-timeout",
    ...overrides,
  };
}

test("completed external effects are preserved, never destructively rolled back", () => {
  const plan = buildTitanBusinessWorkflowRepairPlan({
    companyId: "company-1",
    correlationId: "corr-1",
    planId: "repair-1",
    effects: [effect({ state: "COMPLETED", externally_completed: true, result_ref: "invoice-42", error_code: null })],
  });
  assert.equal(plan.destructive_rollback_allowed, false);
  assert.equal(plan.canonical_business_state_remains_source_of_truth, true);
  assert.equal(plan.commands[0].action, "PRESERVE");
  assert.equal(plan.commands[0].destructive_rollback_forbidden, true);
});

test("failed effects retry forward with stable idempotency and canonical authorization required", () => {
  const plan = buildTitanBusinessWorkflowRepairPlan({ companyId: "company-1", correlationId: "corr-1", planId: "repair-2", effects: [effect()] });
  const command = plan.commands[0];
  assert.equal(command.action, "RETRY_FORWARD");
  assert.equal(command.idempotency_key, "idem-invoice-1");
  assert.equal(command.requires_canonical_domain_authorization, true);
  assert.match(command.command_id, /^repair:create_invoice_v1:invoice-created:retry_forward$/);
});

test("unknown and in-flight effects reconcile instead of retrying blindly", () => {
  const plan = buildTitanBusinessWorkflowRepairPlan({
    companyId: "company-1",
    correlationId: "corr-1",
    planId: "repair-3",
    effects: [
      effect({ effect_id: "payment-unknown", workflow_id: "payment-reconciliation", canonical_domain_surface: "/api/v1/invoices/[id]/payments", idempotency_key: "idem-pay", state: "UNKNOWN", error_code: null }),
      effect({ effect_id: "job-inflight", workflow_id: "create_job_v1", canonical_domain_surface: "/api/v1/work-orders", idempotency_key: "idem-job", state: "IN_FLIGHT", error_code: null }),
    ],
  });
  assert.deepEqual(plan.commands.map((x) => x.action), ["RECONCILE", "RECONCILE"]);
});

test("cross-company effects and domain-surface drift fail closed", () => {
  assert.throws(() => buildTitanBusinessWorkflowRepairPlan({ companyId: "company-1", correlationId: "corr-1", planId: "repair-4", effects: [effect({ company_id: "company-2" })] }), /company-mismatch/);
  assert.throws(() => buildTitanBusinessWorkflowRepairPlan({ companyId: "company-1", correlationId: "corr-1", planId: "repair-5", effects: [effect({ canonical_domain_surface: "/api/v1/payments" })] }), /domain-surface-mismatch/);
});

test("repair command execution remains explicitly company/correlation scoped", () => {
  const plan = buildTitanBusinessWorkflowRepairPlan({ companyId: "company-1", correlationId: "corr-1", planId: "repair-6", effects: [effect()] });
  const command = assertTitanBusinessWorkflowRepairCommandExecutable({ plan, commandId: plan.commands[0].command_id, companyId: "company-1", correlationId: "corr-1" });
  assert.equal(command.effect_id, "invoice-created");
  assert.throws(() => assertTitanBusinessWorkflowRepairCommandExecutable({ plan, commandId: command.command_id, companyId: "company-2", correlationId: "corr-1" }), /company-mismatch/);
  assert.throws(() => assertTitanBusinessWorkflowRepairCommandExecutable({ plan, commandId: command.command_id, companyId: "company-1", correlationId: "corr-other" }), /correlation-mismatch/);
});
