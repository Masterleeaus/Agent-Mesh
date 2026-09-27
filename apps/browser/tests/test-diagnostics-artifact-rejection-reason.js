const fs=require('fs');
const vm=require('vm');
const assert=require('assert');
const source=fs.readFileSync('src/lib/service-worker.js','utf8');
const bad={ready:true,protocolVersion:2,planId:'plan',runId:'run',stepId:'step-01',stepToken:'WRONG',stepCompleted:1,stepTotal:2,status:'completed',artifactId:'a',zip:'x.zip',sha256:'c'.repeat(64),verification:'PASS',nextAction:'advance'};
let diagnostics=[];
const plan={stateVersion:2,stateRevision:1,protocolMode:'signature_v2',planId:'plan',runId:'run',plan:[{number:1,text:'one'},{number:2,text:'two'}],stepIndex:0,dispatchStatus:'awaiting_artifact',currentStepId:'step-01',currentStepToken:'token-01',target:{url:'https://chatgpt.com/c/abc',conversationIdentity:'chatgpt:abc'}};
const chrome={sidePanel:{setPanelBehavior:async()=>{}},runtime:{onMessage:{addListener(){}},sendMessage:async()=>({ok:true}),onStartup:{addListener(){}},onInstalled:{addListener(){}}},alarms:{create:async()=>{},get:async()=>({periodInMinutes:1}),onAlarm:{addListener(){}}},tabs:{query(_q,cb){cb([]);},get:async()=>({id:7,url:'https://chatgpt.com/c/abc',title:'Conversation'}),sendMessage:async(_id,msg)=>msg.action==='GET_CODEE_DIAGNOSTICS'?{ok:true,contextValid:true,composerFound:true}:{ok:true,versions:[],artifacts:[bad],hasSubmittedStepToken:false}},storage:{local:{get:async()=>({codeeState:{plan_7:JSON.parse(JSON.stringify(plan))},codeeDiagnostics:diagnostics}),set:async()=>{}}}};
const context={chrome,console:{log(){},warn(){},error(){}},setTimeout(fn){fn();return 1;},Map,Set,Promise,Date,Math,URL};
vm.runInNewContext(source,context);
(async()=>{
 const r=await context.getDiagnosticSnapshot(7);
 assert.strictEqual(r.artifact.evaluations.length,1);
 assert.strictEqual(r.artifact.evaluations[0].reason,'step-token','diagnostics must expose the exact signature rejection reason');
 assert(/waiting/i.test(r.recommendation),'nonmatching artifact should not be mistaken for current-step completion');
 console.log('diagnostics exposes exact artifact rejection reason OK');
})().catch(e=>{console.error(e);process.exit(1);});
