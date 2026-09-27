const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

const source = fs.readFileSync('src/lib/service-worker.js', 'utf8');
let listener;
let codeeState = {
  plan_7: {
    stateVersion: 2, protocolMode: 'signature_v2', planId: 'aee8886c-2bbd-4966-a92e-5ccda1cbe46b',
    runId: 'run-479e0f8d-64e8-4a4f-9b34-2d07973ef1ba', plan: [{number:1,text:'one'},{number:2,text:'two'}],
    stepIndex: 0, versions: [], knownVersions: [], knownArtifactHashes: [], consumedArtifactHashes: [], artifactHistory: [],
    dispatchStatus: 'awaiting_artifact', currentStepId: 'step-01', currentStepToken: 'token-24f65b79-d503-48e9-b2aa-26099499fd9f'
  }
};
const sent = [];
const artifact = {
  ready:true, protocolVersion:2, planId:'aee8886c-2bbd-4966-a92e-5ccda1cbe46b', runId:'run-479e0f8d-64e8-4a4f-9b34-2d07973ef1ba',
  stepId:'step-01', stepToken:'token-24f65b79-d503-48e9-b2aa-26099499fd9f', stepCompleted:1, stepTotal:2, status:'completed',
  artifactId:'89c8f95e-9434-4cf4-bf9c-fa313fe7f87e', zip:'Build-v1.1.4.zip', type:'cumulative', version:'1.1.4', parentSha256:'N/A',
  sha256:'8c8b2ad3071048cdfeab5742c0d33be208841e4c1848d174b409deec23369fc8', tests:'407/407 PASS', verification:'PASS - verified', nextAction:'advance'
};
const chrome = {
  sidePanel:{setPanelBehavior:async()=>{}},
  runtime:{onMessage:{addListener(fn){listener=fn;}},sendMessage:async()=>({ok:true})},
  alarms:{create(){},onAlarm:{addListener(){}}},
  tabs:{query(_q,cb){cb([]);},async sendMessage(_id,msg){if(msg.action==='GET_PAGE_STATE')return {ok:true,versions:[],artifacts:[]}; if(msg.action==='SEND_PROMPT'){sent.push(msg);return {ok:true};} return {ok:true};}},
  storage:{sync:{get:async()=>({})},local:{get:async()=>({codeeState:JSON.parse(JSON.stringify(codeeState))}),set:async({codeeState:next})=>{codeeState=JSON.parse(JSON.stringify(next));}}}
};
const context={chrome,console:{log(){},warn(){},error(){}},setTimeout(fn){fn();return 1;},Map,Set,Promise,Date,Math,crypto:{randomUUID:()=> 'step2-token'}};
vm.runInNewContext(source,context);

(async()=>{
  let response;
  let resolveResponse;
  const responsePromise = new Promise(resolve => { resolveResponse = resolve; });
  const returned = listener({action:'ARTIFACT_DETECTED',artifact},{tab:{id:7}},value=>{response=value;resolveResponse();});
  assert.strictEqual(returned, true, 'ARTIFACT_DETECTED listener must keep the message channel open for async processing');
  await responsePromise;
  assert.strictEqual(response?.ok, true, 'worker must acknowledge successful artifact processing');
  assert.strictEqual(response?.advanced, true, 'acknowledgement must report advancement');
  assert.strictEqual(codeeState.plan_7.stepIndex, 1);
  assert.strictEqual(sent.length, 1, 'Step 2 must be dispatched before the artifact acknowledgement resolves');
  console.log('artifact message async acknowledgement OK');
})().catch(error=>{console.error(error);process.exit(1);});
