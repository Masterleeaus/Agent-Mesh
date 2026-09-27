const fs=require('fs');const vm=require('vm');const assert=require('assert');
const source=fs.readFileSync('src/lib/service-worker.js','utf8');
const future={stateVersion:99,stateRevision:5,protocolMode:'signature_v2',planId:'future',runId:'future-run',plan:[{number:1,text:'future step'}],stepIndex:0,dispatchStatus:'awaiting_artifact',futureOnly:{keep:'exact'}};
let stored={plan_5:JSON.parse(JSON.stringify(future))};const before=JSON.stringify(stored.plan_5);
const chrome={sidePanel:{setPanelBehavior:async()=>{}},runtime:{onMessage:{addListener(){}},sendMessage:async()=>{}},alarms:{get:async()=>({periodInMinutes:1}),create:async()=>{},onAlarm:{addListener(){}}},tabs:{query(_q,cb){cb([])}},storage:{local:{get:async()=>({codeeState:JSON.parse(JSON.stringify(stored))}),set:async(v)=>{stored=JSON.parse(JSON.stringify(v.codeeState));}}}};
const context={chrome,console:{log(){},warn(){},error(){}},Map,Set,Promise,Date,Math,URL,crypto:{randomUUID:()=> 'uuid'}};vm.runInNewContext(source,context);
(async()=>{
 const incoming={stateVersion:2,protocolMode:'signature_v2',planId:'new',runId:'new-run',plan:[{number:1,text:'new step'}],stepIndex:0,dispatchStatus:'pending_send'};
 const result=await context.savePlanState(5,incoming);
 assert.strictEqual(result.ok,false,'save must refuse to replace an active future-schema plan');
 assert.strictEqual(JSON.stringify(stored.plan_5),before,'rejected save must leave future-schema state byte-for-byte equivalent');
 console.log('future state isolated during save OK');
})().catch(e=>{console.error(e);process.exit(1)});
