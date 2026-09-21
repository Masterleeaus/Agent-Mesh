import test from 'node:test';
import assert from 'node:assert/strict';
import {buildRoleWorkerSeparationProjection,summarizeRoleWorkerSeparation} from '../titan-workforce/roles/role-worker-separation.mjs';

const roles=[
  {role_definition_id:'role.cleaner',name:'Cleaner',purpose:'Perform cleaning work',division_key:'operations',operational_domains:['operations'],verticals:['cleaning'],company_boundary:'company_id',activation_confers_authority:false},
  {role_definition_id:'role.supervisor',name:'Supervisor',purpose:'Coordinate workers',division_key:'operations',operational_domains:['operations'],verticals:['cleaning'],company_boundary:'company_id',activation_confers_authority:false},
  {role_definition_id:'role.estimator',name:'Estimator',purpose:'Prepare estimates',division_key:'sales',operational_domains:['quoting'],verticals:['cleaning'],company_boundary:'company_id',activation_confers_authority:false},
];

test('role definitions and worker instances remain separate entities',()=>{
  const p=buildRoleWorkerSeparationProjection({company_id:'co-1',role_definitions:roles,roster:[
    {worker_id:'w1',company_id:'co-1',name:'A',role_definition_id:'role.cleaner',status:'active',provider_bindings:[{provider:'local'}]},
    {worker_id:'w2',company_id:'co-1',name:'B',role_definition_ids:['role.cleaner','role.supervisor'],status:'active'},
  ]});
  assert.equal(p.roles.length,3);assert.equal(p.workers.length,2);
  assert.deepEqual(p.roles.find(r=>r.role_definition_id==='role.cleaner').worker_ids,['w1','w2']);
  assert.equal(p.roles.find(r=>r.role_definition_id==='role.cleaner').status,undefined);
  assert.equal(p.workers[0].instance_data_only,true);
  assert.equal(p.grants_authority,false);
});

test('one worker may hold many roles and one role may have many workers',()=>{
  const p=buildRoleWorkerSeparationProjection({company_id:'co-1',role_definitions:roles,roster:[
    {worker_id:'w1',role_definition_ids:['role.cleaner','role.supervisor']},
    {worker_id:'w2',role_definition_id:'role.cleaner'},
  ]});
  assert.deepEqual(p.diagnostics.multi_worker_role_definition_ids,['role.cleaner']);
  assert.deepEqual(p.diagnostics.multi_role_worker_ids,['w1']);
  assert.deepEqual(p.diagnostics.unstaffed_role_definition_ids,['role.estimator']);
});

test('assignments link role and worker without changing authority',()=>{
  const p=buildRoleWorkerSeparationProjection({company_id:'co-1',role_definitions:roles,roster:[
    {worker_id:'w1',role_definition_ids:['role.cleaner','role.supervisor']},
  ],assignments:[{assignment_id:'a1',company_id:'co-1',worker_id:'w1',role_definition_id:'role.cleaner'}]});
  assert.equal(p.assignment_links[0].relationship_only,true);
  assert.equal(p.assignment_links[0].grants_authority,false);
  assert.deepEqual(p.roles.find(r=>r.role_definition_id==='role.cleaner').assignment_ids,['a1']);
  assert.equal(p.invariants.role_assignment_confers_authority,false);
});

test('unknown or inconsistent role references fail closed',()=>{
  assert.throws(()=>buildRoleWorkerSeparationProjection({company_id:'co-1',role_definitions:roles,roster:[{worker_id:'w1',role_definition_id:'role.missing'}]}),/unknown-role/);
  assert.throws(()=>buildRoleWorkerSeparationProjection({company_id:'co-1',role_definitions:roles,roster:[{worker_id:'w1',role_definition_id:'role.cleaner'}],assignments:[{assignment_id:'a1',worker_id:'w1',role_definition_id:'role.supervisor'}]}),/role-not-held/);
});

test('company boundary filters foreign records and summary is read only',()=>{
  const p=buildRoleWorkerSeparationProjection({company_id:'co-1',role_definitions:roles,roster:[
    {worker_id:'w1',company_id:'co-1',role_definition_id:'role.cleaner'},
    {worker_id:'foreign',company_id:'co-2',role_definition_id:'role.cleaner'},
  ],assignments:[{assignment_id:'foreign-a',company_id:'co-2',worker_id:'foreign',role_definition_id:'role.cleaner'}]});
  assert.deepEqual(p.workers.map(w=>w.worker_id),['w1']);
  const s=summarizeRoleWorkerSeparation(p);
  assert.equal(s.worker_instances,1);assert.equal(s.read_only,true);assert.equal(s.grants_authority,false);
});
