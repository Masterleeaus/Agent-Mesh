const assert=require('assert');
const fs=require('fs');
const vm=require('vm');
const context=vm.createContext({console,globalThis:{},crypto:require('crypto').webcrypto,setTimeout,clearTimeout}); context.globalThis=context;
for(const file of ['src/intelligence/intelligence-contract.js','src/intelligence/intelligence-host.js']) vm.runInContext(fs.readFileSync(file,'utf8'),context,{filename:file});
const C=context.CodeeIntelligenceContract,H=context.CodeeIntelligenceHost;
assert(C&&H); H._resetForTests();
let active=0,maxActive=0;
const runtime={id:'browser-primary',primaryRuntime:'browser',
 request:async(ctx,payload)=>{active++; maxActive=Math.max(maxActive,active); await new Promise(r=>setTimeout(r,payload.delay||5)); active--; return {requestId:ctx.requestId,text:payload.text};},
 stream:async(ctx,payload)=>({requestId:ctx.requestId,chunks:[payload.text]}), cancel:async()=>({ok:true}), embed:async(ctx,p)=>({requestId:ctx.requestId,vector:[String(p.text||'').length]}), listModels:async()=>[], getCapabilities:async()=>({}), health:async()=>({ok:true})};
H.registerRuntime(runtime,{primary:true});
assert.strictEqual(H.listRuntimes().length,1); assert.strictEqual(H.listRuntimes()[0].primary,true);
const a=C.createContext({sessionId:'session-a',requestId:'req-a',planId:'plan-a',runId:'run-a',tabId:1,conversationIdentity:'conv-a'});
const b=C.createContext({sessionId:'session-b',requestId:'req-b',planId:'plan-b',runId:'run-b',tabId:2,conversationIdentity:'conv-b'});
Promise.all([H.request(a,{text:'A',delay:15}),H.request(b,{text:'B',delay:1})]).then(async values=>{
 assert.deepStrictEqual(values.map(v=>v.text),['A','B']); assert.strictEqual(maxActive,1,'shared runtime must serialize inference');
 assert.strictEqual(H.getSession('session-a').identity.conversationIdentity,'conv-a'); assert.strictEqual(H.getSession('session-b').identity.conversationIdentity,'conv-b');
 assert.strictEqual(H.getRequest('req-a').state,'completed');
 const dup=C.createContext({sessionId:'session-a',requestId:'req-dup',planId:'different-plan',runId:'run-a',tabId:1,conversationIdentity:'conv-a'});
 assert.throws(()=>H.request(dup,{text:'bad'}),/Session identity collision/);
 const c=C.createContext({sessionId:'session-c',requestId:'req-c',planId:'plan-c',runId:'run-c',tabId:3,conversationIdentity:'conv-c'});
 const pending=H.request(c,{text:'C',delay:20}); await new Promise(r=>setTimeout(r,2)); const cancelled=await H.cancel('req-c','test'); assert.strictEqual(cancelled.ok,true); await assert.rejects(pending,/Stale intelligence response|cancelled/); assert.strictEqual(H.getRequest('req-c').state,'cancelled');
 const health=await H.health(); assert.strictEqual(health.runtimeCount,1); assert.strictEqual(health.runtimes[0].id,'browser-primary');
 console.log('Browser intelligence shared host pass 3');
}).catch(err=>{console.error(err);process.exit(1);});
