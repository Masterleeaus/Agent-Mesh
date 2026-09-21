const fs = require('fs');
const vm = require('vm');
const assert = require('assert');
const source = fs.readFileSync('src/lib/service-worker.js','utf8');
let sets = 0;
let codeeState = { plan_7: {
  stateVersion: 2, stateRevision: 5, protocolMode: 'signature_v2', planId: 'plan', runId: 'run',
  plan: [{number:1,text:'one'},{number:2,text:'two'}], stepIndex: 1, dispatchStatus: 'pending_send',
  currentStepId: 'step-02', currentStepToken: 'token-02', knownVersions: [], versions: ['1.0.0']
}};
const chrome={
  sidePanel:{setPanelBehavior:async()=>{}},
  runtime:{onMessage:{addListener(){}},sendMessage:async()=>({ok:true}),onStartup:{addListener(){}},onInstalled:{addListener(){}}},
  alarms:{create:async()=>{},get:async()=>({periodInMinutes:1}),onAlarm:{addListener(){}}},
  tabs:{query(_q,cb){cb([]);},sendMessage:async()=>({ok:true})},
  storage:{local:{get:async()=>({codeeState:JSON.parse(JSON.stringify(codeeState))}),set:async(payload)=>{sets++; if(payload.codeeState) codeeState=JSON.parse(JSON.stringify(payload.codeeState));}}}
};
const context={chrome,console:{log(){},warn(){},error(){}},setTimeout(fn){fn();return 1;},Map,Set,Promise,Date,Math};
vm.runInNewContext(source,context);
(async()=>{
  const before=JSON.stringify(codeeState);
  const result=await context.handleZIPDetected(7,'9.9.9');
  assert.strictEqual(JSON.stringify(codeeState),before,'legacy ZIP observations must not mutate signature-v2 plan state');
  assert.strictEqual(sets,0,'signature-v2 ZIP observation must not write storage');
  assert.strictEqual(result?.ignored,true,'signature-v2 ZIP observation should explicitly report ignored');
  console.log('signature-v2 ZIP events are read-only OK');
})().catch(error=>{console.error(error);process.exit(1);});
