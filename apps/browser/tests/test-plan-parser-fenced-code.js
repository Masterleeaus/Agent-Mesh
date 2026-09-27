const fs=require('fs');const vm=require('vm');const assert=require('assert');
const source=fs.readFileSync('src/sidebar/sidebar.js','utf8');
const context={console:{log(){},warn(){},error(){}},document:{addEventListener(){},getElementById(){return null;}},chrome:{runtime:{onMessage:{addListener(){}}}},Map,Promise,URL};vm.runInNewContext(source,context);
const markdown=['### Step 1: Implement parser','```text','Step 2: this is example text, not a plan boundary','1. also not a plan step','```','### Step 2: Verify behavior'].join('\n');
const plan=context.parsePlanText(markdown);
assert.strictEqual(plan.length,2,'Step/number markers inside fenced code must not split the plan');
assert(plan[0].text.includes('Step 2: this is example text'),'fenced example should remain inside Step 1 body');
assert(plan[1].text.startsWith('Verify behavior'));
console.log('plan parser respects fenced code boundaries OK');
