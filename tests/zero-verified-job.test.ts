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

import { fixture, capability, nativeFixtureSql } from './fixtures/native-runtime-fixture.ts';

test('governed assigned completion survives restart with durable verified provenance and one mutation',async()=>{
 const f=await fixture();try {
  await f.storage.query('CREATE TABLE mutation_count(n INTEGER)');await f.storage.query('INSERT INTO mutation_count VALUES(0)');await f.storage.query("CREATE TRIGGER count_completion AFTER UPDATE OF status ON work_orders WHEN OLD.status <> NEW.status BEGIN UPDATE mutation_count SET n=n+1; END");
  await f.runtime.dispatch(f.input);
  const before=await f.runtime.project({company_id:'a',actor_id:'lead',work_id:'zero:conversation:message'});
  assert.equal(before.business.status,'completed',JSON.stringify({error:before.run.error,evidence:before.evidence}));assert.equal(before.outcome,'verified');assert.ok(before.evidence.some((e:any)=>e.state==='VERIFIED'&&e.decision_id&&e.run_id));
  await f.restart();await f.runtime.dispatch(f.input);
  const after=await f.runtime.project({company_id:'a',actor_id:'lead',work_id:'zero:conversation:message'});
  assert.equal(after.run.run_id,before.run.run_id);assert.equal(after.outcome,'verified');
  assert.equal(before.accepted_evidence.length,6);
  assert.deepEqual(after.accepted_projections,before.accepted_projections);
  assert.deepEqual(after.accepted_evidence,before.accepted_evidence);
  assert.equal(after.accepted_projections[0].provenance.source_of_truth,'accepted-evidence');
  assert.equal(after.accepted_projections[0].status,'VERIFIED');
  assert.ok(after.evidence.every((e:any)=>e.accepted_evidence.schema==='titan.business.accepted-evidence/v1' && e.provenance.actor_id==='lead' && e.provenance.conversation_id==='conversation'));
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
  await f.runtime.workforceStore.create({company_id:'a',work_id:'zero:conversation:message',state,objective:f.input.text,creator:'lead',origin:{actor_id:'lead',conversation_id:'conversation',surface:'zero',correlation_id:f.input.correlation_id},assignee:state==='CLAIMED'||state==='IN_PROGRESS'?'manager':undefined,priority:50,dependencies:[],required_capabilities:[],context_refs:[],evidence_refs:[],created_at:now,updated_at:now});
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
  await new SqliteAuthorityStore(f.storage).appendApproval({company_id:'a',...f.envelope.approval,approval_id:'zz-pending',status:'pending'});
  await f.runtime.dispatch(f.input);
  await new SqliteAuthorityStore(f.storage).appendApproval({company_id:'a',...f.envelope.approval,approval_id:'zzz-approved',status:'approved'});
  let run=await f.runtime.runStore.findByWork('a','zero:conversation:message');
  run={...run,state:'QUEUED',messages:[{role:'user',content:f.input.text}],turn:0,wait:null};
  await f.runtime.runStore.save(run);
  await f.restart();await f.runtime.dispatch(f.input);
  assert.equal((await f.runtime.project({company_id:'a',actor_id:'lead',work_id:'zero:conversation:message'})).outcome,'verified');
  await f.runtime.runStore.save({...run,state:'WAITING_TOOL'});
  await assert.rejects(()=>f.runtime.runtime.resume({company_id:'a',run_id:run.run_id,input:{role:'user',content:'retry'}}),/busy-or-recovery-required/);
 }finally{await f.close();}
});

for (const revokeAt of [1, 2, 3]) test(`current identity rejection at check ${revokeAt} prevents native mutation`, async () => {
 let calls=0;
 const f=await fixture({revalidateIdentity:async (identity:any)=>{
  assert.equal(identity.company_id,'a');assert.equal(identity.actor_id,'lead');
  assert.ok(identity.run_id);assert.equal(identity.work_id,'zero:conversation:message');
  if (++calls===revokeAt) throw new Error('current-session-revoked');
 }});
 try {
  await f.runtime.dispatch(f.input);
  const view=await f.runtime.project({company_id:'a',actor_id:'lead',work_id:'zero:conversation:message'});
  assert.equal(view.business.status,'in_progress');assert.notEqual(view.outcome,'verified');
  assert.equal(calls,revokeAt);
  assert.ok(view.accepted_evidence.every((e:any)=>e.final_outcome!=='verified'));
 }finally{await f.close();}
});

test('legacy gateway evidence remains readable through canonical accepted-evidence projection',async()=>{
 const f=await fixture();try{
  await f.runtime.dispatch(f.input);
  await f.storage.query("UPDATE evidence SET payload=json_remove(payload,'$.accepted_evidence') WHERE company_id='a' AND evidence_type='gateway_execution'");
  await f.restart();
  const view=await f.runtime.project({company_id:'a',actor_id:'lead',work_id:'zero:conversation:message'});
  assert.equal(view.outcome,'verified');assert.equal(view.accepted_evidence.length,6);
  assert.equal(view.accepted_projections[0].provenance.source_of_truth,'accepted-evidence');
 }finally{await f.close();}
});


test('native provider mutates only the mapped physical company database and persists accepted evidence in control storage',async()=>{
 const f=await fixture();const stores:any[]=[];
 try{
  const files={a:join(f.dir,'company-a.db'),b:join(f.dir,'company-b.db')};
  const source=new Database(f.file);
  try{await source.backup(files.a);}finally{source.close();}
  const b=new Database(files.b);
  try{
   for(const f of readdirSync(new URL('../db/sqlite', import.meta.url)).filter(f=>f.endsWith('.sql')).sort()) b.exec(readFileSync(new URL('../db/sqlite/'+f, import.meta.url),'utf8'));
   b.exec(nativeFixtureSql.replaceAll(",'a',", ",'b',"));
  }finally{b.close();}
  const aStore=createSqliteStorage(files.a), bStore=createSqliteStorage(files.b);stores.push(aStore,bStore);
  const mapped=(company_id:string)=>{if(company_id==='a')return aStore;if(company_id==='b')return bStore;throw new Error('company-storage-unmapped');};
  const runtime=await createFieldServiceRuntime({storage:f.storage,workOrders:{
   complete:({company_id,actor_id,work_order_id}:any)=>mapped(company_id).transaction(tx=>completeAssignedWorkOrder(tx as any,work_order_id,company_id,actor_id)),
   read:async({company_id,actor_id,work_order_id}:any)=>(await mapped(company_id).query('SELECT id,status,completed_at FROM work_orders WHERE company_id=$1 AND id=$2 AND assigned_user_id=$3',[company_id,work_order_id,actor_id])).rows[0]??null,
  }});
  await runtime.dispatch(f.input);
  const view=await runtime.project({company_id:'a',actor_id:'lead',work_id:'zero:conversation:message'});
  assert.equal(view.outcome,'verified');assert.equal(view.accepted_projections[0].status,'VERIFIED');
  assert.equal((await aStore.query("SELECT status FROM work_orders WHERE company_id='a' AND id='wo'")).rows[0].status,'completed');
  assert.equal((await bStore.query("SELECT status FROM work_orders WHERE company_id='b' AND id='wo'")).rows[0].status,'in_progress');
  assert.equal((await f.storage.query("SELECT status FROM work_orders WHERE company_id='a' AND id='wo'")).rows[0].status,'in_progress');
  assert.equal(await runtime.project({company_id:'b',actor_id:'lead',work_id:'zero:conversation:message'}),null);
  assert.equal((await f.storage.query("SELECT id FROM evidence WHERE company_id='a' AND evidence_type='gateway_execution'")).rowCount,6);
 }finally{for(const store of stores)await store.close();await f.close();}
});


test('fresh control store composes without business tables or provisioned authority',async()=>{
 const storage=createSqliteStorage(':memory:');
 try{
  const runtime=await createFieldServiceRuntime({storage,workOrders:{async read(){return null;},async complete(){throw new Error('must-not-execute');}}});
  assert.ok(runtime.zeroDispatcher);
  const tables=(await storage.query("SELECT name FROM sqlite_master WHERE type='table'")).rows.map((r:any)=>r.name);
  assert.ok(tables.includes('evidence'));assert.ok(tables.includes('authority_state'));
  for(const name of ['authority_autonomy_snapshots','authority_decisions','authority_approvals','worker_access_assignments']) assert.ok(tables.includes(name));
  assert.equal(tables.includes('work_orders'),false);assert.equal(tables.includes('companies'),false);
  assert.equal((await storage.query('SELECT id FROM authority_state')).rowCount,0);
  await assert.rejects(()=>runtime.dispatch({company_id:'unprovisioned',actor_id:'actor',conversation_id:'conv',interaction_id:'int',client_message_id:'msg',correlation_id:'corr',text:'complete work order wo'}));
 }finally{await storage.close();}
});


test('cancellation committed during provider identity revalidation prevents the native effect',async()=>{
 let enter:(identity:any)=>void=()=>{};let release:()=>void=()=>{};let checks=0;
 const entered=new Promise<any>(resolve=>{enter=resolve;});
 const barrier=new Promise<void>(resolve=>{release=resolve;});
 const f=await fixture({revalidateIdentity:async(identity:any)=>{if(++checks===3){enter(identity);await barrier;}}});
 let pending:Promise<any>|undefined;
 try{
  pending=f.runtime.dispatch(f.input);
  const identity=await entered;
  await f.runtime.runtime.cancel({company_id:identity.company_id,run_id:identity.run_id,reason:'cancel-during-provider-identity-check'});
  release();await pending;
  const run=await f.runtime.runStore.get('a',identity.run_id);
  assert.equal(run.state,'CANCELLED');
  assert.equal((await f.storage.query("SELECT status FROM work_orders WHERE company_id='a' AND id='wo'")).rows[0].status,'in_progress');
  assert.equal((await f.storage.query("SELECT id FROM evidence WHERE company_id='a' AND evidence_type='gateway_execution' AND json_extract(payload,'$.state')='VERIFIED'")).rowCount,0);
  const view=await f.runtime.project({company_id:'a',actor_id:'lead',work_id:'zero:conversation:message'});
  assert.notEqual(view.outcome,'verified');
 }finally{release();await pending?.catch(()=>{});await f.close();}
});
