const assert=require('assert');const {load}=require('./_workforce-test-loader');const g=load();g.CodeeWorkforceHostIntegration.register({});
(async()=>{
 let out=await g.CodeeWorkforceHostIntegration.executeToolRequest({managerId:'forged-manager',capability:'repository.search',args:{query:'x'}});assert.strictEqual(out.ok,false);assert.strictEqual(out.reason,'unknown-manager');
 out=await g.CodeeWorkforceHostIntegration.routeGovernedMutation({managerId:'forged-manager',action:'repository.write',target:'README.md',change:{content:'x'}});assert.strictEqual(out.ok,false);assert.strictEqual(out.reason,'unknown-manager');
 const ai=await g.CodeeWorkforceHostIntegration.createAdvisoryAiRequest({managerId:'forged-manager',task:'x'});assert.strictEqual(ai.ok,false);assert.strictEqual(ai.reason,'unknown-manager');
 const pre=g.CodeeWorkforceHostIntegration.prepare({text:'Inspect app/Extensions/Crm routes and module dependencies'});assert(pre.managers.some(m=>m.id==='extension-manager'));assert(pre.requestedCapabilities.includes('repository.inventory'));assert(pre.requestedCapabilities.includes('repository.search'));
 console.log('workforce manager attribution and extension evidence OK');
})().catch(e=>{console.error(e);process.exit(1)});
