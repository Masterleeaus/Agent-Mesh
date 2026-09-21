const fs=require('fs');const vm=require('vm');const assert=require('assert');
const source=fs.readFileSync('src/lib/service-worker.js','utf8');
let stored={plan_7:{stateVersion:2,stateRevision:1,protocolMode:'signature_v2',planId:'p',runId:'r',plan:[{number:1,text:'do work'}],stepIndex:0,dispatchStatus:'awaiting_artifact',currentStepId:'step-01',currentStepToken:'token-old',versions:[],knownVersions:[],knownArtifactHashes:[],consumedArtifactHashes:[],consumedArtifactKeys:[],artifactHistory:[],target:{url:'https://chatgpt.com/c/x',conversationIdentity:'chatgpt:x'}}};
let sentToken='';
const chrome={sidePanel:{setPanelBehavior:async()=>{}},runtime:{onMessage:{addListener(){}},sendMessage:async()=>{}},alarms:{get:async()=>({periodInMinutes:1}),create:async()=>{},onAlarm:{addListener(){}}},tabs:{query(_q,cb){cb([])},get:async()=>({url:'https://chatgpt.com/c/x'}),sendMessage:async(_id,msg)=>{if(msg.action==='GET_PAGE_STATE')return{ok:true,versions:[],artifacts:[],hasSubmittedStepToken:true};if(msg.action==='SEND_PROMPT'){sentToken=msg.stepToken;return{ok:true};}return{ok:true};}},storage:{local:{get:async()=>({codeeState:JSON.parse(JSON.stringify(stored))}),set:async(v)=>{stored=JSON.parse(JSON.stringify(v.codeeState));}}}};
let uuidN=0;const context={chrome,console:{log(){},warn(){},error(){}},Map,Set,Promise,Date,Math,URL,crypto:{randomUUID:()=>`u${++uuidN}`}};vm.runInNewContext(source,context);
const failed={ready:true,protocolVersion:2,planId:'p',runId:'r',stepId:'step-01',stepToken:'token-old',stepCompleted:1,stepTotal:1,status:'failed',nextAction:'retry',artifactId:'fail-a',verification:'FAIL'};
(async()=>{
 const handled=await context.handleArtifactDetected(7,failed);assert.strictEqual(handled.retry,true);
 assert.strictEqual(stored.plan_7.currentStepToken,null,'explicit retry should clear the prior attempt token before redispatch');
 stored.plan_7.nextRetryAt=0;
 const result=await context.retryPendingPlanOnTab(7);assert.strictEqual(result.ok,true);
 assert.notStrictEqual(sentToken,'token-old','a protocol-requested new execution attempt must receive a fresh STEP_TOKEN');
 assert.strictEqual(stored.plan_7.currentStepToken,sentToken);
 console.log('explicit retry rotates step token OK');
})().catch(e=>{console.error(e);process.exit(1)});
