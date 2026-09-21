import test from 'node:test';
import assert from 'node:assert/strict';
import {buildRoleWorkerSeparationProjection} from '../titan-workforce/roles/role-worker-separation.mjs';
import {validateRoleWorkerIntegrity,summarizeRoleWorkerIntegrity} from '../titan-workforce/roles/role-worker-integrity.mjs';

const roles=[
  {role_definition_id:'role.cleaner',name:'Cleaner',company_boundary:'company_id',activation_confers_authority:false},
  {role_definition_id:'role.supervisor',name:'Supervisor',company_boundary:'company_id',activation_confers_authority:false},
  {role_definition_id:'role.estimator',name:'Estimator',company_boundary:'company_id',activation_confers_authority:false},
];

function projection(roster=[],assignments=[]){return buildRoleWorkerSeparationProjection({company_id:'co-1',role_definitions:roles,roster,assignments});}

test('healthy role-worker projection produces no integrity issues',()=>{
  const p=projection([{worker_id:'w1',role_definition_id:'role.cleaner'}],[{assignment_id:'a1',worker_id:'w1',role_definition_id:'role.cleaner'}]);
  const r=validateRoleWorkerIntegrity(p);
  assert.equal(r.status,'healthy');assert.equal(r.counts.total,0);assert.equal(r.grants_authority,false);
});

test('critical unstaffed roles are reported without auto staffing',()=>{
  const r=validateRoleWorkerIntegrity(projection([]),{critical_role_definition_ids:['role.supervisor']});
  assert.equal(r.status,'attention');
  assert.equal(r.issues[0].code,'CRITICAL_ROLE_UNSTAFFED');
  assert.equal(r.automatic_execution,false);
});

test('worker without roles is an integrity issue rather than implicit role inference',()=>{
  const p=projection([{worker_id:'w1'}]);
  const r=validateRoleWorkerIntegrity(p);
  assert.ok(r.issues.some(x=>x.code==='WORKER_WITHOUT_ROLE'));
  assert.equal(p.workers[0].role_definition_ids.length,0);
});

test('multi-role assignments require explicit role context',()=>{
  const p=projection([{worker_id:'w1',role_definition_ids:['role.cleaner','role.supervisor']}],[{assignment_id:'a1',worker_id:'w1'}]);
  const r=validateRoleWorkerIntegrity(p);
  assert.ok(r.issues.some(x=>x.code==='ASSIGNMENT_WITHOUT_ROLE_CONTEXT'));
  assert.ok(r.issues.some(x=>x.code==='AMBIGUOUS_MULTI_ROLE_ASSIGNMENT'));
});

test('summary remains company scoped and authority neutral',()=>{
  const p=projection([{worker_id:'w1',company_id:'co-1',role_definition_id:'role.cleaner'}]);
  const r=validateRoleWorkerIntegrity(p,{critical_role_definition_ids:['role.estimator']});
  const s=summarizeRoleWorkerIntegrity(r);
  assert.equal(s.company_id,'co-1');assert.equal(s.grants_authority,false);assert.ok(s.issue_codes.includes('CRITICAL_ROLE_UNSTAFFED'));
});
