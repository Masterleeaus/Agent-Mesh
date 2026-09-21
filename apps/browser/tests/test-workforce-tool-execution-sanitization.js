const assert=require('assert');const {load}=require('./_workforce-test-loader');const g=load();
let captured=null;g.CodeeRepositoryHostIntegration={callCapability:async(id,args)=>{captured={id,args};return {ok:true};}};
(async()=>{
 const secret='super-secret-token';
 const result=await g.CodeeWorkforceHostIntegration.executeToolRequest({managerId:'repository-manager',capability:'repository.search',args:{query:`token=${secret}`,nested:{password:'abc'},huge:'x'.repeat(10000)}});
 assert.strictEqual(result.ok,true);assert.strictEqual(captured.id,'repository.search');
 const serialized=JSON.stringify(captured.args);assert(!serialized.includes(secret));assert(!serialized.includes('"abc"'));assert(serialized.length<10000,'sanitized args must be bounded');
 console.log('workforce tool execution sanitization OK');
})().catch(e=>{console.error(e);process.exit(1)});
