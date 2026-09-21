import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { createDonorSurfaceActivation, getDefaultDonorSurfaceRegistry } from '../titan-runtime/performance/donor-surface-activation.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');

function sha(rel){return crypto.createHash('sha256').update(fs.readFileSync(path.join(root,rel))).digest('hex');}

test('unopened page surfaces perform zero loader work',()=>{
  let calls=0;
  const activation=createDonorSurfaceActivation({moduleLoader:async()=>{calls++;return {};}});
  for(const surface of ['chatTab','monicaOptions','monicaPopup']) assert.equal(activation.describe(surface).loaded,false);
  assert.equal(calls,0);
});

test('page donor runtime requires explicit surface-open demand',async()=>{
  let calls=0;
  const activation=createDonorSurfaceActivation({moduleLoader:async()=>{calls++;return {ok:true};},resolveUrl:x=>x});
  await assert.rejects(()=>activation.activate({surface:'chatTab'}),/explicit_surface_open_required/);
  assert.equal(calls,0);
  const result=await activation.activate({surface:'chatTab',explicit_surface_open:true});
  assert.equal(calls,1);
  assert.equal(result.state.loaded,true);
  assert.equal(result.state.authority_neutral,true);
});

test('concurrent activation is deduplicated',async()=>{
  let calls=0;
  const activation=createDonorSurfaceActivation({moduleLoader:async()=>{calls++;await new Promise(r=>setTimeout(r,10));return {};},resolveUrl:x=>x});
  await Promise.all([
    activation.activate({surface:'monicaPopup',explicit_surface_open:true}),
    activation.activate({surface:'monicaPopup',explicit_surface_open:true}),
  ]);
  assert.equal(calls,1);
});

test('legacy tenant authority aliases fail closed',async()=>{
  const activation=createDonorSurfaceActivation({moduleLoader:async()=>({}),resolveUrl:x=>x});
  await assert.rejects(()=>activation.activate({surface:'chatTab',explicit_surface_open:true,tenant_id:'legacy'}),/legacy_tenant_authority_rejected/);
});

test('Retriever background remains startup-bound and cannot be deferred by this pass',async()=>{
  let calls=0;
  const activation=createDonorSurfaceActivation({moduleLoader:async()=>{calls++;return {};},resolveUrl:x=>x});
  const state=activation.describe('retrieverBackground');
  assert.equal(state.startup_required,true);
  assert.equal(state.deferred_retirement_gate,'TZ-FIX-RUNTIME-ADAPTERS-001_MANAGER_MERGED');
  await assert.rejects(()=>activation.activate({surface:'retrieverBackground',explicit_surface_open:true}),/startup_bound_surface_not_deferred/);
  assert.equal(calls,0);
});

test('current page routes keep retained Titan compatibility runtime',()=>{
  const chat=fs.readFileSync(path.join(root,'chatTab.html'),'utf8');
  const opt=fs.readFileSync(path.join(root,'monicaOptions.html'),'utf8');
  const pop=fs.readFileSync(path.join(root,'monicaPopup.html'),'utf8');
  assert.match(chat,/titan-zero-chat-content\.compat\.js/);
  assert.match(opt,/titan-zero-chat-content\.compat\.js/);
  assert.match(pop,/titan-zero-chat-runtime\.compat\.js/);
  assert.match(pop,/titan-zero-chat-runtime\.compat\.css/);
});

test('protected compat and Retriever files remain present',()=>{
  for(const rel of ['content.css','titan-zero-chat-content.compat.js','titan-zero-chat-content.compat.css','titan-zero-chat-background.compat.js','titan-zero-chat-runtime.compat.js','titan-zero-chat-runtime.compat.css','retriever-background.iife.js','compatibility/monica/background-runtime-boundary.mjs']) {
    assert.equal(fs.existsSync(path.join(root,rel)),true,rel);
  }
});

test('background boundary still imports retained Retriever and background compat',()=>{
  const boundary=fs.readFileSync(path.join(root,'compatibility/monica/background-runtime-boundary.mjs'),'utf8');
  assert.match(boundary,/titan-zero-chat-background\.compat\.js/);
  assert.match(boundary,/retriever-background\.iife\.js/);
});

test('activation metadata is authority neutral',()=>{
  const registry=getDefaultDonorSurfaceRegistry();
  assert.equal(registry.chatTab.startup_required,false);
  assert.equal(registry.retrieverBackground.startup_required,true);
  const activation=createDonorSurfaceActivation();
  assert.equal(activation.describe('monicaPopup').activation_confers_authority,false);
  assert.equal(activation.describe('monicaPopup').identity_confers_authority,false);
});

test('protected content compat hash remains unchanged from Manager Phase2 evidence',()=>{
  assert.equal(sha('titan-zero-chat-content.compat.js'),'987c0de84d020c8484fb1cc7da81a69346e1bd940f7b72874d8ffa82fbfe6ab8');
});
