const fs = require('fs');
const vm = require('vm');
const assert = require('assert');
const source = fs.readFileSync('src/lib/service-worker.js', 'utf8');
let codeeState = { plan_7: {
  stateVersion: 2, protocolMode: 'signature_v2', planId: 'plan-7', runId: 'run-7',
  plan: [{number:1,text:'one'}], stepIndex: 0, versions: [], knownVersions: [], knownArtifactHashes: [],
  consumedArtifactHashes: [], artifactHistory: [], dispatchStatus: 'pending_send',
  currentStepId: 'step-01', currentStepToken: 'token-original'
}};
const sent = [];
const chrome = {
  sidePanel: { setPanelBehavior: async()=>{} }, runtime: { onMessage:{addListener(){}}, sendMessage:async()=>({ok:true}) },
  alarms:{create(){},onAlarm:{addListener(){}}},
  tabs:{query(_q,cb){cb([]);}, async sendMessage(_id,msg){
    if (msg.action === 'GET_PAGE_STATE') return {ok:true,versions:[],artifacts:[]};
    if (msg.action === 'SEND_PROMPT') { sent.push(msg); return {ok:true}; }
    return {ok:true};
  }},
  storage:{sync:{get:async()=>({})},local:{
    get:async()=>({codeeState:JSON.parse(JSON.stringify(codeeState))}),
    set:async({codeeState:next})=>{codeeState=JSON.parse(JSON.stringify(next));}
  }}
};
const context={chrome,console:{log(){},warn(){},error(){}},setTimeout(fn){fn();return 1;},clearTimeout(){},Map,Set,Promise,Date,Math,crypto:{randomUUID:()=> 'rotated'}};
vm.runInNewContext(source,context);
(async()=>{
  const result = await context.retryPendingPlanOnTab(7);
  assert.strictEqual(result.ok,true);
  assert.strictEqual(codeeState.plan_7.currentStepToken,'token-original',
    'retrying the same logical step must keep its correlation token so a valid in-flight artifact is not orphaned');
  assert(sent[0].prompt.includes('STEP_TOKEN: token-original'));
  console.log('same-step retry token stability OK');
})().catch(error=>{console.error(error);process.exit(1);});
