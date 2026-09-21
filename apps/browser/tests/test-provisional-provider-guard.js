const fs=require('fs');const vm=require('vm');const assert=require('assert');
const source=fs.readFileSync('src/lib/service-worker.js','utf8');
let liveUrl='https://claude.ai/new';
const chrome={sidePanel:{setPanelBehavior:async()=>{}},runtime:{onMessage:{addListener(){}},sendMessage:async()=>{}},alarms:{create(){},onAlarm:{addListener(){}}},tabs:{query(_q,cb){cb([])},get:async id=>({id,url:liveUrl})},storage:{local:{get:async()=>({codeeState:{}}),set:async()=>{}}}};
const context={chrome,console:{log(){},warn(){},error(){}},Map,Set,Promise,Date,Math,URL};vm.runInNewContext(source,context);
(async()=>{
 const plan={target:{url:'https://chatgpt.com/'}};
 let threw=false;try{await context.validateTargetConversation(7,plan)}catch(e){threw=true;assert(/provider|conversation/i.test(e.message));}
 assert.strictEqual(threw,true,'a provisional ChatGPT plan must never escape to Claude in the same tab');
 console.log('provisional provider boundary guard OK');
})().catch(e=>{console.error(e);process.exit(1)});
