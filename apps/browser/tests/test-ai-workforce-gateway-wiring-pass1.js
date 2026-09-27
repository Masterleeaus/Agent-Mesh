const assert=require('assert'); const path=require('path');
for(const f of ['src/lib/capability-registry.js','src/ai/ai-sanitizer.js','src/ai/ai-request-contract.js','src/ai/ai-response-contract.js','src/ai/provider-contract.js','src/ai/ai-provider-registry.js','src/ai/model-registry.js','src/ai/provider-gateway.js','src/lib/onboard-ai-host-integration.js']) { const full=path.resolve(f); delete require.cache[full]; require(full); }
assert(globalThis.CodeeProviderGateway,'gateway exported');
assert(globalThis.CodeeOnboardAIHostIntegration,'host integration exported');
const reg=globalThis.CodeeOnboardAIHostIntegration.register(); assert.strictEqual(reg.registered,true);
const cap=globalThis.CodeeCapabilityRegistry.getCapability('ai.gateway.status'); assert(cap); assert.strictEqual(cap.readOnly,true); assert.strictEqual(cap.authority.mayAdvancePlan,false);
const status=globalThis.CodeeOnboardAIHostIntegration.status(); assert.strictEqual(status.gatewayInstalled,true); assert.strictEqual(status.providers,0); assert.strictEqual(status.models,0); assert.strictEqual(status.inferenceReady,false);
console.log('AI workforce/gateway wiring pass');
