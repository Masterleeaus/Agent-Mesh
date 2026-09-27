import test from "node:test";
import assert from "node:assert/strict";
import {
  assertTitanBusinessWorkflowDiagnosticRepairExecutable,
  buildTitanBusinessWorkflowOperationalDiagnostics,
} from "../../packages/.tmp-business-workflows-build/operational-repair-diagnostics.js";

const base = { company_id: "company-1", correlation_id: "corr-1", canonical_exists: true, counterpart_exists: false, expected_link_ref: "expected-1", observed_link_ref: null, reconciliation_state: "MISSING" };

function evidence(overrides = {}) {
  return { ...base, evidence_id: "e1", workflow_id: "create_job_v1", canonical_domain_surface: "/api/v1/work-orders", subject_ref: "job-1", ...overrides };
}

test("detects orphan jobs, invoices, broken booking links and payment gaps", () => {
  const report = buildTitanBusinessWorkflowOperationalDiagnostics({ companyId: "company-1", correlationId: "corr-1", evidence: [
    evidence(),
    evidence({ evidence_id: "e2", workflow_id: "create_invoice_v1", canonical_domain_surface: "/api/v1/invoices", subject_ref: "invoice-1" }),
    evidence({ evidence_id: "e3", workflow_id: "service_booking_v1", canonical_domain_surface: "/api/v1/booking-requests/[id]/convert", subject_ref: "booking-1", reconciliation_state: "DIVERGED", counterpart_exists: true, observed_link_ref: "wrong-link" }),
    evidence({ evidence_id: "e4", workflow_id: "payment-reconciliation", canonical_domain_surface: "/api/v1/invoices/[id]/payments", subject_ref: "payment-1", reconciliation_state: "UNKNOWN" }),
  ]});
  assert.deepEqual(report.diagnostics.map((d) => d.gap_kind), ["ORPHAN_JOB", "ORPHAN_INVOICE", "BROKEN_BOOKING_LINK", "PAYMENT_RECONCILIATION_GAP"]);
  assert.equal(report.direct_mutation_permitted, false);
});

test("matched evidence produces no repair diagnostic", () => {
  const report = buildTitanBusinessWorkflowOperationalDiagnostics({ companyId: "company-1", correlationId: "corr-1", evidence: [evidence({ reconciliation_state: "MATCHED", counterpart_exists: true, observed_link_ref: "expected-1" })] });
  assert.equal(report.diagnostics.length, 0);
});

test("repair commands are explicit, idempotent and authorization-gated", () => {
  const report = buildTitanBusinessWorkflowOperationalDiagnostics({ companyId: "company-1", correlationId: "corr-1", evidence: [evidence()] });
  const command = report.diagnostics[0].repair;
  assert.equal(command.action, "RELINK");
  assert.equal(command.requires_canonical_domain_authorization, true);
  assert.equal(command.idempotency_required, true);
  assert.equal(command.destructive_rollback_forbidden, true);
  assert.equal(assertTitanBusinessWorkflowDiagnosticRepairExecutable({ report, commandId: command.command_id, companyId: "company-1", correlationId: "corr-1" }).subject_ref, "job-1");
});

test("cross-company/correlation and domain-surface drift fail closed", () => {
  assert.throws(() => buildTitanBusinessWorkflowOperationalDiagnostics({ companyId: "company-1", correlationId: "corr-1", evidence: [evidence({ company_id: "company-2" })] }), /company-mismatch/);
  assert.throws(() => buildTitanBusinessWorkflowOperationalDiagnostics({ companyId: "company-1", correlationId: "corr-1", evidence: [evidence({ correlation_id: "corr-2" })] }), /correlation-mismatch/);
  assert.throws(() => buildTitanBusinessWorkflowOperationalDiagnostics({ companyId: "company-1", correlationId: "corr-1", evidence: [evidence({ canonical_domain_surface: "/api/v1/invoices" })] }), /domain-surface-mismatch/);
});

test("diagnostics are read-only evidence and cannot become rollback authority", () => {
  const report = buildTitanBusinessWorkflowOperationalDiagnostics({ companyId: "company-1", correlationId: "corr-1", evidence: [evidence()] });
  assert.equal(report.read_only_evidence, true);
  assert.equal(report.canonical_business_state_remains_source_of_truth, true);
  assert.equal(report.diagnostics[0].repair.destructive_rollback_forbidden, true);
});
