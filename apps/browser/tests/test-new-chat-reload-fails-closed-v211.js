const fs=require('fs'),vm=require('vm'),assert=require('assert');
const source=fs.readFileSync('src/lib/service-worker.js','utf8');
let reloads=0;
const chrome={
  sidePanel:{setPanelBehavior:async()=>{}},
  runtime:{onMessage:{addListener(){}},sendMessage:async()=>({ok:true}),onStartup:{addListener(){}},onInstalled:{addListener(){}}},
  alarms:{create:async()=>{},get:async()=>null,onAlarm:{addListener(){}}},
  tabs:{
    query(_q,cb){cb&&cb([]);return Promise.resolve([])},
    get:async id=>({id,windowId:1,url:'https://chatgpt.com/',active:true,frozen:false,discarded:false,status:'complete',autoDiscardable:false}),
    reload:async()=>{reloads++},
    sendMessage:async()=>{throw new Error('Could not establish connection. Receiving end does not exist.')}
  },
  storage:{local:{get:async()=>({codeeState:{},codeeDiagnostics:[]}),set:async()=>{}}}
};
const c={chrome,console:{log(){},warn(){},error(){}},setTimeout(fn){fn();return 1},clearTimeout(){},Map,Set,Promise,Date,Math,URL};
vm.runInNewContext(source,c);
(async()=>{
  const result=await c.recoverMissingContentReceiver(7);
  assert.strictEqual(reloads,0,'receiver recovery must never reload a provider new-chat/root URL');
  assert.strictEqual(result.ok,false);
  assert.match(String(result.reason||''),/new-chat|unstable|identity/i,'failure should explain that the target lacks a stable conversation identity');
  console.log('new-chat receiver recovery fails closed without reload OK');
})().catch(e=>{console.error(e);process.exit(1)});
