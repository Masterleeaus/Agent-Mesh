const fs=require('fs');const vm=require('vm');const assert=require('assert');
const source=fs.readFileSync('src/lib/service-worker.js','utf8');
let codeeState={plan_7:{stateVersion:2,stateRevision:1,planId:'p',plan:[{number:1,text:'one'}],stepIndex:0,dispatchStatus:'pending_send'}};
const local={get:async()=>({codeeState:JSON.parse(JSON.stringify(codeeState))}),set:async({codeeState:next})=>{codeeState=JSON.parse(JSON.stringify(next))}};
const chrome={sidePanel:{setPanelBehavior:async()=>{}},runtime:{onMessage:{addListener(){}},sendMessage:async()=>{}},alarms:{create(){},onAlarm:{addListener(){}}},tabs:{query(_q,cb){cb([])}},storage:{local}};
const context={chrome,console:{log(){},warn(){},error(){}},Map,Set,Promise,Date,Math,URL};vm.runInNewContext(source,context);
(async()=>{
 const a=JSON.parse(JSON.stringify(codeeState.plan_7)); const b=JSON.parse(JSON.stringify(codeeState.plan_7));
 a.marker='newer'; await context.updatePlanState(7,a);
 b.marker='stale'; let stale=false;try{await context.updatePlanState(7,b)}catch(e){stale=/stale/i.test(e.message)}
 assert.strictEqual(stale,true,'stale revision must be rejected');
 assert.strictEqual(codeeState.plan_7.marker,'newer','stale async state must not overwrite newer state');
 const staleAfterDelete=JSON.parse(JSON.stringify(codeeState.plan_7)); delete codeeState.plan_7;
 let missing=false;try{await context.updatePlanState(7,staleAfterDelete)}catch(e){missing=/stale|missing/i.test(e.message)}
 assert.strictEqual(missing,true,'an in-flight update must not resurrect a stopped/rebound plan');
 assert.strictEqual(codeeState.plan_7,undefined);
 console.log('stale plan-state overwrite/resurrection guard OK');
})().catch(e=>{console.error(e);process.exit(1)});
