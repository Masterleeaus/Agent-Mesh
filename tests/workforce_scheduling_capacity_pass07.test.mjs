import test from 'node:test';
import assert from 'node:assert/strict';
import { createDecisionRightsPolicy } from '../titan-workforce/decision/decision-rights-runtime.mjs';
import { evaluateSchedulingApprovalEscalation } from '../titan-workforce/scheduling/scheduling-approval-escalation-runtime.mjs';

const graph = {
  schema: 'titan.workforce.graph.v1', company_id: 'company-a',
  nodes: [
    { node_id: 'worker:m1', company_id: 'company-a', kind: 'worker' },
    { node_id: 'worker:w1', company_id: 'company-a', kind: 'worker' },
    { node_id: 'worker:w2', company_id: 'company-a', kind: 'worker' },
    { node_id: 'role:manager', company_id: 'company-a', kind: 'role' }
  ],
  edges: [
    { company_id: 'company-a', type: 'HAS_ROLE', from: 'worker:m1', to: 'role:manager' },
    { company_id: 'company-a', type: 'REPORTS_TO', from: 'worker:w1', to: 'worker:m1' },
    { company_id: 'company-a', type: 'REPORTS_TO', from: 'worker:w2', to: 'worker:m1' }
  ]
};
const teams = [{ company_id: 'company-a', mission_team_id: 'team-a', members: [{ worker_id: 'w1' }, { worker_id: 'w2' }], supervisor_worker_id: 'm1' }];
const supervisors = [{ company_id: 'company-a', supervisor_worker_id: 'm1', scope: { subordinate_worker_ids: ['w1','w2'] } }];
const ready = {
  schema: 'titan.workforce.cleaning-assignment-requirement-suggestions.v1', company_id: 'company-a',
  suggestions: [{ mission_team_id: 'team-a', state: 'READY_FOR_ASSIGNMENT_PROPOSAL_REVIEW', blockers: [], review_reasons: [], suggested_worker_ids: ['w1','w2'] }]
};
const policy = createDecisionRightsPolicy({ company_id: 'company-a', rules: [
  { rule_id: 'approve-manager', decision_class: 'workforce_reassignment', right: 'APPROVE', effect: 'allow', subject_type: 'role', subject_id: 'manager' },
  { rule_id: 'escalate-worker', decision_class: 'workforce_reassignment', right: 'ESCALATE', effect: 'allow', subject_type: 'worker', subject_id: 'w1' }
]});
const base = { company_id: 'company-a', cleaning_suggestions: ready, mission_team_id: 'team-a', decision_policy: policy, workforce_graph: graph, mission_teams: teams, supervisor_records: supervisors, decision_class: 'workforce_reassignment', reassignment: { requested: true, assignment_id: 'a1', from_worker_ids: ['w1'], to_worker_ids: ['w2'], reason_ref: 'ops:change:1' } };

test('manager with explicit APPROVE right may approve review but gains no execution authority', () => {
  const result = evaluateSchedulingApprovalEscalation({ ...base, actor_worker_id: 'm1' });
  assert.equal(result.state, 'APPROVAL_RIGHT_CONFIRMED_FOR_REVIEW');
  assert.equal(result.approval_evaluation.decision_right_permitted, true);
  assert.equal(result.requires_external_assignment_decision, true);
  assert.equal(result.execution_permitted, false);
  assert.equal(result.grants_authority, false);
});

test('worker with ESCALATE but no APPROVE right gets an authority-neutral escalation draft', () => {
  const result = evaluateSchedulingApprovalEscalation({ ...base, actor_worker_id: 'w1' });
  assert.equal(result.state, 'ESCALATION_REQUIRED');
  assert.equal(result.approval_evaluation.decision_right_permitted, false);
  assert.equal(result.escalation_evaluation.decision_right_permitted, true);
  assert.equal(result.escalation_draft.grants_authority, false);
  assert.ok(result.risk_reasons.includes('REASSIGNMENT_REQUESTED'));
});

test('no approve or escalate right fails closed', () => {
  const result = evaluateSchedulingApprovalEscalation({ ...base, actor_worker_id: 'w2' });
  assert.equal(result.state, 'BLOCKED_NO_APPROVAL_OR_ESCALATION_RIGHT');
  assert.equal(result.automatic_reassignment, false);
});

test('scheduling blockers cannot be overridden by an approval right', () => {
  const blocked = { ...ready, suggestions: [{ ...ready.suggestions[0], state: 'BLOCKED', blockers: ['CREW_SIZE_SHORTAGE:1'] }] };
  const result = evaluateSchedulingApprovalEscalation({ ...base, actor_worker_id: 'm1', cleaning_suggestions: blocked });
  assert.equal(result.approval_evaluation.decision_right_permitted, true);
  assert.equal(result.state, 'BLOCKED_BY_SCHEDULING_EVIDENCE');
  assert.equal(result.scheduling_blocked, true);
});

test('identity is not authority and company/legacy boundaries fail closed', () => {
  const result = evaluateSchedulingApprovalEscalation({ ...base, actor_worker_id: 'm1' });
  assert.equal(result.manager_identity_confers_authority, false);
  assert.equal(result.supervisor_identity_confers_authority, false);
  assert.throws(() => evaluateSchedulingApprovalEscalation({ ...base, company_id: 'company-b', actor_worker_id: 'm1' }), /cross-company/);
  assert.throws(() => evaluateSchedulingApprovalEscalation({ ...base, actor_worker_id: 'm1', tenant_company_id: 'legacy' }), /legacy-tenant-boundary/);
});

test('reassignment requires explicit assignment id and evidence reference', () => {
  assert.throws(() => evaluateSchedulingApprovalEscalation({ ...base, actor_worker_id: 'm1', reassignment: { requested: true, reason_ref: 'r' } }), /assignment_id-required/);
  assert.throws(() => evaluateSchedulingApprovalEscalation({ ...base, actor_worker_id: 'm1', reassignment: { requested: true, assignment_id: 'a1' } }), /reason_ref-required/);
});
