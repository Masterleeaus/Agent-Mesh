const fs = require('fs');
const vm = require('vm');
const assert = require('assert');
const source = fs.readFileSync('src/lib/service-worker.js','utf8');
let listener;
const plan={stateVersion:2,stateRevision:1,protocolMode:'signature_v2',planId:'plan',runId:'run',plan:[{number:1,text:'one'},{number:2,text:'two'}],stepIndex:1,dispatchStatus:'pending_send',currentStepId:'step-02',currentStepToken:'token-02',target:{url:'https://chatgpt.com/c/abc',provider:'ChatGPT',conversationIdentity:'chatgpt:abc'}};
const chrome={
 sidePanel:{setPanelBehavior:async()=>{}},
 runtime:{onMessage:{addListener(fn){listener=fn;}},sendMessage:async()=>({ok:true}),onStartup:{addListener(){}},onInstalled:{addListener(){}}},
 alarms:{create:async()=>{},get:async()=>({name:'ZIP_POLL',periodInMinutes:1}),onAlarm:{addListener(){}}},
 tabs:{
   query(_q,cb){cb([]);},
   get:async()=>({id:7,url:'https://chatgpt.com/c/abc',title:'Test conversation'}),
   sendMessage:async(_id,msg)=> msg.action==='GET_CODEE_DIAGNOSTICS'
     ? {ok:true,contextValid:true,composerFound:true,artifactCount:1,versionCount:1,lastError:''}
     : {ok:true,versions:['1.0.0'],artifacts:[],hasSubmittedStepToken:false}
 },
 storage:{local:{get:async(keys)=>({codeeState:{plan_7:JSON.parse(JSON.stringify(plan))},codeeDiagnostics:[]}),set:async()=>{}}}
};
const context={chrome,console:{log(){},warn(){},error(){}},setTimeout(fn){fn();return 1;},Map,Set,Promise,Date,Math};
vm.runInNewContext(source,context);
assert.strictEqual(typeof context.getDiagnosticSnapshot,'function','worker must expose getDiagnosticSnapshot');
assert.strictEqual(typeof context.runDiagnosticRepair,'function','worker must expose runDiagnosticRepair');
(async()=>{
 const report=await context.getDiagnosticSnapshot(7);
 assert.strictEqual(report.ok,true);
 assert.strictEqual(report.plan.stepNumber,2);
 assert.strictEqual(report.plan.dispatchStatus,'pending_send');
 assert.strictEqual(report.connection.contentScript,true);
 assert.strictEqual(report.connection.composer,true);
 assert.strictEqual(report.recoveryAlarm.ok,true);
 const storageCheck=report.checks.find(x=>x.id==='storage-health');assert(storageCheck);assert.strictEqual(storageCheck.ok,true);
 console.log('worker diagnostics snapshot API OK');
})().catch(error=>{console.error(error);process.exit(1);});
