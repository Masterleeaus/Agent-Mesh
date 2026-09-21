const fs=require('fs');const vm=require('vm');const assert=require('assert');
const source=fs.readFileSync('src/lib/service-worker.js','utf8');
let reloads=0;const actions=[];
const plan={stateVersion:2,protocolMode:'signature_v2',planId:'p',runId:'r',plan:[{number:1,text:'x'}],stepIndex:0,dispatchStatus:'awaiting_artifact',currentStepId:'step-01',currentStepToken:'token-x',target:{url:'https://chatgpt.com/c/a',conversationIdentity:'chatgpt:a'},nextNudgerEnabled:false,lastDispatchedAt:Date.now()};
const chrome={
 sidePanel:{setPanelBehavior:async()=>{}},
 runtime:{onMessage:{addListener(){}},sendMessage:async()=>({ok:true}),onStartup:{addListener(){}},onInstalled:{addListener(){}}},
 alarms:{create:async()=>{},get:async()=>({name:'ZIP_POLL',periodInMinutes:1}),clear:async()=>true,onAlarm:{addListener(){}}},
 windows:{getLastFocused:async()=>({id:1,focused:true}),get:async()=>({id:1,focused:true}),update:async()=>({id:1,focused:true})},
 tabs:{
  query(q,cb){const out=[{id:7,windowId:1,url:'https://chatgpt.com/c/a',active:true,frozen:false,discarded:false,status:'complete',autoDiscardable:false}];cb&&cb(out);return Promise.resolve(out)},
  get:async()=>({id:7,windowId:1,url:'https://chatgpt.com/c/a',active:true,frozen:false,discarded:false,status:'complete',autoDiscardable:false}),
  update:async()=>({id:7,windowId:1,url:'https://chatgpt.com/c/a',active:true,frozen:false,discarded:false,status:'complete',autoDiscardable:false}),
  reload:async()=>{reloads++;},
  sendMessage:async(id,msg)=>{actions.push(msg.action);if(msg.action==='CHECK_FOR_ZIP')return{ok:true};if(msg.action==='GET_CODEE_DIAGNOSTICS')return{ok:true,composerFound:false,providerBusy:false,contextValid:true};if(msg.action==='PROBE_COMPOSER')return{ok:false,retryable:true,reason:'composer-not-found',error:'Could not find the AI chat composer'};return{ok:true};}
 },
 storage:{local:{get:async keys=>({codeePreferences:{autoRecoverySweep:true,backgroundWatchdog:true,composerWatchdog:true,focusPulse:true,targetedReload:true,restorePreviousTab:true,preventAutoDiscard:true,nextNudgerFeatureEnabled:true},codeeState:{plan_7:{...plan}},codeeDiagnostics:[]}),set:async()=>{}}}
};
const context={chrome,console:{log(){},warn(){},error(){}},setTimeout,clearTimeout,Map,Set,Promise,Date,Math,URL};vm.runInNewContext(source,context);
(async()=>{await context.checkForZIPsOnAllTabs();assert(actions.includes('CHECK_FOR_ZIP'),'awaiting-artifact sweep must rescan artifacts');assert(!actions.includes('PROBE_COMPOSER'),'awaiting-artifact sweep must not probe/recover the composer');assert.strictEqual(reloads,0,'awaiting-artifact sweep must never reload merely because composer is missing');console.log('state-aware recovery sweep avoids composer reload while awaiting artifact OK')})().catch(e=>{console.error(e);process.exit(1)});
