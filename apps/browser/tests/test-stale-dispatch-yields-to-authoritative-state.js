const fs=require('fs');
const vm=require('vm');
const assert=require('assert');
const source=fs.readFileSync('src/lib/service-worker.js','utf8');
let codeeState={plan_7:{stateVersion:2,stateRevision:3,protocolMode:'signature_v2',planId:'plan',runId:'run',plan:[{number:1,text:'one'}],stepIndex:0,dispatchStatus:'pending_send',currentStepId:'step-01',currentStepToken:'token-new',target:{url:'https://chatgpt.com/c/abc',conversationIdentity:'chatgpt:abc'}}};
const supplied={...JSON.parse(JSON.stringify(codeeState.plan_7)),stateRevision:2,currentStepToken:'token-old'};
let sends=0;
const chrome={sidePanel:{setPanelBehavior:async()=>{}},runtime:{onMessage:{addListener(){}},sendMessage:async()=>({ok:true}),onStartup:{addListener(){}},onInstalled:{addListener(){}}},alarms:{create:async()=>{},get:async()=>({periodInMinutes:1}),onAlarm:{addListener(){}}},tabs:{query(_q,cb){cb([]);},get:async()=>({id:7,url:'https://chatgpt.com/c/abc'}),sendMessage:async(_id,msg)=>{if(msg.action==='GET_PAGE_STATE')return {ok:true,versions:[],artifacts:[],hasSubmittedStepToken:false};if(msg.action==='SEND_PROMPT'){sends++;return {ok:true};}return {ok:true};}},storage:{local:{get:async()=>({codeeState:JSON.parse(JSON.stringify(codeeState)),codeeDiagnostics:[]}),set:async(payload)=>{if(payload.codeeState)codeeState=JSON.parse(JSON.stringify(payload.codeeState));}}}};
const context={chrome,console:{log(){},warn(){},error(){}},setTimeout(fn){fn();return 1;},Map,Set,Promise,Date,Math,URL};
vm.runInNewContext(source,context);
(async()=>{
 const result=await context.dispatchCurrentStep(7,supplied);
 assert.strictEqual(result.reason,'state-race','stale dispatch should yield to authoritative state');
 assert.strictEqual(result.pending,true);
 assert.strictEqual(sends,0,'stale dispatch must not submit a prompt');
 assert.strictEqual(codeeState.plan_7.currentStepToken,'token-new','newer authoritative state must remain intact');
 console.log('stale dispatch yields safely to authoritative state OK');
})().catch(e=>{console.error(e);process.exit(1);});
