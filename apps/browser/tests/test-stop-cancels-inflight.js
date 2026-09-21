const fs=require('fs');const vm=require('vm');const assert=require('assert');
const source=fs.readFileSync('src/lib/service-worker.js','utf8');
let codeeState={plan_7:{stateVersion:2,protocolMode:'signature_v2',planId:'p-stop',runId:'r',plan:[{number:1,text:'one'}],stepIndex:0,knownVersions:[],versions:[],knownArtifactHashes:[],consumedArtifactHashes:[],artifactHistory:[],dispatchStatus:'pending_send',target:{provider:'ChatGPT',url:'https://chatgpt.com/c/right',conversationIdentity:'chatgpt:right'}}};
let releaseSend; const sendGate=new Promise(r=>releaseSend=r);
const chrome={sidePanel:{setPanelBehavior:async()=>{}},runtime:{onMessage:{addListener(){}},sendMessage:async()=>({ok:true})},alarms:{create(){},onAlarm:{addListener(){}}},tabs:{query(_q,cb){cb([]);},get:async()=>({id:7,url:'https://chatgpt.com/c/right'}),async sendMessage(_id,msg){if(msg.action==='GET_PAGE_STATE')return{ok:true,versions:[],artifacts:[]};if(msg.action==='SEND_PROMPT'){await sendGate;return{ok:true};}return{ok:true};}},storage:{sync:{get:async()=>({})},local:{get:async()=>({codeeState:JSON.parse(JSON.stringify(codeeState))}),set:async({codeeState:next})=>{codeeState=JSON.parse(JSON.stringify(next));}}}};
const context={chrome,console:{log(){},warn(){},error(){}},setTimeout(fn){fn();return 1;},Map,Set,Promise,Date,Math,URL,crypto:{randomUUID:()=> 'x'}};
vm.runInNewContext(source,context);
(async()=>{
 const dispatchPromise=context.retryPendingPlanOnTab(7);
 await new Promise(r=>setImmediate(r));
 const stopped=await context.stopPlan(7,'p-stop');
 assert.strictEqual(stopped.ok,true);
 assert.strictEqual(codeeState.plan_7,undefined);
 releaseSend();
 const result=await dispatchPromise;
 assert.strictEqual(result.cancelled,true);
 assert.strictEqual(codeeState.plan_7,undefined,'an in-flight dispatch must not resurrect a plan after Stop');
 console.log('stop cancels in-flight state resurrection OK');
})().catch(e=>{console.error(e);process.exit(1)});
