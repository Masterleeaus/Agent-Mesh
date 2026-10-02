import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { fixture } from './fixtures/native-runtime-fixture.ts';
import Database from 'better-sqlite3';
import { join } from 'node:path';
import { createSqliteStorage } from '../packages/storage/src/index.ts';
import { SqliteWorkerAccessStore } from '../packages/runtime/authority/index.mjs';

async function interrupt(file:string,phase:string,businessFile:string) {
 const child=spawn(process.execPath,['--import',fileURLToPath(new URL('../services/workforce/node_modules/tsx/dist/loader.mjs',import.meta.url)),fileURLToPath(new URL('./fixtures/native-execution-child.ts',import.meta.url)),file,phase,businessFile],{
  cwd:fileURLToPath(new URL('..',import.meta.url)),env:{...process.env,TSX_TSCONFIG_PATH:fileURLToPath(new URL('../apps/web/tsconfig.json',import.meta.url))},stdio:['ignore','pipe','pipe','ipc'],
 });
 let stderr='';child.stderr?.on('data',chunk=>{stderr+=chunk;});
 let timeout:ReturnType<typeof setTimeout>|undefined;
 try {
  await Promise.race([once(child,'message'),once(child,'exit').then(()=>{throw new Error('child-exited-before-barrier:'+stderr);}),new Promise((_,reject)=>{timeout=setTimeout(()=>reject(new Error('child-barrier-timeout:'+stderr)),10_000);})]);
  const exited=once(child,'exit');child.kill('SIGKILL');const [code,signal]=await exited;
  assert.equal(code,null);assert.equal(signal,'SIGKILL');
 } finally {clearTimeout(timeout);if(child.exitCode===null&&child.signalCode===null)child.kill('SIGKILL');}
}

async function separateBusiness(f:any) {
 const file=join(f.dir,'business.db');const source=new Database(f.file);
 try{await source.backup(file);}finally{source.close();}
 const storage=createSqliteStorage(file);
 delete f.workOrders.completeInControlTransaction;
 f.workOrders.read=async({company_id,actor_id,work_order_id}:any)=>(await storage.query('SELECT id,status,completed_at FROM work_orders WHERE company_id=$1 AND id=$2 AND assigned_user_id=$3',[company_id,work_order_id,actor_id])).rows[0]??null;
 return {file,storage};
}

function watchChildMessages(child:ReturnType<typeof spawn>,stderr:()=>string) {
 type Waiter={resolve:(message:any)=>void;reject:(error:Error)=>void;timer:ReturnType<typeof setTimeout>};
 const messages:any[]=[];const waiters=new Map<string,Set<Waiter>>();
 let failure:Error|undefined;let exitResult:{code:number|null;signal:NodeJS.Signals|null}|undefined;
 let resolveExit:(result:{code:number|null;signal:NodeJS.Signals|null})=>void=()=>{};
 const exited=new Promise<{code:number|null;signal:NodeJS.Signals|null}>(resolve=>{resolveExit=resolve;});
 const remove=(phase:string,waiter:Waiter)=>{
  clearTimeout(waiter.timer);const pending=waiters.get(phase);pending?.delete(waiter);if(pending?.size===0)waiters.delete(phase);
 };
 const failPending=(error:Error)=>{
  for(const [phase,pending] of waiters)for(const waiter of [...pending]){remove(phase,waiter);waiter.reject(error);}
 };
 const onMessage=(message:any)=>{
  messages.push(message);if(typeof message?.phase!=='string')return;
  const pending=waiters.get(message.phase);if(pending)for(const waiter of [...pending]){remove(message.phase,waiter);waiter.resolve(message);}
 };
 const onError=(error:Error)=>{failure=new Error(`child-error:${error.message}${stderr()?`\n${stderr()}`:''}`);failPending(failure);};
 const onExit=(code:number|null,signal:NodeJS.Signals|null)=>{
  exitResult={code,signal};resolveExit(exitResult);
  failure=new Error(`child-exited-before-expected-message:code=${code},signal=${signal}${stderr()?`\n${stderr()}`:''}`);failPending(failure);
 };
 child.on('message',onMessage);child.on('error',onError);child.on('exit',onExit);
 return {
  messages,
  exited,
  waitFor(phase:string,timeoutMs:number,errorMessage:string) {
   const received=messages.find(message=>message?.phase===phase);if(received)return Promise.resolve(received);
   if(failure)return Promise.reject(failure);
   return new Promise<any>((resolve,reject)=>{
    const waiter:Waiter={resolve,reject,timer:setTimeout(()=>{
     remove(phase,waiter);reject(new Error(errorMessage));
    },timeoutMs)};
    const pending=waiters.get(phase)??new Set<Waiter>();pending.add(waiter);waiters.set(phase,pending);
   });
  },
  dispose() {child.off('message',onMessage);child.off('error',onError);child.off('exit',onExit);},
 };
}

for(const phase of ['before-effect','after-effect']) test(`SIGKILL ${phase}: restart reconciles without invoking provider again`,async()=>{
 const f=await fixture();let business:any;try{
  await f.storage.query('CREATE TABLE mutation_count(n INTEGER)');await f.storage.query('INSERT INTO mutation_count VALUES(0)');
  await f.storage.query("CREATE TRIGGER count_completion AFTER UPDATE OF status ON work_orders WHEN OLD.status <> NEW.status BEGIN UPDATE mutation_count SET n=n+1; END");
  business=await separateBusiness(f);
  await interrupt(f.file,phase,business.file);
  const orphan=await f.runtime.runStore.findByWork('a','zero:conversation:message');assert.equal(orphan.state,'WAITING_TOOL');
  const executions=(await f.storage.query('SELECT payload FROM execution_lifecycle_records')).rows.map((row:any)=>JSON.parse(row.payload));
  assert.equal(executions.length,1);assert.equal(executions[0].status,'RUNNING');
  let mutations=0;f.workOrders.complete=async()=>{mutations++;throw new Error('provider-must-not-reexecute');};
  await f.restart();
  const response=await f.runtime.recover(f.input);
  const view=await f.runtime.project({company_id:'a',actor_id:'lead',work_id:'zero:conversation:message'});
  assert.equal(mutations,0);assert.equal(view.run.run_id,orphan.run_id);
  assert.equal(view.outcome,phase==='after-effect'?'verified':'waiting');
  assert.equal(view.run.state,phase==='after-effect'?'COMPLETED':'WAITING_EXTERNAL');
  assert.equal((await business.storage.query('SELECT n FROM mutation_count')).rows[0].n,phase==='after-effect'?1:0);
  if(phase==='before-effect'){
   assert.ok(response.continuation_token);
   await f.runtime.dispatch({...f.input,client_message_id:'retry',continuation_token:response.continuation_token,text:'Check again'});
   assert.equal(mutations,0);
  }
 }finally{await business?.storage.close();await f.close();}
});

test('orphan recovery rejects revoked current worker authority and foreign identity',async()=>{
 const f=await fixture();let business:any;try{
  business=await separateBusiness(f);await interrupt(f.file,'after-effect',business.file);await f.restart();
  await assert.rejects(()=>f.runtime.recover({...f.input,actor_id:'foreign'}),/actor-conflict/);
  await new SqliteWorkerAccessStore(f.storage).append({company_id:'a',assignment_id:'revoked',worker_id:'manager',status:'revoked',granted_at:new Date(Date.now()+1000).toISOString()});
  await assert.rejects(()=>f.runtime.recover(f.input),/recovery-authority-required/);
  const run=await f.runtime.runStore.findByWork('a','zero:conversation:message');assert.equal(run.state,'WAITING_TOOL');
  assert.equal((await f.storage.query("SELECT id FROM evidence WHERE evidence_type='gateway_execution' AND json_extract(payload,'$.state')='VERIFIED'")).rowCount,0);
 }finally{await business?.storage.close();await f.close();}
});

test('hung provider becomes UNCERTAIN; late reply cannot append VERIFIED evidence',async()=>{
 const f=await fixture({timeoutMs:25});let release:(value:any)=>void=()=>{};
 try{
  f.workOrders.complete=()=>new Promise(resolve=>{release=resolve;});
  await f.runtime.dispatch(f.input);
  const run=await f.runtime.runStore.findByWork('a','zero:conversation:message');assert.equal(run.state,'WAITING_EXTERNAL');
  const rows=await f.storage.query('SELECT payload FROM execution_lifecycle_records');assert.equal(JSON.parse(rows.rows[0].payload).status,'UNCERTAIN');
  const count=(await f.storage.query("SELECT id FROM evidence WHERE evidence_type='gateway_execution'")).rowCount;
  release({kind:'ok',status:'completed'});await new Promise(resolve=>setImmediate(resolve));
  assert.equal((await f.storage.query("SELECT id FROM evidence WHERE evidence_type='gateway_execution'")).rowCount,count);
  assert.equal((await f.storage.query("SELECT id FROM evidence WHERE evidence_type='gateway_execution' AND json_extract(payload,'$.state')='VERIFIED'")).rowCount,0);
 }finally{release({kind:'ok'});await f.close();}
});


test('SIGKILL during verification-only reconciliation preserves pending execution for another restart',async()=>{
 const f=await fixture();let business:any;try{
  business=await separateBusiness(f);await interrupt(f.file,'after-effect',business.file);
  await interrupt(f.file,'during-reconcile',business.file);
  const interrupted=await f.runtime.runStore.findByWork('a','zero:conversation:message');
  assert.equal(interrupted.state,'RUNNING');assert.ok(interrupted.wait.tool_call);assert.ok(interrupted.wait.execution.execution_id);
  let mutations=0;f.workOrders.complete=async()=>{mutations++;throw new Error('must-not-mutate');};
  await f.restart();await f.runtime.recover(f.input);
  const view=await f.runtime.project({company_id:'a',actor_id:'lead',work_id:'zero:conversation:message'});
  assert.equal(view.outcome,'verified');assert.equal(mutations,0);assert.equal(view.run.run_id,interrupted.run_id);
 }finally{await business?.storage.close();await f.close();}
});

test('explicit recovery cannot take over a locally active provider execution',async()=>{
 let release:()=>void=()=>{};let entered:()=>void=()=>{};
 const barrier=new Promise<void>(resolve=>{release=resolve;});const atProvider=new Promise<void>(resolve=>{entered=resolve;});
 const f=await fixture();let pending:Promise<any>|undefined;
 try{
  const complete=f.workOrders.complete;
  f.workOrders.complete=async(input:any)=>{entered();await barrier;return complete(input);};
  pending=f.runtime.dispatch(f.input);await atProvider;
  await assert.rejects(()=>f.runtime.recover(f.input),/runtime-run-active/);
  release();await pending;
  const view=await f.runtime.project({company_id:'a',actor_id:'lead',work_id:'zero:conversation:message'});
  assert.equal(view.run.state,'COMPLETED');assert.equal(view.outcome,'verified');
 }finally{release();await pending?.catch(()=>{});await f.close();}
});


for(const revocation of ['policy','access']) test(`revocation of ${revocation} in final identity check prevents native effect`,async()=>{
 let checks=0;let f:any;
 f=await fixture({revalidateIdentity:async()=>{
  if(++checks!==3)return;
  if(revocation==='policy')await f.storage.query("UPDATE authority_state SET envelope=json_set(envelope,'$.policy_allows',json('false')) WHERE company_id='a' AND id='grant'");
  else await new SqliteWorkerAccessStore(f.storage).append({company_id:'a',assignment_id:'late-revocation',worker_id:'manager',status:'revoked',granted_at:new Date(Date.now()+1000).toISOString()});
 }});
 try{
  await f.runtime.dispatch(f.input);
  assert.equal((await f.storage.query("SELECT status FROM work_orders WHERE id='wo'")).rows[0].status,'in_progress');
  assert.equal((await f.storage.query("SELECT id FROM evidence WHERE evidence_type='gateway_execution' AND json_extract(payload,'$.state')='VERIFIED'")).rowCount,0);
 }finally{await f.close();}
});

test('post-admission authority revocation commits during provider work; the admitted effect may finish',async()=>{
 let release:()=>void=()=>{};let entered:()=>void=()=>{};
 const barrier=new Promise<void>(resolve=>{release=resolve;});const atProvider=new Promise<void>(resolve=>{entered=resolve;});
 const f=await fixture();let pending:Promise<any>|undefined;let child:ReturnType<typeof spawn>|undefined;let inbox:ReturnType<typeof watchChildMessages>|undefined;
 try{
  const complete=f.workOrders.complete;
  f.workOrders.complete=async(input:any)=>{entered();await barrier;input.authorityFence.assertCurrent();return complete(input);};
  pending=f.runtime.dispatch(f.input);await atProvider;
  child=spawn(process.execPath,['--import',fileURLToPath(new URL('../services/workforce/node_modules/tsx/dist/loader.mjs',import.meta.url)),fileURLToPath(new URL('./fixtures/native-execution-child.ts',import.meta.url)),f.file,'revoke-policy'],{env:{...process.env,TSX_TSCONFIG_PATH:fileURLToPath(new URL('../apps/web/tsconfig.json',import.meta.url))},stdio:['ignore','ignore','pipe','ipc']});
  let stderr='';child.stderr?.on('data',chunk=>{stderr+=chunk;});
  inbox=watchChildMessages(child,()=>stderr);
  const attempting=await inbox.waitFor('attempting',3000,'child did not report authority update attempt within 3000ms');
  assert.equal(attempting.phase,'attempting');
  await inbox.waitFor('committed',3000,'post-admission authority update remained blocked');
  assert.equal((await f.storage.query("SELECT status FROM work_orders WHERE id='wo'")).rows[0].status,'in_progress');
  release();await pending;const {code,signal}=await inbox.exited;assert.equal(code,0);assert.equal(signal,null);
  assert.ok(inbox.messages.some(message=>message.phase==='committed'));
  assert.equal((await f.storage.query("SELECT status FROM work_orders WHERE id='wo'")).rows[0].status,'completed');
  assert.equal(JSON.parse((await f.storage.query("SELECT envelope FROM authority_state WHERE id='grant'")).rows[0].envelope).policy_allows,false);
  assert.equal((await f.storage.query("SELECT id FROM evidence WHERE evidence_type='gateway_execution' AND json_extract(payload,'$.state')='VERIFIED'")).rowCount,1);
 }finally{
  release();await pending?.catch(()=>{});
  if(child&&child.pid!==undefined&&child.exitCode===null&&child.signalCode===null){child.kill('SIGKILL');await inbox?.exited;}
  inbox?.dispose();
  await f.close();
 }
});

test('noncooperative provider may finish after timeout; UNCERTAIN recovery never reexecutes it',async()=>{
 const f=await fixture({timeoutMs:25});let release:()=>void=()=>{};
 const barrier=new Promise<void>(resolve=>{release=resolve;});
 try{
  const complete=f.workOrders.complete;let invocations=0;
  f.workOrders.complete=async(input:any)=>{invocations++;await barrier;return complete({...input,signal:undefined,authorityFence:undefined});};
  await f.runtime.dispatch(f.input);
  const run=await f.runtime.runStore.findByWork('a','zero:conversation:message');assert.equal(run.state,'WAITING_EXTERNAL');
  assert.equal(invocations,1);
  assert.equal(JSON.parse((await f.storage.query('SELECT payload FROM execution_lifecycle_records')).rows[0].payload).status,'UNCERTAIN');
  release();await new Promise(resolve=>setImmediate(resolve));
  await new Promise(resolve=>setTimeout(resolve,20));
  assert.equal((await f.storage.query("SELECT status FROM work_orders WHERE id='wo'")).rows[0].status,'completed');
  assert.equal((await f.storage.query("SELECT id FROM evidence WHERE evidence_type='gateway_execution' AND json_extract(payload,'$.state')='VERIFIED'")).rowCount,0);
  assert.equal(JSON.parse((await f.storage.query('SELECT payload FROM execution_lifecycle_records')).rows[0].payload).status,'UNCERTAIN');
  await f.restart();await f.runtime.recover(f.input);
  assert.equal(invocations,1,'recovery verifies the late effect and does not rerun the provider');
  assert.equal((await f.storage.query("SELECT status FROM work_orders WHERE id='wo'")).rows[0].status,'completed');
 }finally{release();await f.close();}
});


test('identity invalidated before effect admission prevents native mutation',async()=>{
 let revoked=false;let reads=0;
 const f=await fixture({revalidateIdentity:async()=>{if(revoked)throw new Error('current-session-revoked');}});
 try{
  const read=f.workOrders.read;
  f.workOrders.read=async(input:any)=>{const result=await read(input);if(++reads===2)revoked=true;return result;};
  await f.runtime.dispatch(f.input);
  assert.ok(reads>=2);
  assert.equal((await f.storage.query("SELECT status FROM work_orders WHERE id='wo'")).rows[0].status,'in_progress');
  assert.equal((await f.storage.query("SELECT id FROM evidence WHERE evidence_type='gateway_execution' AND json_extract(payload,'$.state')='EXECUTING'")).rowCount,0);
  assert.equal((await f.storage.query("SELECT id FROM evidence WHERE evidence_type='gateway_execution' AND json_extract(payload,'$.state')='VERIFIED'")).rowCount,0);
 }finally{await f.close();}
});
