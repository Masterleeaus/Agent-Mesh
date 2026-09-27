import test from 'node:test';
import assert from 'node:assert/strict';
import {createLazySurfaceLoader} from '../titan-runtime/performance/lazy-surface-loader.mjs';

const registry={
  diagnostics:{kind:'module',path:'diag.mjs',startup_required:false,company_scoped:false},
  workforce:{kind:'module',path:'work.mjs',startup_required:false,company_scoped:true},
  marketplace:{kind:'json',path:'market.json',startup_required:false,company_scoped:true}
};

test('describing a lazy surface performs no load',()=>{
  let loads=0;
  const loader=createLazySurfaceLoader({registry,moduleLoader:async()=>{loads++;return{}},resolveUrl:x=>x});
  const state=loader.describe('diagnostics');
  assert.equal(loads,0); assert.equal(state.loaded,false); assert.equal(state.authority_neutral,true);
});

test('explicit diagnostics request loads exactly once and caches',async()=>{
  let loads=0;
  const loader=createLazySurfaceLoader({registry,moduleLoader:async()=>{loads++;return{ok:true}},resolveUrl:x=>x});
  const a=await loader.load({surface:'diagnostics'}); const b=await loader.load({surface:'diagnostics'});
  assert.equal(loads,1); assert.equal(a.value.ok,true); assert.equal(b.value.ok,true);
});

test('concurrent requests are deduplicated',async()=>{
  let loads=0, release; const wait=new Promise(r=>release=r);
  const loader=createLazySurfaceLoader({registry,moduleLoader:async()=>{loads++;await wait;return{ok:true}},resolveUrl:x=>x});
  const a=loader.load({surface:'diagnostics'}); const b=loader.load({surface:'diagnostics'}); release(); await Promise.all([a,b]);
  assert.equal(loads,1);
});

test('company-scoped workforce and marketplace require canonical company_id',async()=>{
  const loader=createLazySurfaceLoader({registry,moduleLoader:async()=>({}),jsonLoader:async()=>({}),resolveUrl:x=>x});
  await assert.rejects(loader.load({surface:'workforce'}),/company_id_required/);
  await assert.rejects(loader.load({surface:'marketplace'}),/company_id_required/);
});

test('legacy tenant authority aliases fail closed',async()=>{
  const loader=createLazySurfaceLoader({registry,moduleLoader:async()=>({}),resolveUrl:x=>x});
  await assert.rejects(loader.load({surface:'workforce',company_id:'c1',tenant_id:'legacy'}),/legacy_tenant_authority_rejected/);
});

test('marketplace JSON is loaded on demand only',async()=>{
  let jsonLoads=0;
  const loader=createLazySurfaceLoader({registry,jsonLoader:async()=>{jsonLoads++;return{packages:[]}},resolveUrl:x=>x});
  assert.equal(loader.describe('marketplace').loaded,false);
  const result=await loader.load({surface:'marketplace',company_id:'c1'});
  assert.equal(jsonLoads,1); assert.deepEqual(result.value,{packages:[]});
});

test('failed loads are retryable rather than poisoned in cache',async()=>{
  let attempts=0;
  const loader=createLazySurfaceLoader({registry,moduleLoader:async()=>{attempts++;if(attempts===1)throw new Error('boom');return{ok:true}},resolveUrl:x=>x});
  await assert.rejects(loader.load({surface:'diagnostics'}),/boom/);
  const result=await loader.load({surface:'diagnostics'});
  assert.equal(attempts,2); assert.equal(result.value.ok,true);
});

test('startup-required surfaces cannot be placed behind lazy loader',async()=>{
  const loader=createLazySurfaceLoader({registry:{startup:{kind:'module',path:'x',startup_required:true,company_scoped:false}},resolveUrl:x=>x});
  assert.throws(()=>loader.describe('startup'),/startup_surface_not_lazy/);
});

test('loading remains authority neutral and audits state transitions',async()=>{
  const events=[];
  const loader=createLazySurfaceLoader({registry,moduleLoader:async()=>({}),resolveUrl:x=>x,auditSink:e=>events.push(e)});
  const result=await loader.load({surface:'workforce',company_id:'company-a'});
  assert.equal(result.state.loading_confers_authority,false);
  assert.deepEqual(events.map(e=>e.outcome),['started','loaded']);
  assert.ok(events.every(e=>e.authority_neutral===true));
});
