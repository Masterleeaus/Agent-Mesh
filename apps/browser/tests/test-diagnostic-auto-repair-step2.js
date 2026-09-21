const fs=require('fs');
const vm=require('vm');
const assert=require('assert');
const source=fs.readFileSync('src/lib/service-worker.js','utf8');
const h1='b'.repeat(64);
let codeeState={plan_7:{
 stateVersion:2,stateRevision:1,protocolMode:'signature_v2',planId:'plan',runId:'run',
 plan:[{number:1,text:'one'},{number:2,text:'two'}],stepIndex:0,dispatchStatus:'awaiting_artifact',
 currentStepId:'step-01',currentStepToken:'token-01',versions:[],knownVersions:[],knownArtifactHashes:[],consumedArtifactHashes:[],consumedArtifactKeys:[],artifactHistory:[],
 target:{url:'https://chatgpt.com/c/abc',provider:'ChatGPT',conversationIdentity:'chatgpt:abc'}
}};
const artifact={ready:true,protocolVersion:2,planId:'plan',runId:'run',stepId:'step-01',stepToken:'token-01',stepCompleted:1,stepTotal:2,status:'completed',artifactId:'a1',zip:'Codee-v1.0.0.zip',type:'cumulative',version:'1.0.0',parentSha256:'N/A',sha256:h1,tests:'1/1 PASS',verification:'PASS',nextAction:'advance'};
let sends=0; let diagnostics=[];
const chrome={
 sidePanel:{setPanelBehavior:async()=>{}},
 runtime:{onMessage:{addListener(){}},sendMessage:async()=>({ok:true}),onStartup:{addListener(){}},onInstalled:{addListener(){}}},
 alarms:{create:async()=>{},get:async()=>({name:'ZIP_POLL',periodInMinutes:1}),onAlarm:{addListener(){}}},
 tabs:{
  query(_q,cb){cb([]);}, get:async()=>({id:7,url:'https://chatgpt.com/c/abc',title:'Conversation'}),
  sendMessage:async(_id,msg)=>{
   if(msg.action==='CHECK_FOR_ZIP') return {ok:true};
   if(msg.action==='GET_PAGE_STATE') return {ok:true,versions:['1.0.0'],artifacts:[artifact],hasSubmittedStepToken:false};
   if(msg.action==='GET_CODEE_DIAGNOSTICS') return {ok:true,contextValid:true,composerFound:true,artifactCount:1,versionCount:1};
   if(msg.action==='SEND_PROMPT'){sends++;return {ok:true,stepToken:msg.stepToken};}
   return {ok:true};
  }
 },
 storage:{local:{
  get:async()=>({codeeState:JSON.parse(JSON.stringify(codeeState)),codeeDiagnostics:JSON.parse(JSON.stringify(diagnostics))}),
  set:async(payload)=>{if(payload.codeeState)codeeState=JSON.parse(JSON.stringify(payload.codeeState));if(payload.codeeDiagnostics)diagnostics=JSON.parse(JSON.stringify(payload.codeeDiagnostics));}
 }}
};
const context={chrome,console:{log(){},warn(){},error(){}},setTimeout(fn){fn();return 1;},Map,Set,Promise,Date,Math,URL};
vm.runInNewContext(source,context);
(async()=>{
 const result=await context.runDiagnosticRepair(7,'auto');
 assert.strictEqual(result.ok,true,'auto repair should reconcile a valid visible Step 1 artifact');
 assert.strictEqual(codeeState.plan_7.stepIndex,1,'auto repair must advance to Step 2');
 assert.strictEqual(codeeState.plan_7.dispatchStatus,'awaiting_artifact','Step 2 should be submitted and awaiting its artifact');
 assert.strictEqual(sends,1,'auto repair must submit Step 2 exactly once');
 console.log('diagnostic auto repair reconciles Step 1 and sends Step 2 OK');
})().catch(e=>{console.error(e);process.exit(1);});
