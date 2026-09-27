const fs=require('fs');const vm=require('vm');const assert=require('assert');
const source=fs.readFileSync('src/lib/service-worker.js','utf8');
const chrome={sidePanel:{setPanelBehavior:async()=>{}},runtime:{onMessage:{addListener(){}},sendMessage:async()=>{}},alarms:{create(){},onAlarm:{addListener(){}}},tabs:{query(_q,cb){cb([])}},storage:{local:{get:async()=>({codeeState:{}}),set:async()=>{}}}};
const context={chrome,console:{log(){},warn(){},error(){}},Map,Set,Promise,Date,Math,URL};vm.runInNewContext(source,context);
const plan={stateVersion:2,protocolMode:'signature_v2',planId:'p',runId:'r',plan:[{number:1,text:'x'}],stepIndex:0,currentStepId:'step-01',currentStepToken:'token-1',dispatchStatus:'blocked',consumedArtifactKeys:[],lastArtifactSha256:null};
const artifact={ready:true,protocolVersion:2,planId:'p',runId:'r',stepId:'step-01',stepToken:'token-1',stepCompleted:1,stepTotal:1,status:'completed',nextAction:'advance',artifactId:'a',zip:'a.zip',sha256:'a'.repeat(64),parentSha256:'N/A',verification:'PASS'};
const result=context.validateArtifactForCurrentStep(plan,artifact);
assert.strictEqual(result.ok,true,'a later valid completed footer must be able to resolve a blocked/needs-user step');
console.log('blocked step can recover from later completed footer OK');
