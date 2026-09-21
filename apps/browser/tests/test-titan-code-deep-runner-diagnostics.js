'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert');
const source=fs.readFileSync('src/lib/service-worker.js','utf8');
const now=Date.now();
const activePlan={stateVersion:2,stateRevision:3,planId:'p1',runId:'r1',plan:[{number:1,text:'one'}],stepIndex:0,dispatchStatus:'pending_send',currentStepId:'step-01',currentStepToken:'tok',target:{url:'https://chatgpt.com/c/other',provider:'chatgpt',conversationIdentity:'chatgpt:other'}};
const local={
  codeeState:{plan_99:activePlan},
  codeeDiagnostics:[
    {at:new Date(now-1000).toISOString(),tabId:7,type:'next-runner-skipped',severity:'warning',details:{result:'content-unreachable'}},
    {at:new Date(now-2000).toISOString(),tabId:7,type:'next-runner-sent',severity:'success',details:{result:'sent'}}
  ],
  codeeNextRunnerState:{'7':{enabled:true,intervalMinutes:5,lastResult:'content-unreachable',attemptCount:2,sentCount:1,failedCount:1,nextDueAt:now+300000,target:{tabId:7,url:'https://chatgpt.com/c/abc',provider:'chatgpt',conversationIdentity:'chatgpt:abc',title:'abc'}}},
  codeePreferences:{autoRecoverySweep:true,nextNudgerFeatureEnabled:true,backgroundWatchdog:true,composerWatchdog:true,focusPulse:false,targetedReload:false,restorePreviousTab:true,preventAutoDiscard:true}
};
const chrome={sidePanel:{setPanelBehavior:async()=>{}},runtime:{onMessage:{addListener(){}},sendMessage:async()=>({ok:true}),onStartup:{addListener(){}},onInstalled:{addListener(){}}},alarms:{create:async()=>{},get:async name=>name==='ZIP_POLL'?{name,periodInMinutes:1}:{name,scheduledTime:now+300000,periodInMinutes:5},onAlarm:{addListener(){}}},windows:{getLastFocused:async()=>({id:1,focused:true}),get:async()=>({id:1,focused:true})},tabs:{query:async()=>[],get:async id=>({id,windowId:1,url:'https://chatgpt.com/c/abc',title:'abc',active:true,frozen:false,discarded:false,autoDiscardable:false,status:'complete'}),sendMessage:async()=>{throw new Error('Could not establish connection. Receiving end does not exist.')}},storage:{local:{get:async keys=>{const out={};for(const k of (Array.isArray(keys)?keys:Object.keys(local))) if(k in local)out[k]=local[k];return out;},set:async obj=>Object.assign(local,obj)}}};
const c={chrome,console:{log(){},warn(){},error(){}},setTimeout(fn){fn();return 1},clearTimeout(){},Map,Set,Promise,Date,Math,URL};vm.runInNewContext(source,c);
(async()=>{const r=await c.getDiagnosticSnapshot(7);assert(r.runner,'deep diagnostics must include standalone runner');assert.strictEqual(r.runner.enabled,true);assert.strictEqual(r.runner.healthState,'degraded');assert(r.planInventory,'must include plan inventory');assert.strictEqual(r.planInventory.activeCount,1);assert.strictEqual(r.planInventory.boundToCurrentTab,false);assert(r.recovery,'must include recovery diagnostics');assert.strictEqual(r.recovery.focusPulseEnabled,false);assert(r.failureSummary,'must summarize recent failures');assert(r.failureSummary.byResult['content-unreachable']>=1);assert(r.checks.some(x=>x.id==='next-runner'&&x.level==='fail'),'degraded enabled runner must fail health check');console.log('Titan Code deep runner diagnostics OK')})().catch(e=>{console.error(e);process.exit(1)});
