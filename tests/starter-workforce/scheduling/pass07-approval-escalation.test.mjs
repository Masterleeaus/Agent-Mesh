import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSchedulingApprovalEscalation } from '../../../titan-workforce/starter-agents/scheduling/scheduling-approval-escalation.mjs';

const company_id='company:clean';
const recommendation={schema:'titan.scheduling.cleaning-recommendation.v1',company_id,schedule_intent_id:'sched-7',work_item_id:'job-7',status:'READY_FOR_GOVERNED_ASSIGNMENT',recommended_worker_ids:['w1','w2'],unmet_requirements:[],requires_governed_assignment:true,requires_fresh_authority_evaluation:true,automatic_assignment:false,execution_permitted:false,grants_authority:false};
const base={company_id,operation_id:'sched-op-7',action_id:'reassign-job-7',risk_level:'high',reassignment:true,customer_visible_change:true,reason:'coverage recovery'};

test('high-risk reassignment requires canonical authority evaluation when no decision supplied',()=>{
 const packet=buildSchedulingApprovalEscalation(base,recommendation,null);
 assert.equal(packet.status,'AUTHORITY_EVALUATION_REQUIRED');
 assert.equal(packet.approval_required,true);
 assert.equal(packet.human_attention_required,true);
 assert.equal(packet.target_surface,'approval_queue');
 assert.equal(packet.execution_permitted,false);
 assert.equal(packet.grants_authority,false);
});

test('canonical APPROVAL_REQUIRED decision maps to approval queue without becoming approval',()=>{
 const authority={company_id,operation_id:'sched-op-7',action_id:'reassign-job-7',decision:'APPROVAL_REQUIRED',reason_codes:['approval_required'],authority_decision_id:'auth-7'};
 const packet=buildSchedulingApprovalEscalation(base,recommendation,authority);
 assert.equal(packet.status,'APPROVAL_REQUIRED');
 assert.equal(packet.target_surface,'approval_queue');
 assert.equal(packet.authority_decision_id,'auth-7');
 assert.equal(packet.approval_satisfied,false);
 assert.equal(packet.execution_permitted,false);
});

test('canonical ESCALATE and DENY decisions remain blocking',()=>{
 const escalated=buildSchedulingApprovalEscalation(base,recommendation,{company_id,operation_id:'sched-op-7',action_id:'reassign-job-7',decision:'ESCALATE',reason_codes:['high_risk_escalation_required'],authority_decision_id:'auth-e'});
 assert.equal(escalated.status,'ESCALATION_REQUIRED');
 assert.equal(escalated.target_surface,'human_review');
 const denied=buildSchedulingApprovalEscalation(base,recommendation,{company_id,operation_id:'sched-op-7',action_id:'reassign-job-7',decision:'DENY',reason_codes:['policy_not_allowed'],authority_decision_id:'auth-d'});
 assert.equal(denied.status,'DENIED');
 assert.equal(denied.execution_permitted,false);
});

test('canonical ALLOW only makes packet ready for governed submission, never execution',()=>{
 const packet=buildSchedulingApprovalEscalation({...base,risk_level:'medium'},recommendation,{company_id,operation_id:'sched-op-7',action_id:'reassign-job-7',decision:'ALLOW',reason_codes:['all_authority_gates_satisfied'],authority_decision_id:'auth-a'});
 assert.equal(packet.status,'READY_FOR_GOVERNED_SUBMISSION');
 assert.equal(packet.authority_evaluation_satisfied,true);
 assert.equal(packet.execution_permitted,false);
 assert.equal(packet.direct_mutation,false);
});

test('unmet cleaning requirements force human review even before authority evaluation',()=>{
 const packet=buildSchedulingApprovalEscalation({...base,risk_level:'low'}, {...recommendation,status:'REQUIREMENTS_UNMET',unmet_requirements:[{code:'EQUIPMENT_SHORTFALL'}]}, null);
 assert.equal(packet.status,'REQUIREMENTS_REVIEW_REQUIRED');
 assert.equal(packet.target_surface,'human_review');
});

test('rejects cross-company authority decision and legacy tenant keys',()=>{
 assert.throws(()=>buildSchedulingApprovalEscalation(base,recommendation,{company_id:'company:other',decision:'DENY'}),/cross-company-authority-decision-denied/);
 assert.throws(()=>buildSchedulingApprovalEscalation({...base,tenant_company_id:'legacy'},recommendation,null),/legacy-company-boundary/);
});
