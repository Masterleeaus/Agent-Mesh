const fs=require('fs');const vm=require('vm');const assert=require('assert');
const source=fs.readFileSync('src/lib/service-worker.js','utf8');
const future={stateVersion:99,stateRevision:5,protocolMode:'signature_v2',planId:'future',runId:'future-run',plan:[{number:1,text:'future step'}],stepIndex:0,dispatchStatus:'awaiting_artifact',futureOnly:{nested:{keep:true}}};
const normal={stateVersion:2,stateRevision:1,protocolMode:'signature_v2',planId:'normal',runId:'normal-run',plan:[{number:1,text:'normal step'}],stepIndex:0,dispatchStatus:'pending_send',target:{url:'https://chatgpt.com/c/match',conversationIdentity:'chatgpt:match'}};
let stored={plan_1:JSON.parse(JSON.stringify(normal)),plan_2:JSON.parse(JSON.stringify(future))};
const beforeFuture=JSON.stringify(stored.plan_2);
const chrome={sidePanel:{setPanelBehavior:async()=>{}},runtime:{onMessage:{addListener(){}},sendMessage:async()=>{}},alarms:{get:async()=>({periodInMinutes:1}),create:async()=>{},onAlarm:{addListener(){}}},tabs:{query(_q,cb){cb([])},get:async(id)=>{if(id===1)throw new Error('closed');return {url:'https://chatgpt.com/c/other'}}},storage:{local:{get:async()=>({codeeState:JSON.parse(JSON.stringify(stored))}),set:async(v)=>{stored=JSON.parse(JSON.stringify(v.codeeState));}}}};
const context={chrome,console:{log(){},warn(){},error(){}},Map,Set,Promise,Date,Math,URL,crypto:{randomUUID:()=> 'uuid'}};vm.runInNewContext(source,context);
(async()=>{
 const result=await context.rebindOrphanedPlanToTab(3,'https://chatgpt.com/c/match');
 assert.strictEqual(result.rebound,true);
 assert.strictEqual(JSON.stringify(stored.plan_2),beforeFuture,'rebinding another plan must not mutate unrelated future-schema state');
 console.log('future state isolated during rebind OK');
})().catch(e=>{console.error(e);process.exit(1)});
