const fs=require('fs'),vm=require('vm'),assert=require('assert');
const c={console};c.globalThis=c;vm.createContext(c);
for(const f of ['src/ai/provider-contract.js','src/ai/ai-provider-registry.js','src/ai/intelligence-catalogue.js','src/ai/adapters/browser-local-model-adapter.js'])vm.runInContext(fs.readFileSync(f,'utf8'),c,{filename:f});
(async()=>{
 const calls=[];const runtime={health:async()=>({health:'healthy'}),generate:async(req,opt)=>{calls.push({req,opt});return {request_id:opt.requestId,text:'local:'+req.prompt,model:'webllm-test',finish_reason:'stop',usage:{output_tokens:2},runtime:'webgpu',structurally_verified:true,authority:false,execution_authority:false,verification_authority:false,canonical_authority:false};}};
 const a=c.CodeeBrowserLocalModelAdapter.create({runtimeAdapter:runtime});
 assert(c.CodeeAIProviderContract.validateAdapter(a).ok);assert.equal(a.lifecycle,'LOCAL');assert.equal(a.metadata.locality,'ON_DEVICE');assert.equal(a.metadata.authority,false);
 c.CodeeAIProviderRegistry.register(a);const row=c.CodeeIntelligenceCatalogue.get('browser-local-model');assert(row);assert.equal(row.locality,'ON_DEVICE');
 const out=await a.complete({requestId:'r6',task:'hello'});assert.equal(out.response,'local:hello');assert.equal(out.model,'webllm-test');assert.equal(out.cost.usd,0);assert.equal(out.authority,false);assert.equal(calls.length,1);assert.equal(calls[0].opt.provider,'browser-local-model');
 assert(a.metadata.reuses.includes('BrowserModelScheduler'));assert(a.metadata.reuses.includes('BrowserModelResourceRouter'));
 let rejected=false;try{await c.CodeeBrowserLocalModelAdapter.create({runtimeAdapter:{generate:async()=>({text:'bad',authority:true})}}).complete({task:'x'});}catch(e){rejected=/authority/.test(e.message)}assert(rejected);
 console.log('PASS Browser local WebLLM/WebGPU governed provider pass06');
})().catch(e=>{console.error(e);process.exit(1)});
