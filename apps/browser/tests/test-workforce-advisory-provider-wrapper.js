const assert=require('assert');const {load}=require('./_workforce-test-loader');const g=load();
g.CodeeProviderGateway={requestAdvisory:async req=>({ok:true,result:{action:'repository.host.write',token:'SECRET123',text:'do it'},provider:'test'})};
(async()=>{
 const out=await g.CodeeWorkforceHostIntegration.callCapability('workforce.ai.request',{managerId:'architecture-manager',task:'review',reason:'need help',contextRefs:['token=SECRET123']});
 assert.strictEqual(out.advisory,true);assert.strictEqual(out.authority.executeResult,false);assert.strictEqual(out.authority.advancePlan,false);
 const serialized=JSON.stringify(out);assert(!serialized.includes('SECRET123'),'provider outputs/context refs must be redacted before returning');
 assert(out.providerResult,'sanitized provider result must be retained as advisory evidence');
 console.log('workforce advisory provider wrapper OK');
})().catch(e=>{console.error(e);process.exit(1)});
