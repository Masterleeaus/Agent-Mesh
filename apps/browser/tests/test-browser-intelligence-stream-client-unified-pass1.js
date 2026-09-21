const assert=require('assert');
const fs=require('fs');
const vm=require('vm');

const listeners=[];
const chrome={runtime:{
  sendMessage:async message=>({ok:true,requestId:message.envelope.requestId,result:{text:'AB',chunkCount:2}}),
  onMessage:{addListener:fn=>listeners.push(fn),removeListener:fn=>{const i=listeners.indexOf(fn);if(i>=0)listeners.splice(i,1);}}
}};
const context={console,setTimeout,clearTimeout,crypto:{randomUUID:()=>`uuid-${Math.random()}`},chrome};context.globalThis=context;vm.createContext(context);
for(const file of ['src/intelligence/intelligence-contract.js','src/intelligence/intelligence-host.js','src/intelligence/offscreen-runtime.js','src/intelligence/intelligence-rpc.js']) vm.runInContext(fs.readFileSync(file,'utf8'),context,{filename:file});
const C=context.CodeeIntelligenceContract,R=context.CodeeIntelligenceRpc;
(async()=>{
  const ctx=C.createContext({sessionId:'sess-stream',requestId:'req-stream',planId:'plan-stream',runId:'run-stream',tabId:12,conversationIdentity:'conv-stream'});
  const client=R.createChromeClient(chrome);
  const chunks=[];
  const promise=client.stream(ctx,{prompt:'hi'},{onChunk:(chunk,meta)=>chunks.push([chunk,meta.index])});
  assert.strictEqual(listeners.length,1,'stream client must subscribe while request is active');
  listeners[0]({action:R.STREAM_EVENT_ACTION,requestId:'wrong',sessionId:'sess-stream',chunk:'X',index:1});
  listeners[0]({action:R.STREAM_EVENT_ACTION,requestId:'req-stream',sessionId:'wrong',chunk:'Y',index:1});
  listeners[0]({action:R.STREAM_EVENT_ACTION,requestId:'req-stream',sessionId:'sess-stream',chunk:'A',index:1,totalBytes:1});
  listeners[0]({action:R.STREAM_EVENT_ACTION,requestId:'req-stream',sessionId:'sess-stream',chunk:'B',index:2,totalBytes:2});
  const result=await promise;
  assert.strictEqual(result.text,'AB');
  assert.deepStrictEqual(chunks,[['A',1],['B',2]],'client must ignore stream events from other requests/sessions');
  assert.strictEqual(listeners.length,0,'stream listener must be removed after completion');
  console.log('Browser intelligence unified pass 1 stream client fencing');
})().catch(err=>{console.error(err);process.exit(1);});
