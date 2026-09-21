const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const source=fs.readFileSync('src/lib/service-worker.js','utf8');
const localMemory={},sessionMemory={};
function area(memory){return {async get(keys){const out={};for(const k of Array.isArray(keys)?keys:[keys])if(Object.prototype.hasOwnProperty.call(memory,k))out[k]=JSON.parse(JSON.stringify(memory[k]));return out;},async set(obj){Object.assign(memory,JSON.parse(JSON.stringify(obj)));},async remove(keys){for(const k of Array.isArray(keys)?keys:[keys])delete memory[k];}};}
let listener=null;
const tabs=new Map([
  [11,{id:11,url:'https://example.com/app',title:'Example'}],
  [12,{id:12,url:'chrome://settings/',title:'Settings'}]
]);
const chrome={sidePanel:{setPanelBehavior:async()=>{}},runtime:{onMessage:{addListener(fn){listener=fn;}},sendMessage:async()=>({ok:true}),onStartup:{addListener(){}},onInstalled:{addListener(){}}},alarms:{create:async()=>{},get:async()=>({name:'ZIP_POLL',periodInMinutes:1}),onAlarm:{addListener(){}}},tabs:{query(_q,cb){cb(Array.from(tabs.values()))},get:async id=>tabs.get(Number(id)),sendMessage:async()=>({ok:true})},storage:{local:area(localMemory),session:area(sessionMemory)}};
const c={chrome,console:{log(){},warn(){},error(){}},setTimeout(){return 1},clearTimeout(){},setInterval(){return 1},clearInterval(){},Map,Set,WeakMap,WeakSet,Promise,Date,Math,JSON,Object,Array,String,Number,Boolean,RegExp,Uint32Array,URL,crypto:{randomUUID:()=> 'uuid'}}; c.globalThis=c; vm.createContext(c);
c.importScripts=(...urls)=>{for(const u of urls){const f=path.resolve('src/lib',u);vm.runInContext(fs.readFileSync(f,'utf8'),c,{filename:f});}};
vm.runInContext(source,c,{filename:'service-worker.js'});
function send(message){return new Promise((resolve,reject)=>{const keep=listener(message,{},resolve);assert.strictEqual(keep,true,`${message.action} must be async`);setTimeout(()=>reject(new Error(`${message.action} timed out`)),1000);});}
(async()=>{
  const status=await send({action:'GET_BROWSER_STATUS'});
  assert.strictEqual(status.ok,true);
  assert.strictEqual(status.executionEnabled,true);
  assert.strictEqual(status.policyImplemented,true);
  assert.strictEqual(status.policy.connectedTabs,0);
  assert.strictEqual(status.policy.sessionStorageAvailable,true);

  const connect=await send({action:'BROWSER_POLICY_CONNECT',tabId:11});
  assert.strictEqual(connect.ok,true);
  assert.strictEqual(connect.record.state,'connected-read');
  let auth=await send({action:'CHECK_BROWSER_CAPABILITY_AUTH',tabId:11,capabilityId:'browser.snapshot'});
  assert.strictEqual(auth.ok,true);
  auth=await send({action:'CHECK_BROWSER_CAPABILITY_AUTH',tabId:11,capabilityId:'browser.click'});
  assert.strictEqual(auth.ok,false);
  assert.strictEqual(auth.reason,'interactive-grant-required');

  const grant=await send({action:'BROWSER_POLICY_GRANT',tabId:11,grant:'interactive',ttlMs:60000});
  assert.strictEqual(grant.ok,true);
  assert.strictEqual(grant.record.state,'connected-interactive');
  auth=await send({action:'CHECK_BROWSER_CAPABILITY_AUTH',tabId:11,capabilityId:'browser.click'});
  assert.strictEqual(auth.ok,true);
  auth=await send({action:'CHECK_BROWSER_CAPABILITY_AUTH',tabId:11,capabilityId:'browser.evaluate'});
  assert.strictEqual(auth.ok,false);

  const dev=await send({action:'BROWSER_POLICY_GRANT',tabId:11,grant:'developer_execute',ttlMs:30000});
  assert.strictEqual(dev.record.state,'developer-evaluate-enabled');
  auth=await send({action:'CHECK_BROWSER_CAPABILITY_AUTH',tabId:11,capabilityId:'browser.evaluate'});
  assert.strictEqual(auth.ok,true);

  const restricted=await send({action:'BROWSER_POLICY_CONNECT',tabId:12});
  assert.strictEqual(restricted.ok,false);
  assert.strictEqual(restricted.reason,'restricted-scheme');

  const tabPolicy=await send({action:'GET_BROWSER_TAB_POLICY',tabId:11});
  assert.strictEqual(tabPolicy.ok,true);
  assert.strictEqual(tabPolicy.record.state,'developer-evaluate-enabled');

  const revoke=await send({action:'BROWSER_POLICY_REVOKE',tabId:11,grant:'developer_execute'});
  assert.strictEqual(revoke.ok,true);
  assert.strictEqual(revoke.record.state,'connected-interactive');
  const disconnect=await send({action:'BROWSER_POLICY_DISCONNECT',tabId:11});
  assert.strictEqual(disconnect.ok,true);
  const after=await send({action:'GET_BROWSER_TAB_POLICY',tabId:11});
  assert.strictEqual(after.record,null);
  console.log('Browser policy is wired through service worker without enabling browser execution');
})().catch(e=>{console.error(e);process.exit(1)});
