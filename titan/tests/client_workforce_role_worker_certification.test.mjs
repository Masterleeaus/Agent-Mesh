import test from 'node:test';
import assert from 'node:assert/strict';
import { buildRoleWorkerSeparationProjection } from '../titan-workforce/roles/role-worker-separation.mjs';
import { validateRoleWorkerIntegrity } from '../titan-workforce/roles/role-worker-integrity.mjs';
import { buildRoleWorkerStaffingProjection } from '../titan-workforce/roles/role-worker-staffing-projection.mjs';
import { buildRoleWorkerChangeSet } from '../titan-workforce/roles/role-worker-change-set.mjs';
import { certifyRoleWorkerModel, summarizeRoleWorkerCertification } from '../titan-workforce/roles/role-worker-certification.mjs';

const roles=[
  {role_definition_id:'dispatcher',name:'Dispatcher',company_boundary:'company_id',activation_confers_authority:false},
  {role_definition_id:'cleaner',name:'Cleaner',company_boundary:'company_id',activation_confers_authority:false},
];
function snapshot(roster,assignments=[],critical=[]){
  const separation=buildRoleWorkerSeparationProjection({company_id:'co-1',role_definitions:roles,roster,assignments});
  const integrity=validateRoleWorkerIntegrity(separation,{critical_role_definition_ids:critical});
  const staffing=buildRoleWorkerStaffingProjection(separation,integrity,{critical_role_definition_ids:critical});
  return {separation,integrity,staffing};
}

test('certifies a clean separated role/worker model while keeping visible UI pending',()=>{
  const s=snapshot([{worker_id:'w1',company_id:'co-1',role_definition_id:'dispatcher'}]);
  const cert=certifyRoleWorkerModel(s);
  assert.equal(cert.status,'certified');
  assert.equal(cert.data_model_ready,true);
  assert.equal(cert.visible_ui_integration_pending,true);
  assert.equal(cert.grants_authority,false);
  assert.equal(cert.automatic_execution,false);
});

test('blocks certification when high-severity integrity issues exist',()=>{
  const s=snapshot([{worker_id:'w1',company_id:'co-1',role_definition_ids:[]}]);
  const cert=certifyRoleWorkerModel(s);
  assert.equal(cert.status,'blocked');
  assert.equal(cert.data_model_ready,false);
  assert.ok(cert.blockers.some(x=>x.code==='BLOCKING_INTEGRITY_ISSUES'));
});

test('rejects cross-company contract combinations',()=>{
  const s=snapshot([{worker_id:'w1',company_id:'co-1',role_definition_id:'dispatcher'}]);
  assert.throws(()=>certifyRoleWorkerModel({...s,staffing:{...s.staffing,company_id:'co-2'}}),/company-mismatch/);
});

test('rejects authority or execution leakage in source contracts',()=>{
  const s=snapshot([{worker_id:'w1',company_id:'co-1',role_definition_id:'dispatcher'}]);
  const cert=certifyRoleWorkerModel({...s,staffing:{...s.staffing,automatic_execution:true}});
  assert.equal(cert.status,'blocked');
  assert.ok(cert.blockers.some(x=>x.code==='SAFETY_CONTRACT_VIOLATION'));
});

test('accepts a read-only change set and summary stays non-executing',()=>{
  const a=snapshot([{worker_id:'w1',company_id:'co-1',role_definition_id:'dispatcher'}]);
  const b=snapshot([{worker_id:'w1',company_id:'co-1',role_definition_id:'dispatcher'},{worker_id:'w2',company_id:'co-1',role_definition_id:'cleaner'}]);
  const change_set=buildRoleWorkerChangeSet(a.staffing,b.staffing);
  const cert=certifyRoleWorkerModel({...b,change_set});
  const summary=summarizeRoleWorkerCertification(cert);
  assert.equal(summary.data_model_ready,true);
  assert.equal(summary.visible_ui_integration_pending,true);
  assert.equal(summary.grants_authority,false);
  assert.ok(cert.warnings.some(x=>x.code==='STAFFING_CHANGE_SET_PRESENT'));
});
