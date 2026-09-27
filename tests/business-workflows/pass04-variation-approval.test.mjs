import assert from "node:assert/strict";
import test from "node:test";
import {
  createTitanBusinessVariationApproval,
  transitionTitanBusinessVariationApproval,
  assertTitanBusinessVariationApprovalExecutable,
} from "../../packages/.tmp-business-workflows-build/variation-approval.js";

const snapshot = (overrides = {}) => ({
  company_id: "company-1",
  actor_id: "manager-1",
  authority_revision: "auth-r7",
  capability: "crm.work_order.update",
  scoped_work_order_id: "wo-1",
  captured_at: "2026-09-13T00:00:00.000Z",
  expires_at: "2026-09-13T02:00:00.000Z",
  identity_grants_authority: false,
  ...overrides,
});

const create = () => createTitanBusinessVariationApproval({
  companyId: "company-1",
  correlationId: "corr-1",
  variationId: "variation-1",
  workOrderId: "wo-1",
  requestedAt: "2026-09-13T00:05:00.000Z",
  approvalExpiresAt: "2026-09-13T01:00:00.000Z",
  authoritySnapshot: snapshot(),
});

test("creates immutable pending approval with authority snapshot and audit evidence", () => {
  const approval = create();
  assert.equal(approval.status, "PENDING");
  assert.equal(approval.revision, 0);
  assert.equal(approval.authority_snapshot.identity_grants_authority, false);
  assert.deepEqual(approval.audit.map((e) => e.event), ["REQUESTED"]);
  assert.equal(Object.isFrozen(approval), true);
});

test("approval requires a fresh scoped authority snapshot and becomes executable", () => {
  const approved = transitionTitanBusinessVariationApproval({
    approval: create(),
    expectedRevision: 0,
    now: "2026-09-13T00:10:00.000Z",
    decision: "APPROVE",
    reasonCode: "customer-confirmed",
    authoritySnapshot: snapshot({ authority_revision: "auth-r8", captured_at: "2026-09-13T00:09:00.000Z" }),
  });
  assert.equal(approved.status, "APPROVED");
  assert.equal(approved.decision?.authority_revision, "auth-r8");
  assert.equal(assertTitanBusinessVariationApprovalExecutable({ approval: approved, companyId: "company-1", workOrderId: "wo-1", now: "2026-09-13T00:20:00.000Z" }), approved);
});

test("identity cannot substitute for authority or cross company/work-order scope", () => {
  assert.throws(() => createTitanBusinessVariationApproval({ companyId: "company-1", correlationId: "corr-1", variationId: "v-1", workOrderId: "wo-1", requestedAt: "2026-09-13T00:05:00.000Z", approvalExpiresAt: "2026-09-13T01:00:00.000Z", authoritySnapshot: snapshot({ company_id: "company-2" }) }), /authority-company-mismatch/);
  assert.throws(() => transitionTitanBusinessVariationApproval({ approval: create(), expectedRevision: 0, now: "2026-09-13T00:10:00.000Z", decision: "APPROVE", authoritySnapshot: snapshot({ scoped_work_order_id: "wo-2" }) }), /authority-scope-mismatch/);
  assert.throws(() => createTitanBusinessVariationApproval({ companyId: "company-1", correlationId: "corr-1", variationId: "v-1", workOrderId: "wo-1", requestedAt: "2026-09-13T00:05:00.000Z", approvalExpiresAt: "2026-09-13T01:00:00.000Z", authoritySnapshot: snapshot({ identity_grants_authority: true }) }), /identity-authority-forbidden/);
});

test("approval expiry and optimistic revision conflicts fail closed", () => {
  const pending = create();
  assert.throws(() => transitionTitanBusinessVariationApproval({ approval: pending, expectedRevision: 1, now: "2026-09-13T00:10:00.000Z", decision: "DENY", authoritySnapshot: snapshot() }), /revision-conflict/);
  const expired = transitionTitanBusinessVariationApproval({ approval: pending, expectedRevision: 0, now: "2026-09-13T01:00:00.000Z" });
  assert.equal(expired.status, "EXPIRED");
  assert.throws(() => assertTitanBusinessVariationApprovalExecutable({ approval: expired, companyId: "company-1", workOrderId: "wo-1", now: "2026-09-13T01:01:00.000Z" }), /not-approved/);
});

test("denial is terminal and auditable without mutating canonical work order state", () => {
  const denied = transitionTitanBusinessVariationApproval({
    approval: create(),
    expectedRevision: 0,
    now: "2026-09-13T00:15:00.000Z",
    decision: "DENY",
    reasonCode: "insufficient-evidence",
    authoritySnapshot: snapshot({ authority_revision: "auth-r9", captured_at: "2026-09-13T00:14:00.000Z" }),
  });
  assert.equal(denied.status, "DENIED");
  assert.equal(denied.audit.at(-1)?.reason_code, "insufficient-evidence");
  assert.throws(() => transitionTitanBusinessVariationApproval({ approval: denied, expectedRevision: 1, now: "2026-09-13T00:16:00.000Z", decision: "APPROVE", authoritySnapshot: snapshot() }), /terminal/);
});
