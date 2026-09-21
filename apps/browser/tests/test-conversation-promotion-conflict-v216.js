const fs=require('fs'),vm=require('vm'),assert=require('assert');
let codeeState={
 plan_10:{stateVersion:2,stateRevision:1,protocolMode:'signature_v2',planId:'A',runId:'rA',plan:[{number:1,text:'x'}],stepIndex:0,dispatchStatus:'pending_send',target:{provider:'chatgpt',conversationIdentity:'chatgpt:page:new-chat:p1',url:'https://chatgpt.com/'}},
 plan_11:{stateVersion:2,stateRevision:1,protocolMode:'signature_v2',planId:'B',runId:'rB',plan:[{number:1,text:'x'}],stepIndex:0,dispatchStatus:'pending_send',target:{provider:'chatgpt',conversationIdentity:'chatgpt:abc',url:'https://chatgpt.com/c/abc'}}
};
const chrome={sidePanel:{setPanelBehavior:async()=>{}},runtime:{onMessage:{addListener(){}},onStartup:{addListener(){}},onInstalled:{addListener(){}},sendMessage:async()=>({})},alarms:{get:async()=>null,create:async()=>{},onAlarm:{addListener(){}}},tabs:{query(_q,cb){cb([])}},storage:{local:{get:async()=>({codeeState:JSON.parse(JSON.stringify(codeeState))}),set:async v=>{codeeState=JSON.parse(JSON.stringify(v.codeeState))}},sync:{get:async()=>({})}}};
const c={chrome,console:{log(){},warn(){},error(){}},setTimeout,clearTimeout,Map,Set,Promise,Date,Math,crypto:{randomUUID:()=> 'x'}};vm.runInNewContext(fs.readFileSync('src/lib/service-worker.js','utf8'),c);
(async()=>{
 const incoming=JSON.parse(JSON.stringify(codeeState.plan_10));
 incoming.target={...incoming.target,url:'https://chatgpt.com/c/abc',conversationIdentity:'chatgpt:abc'};
 const result=await c.updatePlanState(10,incoming);
 assert.strictEqual(result.target.conversationIdentity,'chatgpt:abc','provisional plan should promote to its verified structured identity');
 assert.strictEqual(codeeState.plan_10.target.conversationIdentity,'chatgpt:abc');
 assert.strictEqual(codeeState.plan_11.target.conversationIdentity,'chatgpt:abc','another tab may independently target the same structured conversation');
 console.log('conversation promotion remains identity-bound without global plan mutex');
})().catch(e=>{console.error(e);process.exit(1)});
