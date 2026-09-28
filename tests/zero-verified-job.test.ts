import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import Database from 'better-sqlite3';
import { createSqliteStorage } from '../packages/storage/src/index.ts';
import { completeAssignedWorkOrder } from '../apps/web/lib/work-orders/lead-access.ts';
import { createFieldServiceRuntime } from '../services/workforce/src/field-service-runtime.mjs';

import { SqliteAuthorityStore, SqliteWorkerAccessStore } from '../packages/runtime/authority/index.mjs';

const capability='crm.work_order.complete';
async function fixture() {
 const dir=mkdtempSync(join(tmpdir(),'titan-job-')); const file=join(dir,'test.db');
 const db=new Database(file);
 for(const f of readdirSync(new URL('../db/sqlite', import.meta.url)).filter(f=>f.endsWith('.sql')).sort()) db.exec(readFileSync(new URL('../db/sqlite/'+f, import.meta.url),'utf8'));
 db.exec("INSERT INTO companies(id,name) VALUES('a','A'),('b','B'); INSERT INTO users(id,company_id,email,full_name,password_hash,role) VALUES('lead','a','lead@example.invalid','Lead','fixture','tech'); INSERT INTO clients(id,company_id,name) VALUES('client','a','Client'); INSERT INTO jobs(id,company_id,client_id,title,created_by) VALUES('job','a','client','Job','lead'); INSERT INTO work_orders(id,company_id,job_id,client_id,title,status,assigned_user_id,created_by) VALUES('wo','a','job','client','Work','in_progress','lead','lead'); INSERT INTO visits(id,company_id,job_id,work_order_id,assigned_user_id,status,scheduled_start,scheduled_end,completed_at) VALUES('visit','a','job','wo','lead','completed','2026-09-28','2026-09-28','2026-09-28'); INSERT INTO work_order_tasks(id,company_id,work_order_id,label,completed,status) VALUES('task','a','wo','Completion evidence',1,'done'); INSERT INTO evidence(id,company_id,subject_type,subject_id,evidence_type) VALUES('field-proof','a','work_order','wo','field_completion');");
 const envelope={actor_id:'lead',work_order_id:'wo',permissions:[capability],policy_allows:true,governance_allows:true,assurance_allows:true,risk:'low',evidence_refs:['field-proof'],approval:{status:'approved',approval_id:'approval',approver_id:'lead',approval_scope:'wo',granted_at:new Date().toISOString()},autonomy_snapshot:{company_id:'a',source:'titan-autonomy',status:'verified',decision_id:'external-autonomy',capability,effective_score:60,verified_at:new Date().toISOString()}};
 db.prepare("INSERT INTO authority_state(id,company_id,subject_type,subject_id,level,envelope) VALUES('grant','a','worker_capability',?,'scoped',?)").run('manager/'+capability,JSON.stringify(envelope));
 db.close();
 let storage=createSqliteStorage(file);
 await new SqliteWorkerAccessStore(storage).append({company_id:'a',assignment_id:'access',worker_id:'manager',permissions:[capability],status:'active',granted_at:new Date().toISOString()});
 const authorityStore=new SqliteAuthorityStore(storage);
 await authorityStore.appendAutonomySnapshot(envelope.autonomy_snapshot,{worker_id:'manager'});
 await authorityStore.appendApproval({company_id:'a',...envelope.approval});
 const workOrders={
  async complete({company_id,actor_id,work_order_id}:any){return storage.transaction(tx=>completeAssignedWorkOrder(tx as any,work_order_id,company_id,actor_id));},
  async read({company_id,actor_id,work_order_id}:any){return (await storage.query('SELECT id,status,completed_at,assigned_user_id FROM work_orders WHERE company_id=$1 AND id=$2 AND assigned_user_id=$3',[company_id,work_order_id,actor_id])).rows[0]??null;},
 };
 let runtime=await createFieldServiceRuntime({storage,workOrders});
 await runtime.workforce.registerWorker({company_id:'a',worker_id:'manager',kind:'digital',active:true,capabilities:['work.delegate',capability]});
 const input={company_id:'a',actor_id:'lead',conversation_id:'conversation',interaction_id:'interaction',client_message_id:'message',correlation_id:'correlation',text:'complete work order wo'};
 return {get storage(){return storage}, get runtime(){return runtime},input,envelope,workOrders,
 async peer(){const peerStorage=createSqliteStorage(file);return {storage:peerStorage,runtime:await createFieldServiceRuntime({storage:peerStorage,workOrders})};},
 async restart(){await storage.close();storage=createSqliteStorage(file);runtime=await createFieldServiceRuntime({storage,workOrders});},
 async close(){await storage.close();rmSync(dir,{recursive:true,force:true});}};
}

test('governed assigned completion survives restart with durable verified provenance and one mutation',async()=>{
 const f=await fixture();try {
  await f.storage.query('CREATE TABLE mutation_count(n INTEGER)');await f.storage.query('INSERT INTO mutation_count VALUES(0)');await f.storage.query("CREATE TRIGGER count_completion AFTER UPDATE OF status ON work_orders WHEN OLD.status <> NEW.status BEGIN UPDATE mutation_count SET n=n+1; END");
  await f.runtime.dispatch(f.input);
  const before=await f.runtime.project({company_id:'a',actor_id:'lead',work_id:'zero:conversation:message'});
  assert.equal(before.business.status,'completed',JSON.stringify({error:before.run.error,evidence:before.evidence}));assert.equal(before.outcome,'verified');assert.ok(before.evidence.some((e:any)=>e.state==='VERIFIED'&&e.decision_id&&e.run_id));
  await f.restart();await f.runtime.dispatch(f.input);
  const after=await f.runtime.project({company_id:'a',actor_id:'lead',work_id:'zero:conversation:message'});
  assert.equal(after.run.run_id,before.run.run_id);assert.equal(after.outcome,'verified');
  await f.runtime.dispatch({...f.input,client_message_id:'second-message'});
  const second=await f.runtime.project({company_id:'a',actor_id:'lead',work_id:'zero:conversation:second-message'});
  assert.equal(second.outcome,'verified');
  assert.equal((await f.storage.query("SELECT id FROM evidence WHERE company_id='a' AND evidence_type='gateway_execution'")).rowCount,6);
  assert.equal((await f.storage.query('SELECT n FROM mutation_count')).rows[0].n,1);
  assert.equal(await f.runtime.project({company_id:'b',actor_id:'lead',work_id:'zero:conversation:message'}),null);
 }finally{await f.close();}
});

for(const mode of ['denied','approval','missing-evidence','unverified','revoked-access','foreign-evidence','wrong-actor'] as const)test(`${mode} never projects a verified job completion`,async()=>{
 const f=await fixture();try{
  if(mode==='revoked-access')await new SqliteWorkerAccessStore(f.storage).append({company_id:'a',assignment_id:'revoked',worker_id:'manager',status:'revoked',granted_at:new Date(Date.now()+1000).toISOString()});
  if(mode==='foreign-evidence'){await f.storage.query("INSERT INTO evidence(id,company_id,subject_type,subject_id,evidence_type) VALUES('foreign','b','work_order','wo','field_completion')");f.envelope.evidence_refs=['foreign'];}
  if(mode==='wrong-actor')f.input.actor_id='other';
  if(mode==='denied')f.envelope.policy_allows=false;
  if(mode==='approval')await new SqliteAuthorityStore(f.storage).appendApproval({company_id:'a',...f.envelope.approval,approval_id:'zz-pending',status:'pending'});
  if(mode==='missing-evidence')f.envelope.evidence_refs=['foreign-or-missing'];
  if(mode==='unverified')f.workOrders.complete=async()=>({kind:'ok',status:'completed'});
  await f.storage.query("UPDATE authority_state SET envelope=$1 WHERE company_id='a' AND id='grant'",[JSON.stringify(f.envelope)]);
  await f.runtime.dispatch(f.input);
  const view=await f.runtime.project({company_id:'a',actor_id:f.input.actor_id,work_id:'zero:conversation:message'});
  assert.notEqual(view.outcome,'verified');assert.equal(view.business?.status,mode==='wrong-actor'?undefined:'in_progress');
  if(mode==='approval')assert.equal(view.work.state,'WAITING_APPROVAL');
 }finally{await f.close();}
});


test('approval continuation after restart uses durable approval and the original run',async()=>{
 const f=await fixture();try{
  await new SqliteAuthorityStore(f.storage).appendApproval({company_id:'a',...f.envelope.approval,approval_id:'zz-pending',status:'pending'});
  const waiting=await f.runtime.dispatch(f.input);
  assert.ok(waiting.continuation_token);
  await f.restart();
  await new SqliteAuthorityStore(f.storage).appendApproval({company_id:'a',...f.envelope.approval,approval_id:'zzz-approved',status:'approved'});
  await f.runtime.dispatch({...f.input,client_message_id:'reply',text:'continue',continuation_token:waiting.continuation_token});
  const view=await f.runtime.project({company_id:'a',actor_id:'lead',work_id:'zero:conversation:message'});
  assert.equal(view.outcome,'verified');
  assert.equal((await f.storage.query("SELECT run_id FROM agent_runs WHERE company_id='a'")).rowCount,1);
 }finally{await f.close();}
});

test('concurrent approval continuations admit one execution',async()=>{
 const f=await fixture();try{
  await new SqliteAuthorityStore(f.storage).appendApproval({company_id:'a',...f.envelope.approval,approval_id:'zz-pending',status:'pending'});
  const waiting=await f.runtime.dispatch(f.input);
  await new SqliteAuthorityStore(f.storage).appendApproval({company_id:'a',...f.envelope.approval,approval_id:'zzz-approved',status:'approved'});
  const reply={...f.input,text:'continue',continuation_token:waiting.continuation_token};
  await Promise.allSettled([f.runtime.dispatch(reply),f.runtime.dispatch(reply)]);
  assert.equal((await f.storage.query("SELECT id FROM evidence WHERE company_id='a' AND evidence_type='gateway_execution' AND json_extract(payload,'$.state')='VERIFIED'")).rowCount,1);
 }finally{await f.close();}
});

test('concurrent actors cannot receive each others runtime events',async()=>{
 const f=await fixture();try{
  const [one,two]=await Promise.all([f.runtime.dispatch(f.input),f.runtime.dispatch({...f.input,actor_id:'other',client_message_id:'other',text:'unrelated'})]);
  assert.ok(one.events.every(e=>e.work_id==='zero:conversation:message'));
  assert.ok(two.events.every(e=>e.work_id==='zero:conversation:other'));
 }finally{await f.close();}
});

for(const state of ['CREATED','READY','CLAIMED','IN_PROGRESS'])test(`interrupted ${state} bootstrap recovers one persisted run`,async()=>{
 const f=await fixture();try{
  const now=new Date().toISOString();
  await f.runtime.workforceStore.create({company_id:'a',work_id:'zero:conversation:message',state,objective:f.input.text,creator:'lead',origin:{actor_id:'lead',conversation_id:'conversation',surface:'zero'},assignee:state==='CLAIMED'||state==='IN_PROGRESS'?'manager':undefined,priority:50,dependencies:[],required_capabilities:[],context_refs:[],evidence_refs:[],created_at:now,updated_at:now});
  await f.restart();
  await Promise.allSettled([f.runtime.dispatch(f.input),f.runtime.dispatch(f.input)]);
  const view=await f.runtime.project({company_id:'a',actor_id:'lead',work_id:'zero:conversation:message'});
  assert.equal(view.outcome,'verified');assert.equal(view.work.state,'COMPLETED');
  assert.equal((await f.storage.query("SELECT run_id FROM agent_runs WHERE company_id='a'")).rowCount,1);
 }finally{await f.close();}
});

for(const waiting of [false,true])test(`read after restart reconciles persisted ${waiting?'waiting':'completed'} run after interrupted work projection`,async()=>{
 const f=await fixture();try{
  if(waiting)await new SqliteAuthorityStore(f.storage).appendApproval({company_id:'a',...f.envelope.approval,approval_id:'zz-pending',status:'pending'});
  await f.runtime.dispatch(f.input);
  const work=await f.runtime.workforceStore.get('a','zero:conversation:message');
  await f.runtime.workforceStore.put({...work,state:'IN_PROGRESS',result:undefined,evidence_refs:[]});
  await f.restart();
  const view=await f.runtime.project({company_id:'a',actor_id:'lead',work_id:'zero:conversation:message'});
  assert.equal(view.work.state,waiting?'WAITING_APPROVAL':'COMPLETED');
  if(!waiting)assert.ok(view.work.evidence_refs.length>0);
 }finally{await f.close();}
});

test('separate SQLite connections cannot execute one continuation twice',async()=>{
 const f=await fixture();let peer;try{
  await new SqliteAuthorityStore(f.storage).appendApproval({company_id:'a',...f.envelope.approval,approval_id:'zz-pending',status:'pending'});
  const waiting=await f.runtime.dispatch(f.input);
  await new SqliteAuthorityStore(f.storage).appendApproval({company_id:'a',...f.envelope.approval,approval_id:'zzz-approved',status:'approved'});
  peer=await f.peer();
  const reply={...f.input,text:'continue',continuation_token:waiting.continuation_token};
  const results=await Promise.allSettled([f.runtime.dispatch(reply),peer.runtime.dispatch(reply)]);
  assert.equal(results.filter(result=>result.status==='fulfilled').length,1);
  assert.equal((await f.storage.query("SELECT id FROM evidence WHERE company_id='a' AND evidence_type='gateway_execution' AND json_extract(payload,'$.state')='VERIFIED'")).rowCount,1);
 }finally{await peer?.storage.close();await f.close();}
});

test('persisted queued start is recoverable; unknown in-flight execution is not replayed',async()=>{
 const f=await fixture();try{
  await f.runtime.dispatch({...f.input,text:'ask for more information'});
  let run=await f.runtime.runStore.findByWork('a','zero:conversation:message');
  run={...run,state:'QUEUED',messages:[{role:'user',content:f.input.text}],turn:0,wait:null};
  await f.runtime.runStore.save(run);
  await f.restart();await f.runtime.dispatch(f.input);
  assert.equal((await f.runtime.project({company_id:'a',actor_id:'lead',work_id:'zero:conversation:message'})).outcome,'verified');
  await f.runtime.runStore.save({...run,state:'WAITING_TOOL'});
  await assert.rejects(()=>f.runtime.runtime.resume({company_id:'a',run_id:run.run_id,input:{role:'user',content:'retry'}}),/busy-or-recovery-required/);
 }finally{await f.close();}
});
