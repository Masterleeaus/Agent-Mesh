import test from "node:test";
import assert from "node:assert/strict";
import {
  createTitanBusinessWorkflowParticipant,
  createTitanBusinessWorkflowParticipantHandoff,
} from "../../packages/.tmp-business-workflows-build/workforce-participant-handoff.js";

function participant(tier, overrides = {}) {
  const ids = {
    manager: {},
    supervisor: { supervisorId: "sup-1" },
    agent: { supervisorId: "sup-1", agentId: "agent-1" },
    worker: { supervisorId: "sup-1", agentId: "agent-1", workerId: "worker-1" },
  }[tier];
  return createTitanBusinessWorkflowParticipant({
    companyId: "company-1",
    correlationId: "corr-1",
    workflowId: "create_job_v1",
    participantId: `${tier}-p`,
    tier,
    managerId: "mgr-1",
    authorityCeiling: tier === "manager" ? "WRITE_INTERNAL" : "PROPOSE",
    ...ids,
    ...overrides,
  });
}

test("participant identity and hierarchy do not themselves grant execution authority", () => {
  const p = participant("agent");
  assert.equal(p.can_execute, false);
  assert.equal(p.identity_is_authority, false);
  assert.equal(p.hierarchy_is_authority, false);
  assert.equal(p.handoff_is_authority, false);
});

test("adjacent manager to supervisor handoff is accepted but cannot execute without authority and capability evidence", () => {
  const handoff = createTitanBusinessWorkflowParticipantHandoff({ from: participant("manager"), to: participant("supervisor"), handoffId: "h-1", summary: "Review booking exception" });
  assert.equal(handoff.accepted, true);
  assert.equal(handoff.execution_permitted, false);
  assert.equal(handoff.reason_code, "participant-only-authority-evidence-required");
  assert.equal(handoff.policies.handoff_does_not_grant_authority, true);
});

test("execution becomes eligible only when explicit authority decision and capability resolution evidence are both present", () => {
  const from = participant("agent");
  const to = participant("worker", { authorityDecisionRef: "auth-42", capabilityResolutionRef: "cap-42" });
  const handoff = createTitanBusinessWorkflowParticipantHandoff({ from, to, handoffId: "h-2", summary: "Perform bounded job task", causalRef: "event-9" });
  assert.equal(handoff.execution_permitted, true);
  assert.equal(handoff.reason_code, "authority-and-capability-evidence-present");
});

test("handoffs cannot skip hierarchy tiers or shortcut upward authority boundaries", () => {
  assert.throws(() => createTitanBusinessWorkflowParticipantHandoff({ from: participant("manager"), to: participant("agent"), handoffId: "h-skip", summary: "skip" }), /hierarchy-skip/);
  assert.throws(() => createTitanBusinessWorkflowParticipantHandoff({ from: participant("worker"), to: participant("agent"), handoffId: "h-up", summary: "up" }), /upward-authority-shortcut/);
});

test("cross-company and authority-expanding handoffs fail closed", () => {
  const from = participant("agent", { authorityCeiling: "PROPOSE" });
  const otherCompany = participant("worker", { companyId: "company-2" });
  assert.throws(() => createTitanBusinessWorkflowParticipantHandoff({ from, to: otherCompany, handoffId: "h-company", summary: "x" }), /company-mismatch/);
  const elevated = participant("worker", { authorityCeiling: "WRITE_INTERNAL" });
  assert.throws(() => createTitanBusinessWorkflowParticipantHandoff({ from, to: elevated, handoffId: "h-auth", summary: "x" }), /authority-expansion/);
});
