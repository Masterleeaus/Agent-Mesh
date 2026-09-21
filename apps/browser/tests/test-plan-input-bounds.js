const fs=require('fs');const vm=require('vm');const assert=require('assert');
const source=fs.readFileSync('src/sidebar/sidebar.js','utf8');
const chrome={runtime:{onMessage:{addListener(){}},sendMessage:async()=>({ok:true})},storage:{local:{get:async()=>({})}},tabs:{onActivated:{addListener(){}},onUpdated:{addListener(){}},onRemoved:{addListener(){}},query:async()=>[]}};const context={chrome,document:{addEventListener(){},getElementById(){return null}},console:{log(){},warn(){},error(){}},Map,Set,Promise,Date,Math,URL,crypto:{randomUUID:()=> 'x'}};vm.runInNewContext(source,context);
assert.strictEqual(typeof context.validatePlanInput,'function','sidebar must expose plan input bounds validation');
let result=context.validatePlanInput('x'.repeat(1024*1024+1),[{number:1,text:'x'}]);assert.strictEqual(result.ok,false,'oversized pasted plans must be rejected before storage');
const many=Array.from({length:501},(_,i)=>({number:i+1,text:`s${i}`}));result=context.validatePlanInput('small',many);assert.strictEqual(result.ok,false,'pathological step counts must be rejected before UI/storage overload');
assert.strictEqual(context.validatePlanInput('small',[{number:1,text:'ok'}]).ok,true);
console.log('plan input size/step bounds OK');
