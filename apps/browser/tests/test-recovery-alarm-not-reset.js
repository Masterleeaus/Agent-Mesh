const fs=require('fs');const vm=require('vm');const assert=require('assert');
const source=fs.readFileSync('src/lib/service-worker.js','utf8');
let creates=0;const alarms={async get(name){assert.strictEqual(name,'ZIP_POLL');return{name:'ZIP_POLL',periodInMinutes:1}},async create(){creates++},onAlarm:{addListener(){}}};
const chrome={sidePanel:{setPanelBehavior:async()=>{}},runtime:{onMessage:{addListener(){}},sendMessage:async()=>{}},alarms,tabs:{query(_q,cb){cb([])}},storage:{local:{get:async()=>({codeeState:{}}),set:async()=>{}}}};
const context={chrome,console:{log(){},warn(){},error(){}},Map,Set,Promise,Date,Math,URL};vm.runInNewContext(source,context);
(async()=>{await new Promise(r=>setImmediate(r));assert.strictEqual(creates,0,'worker startup must not reset an already-scheduled one-minute recovery alarm');console.log('existing recovery alarm is not reset on worker wake OK')})().catch(e=>{console.error(e);process.exit(1)});
