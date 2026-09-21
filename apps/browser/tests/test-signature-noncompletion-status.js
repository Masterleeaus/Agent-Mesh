const fs=require('fs');const vm=require('vm');const assert=require('assert');
const source=fs.readFileSync('src/lib/service-worker.js','utf8');
function base(){return{stateVersion:2,protocolMode:'signature_v2',planId:'p',runId:'r',plan:[{number:1,text:'one'}],stepIndex:0,versions:[],knownVersions:[],knownArtifactHashes:[],consumedArtifactHashes:[],artifactHistory:[],dispatchStatus:'awaiting_artifact',currentStepId:'step-01',currentStepToken:'tok'};}
let codeeState={plan_7:base()};let ui=[];
const chrome={sidePanel:{setPanelBehavior:async()=>{}},runtime:{onMessage:{addListener(){}},sendMessage:async m=>{ui.push(m);return{ok:true};}},alarms:{create(){},onAlarm:{addListener(){}}},tabs:{query(_q,cb){cb([]);},sendMessage:async()=>({ok:true})},storage:{sync:{get:async()=>({})},local:{get:async()=>({codeeState:JSON.parse(JSON.stringify(codeeState))}),set:async({codeeState:next})=>{codeeState=JSON.parse(JSON.stringify(next));}}}};
const context={chrome,console:{log(){},warn(){},error(){}},setTimeout(fn){fn();return 1;},Map,Set,Promise,Date,Math};vm.runInNewContext(source,context);
const common={ready:true,protocolVersion:2,planId:'p',runId:'r',stepId:'step-01',stepToken:'tok',stepCompleted:1,stepTotal:1,artifactId:'a',zip:'x.zip',type:'cumulative',version:'1',parentSha256:'N/A',sha256:'e'.repeat(64),tests:'0/1 PASS',verification:'FAIL'};
(async()=>{
 let result=await context.handleArtifactDetected(7,{...common,status:'blocked',nextAction:'needs_user'});
 assert.strictEqual(result.ok,true,'a canonical blocked result must be handled, not silently ignored');
 assert.strictEqual(codeeState.plan_7.dispatchStatus,'blocked');
 assert(ui.some(m=>String(m.status||'').toLowerCase().includes('blocked')),'UI should surface the blocked state');
 codeeState={plan_7:base()};ui=[];
 result=await context.handleArtifactDetected(7,{...common,status:'failed',nextAction:'retry'});
 assert.strictEqual(result.ok,true);
 assert.strictEqual(codeeState.plan_7.dispatchStatus,'pending_send','NEXT_ACTION retry should re-arm the same step for recovery');
 assert.strictEqual(codeeState.plan_7.currentStepToken,null,'a protocol-requested retry must retire the prior attempt token before redispatch');
 console.log('non-completed CODEE statuses are wired into plan state OK');
})().catch(e=>{console.error(e);process.exit(1)});
