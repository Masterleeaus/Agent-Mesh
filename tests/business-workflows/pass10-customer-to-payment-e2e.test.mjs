import test from "node:test";
import assert from "node:assert/strict";
import {
  buildTitanBusinessWorkflowRunPlan,
  executeTitanBusinessWorkflowRunPlan,
} from "../../packages/.tmp-business-workflows-build/runner-contract.js";
import {
  createTitanBusinessWorkflowExecutionState,
  transitionTitanBusinessWorkflowExecutionState,
} from "../../packages/.tmp-business-workflows-build/execution-state.js";
import {
  buildTitanBusinessWorkflowProgressReadModel,
  assertTitanBusinessWorkflowProgressReadable,
} from "../../packages/.tmp-business-workflows-build/progress-read-model.js";
import {
  buildTitanBusinessWorkflowOperationalDiagnostics,
} from "../../packages/.tmp-business-workflows-build/operational-repair-diagnostics.js";

const companyId = "company-e2e";
const correlationId = "corr-customer-payment-10";
const actorId = "agent-e2e";

const FLOW = [
  ["new_customer_v1", "/api/v1/clients", "customer-10", { name: "Customer Ten" }],
  ["create_quote_v1", "/api/v1/estimates", "quote-10", { customer_ref: "customer-10" }],
  ["service_booking_v1", "/api/v1/booking-requests", "booking-10", { quote_ref: "quote-10" }],
  ["create_job_v1", "/api/v1/work-orders", "job-10", { booking_ref: "booking-10" }],
  ["complete_job_v1", "/api/v1/work-orders/[id]/complete", "job-10-complete", { work_order_ref: "job-10" }],
  ["create_invoice_v1", "/api/v1/invoices", "invoice-10", { work_order_ref: "job-10" }],
  ["payment-reconciliation", "/api/v1/invoices/[id]/payments", "payment-10", { invoice_ref: "invoice-10" }],
];

function makePlan([workflowId, _surface, _result, input]) {
  return buildTitanBusinessWorkflowRunPlan({
    workflowId,
    companyId,
    actorId,
    correlationId,
    idempotencyKey: `idem-${workflowId}-10`,
    input,
  });
}

async function runCertifiedFlow({ denyWorkflow = null } = {}) {
  const invoked = [];
  const authorized = [];
  const states = [];
  const adapter = {
    authorize(plan) {
      authorized.push(plan.workflow_id);
      return plan.workflow_id !== denyWorkflow;
    },
    invoke(plan) {
      invoked.push([plan.workflow_id, plan.canonical_domain_surface, plan.idempotency_key]);
      const row = FLOW.find(([workflowId]) => workflowId === plan.workflow_id);
      return { result_ref: row[2], company_id: plan.company_id, correlation_id: plan.correlation_id };
    },
  };

  for (const row of FLOW) {
    const plan = makePlan(row);
    const state0 = createTitanBusinessWorkflowExecutionState({ plan, maxAttempts: 3 });
    const state1 = transitionTitanBusinessWorkflowExecutionState({
      state: state0,
      expectedRevision: 0,
      event: { eventId: `start-${plan.workflow_id}`, type: "START" },
    });
    const outcome = await executeTitanBusinessWorkflowRunPlan({ plan, adapter });
    if (outcome.status === "DENIED") return { authorized, invoked, states, denied: plan.workflow_id };
    const state2 = transitionTitanBusinessWorkflowExecutionState({
      state: state1,
      expectedRevision: 1,
      event: { eventId: `success-${plan.workflow_id}`, type: "SUCCEEDED", resultRef: outcome.result.result_ref },
    });
    states.push(state2);
  }
  return { authorized, invoked, states, denied: null };
}

test("customer-to-payment E2E uses canonical business surfaces in deterministic order", async () => {
  const run = await runCertifiedFlow();
  assert.equal(run.denied, null);
  assert.deepEqual(run.invoked.map(([workflowId]) => workflowId), FLOW.map(([workflowId]) => workflowId));
  assert.deepEqual(run.invoked.map(([, surface]) => surface), FLOW.map(([, surface]) => surface));
  assert.deepEqual(run.authorized, FLOW.map(([workflowId]) => workflowId));
  assert.equal(new Set(run.invoked.map(([, , idem]) => idem)).size, FLOW.length);
});

test("every E2E step reaches terminal success and exposes only read-only completion progress", async () => {
  const run = await runCertifiedFlow();
  assert.equal(run.states.length, FLOW.length);
  for (const state of run.states) {
    assert.equal(state.status, "SUCCEEDED");
    assert.equal(state.company_id, companyId);
    assert.equal(state.correlation_id, correlationId);
    const progress = buildTitanBusinessWorkflowProgressReadModel({ state });
    assertTitanBusinessWorkflowProgressReadable({ model: progress, companyId, correlationId });
    assert.equal(progress.phase, "COMPLETE");
    assert.equal(progress.progress_percent, 100);
    assert.equal(progress.read_only, true);
    assert.equal(progress.mutation_permitted, false);
    assert.equal(progress.mutable_internal_state_exposed, false);
  }
});

test("domain authorization denial halts the chain before the denied canonical mutation", async () => {
  const run = await runCertifiedFlow({ denyWorkflow: "create_invoice_v1" });
  assert.equal(run.denied, "create_invoice_v1");
  assert.deepEqual(run.invoked.map(([workflowId]) => workflowId), [
    "new_customer_v1",
    "create_quote_v1",
    "service_booking_v1",
    "create_job_v1",
    "complete_job_v1",
  ]);
  assert.equal(run.invoked.some(([workflowId]) => workflowId === "create_invoice_v1"), false);
  assert.equal(run.invoked.some(([workflowId]) => workflowId === "payment-reconciliation"), false);
});

test("matched canonical evidence yields no operational repair diagnostics after E2E completion", async () => {
  await runCertifiedFlow();
  const evidence = [
    ["ev-booking-10", "service_booking_v1", "/api/v1/booking-requests", "booking-10", "quote-10"],
    ["ev-job-10", "create_job_v1", "/api/v1/work-orders", "job-10", "booking-10"],
    ["ev-invoice-10", "create_invoice_v1", "/api/v1/invoices", "invoice-10", "job-10"],
    ["ev-payment-10", "payment-reconciliation", "/api/v1/invoices/[id]/payments", "payment-10", "invoice-10"],
  ].map(([evidence_id, workflow_id, canonical_domain_surface, subject_ref, link]) => ({
    evidence_id,
    company_id: companyId,
    correlation_id: correlationId,
    workflow_id,
    canonical_domain_surface,
    subject_ref,
    expected_link_ref: link,
    observed_link_ref: link,
    canonical_exists: true,
    counterpart_exists: true,
    reconciliation_state: "MATCHED",
  }));
  const report = buildTitanBusinessWorkflowOperationalDiagnostics({ companyId, correlationId, evidence });
  assert.equal(report.diagnostics.length, 0);
  assert.equal(report.read_only_evidence, true);
  assert.equal(report.direct_mutation_permitted, false);
});

test("E2E runner remains orchestration-only and preserves company boundary ownership", () => {
  for (const row of FLOW) {
    const plan = makePlan(row);
    assert.equal(plan.company_id, companyId);
    assert.equal(plan.authority.identity_grants_authority, false);
    assert.equal(plan.authority.execution_permitted, false);
    assert.equal(plan.authority.canonical_domain_authorization_required, true);
  }
  assert.throws(() => buildTitanBusinessWorkflowRunPlan({
    workflowId: "create_quote_v1",
    companyId,
    correlationId,
    idempotencyKey: "idem-boundary-10",
    input: { company_id: "other-company" },
  }), /workflow-runner-company-boundary-owned:company_id/);
});
