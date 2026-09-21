const assert=require('assert'),fs=require('fs'),vm=require('vm');
const c=vm.createContext({console,globalThis:{}});c.globalThis=c;
for(const f of ['src/ai/ai-sanitizer.js','src/ai/ai-audit-ledger.js','src/ai/ai-request-contract.js','src/ai/ai-response-contract.js','src/ai/provider-contract.js','src/ai/ai-provider-registry.js','src/ai/model-registry.js','src/ai/provider-gateway.js'])vm.runInContext(fs.readFileSync(f,'utf8'),c,{filename:f});
function adapter(id,lifecycle,caps={}){return {id,displayName:id,lifecycle,transport:'none',connect:async()=>({ok:true}),disconnect:async()=>({ok:true}),health:async()=>({state:'READY'}),listModels:async()=>[],getModel:async()=>null,getCapabilities:()=>caps,complete:async()=>({response:id,model:'m'}),stream:async function*(){},embed:async()=>({vectors:[]}),countTokens:()=>null,estimateCost:()=>({usd:lifecycle==='PAID'?1:0}),getQuota:async()=>null,getRateLimits:async()=>null,supportsTools:()=>Boolean(caps.tools),supportsStructuredOutput:()=>Boolean(caps.structured_output),supportsVision:()=>Boolean(caps.vision),supportsReasoning:()=>Boolean(caps.reasoning),supportsEmbeddings:()=>Boolean(caps.embeddings),supportsLongContext:()=>Boolean(caps.long_context),supportsCaching:()=>Boolean(caps.caching),supportsBatch:()=>Boolean(caps.batch),supportsFiles:()=>Boolean(caps.files)};}
c.CodeeProviderGateway.registerProvider(adapter('paid','PAID',{text:true,reasoning:true}));
c.CodeeProviderGateway.registerProvider(adapter('free','FREE',{text:true}));
c.CodeeProviderGateway.registerProvider(adapter('local','LOCAL',{text:true,reasoning:true,structured_output:true}));
(async()=>{
 const freeOnly=await c.CodeeProviderGateway.request({requestId:'free-only',task:'x',privacyLevel:'INTERNAL',costPolicy:{mode:'FREE_ONLY'},requiredCapabilities:['reasoning']});
 assert.strictEqual(freeOnly.ok,true); assert.notStrictEqual(freeOnly.provider,'paid','FREE_ONLY must never select paid provider');
 assert.strictEqual(freeOnly.provider,'local','capability matching must skip free provider without reasoning');
 const secret=await c.CodeeProviderGateway.request({requestId:'secret',task:'x',privacyLevel:'SECRET',preferredProviders:['paid','local'],requiredCapabilities:['structured_output']});
 assert.strictEqual(secret.provider,'local','SECRET must stay on LOCAL provider');
 const impossible=await c.CodeeProviderGateway.request({requestId:'impossible',task:'x',privacyLevel:'INTERNAL',preferredProviders:['free'],requiredCapabilities:['vision']});
 assert.strictEqual(impossible.ok,false); assert.strictEqual(impossible.reason,'no-capable-provider');
 console.log('AI gateway capability/cost/privacy pass');
})().catch(e=>{console.error(e);process.exit(1)});
