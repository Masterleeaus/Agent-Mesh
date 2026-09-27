const fs=require('fs'),vm=require('vm'),assert=require('assert');
const fake={availability:async()=> 'available',create:async opts=>({prompt:async text=>`device:${text}:${opts.initialPrompts?.[0]?.content||''}`,destroy(){}})};
const c={console};c.globalThis=c;vm.createContext(c);
for(const f of ['src/ai/provider-contract.js','src/ai/ai-provider-registry.js','src/ai/intelligence-catalogue.js','src/ai/adapters/chrome-prompt-adapter.js'])vm.runInContext(fs.readFileSync(f,'utf8'),c,{filename:f});
(async()=>{
 assert.equal(await c.CodeeChromePromptAdapter.isAvailable(fake),true);
 const a=c.CodeeChromePromptAdapter.create({runtime:fake});
 assert(c.CodeeAIProviderContract.validateAdapter(a).ok);assert.equal(a.lifecycle,'LOCAL');assert.equal(a.metadata.locality,'ON_DEVICE');assert.equal(a.metadata.authority,false);
 c.CodeeAIProviderRegistry.register(a);
 const row=c.CodeeIntelligenceCatalogue.get('chrome-prompt-api');assert(row);assert.equal(row.locality,'ON_DEVICE');
 const out=await a.complete({task:'hello',systemInstructions:'safe'});assert.equal(out.response,'device:hello:safe');assert.equal(out.cost.usd,0);assert.equal(out.authority,false);
 assert.equal(a.supportsTools(),false);assert.equal(a.supportsEmbeddings(),false);
 console.log('PASS Chrome Prompt API governed provider pass05');
})().catch(e=>{console.error(e);process.exit(1)});
