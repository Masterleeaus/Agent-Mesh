const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const source=fs.readFileSync('src/lib/service-worker.js','utf8'); const memory={};
const local={async get(keys){const out={};for(const k of Array.isArray(keys)?keys:[keys]) if(Object.prototype.hasOwnProperty.call(memory,k)) out[k]=memory[k]; return out;},async set(obj){Object.assign(memory,JSON.parse(JSON.stringify(obj)));}};
let listener=null;
const chrome={sidePanel:{setPanelBehavior:async()=>{}},runtime:{onMessage:{addListener(fn){listener=fn;}},sendMessage:async()=>({ok:true}),onStartup:{addListener(){}},onInstalled:{addListener(){}}},alarms:{create:async()=>{},get:async()=>({name:'ZIP_POLL',periodInMinutes:1}),onAlarm:{addListener(){}}},tabs:{query(_q,cb){cb([])},get:async()=>({id:11,url:'https://chatgpt.com/c/test',title:'Test'}),sendMessage:async()=>({ok:true})},storage:{local}};
const c={chrome,console:{log(){},warn(){},error(){}},setTimeout(){return 1},clearTimeout(){},setInterval(){return 1},clearInterval(){},Map,Set,WeakMap,WeakSet,Promise,Date,Math,JSON,Object,Array,String,Number,Boolean,RegExp,Uint32Array,crypto:{randomUUID:()=> 'uuid'}}; c.globalThis=c; vm.createContext(c);
c.importScripts=(...urls)=>{for(const u of urls){const f=path.resolve('src/lib',u);vm.runInContext(fs.readFileSync(f,'utf8'),c,{filename:f});}};
vm.runInContext(source,c,{filename:'service-worker.js'});
(async()=>{
  const payload=await c.getCapabilityRegistryPayload();
  const browser=payload.registry.capabilities.filter(row=>row.pack==='codee-browser-control-engine');
  assert.strictEqual(browser.length,40);
  assert.strictEqual(payload.browser.capabilities,40);
  assert(payload.browser.implemented > 0);
  const status=await c.getBrowserStatus();
  assert.strictEqual(status.registered,true);
  assert.strictEqual(status.contractOnly + status.implemented,40);
  assert.strictEqual(status.executionEnabled,true);
  assert.strictEqual(status.manifestPermissionsActivated,true);
  assert(listener,'service worker message listener must be installed');
  const response=await new Promise((resolve,reject)=>{
    const keep=listener({action:'GET_BROWSER_STATUS'},{},resolve);
    assert.strictEqual(keep,true);
    setTimeout(()=>reject(new Error('GET_BROWSER_STATUS timed out')),1000);
  });
  assert.strictEqual(response.ok,true);
  assert.strictEqual(response.total,40);
  console.log('Browser capability contract is live in service worker without execution authority');
})().catch(e=>{console.error(e);process.exit(1)});
