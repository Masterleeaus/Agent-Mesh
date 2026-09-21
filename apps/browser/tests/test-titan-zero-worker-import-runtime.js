const fs=require('fs');const path=require('path');const vm=require('vm');const assert=require('assert');
const source=fs.readFileSync('src/lib/service-worker.js','utf8');
const chrome={
 sidePanel:{setPanelBehavior:async()=>{}},
 runtime:{onMessage:{addListener(){}},sendMessage:async()=>({ok:true}),onStartup:{addListener(){}},onInstalled:{addListener(){}}},
 alarms:{create:async()=>{},get:async()=>({name:'ZIP_POLL',periodInMinutes:1}),onAlarm:{addListener(){}}},
 tabs:{query(_q,cb){cb([])},get:async()=>({id:1,url:'https://chatgpt.com/c/a'}),sendMessage:async()=>({ok:true,versions:[],artifacts:[],hasSubmittedStepToken:false})},
 storage:{local:{get:async()=>({codeePreferences:{titanZero:{enabled:true}}}),set:async()=>{}}}
};
const context={chrome,console:{log(){},warn(){},error(){}},setTimeout(fn){fn();return 1;},Map,Set,Promise,Date,Math,JSON,Object,Array,String,Number,Boolean,RegExp};
context.globalThis=context;vm.createContext(context);
context.importScripts=(...urls)=>{for(const url of urls){const file=path.resolve('src/lib',url);vm.runInContext(fs.readFileSync(file,'utf8'),context,{filename:file});}};
vm.runInContext(source,context,{filename:'service-worker.js'});
(async()=>{
 const payload=await context.getCapabilityRegistryPayload();
 assert.strictEqual(payload.registry.prompts.length,89);
 assert.strictEqual(payload.registry.prompts.filter(p=>p.category==='Managers & AI Workforce').length,30);
 assert.strictEqual(payload.registry.skills.length,100);
 assert.strictEqual(payload.registry.skills.filter(p=>p.category==='Managers & AI Workforce').length,34);
 assert.strictEqual(payload.registry.profiles.length,38);
 assert.strictEqual(payload.registry.managers.length,14);
 assert.strictEqual(payload.titanZeroSettings.ignoreExtensions,false);
 assert.strictEqual(payload.titanZeroSettings.includeExtensions,true);
 assert.strictEqual(payload.titanZeroSettings.parseSqlRows,false);
 assert.strictEqual(payload.registry.repositoryCapabilities.length,28);
 assert.strictEqual(payload.repositorySettings.includeExtensions,true);
 assert.strictEqual(payload.repositorySettings.requireVerifiedBackupBeforeMutation,true);
 console.log('Titan Zero worker import/runtime registration OK');
})().catch(e=>{console.error(e);process.exit(1)});
