const fs = require('fs');
const vm = require('vm');
const assert = require('assert');
const source = fs.readFileSync('src/lib/service-worker.js','utf8');
let codeeState={plan_7:{planId:'p7',plan:[]},plan_8:{planId:'p8',plan:[]}};
let pendingGets=[];
let synchronized=true;
const local={
  async get(){
    const snapshot=JSON.parse(JSON.stringify(codeeState));
    if (!synchronized) return {codeeState:snapshot};
    return new Promise(resolve=>{
      pendingGets.push(()=>resolve({codeeState:snapshot}));
      if (pendingGets.length===2) { const list=pendingGets; pendingGets=[]; synchronized=false; list.forEach(fn=>fn()); }
    });
  },
  async set({codeeState:next}) { codeeState=JSON.parse(JSON.stringify(next)); }
};
const chrome={sidePanel:{setPanelBehavior:async()=>{}},runtime:{onMessage:{addListener(){}},sendMessage:async()=>{}},alarms:{create(){},onAlarm:{addListener(){}}},tabs:{query(_q,cb){cb([]);},sendMessage:async()=>({ok:true})},storage:{sync:{get:async()=>({})},local}};
const context={chrome,console:{log(){},warn(){},error(){}},setTimeout(fn){fn();return 1;},Map,Set,Promise,Date,Math};
vm.runInNewContext(source,context);
(async()=>{
  const p7={planId:'p7',plan:[],marker:'updated-7'};
  const p8={planId:'p8',plan:[],marker:'updated-8'};
  await Promise.all([context.updatePlanState(7,p7),context.updatePlanState(8,p8)]);
  assert.strictEqual(codeeState.plan_7.marker,'updated-7');
  assert.strictEqual(codeeState.plan_8.marker,'updated-8',
    'concurrent worker updates on different tabs must not clobber one another');
  console.log('worker multi-tab storage writes are serialized OK');
})().catch(error=>{console.error(error);process.exit(1);});
