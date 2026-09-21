import test from 'node:test';
import assert from 'node:assert/strict';
import {createCompatBootstrap} from '../titan-runtime/compat-decomposition/compat-bootstrap.mjs';
import {createCompatTypedAdapterChunk,COMPAT_TYPED_ADAPTER_CHUNK_SCHEMA} from '../titan-runtime/compat-decomposition/chunks/typed-adapter.mjs';

test('typed adapter support is lazy and company-scoped in compat bootstrap',async()=>{
  let loads=0; const seen=[];
  const b=createCompatBootstrap({moduleLoader:async url=>{loads++;seen.push(url);return{ok:true}},resolveUrl:x=>x});
  assert.equal(b.describe('typedAdapter').loaded,false);
  await assert.rejects(b.loadTypedAdapter(),/company_id_required/);
  assert.equal(loads,0);
  const r=await b.loadTypedAdapter({company_id:'c1'});
  assert.equal(loads,1); assert.equal(seen[0],'../compat-decomposition/chunks/typed-adapter.mjs'); assert.equal(r.company_id,'c1');
});

test('typed adapter chunk reuses canonical negotiation contract and never grants authority',()=>{
  const c=createCompatTypedAdapterChunk();
  assert.equal(c.schema,COMPAT_TYPED_ADAPTER_CHUNK_SCHEMA);
  const n=c.negotiateRuntimeAdapter({company_id:'c1',local_runtime:'titan',remote_runtime:'compat',remote_version:'1.0',remote_capabilities:['work_submission'],required_capabilities:['work_submission'],legacy_fallback_available:true});
  assert.equal(n.capability_negotiation_grants_authority,false);
  const path=c.selectAdapterPath({company_id:'c1',negotiation:n});
  assert.equal(path.authority_granted,false); assert.equal(path.execution_authority,false);
  assert.equal(c.adapter_grants_authority,false); assert.equal(c.loading_confers_authority,false);
});

test('adapter session recovery remains company scoped and forces fresh authority evaluation after navigation',()=>{
  const c=createCompatTypedAdapterChunk();
  const s=c.createAdapterSession({company_id:'c1',session_id:'s1',runtime:'compat',adapter_version:'1.0',correlation_id:'corr',navigation_key:'nav-1'});
  const r=c.recoverAdapterSession(s,{company_id:'c1',navigation_key:'nav-2',runtime:'compat',adapter_version:'1.0',now:s.last_seen_at+1});
  assert.equal(r.recovered,true); assert.equal(r.requires_fresh_authority_evaluation,true); assert.equal(r.grants_authority,false);
  const mismatch=c.recoverAdapterSession(s,{company_id:'c2',navigation_key:'nav-2'});
  assert.equal(mismatch.recovered,false); assert.equal(mismatch.recovery_status,'company_mismatch'); assert.equal(mismatch.grants_authority,false);
});

test('legacy tenant aliases fail closed in typed adapter lazy path',async()=>{
  const b=createCompatBootstrap({moduleLoader:async()=>({}),resolveUrl:x=>x});
  await assert.rejects(b.loadTypedAdapter({company_id:'c1',tenant_id:'legacy'}),/legacy_tenant_authority_rejected/);
});

test('background Retriever boundary is deliberately not modified by Pass7',async()=>{
  const fs=await import('node:fs/promises');
  const boundary=await fs.readFile(new URL('../compatibility/monica/background-runtime-boundary.mjs',import.meta.url),'utf8');
  assert.match(boundary,/retriever-background\.iife\.js/);
  assert.match(boundary,/titan-zero-chat-background\.compat\.js/);
});
