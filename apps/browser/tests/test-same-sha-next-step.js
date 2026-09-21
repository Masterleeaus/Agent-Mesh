const fs = require('fs');
const vm = require('vm');
const assert = require('assert');
const source = fs.readFileSync('src/lib/service-worker.js','utf8');
const hash = 'd'.repeat(64);
let codeeState={plan_7:{stateVersion:2,protocolMode:'signature_v2',planId:'plan',runId:'run',plan:[{number:1,text:'one'},{number:2,text:'two'}],stepIndex:1,versions:['1.0.0'],knownVersions:[],knownArtifactHashes:[hash],consumedArtifactHashes:[hash],artifactHistory:[{step:1,sha256:hash}],lastArtifactSha256:hash,dispatchStatus:'awaiting_artifact',currentStepId:'step-02',currentStepToken:'token-02'}};
const chrome={sidePanel:{setPanelBehavior:async()=>{}},runtime:{onMessage:{addListener(){}},sendMessage:async()=>({ok:true})},alarms:{create(){},onAlarm:{addListener(){}}},tabs:{query(_q,cb){cb([]);},async sendMessage(){return {ok:true};}},storage:{sync:{get:async()=>({})},local:{get:async()=>({codeeState:JSON.parse(JSON.stringify(codeeState))}),set:async({codeeState:next})=>{codeeState=JSON.parse(JSON.stringify(next));}}}};
const context={chrome,console:{log(){},warn(){},error(){}},setTimeout(fn){fn();return 1;},Map,Set,Promise,Date,Math};
vm.runInNewContext(source,context);
const artifact={ready:true,protocolVersion:2,planId:'plan',runId:'run',stepId:'step-02',stepToken:'token-02',stepCompleted:2,stepTotal:2,status:'completed',artifactId:'a2',zip:'same.zip',type:'cumulative',version:'1.0.0',parentSha256:hash,sha256:hash,tests:'1/1 PASS',verification:'PASS',nextAction:'advance'};
(async()=>{
  const result=await context.handleArtifactDetected(7,artifact);
  assert.strictEqual(result.ok,true,
    'the same ZIP SHA may legitimately complete a different step when run/step/token and parent chain match');
  assert.strictEqual(codeeState.plan_7.dispatchStatus,'complete');
  console.log('same SHA on a different signed step is allowed OK');
})().catch(error=>{console.error(error);process.exit(1);});
