const fs=require('fs');const vm=require('vm');const assert=require('assert');
const source=fs.readFileSync('src/lib/service-worker.js','utf8');
const chrome={sidePanel:{setPanelBehavior:async()=>{}},runtime:{onMessage:{addListener(){}},sendMessage:async()=>{}},alarms:{create(){},onAlarm:{addListener(){}}},tabs:{query(_q,cb){cb([])}},storage:{local:{get:async()=>({codeeState:{}}),set:async()=>{}}}};
const c={chrome,console:{log(){},warn(){},error(){}},Map,Set,Promise,Date,Math,URL};vm.runInNewContext(source,c);
const cases=[
 {name:'empty plan',plan:{stateVersion:2,protocolMode:'signature_v2',planId:'p1',runId:'r1',plan:[],stepIndex:0,dispatchStatus:'pending_send'}},
 {name:'out of range step',plan:{stateVersion:2,protocolMode:'signature_v2',planId:'p2',runId:'r2',plan:[{number:1,text:'x'}],stepIndex:4,dispatchStatus:'pending_send'}},
 {name:'empty persisted step',plan:{stateVersion:2,protocolMode:'signature_v2',planId:'p3',runId:'r3',plan:[{number:1,text:'   '}],stepIndex:0,dispatchStatus:'pending_send'}}
];
for(const item of cases){c.normalizePlanState(item.plan);assert.strictEqual(item.plan.requiresRestart,true,`${item.name} must be quarantined instead of retried forever`);assert.strictEqual(item.plan.restartReason,'corrupt-plan-state');assert.strictEqual(item.plan.dispatchStatus,'blocked');}
console.log('corrupt persisted worker plan state is quarantined OK');
