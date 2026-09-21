const fs=require('fs'),vm=require('vm'),assert=require('assert');let codeeState={};const chrome={sidePanel:{setPanelBehavior:async()=>{}},runtime:{onMessage:{addListener(){}},onStartup:{addListener(){}},onInstalled:{addListener(){}},sendMessage:async()=>({})},alarms:{get:async()=>null,create:async()=>{},onAlarm:{addListener(){}}},tabs:{query(_q,cb){cb([])}},storage:{local:{get:async()=>({codeeState:JSON.parse(JSON.stringify(codeeState))}),set:async v=>{codeeState=JSON.parse(JSON.stringify(v.codeeState))}},sync:{get:async()=>({})}}};const c={chrome,console:{log(){},warn(){},error(){}},setTimeout,clearTimeout,Map,Set,Promise,Date,Math,crypto:{randomUUID:()=> 'x'}};vm.runInNewContext(fs.readFileSync('src/lib/service-worker.js','utf8'),c);function p(id,conversation='abc'){return {stateVersion:2,protocolMode:'signature_v2',planId:id,runId:`r-${id}`,plan:[{number:1,text:'x'}],stepIndex:0,dispatchStatus:'pending_send',target:{provider:'chatgpt',conversationIdentity:`chatgpt:${conversation}`,url:`https://chatgpt.com/c/${conversation}`}}}
(async()=>{
  assert.strictEqual((await c.savePlanState(10,p('A','abc'))).ok,true);
  assert.strictEqual((await c.savePlanState(11,p('B','def'))).ok,true,'different conversations must run concurrently');
  assert.strictEqual((await c.savePlanState(12,p('C','ghi'))).ok,true,'a third conversation must run concurrently');
  assert.strictEqual((await c.savePlanState(13,p('D','abc'))).ok,true,'conversation identity must not be a global mutex across tabs');
  const sameTab=await c.savePlanState(10,p('E','abc'));
  assert.strictEqual(sameTab.ok,true,'a second plan in the same tab should be queued, not overwrite or fail');
  assert.strictEqual(sameTab.queued,true,'same-tab second plan must enter the durable queue');
  assert.strictEqual(codeeState.plan_10.planId,'A','current active plan must remain unchanged');
  assert.strictEqual(codeeState.planQueue_10.length,1,'queued plan must be retained');
  assert.strictEqual(codeeState.planQueue_10[0].planId,'E');
  assert.strictEqual(Object.keys(codeeState).filter(k=>/^plan_-?\d+$/.test(k)).length,4);
  console.log('multi active plans across tabs plus same-tab queue OK');
})().catch(e=>{console.error(e);process.exit(1)});
