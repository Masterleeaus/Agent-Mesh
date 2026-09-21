const fs=require('fs');const vm=require('vm');const assert=require('assert');
const source=fs.readFileSync('src/sidebar/sidebar.js','utf8');
const chrome={runtime:{onMessage:{addListener(){}},sendMessage:async()=>({ok:true})},storage:{local:{get:async()=>({})}},tabs:{onActivated:{addListener(){}},onUpdated:{addListener(){}},onRemoved:{addListener(){}},query:async()=>[]}};const context={chrome,document:{addEventListener(){},getElementById(){return null}},console:{log(){},warn(){},error(){}},Map,Set,Promise,Date,Math,URL};vm.runInNewContext(source,context);
assert.strictEqual(typeof context.isRenderablePlanState,'function','sidebar must validate persisted state before rendering it');
assert.strictEqual(context.isRenderablePlanState({planId:'p',plan:null,stepIndex:0}),false);
assert.strictEqual(context.isRenderablePlanState({planId:'p',plan:[],stepIndex:0}),false);
assert.strictEqual(context.isRenderablePlanState({planId:'p',plan:[{number:1,text:'x'}],stepIndex:99}),false);
assert.strictEqual(context.isRenderablePlanState({planId:'p',plan:[{number:1,text:'x'}],stepIndex:0,dispatchStatus:'pending_send'}),true);
console.log('sidebar rejects malformed persisted plan state before render OK');
