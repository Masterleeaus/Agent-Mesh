const fs=require('fs'),vm=require('vm'),assert=require('assert');
const source=fs.readFileSync('src/lib/service-worker.js','utf8');
let storage={codeePreferences:{titanZero:{enabled:true},repository:{enabled:true}},codeeTitanZeroAnalysis:{},codeeRepositoryAnalysis:{},codeeState:{}};
const clone=x=>x===undefined?undefined:JSON.parse(JSON.stringify(x));
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const chrome={sidePanel:{setPanelBehavior:async()=>{}},runtime:{onMessage:{addListener(){}},sendMessage:async()=>({ok:true}),onStartup:{addListener(){}},onInstalled:{addListener(){}}},alarms:{create:async()=>{},get:async()=>({periodInMinutes:1}),onAlarm:{addListener(){}}},tabs:{query(_q,cb){cb([])},get:async()=>({url:'https://chatgpt.com/c/a'}),sendMessage:async()=>({ok:true})},storage:{local:{get:async keys=>{await wait(8);const out={};for(const k of keys||[])out[k]=clone(storage[k]);return out;},set:async payload=>{await wait(4);Object.assign(storage,clone(payload));}}}};
const c={chrome,console:{log(){},warn(){},error(){}},Map,Set,Promise,Date,Math,JSON,setTimeout,clearTimeout,importScripts(){}};c.globalThis=c;vm.createContext(c);vm.runInContext(source,c);
c.CodeeCapabilityRegistry={};
c.CodeeTitanZeroHostIntegration={normalizeSettings:v=>({enabled:v?.enabled!==false}),register:()=>({})};
c.CodeeRepositoryHostIntegration={normalizeSettings:v=>({enabled:v?.enabled!==false}),register:()=>({})};
(async()=>{
  await Promise.all([c.updateTitanZeroSettings({enabled:false}),c.updateRepositorySettings({enabled:false})]);
  assert.strictEqual(storage.codeePreferences.titanZero.enabled,false,'concurrent repository update must not restore old Titan settings');
  assert.strictEqual(storage.codeePreferences.repository.enabled,false,'concurrent Titan update must not restore old repository settings');
  console.log('Concurrent capability preference updates preserve both settings');
})().catch(e=>{console.error(e);process.exit(1)});
