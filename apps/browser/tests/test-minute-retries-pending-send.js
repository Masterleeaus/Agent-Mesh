const fs = require('fs');
const vm = require('vm');
const assert = require('assert');
const source = fs.readFileSync('src/lib/service-worker.js','utf8');
let codeeState={plan_7:{stateVersion:2,protocolMode:'signature_v2',planId:'plan-r',runId:'run-r',plan:[{number:1,text:'one'},{number:2,text:'two'}],stepIndex:1,versions:[],knownVersions:[],knownArtifactHashes:[],consumedArtifactHashes:[],artifactHistory:[],dispatchStatus:'pending_send',lastArtifactSha256:'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'}};
const sent=[];
const chrome={sidePanel:{setPanelBehavior:async()=>{}},runtime:{onMessage:{addListener(){}},sendMessage:async()=>({ok:true})},alarms:{create(){},onAlarm:{addListener(){}}},tabs:{query(_q,cb){cb([{id:7}]);},async sendMessage(id,msg){assert.strictEqual(id,7);if(msg.action==='GET_PAGE_STATE')return {ok:true,versions:[],artifacts:[]};if(msg.action==='SEND_PROMPT'){sent.push(msg);return {ok:true};}if(msg.action==='CHECK_FOR_ZIP')return {ok:true};return {ok:true};}},storage:{sync:{get:async()=>({})},local:{get:async()=>({codeeState:JSON.parse(JSON.stringify(codeeState))}),set:async({codeeState:next})=>{codeeState=JSON.parse(JSON.stringify(next));}}}};
const context={chrome,console:{log(){},warn(){},error(){}},setTimeout(fn){fn();return 1;},Map,Set,Promise,Date,Math,crypto:{randomUUID:()=> 'retry-token'}};
vm.runInNewContext(source,context);
(async()=>{
  assert.strictEqual(typeof context.retryPendingPlanOnTab,'function','worker must expose pending-send recovery helper');
  const result=await context.retryPendingPlanOnTab(7);
  assert.strictEqual(result.ok,true);
  assert.strictEqual(sent.length,1,'one-minute recovery must retry a pending Step 2 without requiring a manual reload');
  assert.strictEqual(codeeState.plan_7.dispatchStatus,'awaiting_artifact');
  console.log('one-minute pending-send retry OK');
})().catch(error=>{console.error(error);process.exit(1);});
