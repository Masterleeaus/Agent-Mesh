const fs=require('fs');const vm=require('vm');const assert=require('assert');
const source=fs.readFileSync('src/lib/service-worker.js','utf8');
let probes=0,reloads=0;let active=9;
const plan={stateVersion:2,protocolMode:'signature_v2',planId:'p',runId:'r',plan:[{number:1,text:'x'}],stepIndex:0,dispatchStatus:'pending_send',currentStepId:'step-01',currentStepToken:'token-x',target:{url:'https://chatgpt.com/c/a'},nextNudgerEnabled:false};
const chrome={
 sidePanel:{setPanelBehavior:async()=>{}},
 runtime:{onMessage:{addListener(){}},sendMessage:async()=>({ok:true}),onStartup:{addListener(){}},onInstalled:{addListener(){}}},
 alarms:{create:async()=>{},get:async()=>({name:'ZIP_POLL',periodInMinutes:1}),clear:async()=>true,onAlarm:{addListener(){}}},
 windows:{getLastFocused:async()=>({id:1,focused:true}),get:async()=>({id:1,focused:true}),update:async()=>({id:1,focused:true})},
 tabs:{
  query(q,cb){const out=q&&q.active?[{id:active,windowId:1,active:true}]:[];cb&&cb(out);return Promise.resolve(out)},
  get:async id=>({id,windowId:1,url:'https://chatgpt.com/c/a',active:id===active,frozen:false,discarded:false,autoDiscardable:false,status:'complete'}),
  update:async(id,props)=>{if(props.active)active=id;return{id,windowId:1,url:'https://chatgpt.com/c/a',active:id===active,frozen:false,discarded:false,autoDiscardable:false,status:'complete'}},
  reload:async()=>{reloads++;},
  sendMessage:async(id,msg)=>{
   if(msg.action==='PROBE_COMPOSER'){probes++;return{ok:false,reason:'composer-not-found',error:'Could not find the AI chat composer'};}
   if(msg.action==='GET_CODEE_DIAGNOSTICS') return {ok:true,composerFound:false,providerBusy:false,contextValid:true};
   return {ok:true};
  }
 },
 storage:{local:{get:async()=>({codeePreferences:{autoRecoverySweep:true,backgroundWatchdog:true,composerWatchdog:true,focusPulse:true,targetedReload:true,restorePreviousTab:true,preventAutoDiscard:true},codeeState:{plan_7:{...plan}},codeeDiagnostics:[]}),set:async()=>{}}}
};
const context={chrome,console:{log(){},warn(){},error(){}},setTimeout(fn){fn();return 1},clearTimeout(){},Map,Set,Promise,Date,Math,URL};vm.runInNewContext(source,context);
(async()=>{
 assert.strictEqual(typeof context.ensureComposerReady,'function','worker must expose composer watchdog recovery');
 const result=await context.ensureComposerReady(7);
 assert.strictEqual(result.ok,false,'missing composer should remain retryable instead of forcing a page reload');
 assert.strictEqual(result.reason,'composer-not-found');
 assert.strictEqual(reloads,0,'composer watchdog must never reload solely because composer is missing');
 assert(probes>=1,'composer watchdog must still perform bounded composer probes');
 assert.strictEqual(active,9,'composer recovery should restore the prior active tab');
 console.log('composer watchdog retries safely without reload loop OK');
})().catch(e=>{console.error(e);process.exit(1)});
