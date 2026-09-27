const assert=require('assert');const fs=require('fs'),vm=require('vm');
const c={console};c.globalThis=c;vm.createContext(c);
for(const f of ['src/ai/provider-contract.js','src/ai/ai-provider-registry.js','src/ai/intelligence-catalogue.js','src/ai/adapters/browser-local-model-adapter.js'])vm.runInContext(fs.readFileSync(f,'utf8'),c,{filename:f});
(async()=>{
 let calls=0;const runtime={health:async()=>({health:'healthy',webgpu:true}),generate:async(req,opt)=>{calls++;assert.equal(req.prompt,'summarize');assert.equal(opt.provider,'browser-local-model');return {text:'local result',model:'webllm-test',request_id:'r1',runtime:'webllm',resource_profile:{tier:'gpu'},structurally_verified:true,authority:false};}};
 const a=c.CodeeBrowserLocalModelAdapter.create({runtime});assert(c.CodeeAIProviderContract.validateAdapter(a).ok);c.CodeeAIProviderRegistry.register(a);
 const row=c.CodeeIntelligenceCatalogue.get('browser-local-model');assert(row);assert.equal(row.locality,'ON_DEVICE');assert(['browser-model-runtime-adapter','browser-model-runtime'].includes(row.transport));
 const out=await a.complete({task:'summarize'});assert.equal(out.response,'local result');assert.equal(out.cost.usd,0);assert.equal(out.authority,false);assert.equal(calls,1);
 const hostile=c.CodeeBrowserLocalModelAdapter.create({runtime:{generate:async()=>({text:'x',authority:true})}});await assert.rejects(()=>hostile.complete({task:'x'}),/authority-violation/);
 console.log('PASS browser local WebLLM/WebGPU provider convergence');
})().catch(e=>{console.error(e);process.exit(1)});
