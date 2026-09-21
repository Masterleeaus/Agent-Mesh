const fs=require('fs');const vm=require('vm');const assert=require('assert');
const source=fs.readFileSync('src/lib/service-worker.js','utf8');
let sets=0; let codeeState={};
const chrome={sidePanel:{setPanelBehavior:async()=>{}},runtime:{onMessage:{addListener(){}},sendMessage:async()=>({ok:true})},alarms:{create(){},onAlarm:{addListener(){}}},tabs:{query(_q,cb){cb([]);},get:async id=>({id,url:'https://chatgpt.com/c/none'}),sendMessage:async()=>({ok:true})},storage:{local:{get:async()=>({codeeState:JSON.parse(JSON.stringify(codeeState))}),set:async({codeeState:next})=>{sets++;codeeState=JSON.parse(JSON.stringify(next));}}}};
const context={chrome,console:{log(){},warn(){},error(){}},setTimeout(fn){fn();return 1;},Map,Set,Promise,Date,Math,URL,crypto:{randomUUID:()=> 'x'}};
vm.runInNewContext(source,context);
(async()=>{
 const result=await context.handleContentReady(9,[],[],'https://chatgpt.com/c/none');
 assert.strictEqual(result.resumed,false);
 assert.strictEqual(sets,0,'content-ready on a conversation with no plan must not write empty state to storage');
 console.log('content ready without a plan avoids empty storage writes OK');
})().catch(e=>{console.error(e);process.exit(1)});
