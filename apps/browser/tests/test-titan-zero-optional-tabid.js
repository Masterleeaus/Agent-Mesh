const fs=require('fs'),vm=require('vm'),assert=require('assert');const source=fs.readFileSync('src/lib/service-worker.js','utf8');
const chrome={sidePanel:{setPanelBehavior:async()=>{}},runtime:{onMessage:{addListener(){}},sendMessage:async()=>({ok:true}),onStartup:{addListener(){}},onInstalled:{addListener(){}}},alarms:{create:async()=>{},get:async()=>({periodInMinutes:1}),onAlarm:{addListener(){}}},tabs:{query(_q,cb){cb([])},get:async()=>({url:'https://chatgpt.com/c/a'}),sendMessage:async()=>({ok:true})},storage:{local:{get:async()=>({}),set:async()=>{}}}};
const c={chrome,console:{log(){},warn(){},error(){}},Map,Set,Promise,Date,Math,JSON,setTimeout,importScripts(){}};c.globalThis=c;vm.createContext(c);vm.runInContext(source,c);
assert.strictEqual(typeof c.normalizeOptionalTabId,'function','worker must expose a strict optional tab-id normalizer');
for(const value of [undefined,null,'',false,-1,'-1','abc',1.2])assert.strictEqual(c.normalizeOptionalTabId(value),null,`must reject ${String(value)}`);
assert.strictEqual(c.normalizeOptionalTabId(0),0);assert.strictEqual(c.normalizeOptionalTabId('12'),12);
console.log('Titan Zero optional tab IDs normalize without null-to-zero coercion');
