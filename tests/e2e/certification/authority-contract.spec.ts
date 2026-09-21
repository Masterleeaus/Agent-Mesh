import { test, expect } from "@playwright/test";
import {
  createTitanDelegationEscalation,
  resolveTitanDelegationEscalationApproval,
} from "../../../packages/titan-platform/src/workforce-delegation";

const envelope = {
  company_id: "11111111-1111-1111-1111-111111111111",
  delegation_id: "delegation-certification-1",
  objective: "Verify authority boundary",
  inputs: { source: "manager-1", target: "agent-1" },
  authority_ceiling: "PROPOSE",
  priority: "NORMAL",
  due_at: null,
  idempotency_key: "certification-authority-1",
  causality: {
    correlation_id: "correlation-certification-1",
    root_delegation_id: "delegation-certification-1",
    parent_delegation_id: null,
    source_event_id: null,
  },
  expected_outcome: { description: "Authority remains bounded", evidence_required: ["approval-decision"] },
} as const;

test.describe("Certification — approvals never manufacture authority", () => {
  test("risky escalation requires both manager and human approval and remains non-executable", () => {
    const escalation = createTitanDelegationEscalation({
      envelope,
      escalation_id: "escalation-certification-1",
      reason: "RISKY",
      summary: "Risk requires explicit approval",
      requested_resolution: "Review before continuing",
      idempotency_key: "escalation-certification-key-1",
    });
    expect(escalation.manager_approval_required).toBe(true);
    expect(escalation.human_approval_required).toBe(true);
    expect(escalation.grants_authority).toBe(false);
    expect(escalation.execution_permitted).toBe(false);

    const managerOnly = resolveTitanDelegationEscalationApproval({ escalation, manager_approved: true });
    expect(managerOnly.approved).toBe(false);
    expect(managerOnly.grants_authority).toBe(false);
    expect(managerOnly.execution_permitted).toBe(false);

    const approved = resolveTitanDelegationEscalationApproval({
      escalation,
      manager_approved: true,
      human_approved: true,
    });
    expect(approved.approved).toBe(true);
    expect(approved.grants_authority).toBe(false);
    expect(approved.authority_effect).toBe(false);
    expect(approved.execution_permitted).toBe(false);
  });
});
