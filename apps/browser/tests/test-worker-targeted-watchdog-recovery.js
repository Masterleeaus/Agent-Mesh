const fs=require('fs');const vm=require('vm');const assert=require('assert');
const source=fs.readFileSync('src/lib/service-worker.js','utf8');
let activeTab=8;let tab7={id:7,windowId:1,url:'https://chatgpt.com/c/abc',active:false,frozen:false,discarded:false,autoDiscardable:true,status:'complete'};let sends=0;let reloads=0;const updates=[];
const chrome={
 sidePanel:{setPanelBehavior:async()=>{}},
 runtime:{onMessage:{addListener(){}},sendMessage:async()=>({ok:true}),onStartup:{addListener(){}},onInstalled:{addListener(){}}},
 alarms:{create:async()=>{},get:async()=>({name:'ZIP_POLL',periodInMinutes:1}),onAlarm:{addListener(){}}},
 tabs:{
  query(q,cb){const out=q&&q.active&&q.windowId===1?[{id:activeTab,windowId:1,active:true}]:[];cb&&cb(out);return Promise.resolve(out)},
  get:async id=>id===7?{...tab7}:{id,windowId:1,active:id===activeTab,url:'https://chatgpt.com/c/other',frozen:false,discarded:false,autoDiscardable:true,status:'complete'},
  update:async(id,props)=>{updates.push([id,{...props}]);if(id===7){if(props.autoDiscardable===false)tab7.autoDiscardable=false;if(props.active){activeTab=7;tab7.active=true;}}else if(props.active){activeTab=id;tab7.active=false;}return id===7?{...tab7}:{id,windowId:1,active:true,frozen:false,discarded:false,status:'complete'}},
  reload:async id=>{reloads++;tab7.status='loading';tab7.status='complete';return true},
  sendMessage:async(id,msg)=>{if(id!==7)return{ok:true};sends++;if(sends===1)return{ok:false,reason:'composer-not-found',error:'Could not find the AI chat composer'};if(sends===2||sends===3)throw new Error('Could not establish connection. Receiving end does not exist.');return{ok:true,accepted:true}}
 },
 storage:{local:{get:async()=>({codeePreferences:{recoveryPolicyVersion:2,autoRecoverySweep:true,backgroundWatchdog:true,composerWatchdog:true,focusPulse:true,targetedReload:true,restorePreviousTab:true,preventAutoDiscard:true},codeeState:{},codeeDiagnostics:[]}),set:async()=>{}}}
};
const context={chrome,console:{log(){},warn(){},error(){}},setTimeout(fn){fn();return 1},clearTimeout(){},Map,Set,Promise,Date,Math,URL};vm.runInNewContext(source,context);
(async()=>{
 assert.strictEqual(typeof context.sendContentMessageWithWatchdog,'function','worker must expose targeted content watchdog messaging');
 const result=await context.sendContentMessageWithWatchdog(7,{action:'SEND_PROMPT',prompt:'x'},{allowReload:true});
 assert.strictEqual(result.ok,true,'watchdog must recover the operation');
 assert.strictEqual(reloads,1,'reload must be a last fallback after a focus retry fails');
 assert(updates.some(([id,p])=>id===7&&p.active===true),'watchdog must pulse only the exact target conversation tab');
 assert.strictEqual(activeTab,8,'watchdog must restore the previously active tab');
 console.log('targeted background watchdog focus/reload recovery OK');
})().catch(e=>{console.error(e);process.exit(1)});
