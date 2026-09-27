import test from 'node:test';
import assert from 'node:assert/strict';
import {buildSchedulingReplayEnvelope, assessSchedulingReplay} from '../../../titan-workforce/starter-agents/scheduling/scheduling-offline-replay.mjs';

const proposal={schema:'titan.scheduling.approval-escalation.v1',company_id:'c1',schedule_intent_id:'s1',work_item_id:'w1',operation_id:'op1',action_id:'a1',status:'APPROVAL_REQUIRED',execution_permitted:false,grants_authority:false};

test('proposal replay envelope is company-scoped, idempotent and effect-neutral',()=>{
 const r=buildSchedulingReplayEnvelope({company_id:'c1',operation_id:'op1',base_revision:7,kind:'proposal'},proposal);
 assert.equal(r.schema,'titan.scheduling.offline-replay-envelope.v1');
 assert.equal(r.company_id,'c1'); assert.equal(r.payload_kind,'proposal');
 assert.equal(r.idempotency_key,'scheduling:c1:op1');
 assert.equal(r.requires_explicit_resume,true); assert.equal(r.automatic_effect_replay,false);
 assert.equal(r.requires_fresh_authority_evaluation,true); assert.equal(r.execution_permitted,false); assert.equal(r.grants_authority,false);
});

test('accepted assignment replay stores reference only, never assignment authority',()=>{
 const r=buildSchedulingReplayEnvelope({company_id:'c1',operation_id:'op2',kind:'accepted_assignment_reference',base_revision:8},{company_id:'c1',assignment_id:'as1',assignment_revision:8,work_item_id:'w1',worker_ids:['u1']});
 assert.deepEqual(r.accepted_assignment_reference,{assignment_id:'as1',assignment_revision:8,work_item_id:'w1',worker_ids:['u1']});
 assert.equal(r.payload,null); assert.equal(r.assignment_authority_owned,false);
});

test('cross-company and legacy tenant data fail closed',()=>{
 assert.throws(()=>buildSchedulingReplayEnvelope({company_id:'c1',operation_id:'op3'}, {...proposal,company_id:'c2'}),/cross-company/);
 assert.throws(()=>buildSchedulingReplayEnvelope({company_id:'c1',operation_id:'op3',tenant_id:'x'}, proposal),/legacy-company-boundary/);
});

test('replay assessment suppresses duplicate operation and requires review for stale revision',()=>{
 const env=buildSchedulingReplayEnvelope({company_id:'c1',operation_id:'op4',base_revision:4},proposal);
 assert.equal(assessSchedulingReplay(env,{company_id:'c1',current_revision:4,applied_operation_ids:['op4']}).disposition,'ALREADY_APPLIED');
 const stale=assessSchedulingReplay(env,{company_id:'c1',current_revision:5,applied_operation_ids:[]});
 assert.equal(stale.disposition,'STALE_REVISION'); assert.equal(stale.replay_allowed,false); assert.equal(stale.requires_fresh_authority_evaluation,true);
});

test('matching revision only prepares governed resubmission, never executes',()=>{
 const env=buildSchedulingReplayEnvelope({company_id:'c1',operation_id:'op5',base_revision:4},proposal);
 const a=assessSchedulingReplay(env,{company_id:'c1',current_revision:4,applied_operation_ids:[]});
 assert.equal(a.disposition,'READY_FOR_GOVERNED_RESUBMISSION');
 assert.equal(a.replay_allowed,false); assert.equal(a.execution_permitted,false); assert.equal(a.requires_explicit_resume,true);
});
