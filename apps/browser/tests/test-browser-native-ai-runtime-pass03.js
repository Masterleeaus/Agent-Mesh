'use strict';
const assert = require('assert');
const { BrowserNativeAIRuntime } = require('../src/intelligence/browser-native-ai-runtime');
const { BrowserModelRuntimeAdapter } = require('../src/intelligence/browser-model-runtime-adapter');

(async () => {
  const calls=[];
  const native = new BrowserNativeAIRuntime({
    promptApi:{capabilities:async()=>({available:false}),generate:async()=>{throw new Error('must not run');}},
    webllm:{capabilities:async()=>({available:true,model:'local-test'}),generate:async(p)=>{calls.push('webllm');return {text:`local:${p.prompt}`,model:'local-test'};}},
    webgpu:{capabilities:async()=>({available:true}),generate:async()=>({text:'gpu'})},
  });
  const caps=await native.capabilities();
  assert.strictEqual(caps.providers.webllm.locality,'ON_DEVICE');
  assert.strictEqual(caps.providers.webllm.authority,false);
  const out=await native.generate({prompt:'hello'});
  assert.strictEqual(out.text,'local:hello');
  assert.strictEqual(out.runtime,'webllm');
  assert.deepStrictEqual(calls,['webllm']);

  let rpcCalls=0;
  const adapter=new BrowserModelRuntimeAdapter({
    nativeRuntime:native,
    rpc:{request:async()=>{rpcCalls++;return {text:'remote'};}},
  });
  const result=await adapter.generate({prompt:'device first'});
  assert.strictEqual(result.text,'local:device first');
  assert.strictEqual(result.runtime,'webllm');
  assert.strictEqual(rpcCalls,0);

  const hostile=new BrowserNativeAIRuntime({webllm:{generate:async()=>({text:'x',authority:true})}});
  await assert.rejects(()=>hostile.generate({prompt:'x'}), e=>e.code==='ERR_BROWSER_NATIVE_AI_UNAVAILABLE' && e.details[0].code==='ERR_BROWSER_NATIVE_AI_AUTHORITY');
  console.log('PASS browser native AI runtime pass03');
})().catch((error)=>{console.error(error);process.exit(1);});
