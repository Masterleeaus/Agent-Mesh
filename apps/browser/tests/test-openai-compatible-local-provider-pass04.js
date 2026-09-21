const fs=require('fs'),vm=require('vm'),assert=require('assert');
const calls=[];
const c={URL,console,CodeeApprovedNetworkTransport:{
 getJson:async(url,opt)=>{calls.push(['GET',url,opt]);return {ok:true,status:200,json:{data:[{id:'qwen2.5-coder:7b'},{id:'tiny'}]}}},
 postJson:async(url,body,opt)=>{calls.push(['POST',url,body,opt]);return {ok:true,status:200,json:{id:'req-1',model:body.model,choices:[{message:{content:'local ok'},finish_reason:'stop'}],usage:{prompt_tokens:3,completion_tokens:2}}}}
}};c.globalThis=c;vm.createContext(c);
for(const f of ['src/ai/provider-contract.js','src/ai/ai-provider-registry.js','src/ai/adapters/openai-compatible-local-adapter.js'])vm.runInContext(fs.readFileSync(f,'utf8'),c,{filename:f});
(async()=>{
 assert.deepStrictEqual(Object.keys(c.CodeeOpenAICompatibleLocalAdapter.PRESETS),['ollama','lmstudio','llamacpp','vllm','custom']);
 const a=c.CodeeOpenAICompatibleLocalAdapter.create({preset:'lmstudio'});assert.equal(a.id,'lmstudio');assert.equal(a.lifecycle,'LOCAL');assert.equal(a.metadata.locality,'LOCAL_DEVICE');
 assert(c.CodeeAIProviderContract.validateAdapter(a).ok);c.CodeeAIProviderRegistry.register(a);
 const models=await a.listModels();assert.equal(models.length,2);assert.equal(a.getSelectedModel(),'qwen2.5-coder:7b');
 const out=await a.complete({task:'hello',maximumOutput:100,temperature:.1});assert.equal(out.response,'local ok');assert.equal(out.cost.usd,0);assert(calls.some(x=>x[1]==='http://127.0.0.1:1234/v1/models'));assert(calls.some(x=>x[1]==='http://127.0.0.1:1234/v1/chat/completions'));
 const hosted=c.CodeeOpenAICompatibleLocalAdapter.create({id:'my-host',baseUrl:'https://ai.example.test/v1',locality:'CUSTOMER_HOSTED',apiKey:'secret'});assert.equal(hosted.metadata.locality,'CUSTOMER_HOSTED');assert.equal(hosted.metadata.customerHosted,true);assert(!JSON.stringify(hosted.metadata).includes('secret'));
 console.log('PASS OpenAI-compatible local provider pass04');
})().catch(e=>{console.error(e);process.exit(1)});
