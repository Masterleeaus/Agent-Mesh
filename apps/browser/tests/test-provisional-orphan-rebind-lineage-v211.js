const fs=require('fs'),vm=require('vm'),assert=require('assert');
const source=fs.readFileSync('src/lib/service-worker.js','utf8');
let codeeState={plan_7:{stateVersion:2,protocolMode:'signature_v2',planId:'p',runId:'r',plan:[{number:1,text:'one'}],stepIndex:0,dispatchStatus:'awaiting_artifact',target:{provider:'ChatGPT',url:'https://chatgpt.com/',conversationIdentity:'chatgpt:page:new-chat:origin'}}};
const chrome={sidePanel:{setPanelBehavior:async()=>{}},runtime:{onMessage:{addListener(){}},sendMessage:async()=>({ok:true}),onStartup:{addListener(){}},onInstalled:{addListener(){}}},alarms:{create(){},get:async()=>null,onAlarm:{addListener(){}}},tabs:{query(_q,cb){cb&&cb([]);return Promise.resolve([])},async get(id){if(id===7)throw new Error('gone');return{id,url:'https://chatgpt.com/c/other'};}},storage:{local:{get:async()=>({codeeState:JSON.parse(JSON.stringify(codeeState))}),set:async({codeeState:next})=>{codeeState=JSON.parse(JSON.stringify(next));}}}};
const c={chrome,console:{log(){},warn(){},error(){}},setTimeout(fn){fn();return 1},clearTimeout(){},Map,Set,Promise,Date,Math,URL};vm.runInNewContext(source,c);
(async()=>{
  const unrelated=await c.rebindOrphanedPlanToTab(9,'https://chatgpt.com/c/other','chatgpt:page:new-chat:different','chatgpt:other');
  assert.strictEqual(unrelated.rebound,false,'orphaned provisional plan must not attach to an unrelated structured conversation');
  assert(codeeState.plan_7 && !codeeState.plan_9,'unsafe orphan rebind must leave stored ownership unchanged');

  const related=await c.rebindOrphanedPlanToTab(9,'https://chatgpt.com/c/real','chatgpt:page:new-chat:origin','chatgpt:real');
  assert.strictEqual(related.rebound,true,'matching provisional lineage may rebind to its promoted structured conversation');
  assert(codeeState.plan_9 && !codeeState.plan_7);
  console.log('provisional orphan rebind requires matching lineage OK');
})().catch(e=>{console.error(e);process.exit(1)});
