const fs=require('fs'),vm=require('vm'),assert=require('assert');
let codeeState={};
const chrome={
  sidePanel:{setPanelBehavior:async()=>{}},
  runtime:{onMessage:{addListener(){}},onStartup:{addListener(){}},onInstalled:{addListener(){}},sendMessage:async()=>({})},
  alarms:{get:async()=>null,create:async()=>{},clear:async()=>true,onAlarm:{addListener(){}}},
  tabs:{query(_q,cb){cb([])},get:async id=>({id,url:'https://chatgpt.com/c/abc',title:'abc'})},
  storage:{local:{get:async()=>({codeeState:JSON.parse(JSON.stringify(codeeState))}),set:async v=>{if(v.codeeState!==undefined)codeeState=JSON.parse(JSON.stringify(v.codeeState));}},sync:{get:async()=>({})}}
};
const c={chrome,console:{log(){},warn(){},error(){}},setTimeout,clearTimeout,Map,Set,Promise,Date,Math,crypto:{randomUUID:()=> 'x'}};
vm.runInNewContext(fs.readFileSync('src/lib/service-worker.js','utf8'),c);
function p(id){return {stateVersion:2,protocolMode:'signature_v2',planId:id,runId:`r-${id}`,plan:[{number:1,text:`${id}-1`}],stepIndex:0,dispatchStatus:'pending_send',target:{provider:'chatgpt',conversationIdentity:'chatgpt:abc',url:'https://chatgpt.com/c/abc'}}}
(async()=>{
  let r=await c.savePlanState(10,p('A')); assert.strictEqual(r.ok,true); assert.strictEqual(r.queued,false);
  r=await c.savePlanState(10,p('B')); assert.strictEqual(r.ok,true); assert.strictEqual(r.queued,true); assert.strictEqual(r.queuePosition,1);
  r=await c.savePlanState(10,p('C')); assert.strictEqual(r.ok,true); assert.strictEqual(r.queued,true); assert.strictEqual(r.queuePosition,2);
  assert.strictEqual(codeeState.plan_10.planId,'A');
  assert.deepStrictEqual(codeeState.planQueue_10.map(x=>x.planId),['B','C']);
  codeeState.plan_10.dispatchStatus='complete';
  r=await c.promoteNextQueuedPlan(10,{dispatch:false}); assert.strictEqual(r.promoted,true); assert.strictEqual(codeeState.plan_10.planId,'B');
  assert.deepStrictEqual(codeeState.planQueue_10.map(x=>x.planId),['C']);
  r=await c.stopPlan(10,'B'); assert.strictEqual(r.ok,true); assert.strictEqual(r.promoted,true); assert.strictEqual(codeeState.plan_10.planId,'C');
  assert.deepStrictEqual(codeeState.planQueue_10,[]);
  const archived=Object.values(codeeState).filter(v=>v&&typeof v==='object'&&!Array.isArray(v)&&v.planId==='A');
  assert.ok(archived.length>=1,'completed active plan must be archived before queue promotion');
  console.log('PASS multi-plan queue preserves and promotes plans');
})().catch(e=>{console.error(e);process.exit(1)});
