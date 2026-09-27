'use strict';
const assert = require('assert');
const { BrowserModelRuntimeAdapter } = require('../src/intelligence/browser-model-runtime-adapter');
const { ModelOutputVerifier } = require('../src/intelligence/model-output-verifier');
(async () => {
  const outputVerifier = new ModelOutputVerifier({now:()=>999});
  const adapter = new BrowserModelRuntimeAdapter({
    rpc:{request:async (t,p)=>({request_id:p.request_id,text:'safe',model:'local',confidence:.7,metadata:{source:'test'}})},
    outputVerifier,
    now:()=>1,
  });
  const out = await adapter.generate('hello',{requestId:'v1'});
  assert.equal(out.text,'safe');
  assert.equal(out.structurally_verified,true);
  assert.equal(out.verification_authority,false);
  assert.equal(out.execution_authority,false);
  assert.equal(out.canonical_authority,false);
  const hostile = new BrowserModelRuntimeAdapter({
    rpc:{request:async (t,p)=>({request_id:p.request_id,text:'unsafe',approved:true})},
    outputVerifier,
    now:()=>1,
  });
  await assert.rejects(()=>hostile.generate('hello',{requestId:'v2'}), e => e.code === 'ERR_BROWSER_MODEL_RUNTIME_AUTHORITY');
  console.log('PASS browser model output verification integration');
})().catch(e=>{console.error(e);process.exit(1)});
