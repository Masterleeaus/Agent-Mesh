import test from "node:test";
import assert from "node:assert/strict";
import {
  createTitanBusinessWorkflowExecutionState,
  assertTitanBusinessWorkflowResume,
  transitionTitanBusinessWorkflowExecutionState,
} from "../../packages/.tmp-business-workflows-build/execution-state.js";
import {
  createTitanBusinessVariationApproval,
  transitionTitanBusinessVariationApproval,
} from "../../packages/.tmp-business-workflows-build/variation-approval.js";
import {
  buildTitanBusinessWorkflowRepairPlan,
} from "../../packages/.tmp-business-workflows-build/compensation-repair.js";
import {
  buildTitanBusinessWorkflowOperationalDiagnostics,
} from "../../packages/.tmp-business-workflows-build/operational-repair-diagnostics.js";
import {
  buildTitanBusinessWorkflowRunPlan,
} from "../../packages/.tmp-business-workflows-build/runner-contract.js";

const plan = () => buildTitanBusinessWorkflowRunPlan({
  workflowId: "create_job_v1",
  companyId: "company-1",
  actorId: "agent-1",
  correlationId: "corr-9",
  idempotencyKey: "idem-9",
  input: { quote_id: "quote-9" },
});

const authority = (overrides = {}) => ({
  company_id: "company-1",
  actor_id: "manager-1",
  authority_revision: "auth-9",
  capability: "crm.work_order.update",
  scoped_work_order_id: "wo-9",
  captured_at: "2026-09-13T00:00:00.000Z",
  expires_at: "2026-09-13T02:00:00.000Z",
  identity_grants_authority: false,
  ...overrides,
});

const pendingApproval = () => createTitanBusinessVariationApproval({
  companyId: "company-1",
  correlationId: "corr-9",
  variationId: "variation-9",
  workOrderId: "wo-9",
  requestedAt: "2026-09-13T00:05:00.000Z",
  approvalExpiresAt: "2026-09-13T01:00:00.000Z",
  authoritySnapshot: authority(),
});

test("concurrent execution-state writers fail closed on the stale revision", () => {
  const initial = createTitanBusinessWorkflowExecutionState({ plan: plan(), maxAttempts: 3 });
  const committed = transitionTitanBusinessWorkflowExecutionState({ state: initial, expectedRevision: 0, event: { eventId: "start-a", type: "START" } });
  assert.equal(committed.revision, 1);
  assert.throws(() => transitionTitanBusinessWorkflowExecutionState({ state: committed, expectedRevision: 0, event: { eventId: "start-b", type: "START" } }), /revision-conflict/);
});

test("duplicate delivery remains a deterministic no-op across restart/resume", () => {
  let state = createTitanBusinessWorkflowExecutionState({ plan: plan(), maxAttempts: 3 });
  state = transitionTitanBusinessWorkflowExecutionState({ state, expectedRevision: 0, event: { eventId: "start-1", type: "START" } });
  const serialized = JSON.parse(JSON.stringify(state));
  const resumed = assertTitanBusinessWorkflowResume(serialized, { companyId: "company-1", correlationId: "corr-9", idempotencyKey: "idem-9" });
  const duplicate = transitionTitanBusinessWorkflowExecutionState({ state: resumed, expectedRevision: 999, event: { eventId: "start-1", type: "START" } });
  assert.deepEqual(duplicate, serialized);
  assert.equal(duplicate.attempt, 1);
});

test("out-of-order workflow events fail closed and cannot synthesize success", () => {
  const initial = createTitanBusinessWorkflowExecutionState({ plan: plan(), maxAttempts: 3 });
  assert.throws(() => transitionTitanBusinessWorkflowExecutionState({ state: initial, expectedRevision: 0, event: { eventId: "success-before-start", type: "SUCCEEDED", resultRef: "job-9" } }), /success-invalid/);
  assert.throws(() => transitionTitanBusinessWorkflowExecutionState({ state: initial, expectedRevision: 0, event: { eventId: "failure-before-start", type: "RETRYABLE_FAILURE", errorCode: "timeout" } }), /retryable-failure-invalid/);
  assert.equal(initial.status, "PENDING");
  assert.equal(initial.revision, 0);
});

test("competing variation decisions are revision-serialized and terminal", () => {
  const pending = pendingApproval();
  const approved = transitionTitanBusinessVariationApproval({
    approval: pending,
    expectedRevision: 0,
    now: "2026-09-13T00:10:00.000Z",
    decision: "APPROVE",
    reasonCode: "customer-confirmed",
    authoritySnapshot: authority({ authority_revision: "auth-10", captured_at: "2026-09-13T00:09:00.000Z" }),
  });
  assert.equal(approved.status, "APPROVED");
  assert.throws(() => transitionTitanBusinessVariationApproval({
    approval: approved,
    expectedRevision: 0,
    now: "2026-09-13T00:11:00.000Z",
    decision: "DENY",
    reasonCode: "late-conflicting-decision",
    authoritySnapshot: authority({ authority_revision: "auth-11", captured_at: "2026-09-13T00:10:30.000Z" }),
  }), /revision-conflict/);
  assert.throws(() => transitionTitanBusinessVariationApproval({
    approval: approved,
    expectedRevision: 1,
    now: "2026-09-13T00:11:00.000Z",
    decision: "DENY",
    authoritySnapshot: authority({ authority_revision: "auth-11", captured_at: "2026-09-13T00:10:30.000Z" }),
  }), /terminal/);
});

test("repair and diagnostics are deterministic across replay and do not create rollback authority", () => {
  const effect = {
    effect_id: "job-create-9",
    workflow_id: "create_job_v1",
    company_id: "company-1",
    correlation_id: "corr-9",
    canonical_domain_surface: "/api/v1/work-orders",
    idempotency_key: "idem-job-9",
    state: "UNKNOWN",
    externally_completed: false,
    result_ref: null,
    error_code: null,
  };
  const first = buildTitanBusinessWorkflowRepairPlan({ companyId: "company-1", correlationId: "corr-9", planId: "repair-9", effects: [effect] });
  const replay = buildTitanBusinessWorkflowRepairPlan({ companyId: "company-1", correlationId: "corr-9", planId: "repair-9", effects: [effect] });
  assert.deepEqual(replay, first);
  assert.equal(first.commands[0].action, "RECONCILE");
  assert.equal(first.destructive_rollback_allowed, false);

  const evidence = {
    evidence_id: "ev-9",
    workflow_id: "create_job_v1",
    company_id: "company-1",
    correlation_id: "corr-9",
    canonical_domain_surface: "/api/v1/work-orders",
    subject_ref: "job-9",
    canonical_exists: true,
    counterpart_exists: false,
    expected_link_ref: "booking-9",
    observed_link_ref: null,
    reconciliation_state: "MISSING",
  };
  const d1 = buildTitanBusinessWorkflowOperationalDiagnostics({ companyId: "company-1", correlationId: "corr-9", evidence: [evidence] });
  const d2 = buildTitanBusinessWorkflowOperationalDiagnostics({ companyId: "company-1", correlationId: "corr-9", evidence: [evidence] });
  assert.deepEqual(d2, d1);
  assert.equal(d1.read_only_evidence, true);
  assert.equal(d1.direct_mutation_permitted, false);
  assert.equal(d1.diagnostics[0].repair.destructive_rollback_forbidden, true);
});
