const assert=require('assert');
const fs=require('fs');
const vm=require('vm');
const context=vm.createContext({console,globalThis:{},Date}); context.globalThis=context;
vm.runInContext(fs.readFileSync('src/intelligence/webgpu-capability.js','utf8'),context,{filename:'src/intelligence/webgpu-capability.js'});
const W=context.CodeeWebGpuCapability; assert(W);
(async()=>{
 W.clearCache();
 const absent=await W.probe({navigator:{userAgent:'test'},secureContext:true,force:true});
 assert.strictEqual(absent.available,false); assert.strictEqual(absent.reason,'webgpu-api-unavailable'); assert.strictEqual(absent.profile.id,'fallback');
 const adapter={
  limits:{maxBufferSize:1073741824,maxStorageBufferBindingSize:536870912,maxComputeWorkgroupStorageSize:32768,maxComputeInvocationsPerWorkgroup:256},
  features:new Set(['shader-f16']),
  requestAdapterInfo:async()=>({vendor:'Discrete Test GPU',architecture:'test',device:'1',description:'test adapter'}),
  requestDevice:async()=>({limits:{maxBufferSize:1073741824,maxStorageBufferBindingSize:536870912,maxComputeWorkgroupStorageSize:32768,maxComputeInvocationsPerWorkgroup:256},features:new Set(['shader-f16']),destroy(){}})
 };
 let calls=0; const navigator={userAgent:'Chrome test',deviceMemory:16,gpu:{requestAdapter:async opts=>{calls++;assert.strictEqual(opts.powerPreference,'high-performance');return adapter;}}};
 const high=await W.probe({navigator,secureContext:true,force:true});
 assert.strictEqual(high.available,true); assert.strictEqual(high.device.created,true); assert.strictEqual(high.profile.id,'high'); assert(high.adapter.features.includes('shader-f16')); assert.strictEqual(high.deviceMemoryGB,16);
 const cached=await W.probe({navigator}); assert.strictEqual(cached,high); assert.strictEqual(calls,1,'capability result should be cached');
 const accept=W.recommend(high,{bytes:2000000000,contextTokens:8192}); assert.strictEqual(accept.ok,true); assert.strictEqual(accept.profileId,'high');
 const reject=W.recommend(high,{bytes:9000000000,contextTokens:65536}); assert.strictEqual(reject.ok,false); assert(reject.reasons.includes('model-too-large')); assert(reject.reasons.includes('context-too-large'));
 const balanced=W.classify({vendor:'Intel integrated'},{maxBufferSize:536870912,maxStorageBufferBindingSize:268435456},{deviceMemoryGB:8}); assert.strictEqual(balanced.id,'balanced');
 const constrained=W.classify({}, {maxBufferSize:134217728,maxStorageBufferBindingSize:67108864},{deviceMemoryGB:4}); assert.strictEqual(constrained.id,'constrained'); assert.strictEqual(constrained.allowGpuEmbeddings,false);
 console.log('Browser intelligence WebGPU capability pass 4');
})().catch(err=>{console.error(err);process.exit(1);});
