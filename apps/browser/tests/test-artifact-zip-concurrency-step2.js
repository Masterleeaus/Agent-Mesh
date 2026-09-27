const fs=require('fs');
const vm=require('vm');
const assert=require('assert');
const source=fs.readFileSync('src/lib/service-worker.js','utf8');
const h1='a'.repeat(64);
let codeeState={plan_7:{
 stateVersion:2,stateRevision:1,protocolMode:'signature_v2',planId:'plan',runId:'run',
 plan:[{number:1,text:'one'},{number:2,text:'two'}],stepIndex:0,dispatchStatus:'awaiting_artifact',
 currentStepId:'step-01',currentStepToken:'token-01',versions:[],knownVersions:[],knownArtifactHashes:[],consumedArtifactHashes:[],consumedArtifactKeys:[],artifactHistory:[],
 target:{url:'https://chatgpt.com/c/abc',provider:'ChatGPT',conversationIdentity:'chatgpt:abc'}
}};
let promptSends=0;
const chrome={
 sidePanel:{setPanelBehavior:async()=>{}},
 runtime:{onMessage:{addListener(){}},sendMessage:async()=>({ok:true}),onStartup:{addListener(){}},onInstalled:{addListener(){}}},
 alarms:{create:async()=>{},get:async()=>({periodInMinutes:1}),onAlarm:{addListener(){}}},
 tabs:{
   query(_q,cb){cb([]);},
   get:async()=>({id:7,url:'https://chatgpt.com/c/abc',title:'Conversation'}),
   sendMessage:async(_id,msg)=>{
     if(msg.action==='GET_PAGE_STATE') return {ok:true,versions:['1.0.0'],artifacts:[],hasSubmittedStepToken:false};
     if(msg.action==='SEND_PROMPT'){promptSends++; return {ok:true,stepToken:msg.stepToken};}
     if(msg.action==='GET_CODEE_DIAGNOSTICS') return {ok:true,composerFound:true,contextValid:true};
     return {ok:true};
   }
 },
 storage:{local:{
   get:async()=>({codeeState:JSON.parse(JSON.stringify(codeeState)),codeeDiagnostics:[]}),
   set:async(payload)=>{if(payload.codeeState) codeeState=JSON.parse(JSON.stringify(payload.codeeState));}
 }}
};
const context={chrome,console:{log(){},warn(){},error(){}},setTimeout(fn){fn();return 1;},Map,Set,Promise,Date,Math,URL};
vm.runInNewContext(source,context);
const artifact={ready:true,protocolVersion:2,planId:'plan',runId:'run',stepId:'step-01',stepToken:'token-01',stepCompleted:1,stepTotal:2,status:'completed',artifactId:'a1',zip:'Codee-v1.0.0.zip',type:'cumulative',version:'1.0.0',parentSha256:'N/A',sha256:h1,tests:'1/1 PASS',verification:'PASS',nextAction:'advance'};
(async()=>{
 const results=await Promise.all([context.handleArtifactDetected(7,artifact),context.handleZIPDetected(7,'1.0.0')]);
 assert.strictEqual(results[0].ok,true,'signed artifact must be accepted');
 assert.strictEqual(promptSends,1,'Step 2 must be dispatched exactly once');
 assert.strictEqual(codeeState.plan_7.stepIndex,1,'state must advance to Step 2');
 assert.strictEqual(codeeState.plan_7.dispatchStatus,'awaiting_artifact','Step 2 must be waiting for its signed artifact');
 assert.strictEqual(codeeState.plan_7.lastArtifactSha256,h1,'Step 1 SHA must become the Step 2 parent');
 console.log('concurrent signed artifact + legacy ZIP cannot strand Step 2 OK');
})().catch(e=>{console.error(e);process.exit(1);});
