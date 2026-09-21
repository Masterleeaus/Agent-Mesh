const fs=require('fs');const vm=require('vm');const assert=require('assert');
const source=fs.readFileSync('src/lib/service-worker.js','utf8');
let writes=0;
const future={stateVersion:99,stateRevision:7,protocolMode:'signature_v2',planId:'future-plan',runId:'future-run',plan:[{number:1,text:'x'}],stepIndex:0,dispatchStatus:'awaiting_artifact',futureOnly:{keep:'exact'}};
const chrome={
 sidePanel:{setPanelBehavior:async()=>{}},
 runtime:{onMessage:{addListener(){}},sendMessage:async()=>{}},
 alarms:{get:async()=>({periodInMinutes:1}),create:async()=>{},onAlarm:{addListener(){}}},
 tabs:{query(_q,cb){cb([])},get:async()=>({url:'https://chatgpt.com/c/abc'})},
 storage:{local:{get:async()=>({codeeState:{plan_10:JSON.parse(JSON.stringify(future))}}),set:async()=>{writes++;}}}
};
const context={chrome,console:{log(){},warn(){},error(){}},Map,Set,Promise,Date,Math,URL,crypto:{randomUUID:()=> 'uuid'}};
vm.runInNewContext(source,context);
(async()=>{
 const result=await context.handleStartOrRetry(10);
 assert.strictEqual(result.requiresRestart,true);
 assert.strictEqual(writes,0,'an older Codee build must not persist any mutation to future-schema state');
 console.log('future-schema plan is read-only OK');
})().catch(e=>{console.error(e);process.exit(1)});
