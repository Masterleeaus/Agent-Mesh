const assert = require('assert');
const fs = require('fs');
const vm = require('vm');
const context = vm.createContext({ console, globalThis: {} }); context.globalThis = context;
for (const file of ['src/ai/provider-contract.js','src/ai/ai-provider-registry.js','src/ai/model-registry.js']) vm.runInContext(fs.readFileSync(file,'utf8'), context, {filename:file});
const adapter = {
  id:'test-local', displayName:'Test Local', lifecycle:'LOCAL', transport:'none', metadata:{privacy:{local:true}},
  connect: async()=>({ok:true}), disconnect: async()=>({ok:true}), health: async()=>({state:'READY'}), listModels: async()=>[], getModel: async()=>null,
  getCapabilities: ()=>({text:true}), complete: async()=>({text:'ok'}), stream: async function*(){ yield {text:'ok'}; }, embed: async()=>({vectors:[]}),
  countTokens: ()=>null, estimateCost: ()=>({usd:0}), getQuota: async()=>null, getRateLimits: async()=>null,
  supportsTools: ()=>false, supportsStructuredOutput: ()=>false, supportsVision: ()=>false, supportsReasoning: ()=>false, supportsEmbeddings: ()=>false,
  supportsLongContext: ()=>false, supportsCaching: ()=>false, supportsBatch: ()=>false, supportsFiles: ()=>false
};
assert.strictEqual(context.CodeeAIProviderContract.validateAdapter(adapter).ok, true);
context.CodeeAIProviderRegistry.register(adapter);
assert.strictEqual(context.CodeeAIProviderRegistry.get('test-local').id, 'test-local');
assert.strictEqual(context.CodeeAIProviderRegistry.list().length, 1);
assert(Object.isFrozen(context.CodeeAIProviderRegistry.get('test-local')));
const stored=context.CodeeAIProviderRegistry.get('test-local'); try{stored.metadata.privacy.local=false;}catch{} assert.strictEqual(context.CodeeAIProviderRegistry.get('test-local').metadata.privacy.local,true,'provider metadata must be deeply immutable');
assert.throws(()=>context.CodeeAIProviderRegistry.register({...adapter,id:'bad',complete:null}), /complete/);
context.CodeeAIModelRegistry.upsert({providerId:'test-local',modelId:'qwen:test',displayName:'Qwen Test',lifecycle:'ACTIVE',freeStatus:'LOCAL',contextWindow:32768,maxOutput:4096,capabilities:{coding:true,reasoning:true,tools:false},privacy:{local:true,retention:'NONE'},health:'READY'});
const model=context.CodeeAIModelRegistry.get('test-local','qwen:test');
assert.strictEqual(model.freeStatus,'LOCAL');
assert.strictEqual(model.capabilities.coding,true);
assert(Object.isFrozen(model));
assert.deepStrictEqual(Array.from(context.CodeeAIModelRegistry.list({capability:'coding'}),x=>x.modelId),['qwen:test']);
console.log('AI provider/model registry pass');
