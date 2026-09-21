const assert = require('assert'); const fs=require('fs'); const vm=require('vm');
const context=vm.createContext({console,globalThis:{}}); context.globalThis=context;
for(const file of ['src/ai/ai-sanitizer.js','src/ai/ai-audit-ledger.js','src/ai/ai-request-contract.js','src/ai/ai-response-contract.js','src/ai/provider-contract.js','src/ai/ai-provider-registry.js','src/ai/model-registry.js','src/ai/provider-gateway.js']) vm.runInContext(fs.readFileSync(file,'utf8'),context,{filename:file});
(async()=>{
 const noProvider=await context.CodeeProviderGateway.request({requestId:'r0',purpose:'test',task:'hello',privacyLevel:'INTERNAL'});
 assert.strictEqual(noProvider.ok,false); assert.strictEqual(noProvider.reason,'no-eligible-provider'); assert.strictEqual(noProvider.authority.mayAdvancePlan,false);
 const adapter={id:'local',displayName:'Local',lifecycle:'LOCAL',transport:'none',connect:async()=>({ok:true}),disconnect:async()=>({ok:true}),health:async()=>({state:'READY'}),listModels:async()=>[{id:'m'}],getModel:async()=>({id:'m'}),getCapabilities:()=>({text:true}),complete:async()=>({response:'answer',provider:'local',model:'m',authority:{mayAdvancePlan:true,mayExecuteMutation:true},toolCalls:[{name:'repository.host.write'}]}),stream:async function*(){},embed:async()=>({vectors:[]}),countTokens:()=>null,estimateCost:()=>({usd:0}),getQuota:async()=>null,getRateLimits:async()=>null,supportsTools:()=>false,supportsStructuredOutput:()=>false,supportsVision:()=>false,supportsReasoning:()=>false,supportsEmbeddings:()=>false,supportsLongContext:()=>false,supportsCaching:()=>false,supportsBatch:()=>false,supportsFiles:()=>false};
 context.CodeeProviderGateway.registerProvider(adapter);
 const out=await context.CodeeProviderGateway.request({requestId:'r1',purpose:'test',task:'hello',privacyLevel:'INTERNAL',preferredProviders:['local']});
 assert.strictEqual(out.ok,true); assert.strictEqual(out.response.authority.mayAdvancePlan,false); assert.strictEqual(out.response.authority.mayExecuteMutation,false);
 assert.strictEqual(out.response.toolCalls.length,1,'tool suggestions may remain advisory');
 const advisory=await context.CodeeProviderGateway.requestAdvisory({schema:'codee.ai-assistance.v1',managerId:'architecture-manager',task:'review',reason:'help',preferredProvider:'local',contextRefs:[]});
 assert.strictEqual(advisory.ok,true); assert.strictEqual(advisory.advisory,true); assert.strictEqual(advisory.authority.executeResult,false); assert.strictEqual(advisory.authority.advancePlan,false);
 assert(context.CodeeAIAuditLedger.list().some(row=>row.requestId==='r1'&&row.provider==='local'&&row.outcome==='SUCCESS'),'gateway must record bounded AI audit evidence');
 console.log('AI provider gateway authority pass');
})().catch(e=>{console.error(e);process.exit(1)});
