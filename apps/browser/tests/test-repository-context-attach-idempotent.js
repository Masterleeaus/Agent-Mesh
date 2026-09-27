const fs=require('fs'),vm=require('vm'),assert=require('assert');
const source=fs.readFileSync('src/lib/service-worker.js','utf8');
let storage={codeeState:{plan_7:{stateVersion:2,stateRevision:3,planId:'p',plan:[{text:'x'}],stepIndex:0,dispatchStatus:'awaiting_artifact'}}};
const clone=x=>x===undefined?undefined:JSON.parse(JSON.stringify(x));
const chrome={sidePanel:{setPanelBehavior:async()=>{}},runtime:{onMessage:{addListener(){}},sendMessage:async()=>({ok:true}),onStartup:{addListener(){}},onInstalled:{addListener(){}}},alarms:{create:async()=>{},get:async()=>({periodInMinutes:1}),onAlarm:{addListener(){}}},tabs:{query(_q,cb){cb([])},get:async()=>({url:'https://chatgpt.com/c/a'}),sendMessage:async()=>({ok:true})},storage:{local:{get:async keys=>{const out={};for(const k of keys||[])out[k]=clone(storage[k]);return out;},set:async payload=>Object.assign(storage,clone(payload))}}};
const c={chrome,console:{log(){},warn(){},error(){}},Map,Set,Promise,Date,Math,JSON,setTimeout,clearTimeout,importScripts(){}};c.globalThis=c;vm.createContext(c);vm.runInContext(source,c);
(async()=>{
 const preflight={impact:{risk:'medium'},verification:{commands:['php -l']},targetedTests:{commands:['phpunit']}};
 const first=await c.attachRepositoryContextToSavedPlan(7,'CTX',preflight);
 const rev=storage.codeeState.plan_7.stateRevision;
 const second=await c.attachRepositoryContextToSavedPlan(7,'CTX',preflight);
 assert.strictEqual(first.attached,true);
 assert.strictEqual(second.unchanged,true,'same repository context/preflight must be idempotent');
 assert.strictEqual(storage.codeeState.plan_7.stateRevision,rev,'same context must not churn plan revision');
 console.log('Repository context attachment is idempotent');
})().catch(e=>{console.error(e);process.exit(1)});
