const fs=require('fs'),vm=require('vm'),assert=require('assert');
const source=fs.readFileSync('src/lib/service-worker.js','utf8');
const chrome={sidePanel:{setPanelBehavior:async()=>{}},runtime:{onMessage:{addListener(){}},sendMessage:async()=>({ok:true}),onStartup:{addListener(){}},onInstalled:{addListener(){}}},alarms:{create(){},get:async()=>null,onAlarm:{addListener(){}}},tabs:{query(_q,cb){cb&&cb([]);return Promise.resolve([])}},storage:{local:{get:async()=>({codeeState:{}}),set:async()=>{}}}};
const c={chrome,console:{log(){},warn(){},error(){}},setTimeout(fn){fn();return 1},clearTimeout(){},Map,Set,Promise,Date,Math,URL};
vm.runInNewContext(source,c);
(async()=>{
  const plan={target:{provider:'ChatGPT',url:'https://chatgpt.com/',conversationIdentity:'chatgpt:page:new-chat:origin'}};
  const wrong=await c.reconcileConversationIdentity(plan,'https://chatgpt.com/c/other','chatgpt:page:new-chat:different','chatgpt:other');
  assert.strictEqual(wrong.ok,false,'a provisional plan must not promote into an unrelated structured conversation');
  assert.strictEqual(plan.target.conversationIdentity,'chatgpt:page:new-chat:origin','failed promotion must preserve the original binding');

  const correctPlan={target:{provider:'ChatGPT',url:'https://chatgpt.com/',conversationIdentity:'chatgpt:page:new-chat:origin'}};
  const correct=await c.reconcileConversationIdentity(correctPlan,'https://chatgpt.com/c/real','chatgpt:page:new-chat:origin','chatgpt:real');
  assert.strictEqual(correct.ok,true,'matching provisional lineage may promote to the newly structured conversation');
  assert.strictEqual(correctPlan.target.conversationIdentity,'chatgpt:real');
  console.log('provisional promotion requires matching lineage OK');
})().catch(e=>{console.error(e);process.exit(1)});
