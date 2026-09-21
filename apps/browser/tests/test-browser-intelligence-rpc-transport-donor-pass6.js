const assert=require('assert');
const fs=require('fs');
const vm=require('vm');
const context={console,setTimeout,clearTimeout,crypto:{randomUUID:()=>`uuid-${Math.random()}`}}; context.globalThis=context; vm.createContext(context);
for(const file of ['src/intelligence/intelligence-contract.js','src/intelligence/intelligence-host.js','src/intelligence/offscreen-runtime.js','src/intelligence/intelligence-rpc.js']) {
  if(fs.existsSync(file)) vm.runInContext(fs.readFileSync(file,'utf8'),context,{filename:file});
}
assert(context.CodeeIntelligenceRpc,'CodeeIntelligenceRpc must be exported');
const R=context.CodeeIntelligenceRpc, C=context.CodeeIntelligenceContract, H=context.CodeeIntelligenceHost, O=context.CodeeOffscreenRuntime;
(async()=>{
  H._resetForTests();
  const ctx=C.createContext({sessionId:'session-a',requestId:'request-a',planId:'plan-a',runId:'run-a',tabId:7,conversationIdentity:'conv-a'});
  const envelope=R.createEnvelope({operation:'request',context:ctx,payload:{prompt:'hello'}});
  assert.strictEqual(envelope.schema,R.SCHEMA);
  assert.strictEqual(envelope.requestId,'request-a');
  assert.strictEqual(envelope.sessionId,'session-a');
  assert(Object.isFrozen(envelope));
  assert.throws(()=>R.createEnvelope({operation:'mutate',context:ctx}),/Unsupported intelligence RPC operation/);

  let retainCount=0, releaseCount=0; const messages=[];
  const manager={retain:async()=>{retainCount++;return true;},release:async()=>{releaseCount++;return true;}};
  const transport=async message=>{messages.push(message); return {ok:true,requestId:message.requestId,result:{text:`reply:${message.payload.prompt||''}`}};};
  const service=R.createService({host:H,offscreenRuntime:O,manager,transport,runtimeId:'browser-offscreen'});
  const response=await service.dispatch(envelope);
  assert.deepStrictEqual(JSON.parse(JSON.stringify(response.result)),{text:'reply:hello'});
  assert.strictEqual(messages.length,1);
  assert.strictEqual(messages[0].requestId,'request-a');
  assert.strictEqual(messages[0].sessionId,'session-a');
  assert.strictEqual(retainCount,1); assert.strictEqual(releaseCount,1);
  assert.strictEqual(H.listRuntimes().length,1,'service should register one shared offscreen runtime');

  const ctxB=C.createContext({sessionId:'session-b',requestId:'request-b',planId:'plan-b',runId:'run-b',tabId:8,conversationIdentity:'conv-b'});
  const responseB=await service.dispatch(R.createEnvelope({operation:'request',context:ctxB,payload:{prompt:'world'}}));
  assert.strictEqual(responseB.result.text,'reply:world');
  assert.strictEqual(H.listRuntimes().length,1,'second request must reuse shared runtime registration');

  const bad=R.createService({host:H,offscreenRuntime:O,manager,transport:async message=>({ok:true,requestId:'different-request',result:{text:'bad'}}),runtimeId:'bad-offscreen'});
  const badCtx=C.createContext({sessionId:'session-c',requestId:'request-c',planId:'plan-c',runId:'run-c',tabId:9,conversationIdentity:'conv-c'});
  await assert.rejects(()=>bad.dispatch(R.createEnvelope({operation:'request',context:badCtx,payload:{prompt:'x'}})),/requestId mismatch/);

  let resolveSlow;
  const slowTransport=async message=>new Promise(resolve=>{resolveSlow=()=>resolve({ok:true,requestId:message.requestId,result:{text:'late'}});});
  const slow=R.createService({host:H,offscreenRuntime:O,manager,transport:slowTransport,runtimeId:'slow-offscreen'});
  const owner=C.createContext({sessionId:'owner-session',requestId:'owner-request',planId:'owner-plan',runId:'owner-run',tabId:10,conversationIdentity:'owner-conv'});
  const p=slow.dispatch(R.createEnvelope({operation:'request',context:owner,payload:{}}));
  await new Promise(r=>setTimeout(r,5));
  const intruder=C.createContext({sessionId:'intruder-session',requestId:'cancel-1',planId:'intruder-plan',runId:'intruder-run',tabId:11,conversationIdentity:'intruder-conv'});
  await assert.rejects(()=>slow.dispatch(R.createEnvelope({operation:'cancel',context:intruder,payload:{requestId:'owner-request'}})),/session does not own request/);
  const ownerCancel=C.createContext({sessionId:'owner-session',requestId:'cancel-2',planId:'owner-plan',runId:'owner-run',tabId:10,conversationIdentity:'owner-conv'});
  const cancelled=await slow.dispatch(R.createEnvelope({operation:'cancel',context:ownerCancel,payload:{requestId:'owner-request'}}));
  assert.strictEqual(cancelled.ok,true);
  resolveSlow();
  await assert.rejects(()=>p,/cancelled|stale/i);

  const clientMessages=[];
  const client=R.createClient(async msg=>{clientMessages.push(msg);return {ok:true,requestId:msg.envelope.requestId,result:{ok:true}};});
  const clientResult=await client.request(ctx,{prompt:'client'});
  assert.strictEqual(clientResult.ok,true);
  assert.strictEqual(clientMessages[0].action,R.ACTION);
  assert.strictEqual(clientMessages[0].envelope.sessionId,'session-a');

  console.log('Browser intelligence donor-first pass 6 RPC transport');
})().catch(err=>{console.error(err);process.exit(1);});
