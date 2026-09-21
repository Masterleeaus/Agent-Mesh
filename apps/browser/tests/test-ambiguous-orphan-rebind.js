const fs=require('fs');const vm=require('vm');const assert=require('assert');
const source=fs.readFileSync('src/lib/service-worker.js','utf8');
let codeeState={
 plan_7:{stateVersion:2,protocolMode:'signature_v2',planId:'p1',runId:'r1',plan:[{number:1,text:'one'}],stepIndex:0,dispatchStatus:'awaiting_artifact',target:{url:'https://chatgpt.com/c/abc',conversationIdentity:'chatgpt:abc'}},
 plan_8:{stateVersion:2,protocolMode:'signature_v2',planId:'p2',runId:'r2',plan:[{number:1,text:'two'}],stepIndex:0,dispatchStatus:'awaiting_artifact',target:{url:'https://chatgpt.com/c/abc',conversationIdentity:'chatgpt:abc'}}
};
const chrome={sidePanel:{setPanelBehavior:async()=>{}},runtime:{onMessage:{addListener(){}},sendMessage:async()=>{}},alarms:{create(){},onAlarm:{addListener(){}}},tabs:{query(_q,cb){cb([])},get:async()=>{throw new Error('closed')}},storage:{local:{get:async()=>({codeeState:JSON.parse(JSON.stringify(codeeState))}),set:async({codeeState:next})=>{codeeState=JSON.parse(JSON.stringify(next))}}}};
const context={chrome,console:{log(){},warn(){},error(){}},Map,Set,Promise,Date,Math,URL};vm.runInNewContext(source,context);
(async()=>{
 const result=await context.rebindOrphanedPlanToTab(9,'https://chatgpt.com/c/abc');
 assert.strictEqual(result.rebound,false,'ambiguous duplicate orphan plans must not be rebound arbitrarily');
 assert.strictEqual(result.reason,'ambiguous-matching-orphans');
 assert(codeeState.plan_7&&codeeState.plan_8&&!codeeState.plan_9);
 console.log('ambiguous orphan rebind is safely refused OK');
})().catch(e=>{console.error(e);process.exit(1)});
