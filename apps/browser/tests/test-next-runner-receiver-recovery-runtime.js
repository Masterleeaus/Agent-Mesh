'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert');
const source=fs.readFileSync('src/lib/service-worker.js','utf8');
let receiver=false,reloads=0,sends=0;
const chrome={
 sidePanel:{setPanelBehavior:async()=>{}},
 runtime:{onMessage:{addListener(){}},sendMessage:async()=>({ok:true}),onStartup:{addListener(){}},onInstalled:{addListener(){}}},
 alarms:{create:async()=>{},get:async()=>({name:'ZIP_POLL',periodInMinutes:1}),clear:async()=>true,onAlarm:{addListener(){}}},
 windows:{getLastFocused:async()=>({id:1,focused:true}),get:async()=>({id:1,focused:true}),update:async()=>({id:1,focused:true})},
 tabs:{
   get:async id=>({id,windowId:1,url:'https://chatgpt.com/c/abc',active:true,frozen:false,discarded:false,autoDiscardable:false,status:'complete'}),
   query:async()=>[{id:7,windowId:1,active:true}],
   update:async(id)=>({id,windowId:1,url:'https://chatgpt.com/c/abc',active:true,frozen:false,discarded:false,autoDiscardable:false,status:'complete'}),
   reload:async()=>{reloads++;receiver=true;},
   sendMessage:async(_id,msg)=>{
     if(!receiver) throw new Error('Could not establish connection. Receiving end does not exist.');
     if(msg.action==='GET_CODEE_DIAGNOSTICS') return {ok:true,contextValid:true};
     if(msg.action==='SEND_NEXT_NUDGE'){sends++;return {ok:true,accepted:true};}
     return {ok:true,conversationIdentity:'chatgpt:abc'};
   }
 },
 storage:{local:{get:async()=>({codeePreferences:{backgroundWatchdog:false,targetedReload:false,focusPulse:false,restorePreviousTab:true,preventAutoDiscard:true}}),set:async()=>{}}}
};
const context={chrome,console:{log(){},warn(){},error(){}},setTimeout(fn){fn();return 1},clearTimeout(){},Map,Set,Promise,Date,Math,URL};
vm.runInNewContext(source,context);
(async()=>{
 const r=await context.sendContentMessageWithWatchdog(7,{action:'SEND_NEXT_NUDGE',text:'next'},{recoverMissingReceiver:true,allowReload:false,recoveryPreferences:{backgroundWatchdog:false,targetedReload:false,focusPulse:false,restorePreviousTab:true,preventAutoDiscard:true}});
 assert.strictEqual(r.ok,true,'explicit receiver recovery must succeed even when background watchdog is disabled');
 assert.strictEqual(reloads,1,'receiver recovery must reload the bound provider tab exactly once');
 assert.strictEqual(sends,1,'next must be sent once after the recovered receiver acknowledges');
 console.log('Next Runner runtime receiver recovery OK');
})().catch(e=>{console.error(e);process.exit(1)});
