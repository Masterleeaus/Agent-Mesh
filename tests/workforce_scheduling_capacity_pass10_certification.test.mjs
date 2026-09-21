import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateWorkforceSchedulingConflicts } from '../titan-workforce/scheduling/workforce-scheduling-conflict-evaluator.mjs';
import { buildAssignmentOfflineEnvelope, reconcileAssignmentRestart } from '../titan-workforce/scheduling/assignment-offline-restart-runtime.mjs';
import { evaluateSchedulingApprovalEscalation } from '../titan-workforce/scheduling/scheduling-approval-escalation-runtime.mjs';
import { createDecisionRightsPolicy } from '../titan-workforce/decision/decision-rights-runtime.mjs';

const company_id='company-a';
const worker={company_id,worker_id:'w1',eligible_for_scheduling_proposal:true,blockers:[]};

test('final conflict contract remains proposal-only and authority-neutral',()=>{
 const r=evaluateWorkforceSchedulingConflicts({company_id,availability_capacity_state:{company_id,workers:[worker]},candidate_match:{company_id,workers:[worker]},assignment_hierarchy:{company_id,mission_teams:[{mission_team_id:'team-a',candidate_workers:[{worker_id:'w1'}]}]},proposed_assignment:{company_id,assignment_id:'a1',worker_id:'w1',mission_team_id:'team-a',site_id:'s1',start_ms:0,end_ms:1000},existing_assignments:[]});
 assert.equal(r.state,'CLEAR_FOR_PROPOSAL_REVIEW');assert.equal(r.execution_permitted,false);assert.equal(r.grants_authority,false);
});

test('final approval contract never converts review authority into reassignment execution',()=>{
 const policy=createDecisionRightsPolicy({company_id,rules:[{rule_id:'r1',decision_class:'workforce_reassignment',right:'APPROVE',effect:'allow',subject_type:'worker',subject_id:'m1'}]});
 const graph={schema:'titan.workforce.graph.v1',company_id,nodes:[{node_id:'worker:m1',company_id,kind:'worker'}],edges:[]};
 const suggestions={schema:'titan.workforce.cleaning-assignment-requirement-suggestions.v1',company_id,suggestions:[{mission_team_id:'team-a',state:'READY_FOR_ASSIGNMENT_PROPOSAL_REVIEW',blockers:[],review_reasons:[],suggested_worker_ids:['w1']}]};
 const r=evaluateSchedulingApprovalEscalation({company_id,actor_worker_id:'m1',cleaning_suggestions:suggestions,mission_team_id:'team-a',decision_policy:policy,workforce_graph:graph,mission_teams:[],supervisor_records:[],decision_class:'workforce_reassignment',reassignment:{requested:true,assignment_id:'a1',from_worker_ids:['w1'],to_worker_ids:['w2'],reason_ref:'ops:r1'}});
 assert.equal(r.approval_evaluation.decision_right_permitted,true);assert.equal(r.execution_permitted,false);assert.equal(r.automatic_reassignment,false);
});

test('final restart contract preserves accepted assignment as evidence only',()=>{
 const decision={assignment_id:'a1',company_id,work_item_id:'job1',worker_id:'w1',decision_state:'assigned',revision:1,grants_authority:false};
 const receipt={company_id,assignment_id:'a1',acceptance_id:'accept1',authority_decision_ref:'auth1',accepted_at:'2026-09-09T01:00:00Z',revision:1,idempotency_key:'accept:a1:1'};
 const envelope=buildAssignmentOfflineEnvelope({company_id,assignment_decision:decision,acceptance_receipt:receipt});
 const r=reconcileAssignmentRestart({company_id,envelope,current_assignment_revision:1,current_assignment_state:'assigned'});
 assert.equal(r.accepted_state_manufactured,false);assert.equal(r.automatic_effect_replay,false);assert.equal(r.execution_permitted,false);
});

test('final restart duplicate replay is a no-op',()=>{
 const decision={assignment_id:'a2',company_id,work_item_id:'job2',worker_id:'w1',decision_state:'assigned',revision:2,grants_authority:false};
 const receipt={company_id,assignment_id:'a2',acceptance_id:'accept2',authority_decision_ref:'auth2',accepted_at:'2026-09-09T01:00:00Z',revision:2,idempotency_key:'accept:a2:2'};
 const envelope=buildAssignmentOfflineEnvelope({company_id,assignment_decision:decision,acceptance_receipt:receipt});
 const r=reconcileAssignmentRestart({company_id,envelope,current_assignment_revision:2,current_assignment_state:'assigned',applied_idempotency_keys:['accept:a2:2']});
 assert.equal(r.replay_outcome,'NOOP_ALREADY_APPLIED');assert.equal(r.duplicate_effect_prevented,true);
});

test('final company boundary rejects legacy tenant data',()=>{
 assert.throws(()=>buildAssignmentOfflineEnvelope({company_id,tenant_company_id:'legacy',assignment_decision:{assignment_id:'a3',company_id,work_item_id:'job3',worker_id:'w1',decision_state:'proposed',revision:1,grants_authority:false}}),/legacy-tenant-boundary/);
});
