const fs=require('fs');const vm=require('vm');const assert=require('assert');
const source=fs.readFileSync('src/lib/service-worker.js','utf8');
let oldTabExists=false;
let codeeState={plan_7:{stateVersion:2,protocolMode:'signature_v2',planId:'p',runId:'r',plan:[{number:1,text:'one'}],stepIndex:0,knownVersions:[],versions:[],knownArtifactHashes:[],consumedArtifactHashes:[],consumedArtifactKeys:[],artifactHistory:[],dispatchStatus:'awaiting_artifact',target:{provider:'ChatGPT',url:'https://chatgpt.com/c/abc',conversationIdentity:'chatgpt:abc'}}};
const chrome={sidePanel:{setPanelBehavior:async()=>{}},runtime:{onMessage:{addListener(){}},sendMessage:async()=>({ok:true})},alarms:{create(){},onAlarm:{addListener(){}}},tabs:{query(_q,cb){cb([]);},async get(id){if(id===7){if(oldTabExists)return{id:7,url:'https://chatgpt.com/c/abc'};throw new Error('No tab with id: 7');}return{id,url:'https://chatgpt.com/c/abc'};},sendMessage:async()=>({ok:true})},storage:{local:{get:async()=>({codeeState:JSON.parse(JSON.stringify(codeeState))}),set:async({codeeState:next})=>{codeeState=JSON.parse(JSON.stringify(next));}}}};
const context={chrome,console:{log(){},warn(){},error(){}},setTimeout(fn){fn();return 1;},Map,Set,Promise,Date,Math,URL,crypto:{randomUUID:()=> 'x'}};
vm.runInNewContext(source,context);
(async()=>{
  assert.strictEqual(typeof context.rebindOrphanedPlanToTab,'function','worker must expose identity rebind helper');
  const rebound=await context.rebindOrphanedPlanToTab(9,'https://chatgpt.com/c/abc');
  assert.strictEqual(rebound.rebound,true,'orphaned plan should rebind to reopened same conversation');
  assert(!codeeState.plan_7,'old orphaned tab key should be removed');
  assert.strictEqual(codeeState.plan_9.planId,'p');

  codeeState={plan_7:{...codeeState.plan_9},}; delete codeeState.plan_9; oldTabExists=true;
  const duplicate=await context.rebindOrphanedPlanToTab(9,'https://chatgpt.com/c/abc');
  assert.strictEqual(duplicate.rebound,false,'must not steal a plan while original same-conversation tab still exists');
  assert(codeeState.plan_7 && !codeeState.plan_9);
  console.log('conversation identity orphan rebind OK');
})().catch(e=>{console.error(e);process.exit(1)});
