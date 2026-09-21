const fs=require('fs');const vm=require('vm');const assert=require('assert');
const source=fs.readFileSync('src/lib/service-worker.js','utf8');
let codeeState={plan_7:{stateVersion:2,protocolMode:'signature_v2',planId:'p',runId:'r',plan:[{number:1,text:'one'},{number:2,text:'two'}],stepIndex:0,versions:[],knownVersions:[],knownArtifactHashes:[],consumedArtifactHashes:[],consumedArtifactKeys:[],artifactHistory:[],dispatchStatus:'awaiting_artifact',currentStepId:'step-01',currentStepToken:'tok'}};
let releaseUi; const uiGate=new Promise(r=>releaseUi=r); let uiCalls=0; let sends=0;
const chrome={sidePanel:{setPanelBehavior:async()=>{}},runtime:{onMessage:{addListener(){}},async sendMessage(){uiCalls++; if(uiCalls===1) await uiGate; return{ok:true};}},alarms:{create(){},onAlarm:{addListener(){}}},tabs:{query(_q,cb){cb([]);},async sendMessage(_id,msg){if(msg.action==='GET_PAGE_STATE')return{ok:true,versions:[],artifacts:[]};if(msg.action==='SEND_PROMPT'){sends++;return{ok:true};}return{ok:true};}},storage:{sync:{get:async()=>({})},local:{get:async()=>({codeeState:JSON.parse(JSON.stringify(codeeState))}),set:async({codeeState:next})=>{codeeState=JSON.parse(JSON.stringify(next));}}}};
const context={chrome,console:{log(){},warn(){},error(){}},setTimeout(fn){fn();return 1;},Map,Set,Promise,Date,Math,crypto:{randomUUID:()=> 'next'}};vm.runInNewContext(source,context);
function artifact(hash){return{ready:true,protocolVersion:2,planId:'p',runId:'r',stepId:'step-01',stepToken:'tok',stepCompleted:1,stepTotal:2,status:'completed',artifactId:`a-${hash[0]}`,zip:`${hash[0]}.zip`,type:'cumulative',version:'1',parentSha256:'N/A',sha256:hash,tests:'1/1 PASS',verification:'PASS',nextAction:'advance'};}
(async()=>{
 const first=context.handleArtifactDetected(7,artifact('a'.repeat(64)));
 await new Promise(r=>setImmediate(r));
 const second=await context.handleArtifactDetected(7,artifact('b'.repeat(64)));
 assert.strictEqual(second.retryable,true,'a second artifact for the same logical step must wait rather than mutate concurrently');
 assert.strictEqual(second.reason,'artifact-processing');
 releaseUi(); await first;
 assert.strictEqual(codeeState.plan_7.stepIndex,1);
 assert.strictEqual(sends,1,'same-step concurrent artifacts must dispatch the next step at most once');
 console.log('same-step artifact concurrency lock OK');
})().catch(e=>{console.error(e);process.exit(1)});
