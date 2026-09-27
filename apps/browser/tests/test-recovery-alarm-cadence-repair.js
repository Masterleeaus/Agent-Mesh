const fs=require('fs');const vm=require('vm');const assert=require('assert');
const source=fs.readFileSync('src/lib/service-worker.js','utf8');let created=[];
const chrome={sidePanel:{setPanelBehavior:async()=>{}},runtime:{onMessage:{addListener(){}},sendMessage:async()=>{}},alarms:{get:async()=>({name:'ZIP_POLL',periodInMinutes:5}),create:async(name,info)=>created.push({name,info}),onAlarm:{addListener(){}}},tabs:{query(_q,cb){cb([])}},storage:{local:{get:async()=>({codeeState:{}}),set:async()=>{}}}};
const context={chrome,console:{log(){},warn(){},error(){}},Map,Set,Promise,Date,Math,URL};vm.runInNewContext(source,context);
(async()=>{await new Promise(r=>setImmediate(r));assert.strictEqual(created.length,1,'wrong-cadence recovery alarm must be repaired');assert.strictEqual(created[0].info.periodInMinutes,1);console.log('wrong recovery alarm cadence is repaired OK')})().catch(e=>{console.error(e);process.exit(1)});
