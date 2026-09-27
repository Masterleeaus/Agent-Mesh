const fs=require('fs');const vm=require('vm');const assert=require('assert');
const source=fs.readFileSync('src/lib/service-worker.js','utf8');
let activeTab=8;let tab7={id:7,windowId:1,url:'https://chatgpt.com/c/abc',active:false,frozen:true,discarded:false,autoDiscardable:true,status:'complete'};const updates=[];
const chrome={
 sidePanel:{setPanelBehavior:async()=>{}},
 runtime:{onMessage:{addListener(){}},sendMessage:async()=>({ok:true}),onStartup:{addListener(){}},onInstalled:{addListener(){}}},
 alarms:{create:async()=>{},get:async()=>({name:'ZIP_POLL',periodInMinutes:1}),onAlarm:{addListener(){}}},
 tabs:{
   query(q,cb){const out=q&&q.active&&q.windowId===1?[{id:activeTab,windowId:1,active:true}]:[];if(cb)cb(out);return Promise.resolve(out)},
   get:async id=>id===7?{...tab7}:{id,windowId:1,active:id===activeTab,url:'https://chatgpt.com/c/other',frozen:false,discarded:false,autoDiscardable:true,status:'complete'},
   update:async(id,props)=>{updates.push([id,{...props}]);if(id===7){if(props.autoDiscardable===false)tab7.autoDiscardable=false;if(props.active){activeTab=7;tab7.active=true;tab7.frozen=false;}}else if(props.active){activeTab=id;tab7.active=false;}return id===7?{...tab7}:{id,windowId:1,active:true,frozen:false,discarded:false,status:'complete'}},
   sendMessage:async()=>({ok:true})
 },
 storage:{local:{get:async()=>({codeeState:{},codeeDiagnostics:[]}),set:async()=>{}}}
};
const context={chrome,console:{log(){},warn(){},error(){}},setTimeout(fn){fn();return 1},clearTimeout(){},Map,Set,Promise,Date,Math,URL};vm.runInNewContext(source,context);
(async()=>{
 assert.strictEqual(typeof context.withRunnableConversationTab,'function','worker must expose a background-tab wake wrapper');
 let ran=false;
 const result=await context.withRunnableConversationTab(7,async()=>{ran=true;assert.strictEqual(activeTab,7,'frozen target must be active while the operation runs');return{ok:true}});
 assert.strictEqual(result.ok,true);assert.strictEqual(ran,true);
 assert.strictEqual(tab7.autoDiscardable,false,'active Codee target must be protected from automatic discard');
 assert.deepStrictEqual(updates[0],[7,{autoDiscardable:false}]);
 assert.deepStrictEqual(updates[1],[7,{active:true,autoDiscardable:false}]);
 assert.deepStrictEqual(updates[updates.length-1],[8,{active:true}],'previous active tab must be restored after the wake pulse');
 console.log('background frozen tab wake pulse and restore OK');
})().catch(e=>{console.error(e);process.exit(1)});
