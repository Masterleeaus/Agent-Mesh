import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { createServerNodeRuntime, ControlPlaneStore, createServerNodeHealthServer } from './runtime.mjs';

const canonical = value => value === null || typeof value !== 'object' ? JSON.stringify(value) : Array.isArray(value) ? `[${value.map(canonical).join(',')}]` : `{${Object.keys(value).sort().map(k=>`${JSON.stringify(k)}:${canonical(value[k])}`).join(',')}}`;
const digest = value => crypto.createHash('sha256').update(canonical(value)).digest('hex');
const headers = { authorization:'Bearer test-token', 'x-titan-schema-version':'1', 'x-titan-caller-id':'registered-plugin', 'x-titan-company-id':'company-a', 'x-titan-correlation-id':'correlation-1' };
const intent = (extra={}) => ({ kind:'service.restart', target_ref:'workforce', company_id:'company-a', capability_id:'node.lifecycle.request', idempotency_key:'intent-1', governed_execution_ref:'execution-1', authority_decision_ref:'authority-1', evidence_ref:'evidence-1', expires_at:new Date(Date.now()+60000).toISOString(), ...extra });
function adapter(overrides={}) {
  return {
    async authenticate({bearerToken}) { return bearerToken === 'test-token' ? {caller_id:'registered-plugin',company_ids:['company-a']} : null; },
    async authorize(request) { return { allowed:true, node_id:request.node_id, caller_id:request.caller_id, company_id:request.intent.company_id, capability_id:request.intent.capability_id, intent_digest:request.intent_digest, authority_decision_ref:request.intent.authority_decision_ref, expires_at:request.intent.expires_at }; },
    async execute() { return { state:'PROVIDER_ACKNOWLEDGED', provider_acknowledged:true, verified:false }; },
    async recordEvidence(event) { return { accepted:true, evidence_ref:event.evidence_ref }; },
    ...overrides,
  };
}
async function fixture(t, options={}) {
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'titan-security-'));
  const runtime=createServerNodeRuntime({authToken:'test-token',storePath:path.join(dir,'control.json'),dependencies:['workforce'],dependencyProbe:async()=>[{name:'workforce',status:'healthy'}],...options});
  const address=await runtime.start();
  t.after(async()=>{await runtime.close();await fs.rm(dir,{recursive:true,force:true});});
  const call=async(route,body,extraHeaders={})=>{ const response=await fetch(`http://127.0.0.1:${address.port}${route}`,{method:body===undefined?'GET':'POST',headers:{...headers,...extraHeaders},...(body===undefined?{}:{body:JSON.stringify(body)})});return {status:response.status,body:await response.json()};};
  return {runtime,dir,call};
}

test('unconfigured CLI boundary refuses fabricated authority without queuing',async t=>{
  let calls=0;const f=await fixture(t,{governedExecutor:async()=>{calls++;}});
  const result=await f.call('/v1/intents',intent());
  assert.equal(result.status,503); assert.match(result.body.error,/canonical/);assert.equal(calls,0);assert.equal(Object.keys(f.runtime.store.state.intents).length,0);
});
test('strict expiry rejects invalid timestamps before trusted execution',async t=>{
  let calls=0;const f=await fixture(t,{canonicalAdapter:adapter({execute:async()=>{calls++;}})});
  for (const expires_at of ['not-a-date','2027-02-30T00:00:00.000Z',{},'2027-01-01']) assert.equal((await f.call('/v1/intents',intent({expires_at}))).status,400);
  assert.equal(calls,0);
});
test('server-resolved company and authority binding rejects invented or cross-company references',async t=>{
  let calls=0;const f=await fixture(t,{canonicalAdapter:adapter({authorize:async()=>({allowed:true,company_id:'company-b'}),execute:async()=>{calls++;}})});
  assert.equal((await f.call('/v1/intents',intent())).status,403);assert.equal(calls,0);
});
test('parallel duplicate intents reserve durably before one provider invocation',async t=>{
  let calls=0;let f;let stored;
  f=await fixture(t,{canonicalAdapter:adapter({execute:async()=>{calls++;stored=JSON.parse(await fs.readFile(path.join(f.dir,'control.json'),'utf8'));await new Promise(resolve=>setTimeout(resolve,40));return {state:'PROVIDER_ACKNOWLEDGED',provider_acknowledged:true};}})});
  const body=intent();const results=await Promise.all(Array.from({length:4},()=>f.call('/v1/intents',body)));
  assert.equal(calls,1);assert.ok(results.every(x=>[200,202].includes(x.status)));assert.equal(Object.values(stored.intents)[0].state,'EXECUTING');assert.deepEqual(Object.values(stored.intents)[0].intent,body);
});
test('uncertain after-effect failure never automatically executes again after restart',async t=>{
  let calls=0;const canonicalAdapter=adapter({execute:async()=>{calls++;throw new Error('lost acknowledgement');}});
  const f=await fixture(t,{canonicalAdapter});const body=intent();const first=await f.call('/v1/intents',body);
  assert.equal(first.status,503);assert.equal(first.body.state,'UNCERTAIN');await f.runtime.close();
  const runtime=createServerNodeRuntime({authToken:'test-token',storePath:path.join(f.dir,'control.json'),canonicalAdapter});const address=await runtime.start();t.after(()=>runtime.close());
  const response=await fetch(`http://127.0.0.1:${address.port}/v1/intents`,{method:'POST',headers,body:JSON.stringify(body)});const replay=await response.json();assert.equal(response.status,200);assert.equal(replay.state,'UNCERTAIN');assert.equal(calls,1);await runtime.close();
});
test('pre-execution evidence rejection prevents provider effects',async t=>{
  let calls=0;const f=await fixture(t,{canonicalAdapter:adapter({recordEvidence:async()=>({accepted:false}),execute:async()=>{calls++;}})});
  assert.equal((await f.call('/v1/intents',intent())).status,503);assert.equal(calls,0);
});
test('failure to persist a reservation prevents provider effects',async t=>{
  let calls=0;const f=await fixture(t,{canonicalAdapter:adapter({execute:async()=>{calls++;}})});
  const original=f.runtime.store.recordIntent; f.runtime.store.recordIntent=async()=>{throw new Error('disk unavailable');};
  const originalReserve=f.runtime.store.reserveIntent; if(originalReserve) f.runtime.store.reserveIntent=async()=>{throw new Error('disk unavailable');};
  assert.equal((await f.call('/v1/intents',intent())).status,500);assert.equal(calls,0);
  f.runtime.store.recordIntent=original; if(originalReserve)f.runtime.store.reserveIntent=originalReserve;
});
test('unknown and absent dependencies cannot claim ready',async t=>{
  for(const dependencyProbe of [async()=>[{name:'workforce',status:'unknown'}],async()=>[],async()=>{throw new Error('probe unavailable');}]){
    const f=await fixture(t,{canonicalAdapter:adapter(),dependencyProbe});assert.equal((await f.call('/ready')).status,503);assert.equal((await f.call('/v1/health')).body.status,'degraded');
  }
});
test('readiness requires commissioned canonical integration as well as healthy probes',async t=>{
  const unconfigured=await fixture(t);assert.equal((await unconfigured.call('/ready')).status,503);
  const configured=await fixture(t,{canonicalAdapter:adapter()});assert.equal((await configured.call('/ready')).status,200);assert.equal((await configured.call('/live')).body.pid,process.pid);
});
test('missing digest, tampering, foreign node and foreign company restore cannot mutate live metadata',async t=>{
  const f=await fixture(t,{canonicalAdapter:adapter()});await f.call('/v1/intents',intent());const before=structuredClone(f.runtime.store.state.intents);const snapshot=f.runtime.store.exportSnapshot('company-a');
  for(const body of [{snapshot},{snapshot,manifest_digest:'f'.repeat(64)},{snapshot:{...snapshot,node_id:'other-node'},manifest_digest:snapshot.snapshot_digest},{snapshot:{...snapshot,company_id:'company-b'},manifest_digest:snapshot.snapshot_digest}]){
    const result=await f.call('/v1/recovery/restore',body);assert.ok([400,403,409].includes(result.status),JSON.stringify(result));assert.deepEqual(f.runtime.store.state.intents,before);
  }
});
test('snapshot export retains intent fingerprints and receipts; additive restore preserves replay and newer work',async t=>{
  const f=await fixture(t,{canonicalAdapter:adapter()});const body=intent();await f.call('/v1/intents',body);const snapshot=f.runtime.store.exportSnapshot('company-a');
  assert.ok(snapshot.intents[0].fingerprint);assert.ok(snapshot.intents[0].receipt);assert.equal(snapshot.company_id,'company-a');
  await f.call('/v1/intents',intent({idempotency_key:'newer'}));await f.runtime.store.restoreSnapshot(snapshot,{manifestDigest:snapshot.snapshot_digest,companyId:'company-a'});
  const replay=await f.call('/v1/intents',body);assert.equal(replay.status,200);assert.equal(replay.body.replay,true);assert.equal(Object.keys(f.runtime.store.state.intents).length,2);
});
test('valid snapshot digest cannot smuggle another company intent',async t=>{
  const f=await fixture(t,{canonicalAdapter:adapter()});await f.call('/v1/intents',intent());const snapshot=f.runtime.store.exportSnapshot('company-a');snapshot.intents[0].company_id='company-b';delete snapshot.snapshot_digest;snapshot.snapshot_digest=digest(snapshot);
  await assert.rejects(f.runtime.store.restoreSnapshot(snapshot,{manifestDigest:snapshot.snapshot_digest,companyId:'company-a'}),/company|invalid/);
});
test('invalid or duplicate snapshot records fail closed without wiping state',async t=>{
  const f=await fixture(t,{canonicalAdapter:adapter()});await f.call('/v1/intents',intent());const snapshot=f.runtime.store.exportSnapshot('company-a');snapshot.intents.push(snapshot.intents[0]);delete snapshot.snapshot_digest;snapshot.snapshot_digest=digest(snapshot);
  await assert.rejects(f.runtime.store.restoreSnapshot(snapshot,{manifestDigest:snapshot.snapshot_digest,companyId:'company-a'}),/duplicate|invalid/);assert.equal(Object.keys(f.runtime.store.state.intents).length,1);
});
test('empty corrupt store fails closed instead of creating a new node identity',async t=>{
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'titan-corrupt-'));t.after(()=>fs.rm(dir,{recursive:true,force:true}));const file=path.join(dir,'control.json');await fs.writeFile(file,'');const store=new ControlPlaneStore(file);await assert.rejects(store.open());assert.equal(await fs.readFile(file,'utf8'),'');
});
test('a second process/store owner cannot open an already locked state file',async t=>{
  const f=await fixture(t);const other=new ControlPlaneStore(path.join(f.dir,'control.json'));await assert.rejects(other.open(),/locked|owner/);
});
test('configured durable store path is honored without writing the working directory',async t=>{
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'titan-env-'));const prior=process.env.TITAN_NODE_STORE_PATH;process.env.TITAN_NODE_STORE_PATH=path.join(dir,'configured.json');
  const runtime=createServerNodeRuntime({authToken:'test-token'});if(prior===undefined)delete process.env.TITAN_NODE_STORE_PATH;else process.env.TITAN_NODE_STORE_PATH=prior;await runtime.start();t.after(async()=>{await runtime.close();await fs.rm(dir,{recursive:true,force:true});});assert.equal(runtime.store.filePath,path.join(dir,'configured.json'));assert.ok((await fs.stat(runtime.store.filePath)).isFile());
});
test('empty read-only health bridge dependency list is not ready',async t=>{
  const server=createServerNodeHealthServer({dependencies:[]});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));t.after(()=>new Promise(resolve=>server.close(resolve)));const response=await fetch(`http://127.0.0.1:${server.address().port}/v1/status`);assert.equal(response.status,503);assert.equal((await response.json()).ready,false);
});

test('standalone CLI uses durable path and refuses uncommissioned writes',async t=>{
  const { spawn }=await import('node:child_process');const { once }=await import('node:events');
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'titan-cli-'));
  const child=spawn(process.execPath,[new URL('./runtime.mjs',import.meta.url).pathname,'--serve'],{env:{...process.env,TITAN_NODE_AUTH_TOKEN:'test-token',TITAN_NODE_STORE_PATH:path.join(dir,'control.json'),TITAN_NODE_PORT:'0'},stdio:['ignore','pipe','pipe']});
  let stderr='';child.stderr.on('data',chunk=>stderr+=chunk);const exit=once(child,'exit');
  t.after(async()=>{if(child.exitCode===null){child.kill('SIGTERM');await exit;}await fs.rm(dir,{recursive:true,force:true});});
  await new Promise(resolve=>setTimeout(resolve,200));
  assert.equal(child.exitCode,null,stderr);assert.ok((await fs.stat(path.join(dir,'control.json'))).isFile());
});
test('arbitrary business payloads are refused by the control metadata ingress',async t=>{
  const f=await fixture(t,{canonicalAdapter:adapter()});assert.equal((await f.call('/v1/intents',intent({customer:{name:'business record'}}))).status,400);assert.equal(Object.keys(f.runtime.store.state.intents).length,0);
});
test('recovered in-flight reservation stays uncertain after abrupt process death',async t=>{
  const { spawn }=await import('node:child_process');const { once }=await import('node:events');const dir=await fs.mkdtemp(path.join(os.tmpdir(),'titan-crash-'));const file=path.join(dir,'control.json');
  const body=intent();const script=`import {ControlPlaneStore} from ${JSON.stringify(new URL('./runtime.mjs',import.meta.url).href)}; const store=await new ControlPlaneStore(${JSON.stringify(file)}).open();await store.reserveIntent(${JSON.stringify({idempotency_key:body.idempotency_key,company_id:body.company_id,capability_id:body.capability_id,correlation_id:'correlation-1',evidence_ref:body.evidence_ref,fingerprint:digest(body),intent:body,state:'EXECUTING',created_at:new Date().toISOString(),receipt:{accepted:true,state:'EXECUTING',verified:false,correlation_id:'correlation-1'}})});process.stdout.write('reserved\\n');setInterval(()=>{},1000);`;
  const child=spawn(process.execPath,['--input-type=module','--eval',script],{stdio:['ignore','pipe','pipe']});const exited=once(child,'exit');
  await once(child.stdout,'data');child.kill('SIGKILL');await exited;
  let store;for(let attempt=0;attempt<50;attempt++){try{store=await new ControlPlaneStore(file).open();break;}catch(error){if(!/locked/.test(error.message))throw error;await new Promise(resolve=>setTimeout(resolve,20));}}
  assert.ok(store,'kernel lease was released after parent death');t.after(async()=>{await store.close();await fs.rm(dir,{recursive:true,force:true});});
  assert.equal(Object.values(store.state.intents)[0].state,'UNCERTAIN');assert.equal(Object.values(store.state.intents)[0].receipt.reconciliation_required,true);
});

test('shared node token and caller header cannot impersonate a canonical principal',async t=>{
  let calls=0;const f=await fixture(t,{canonicalAdapter:adapter({authenticate:async()=>({caller_id:'another-plugin',company_ids:['company-a']}),execute:async()=>{calls++;}})});
  assert.equal((await f.call('/v1/intents',intent())).status,403);assert.equal(calls,0);
});
test('trusted identity must have current company membership before authorization',async t=>{
  let calls=0;const f=await fixture(t,{canonicalAdapter:adapter({authenticate:async()=>({caller_id:'registered-plugin',company_ids:['company-b']}),authorize:async()=>{calls++;}})});
  assert.equal((await f.call('/v1/intents',intent())).status,403);assert.equal(calls,0);
});

test('generic intent ingress cannot bypass recovery node and snapshot validation',async t=>{
  let calls=0;const f=await fixture(t,{canonicalAdapter:adapter({execute:async()=>{calls++;return {state:'PROVIDER_ACKNOWLEDGED',provider_acknowledged:true};}})});
  for(const body of [intent({kind:'node.recovery.restore',capability_id:'node.recovery.restore',target_ref:'wrong-node',snapshot:{arbitrary:'invalid'}}),intent({kind:'node.recovery.checkpoint',capability_id:'node.recovery.checkpoint',target_ref:f.runtime.store.state.node_id,checkpoint_id:'checkpoint-1'})]) {
    const result=await f.call('/v1/intents',body);assert.ok([400,409].includes(result.status),JSON.stringify(result));
  }
  assert.equal(calls,0);assert.equal(Object.keys(f.runtime.store.state.intents).length,0);
});
