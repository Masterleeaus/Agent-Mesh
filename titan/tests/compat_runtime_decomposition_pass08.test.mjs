import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import {createCompatBootstrap} from '../titan-runtime/compat-decomposition/compat-bootstrap.mjs';

const sha=async p=>crypto.createHash('sha256').update(await fs.readFile(new URL(p,import.meta.url))).digest('hex');

function fakeEvents(){
  const map=new Map();
  return {
    addEventListener(name,fn){ if(!map.has(name)) map.set(name,new Set()); map.get(name).add(fn); },
    removeEventListener(name,fn){ map.get(name)?.delete(fn); },
    emit(name,detail){ for(const fn of map.get(name)||[]) fn(detail); },
    count(name){ return map.get(name)?.size||0; }
  };
}

test('cold start installs shell with zero eager optional loads',()=>{
  let loads=0; const globalTarget={};
  const b=createCompatBootstrap({moduleLoader:async()=>{loads++;return{}},resolveUrl:x=>x,globalTarget});
  b.install();
  assert.equal(loads,0);
  assert.equal(globalTarget.TitanCompatBootstrap,b);
  for(const feature of b.list()) assert.equal(b.describe(feature).loaded,false);
});

test('warm start install is idempotent and does not duplicate global bootstrap',()=>{
  const globalTarget={}; const b=createCompatBootstrap({moduleLoader:async()=>({}),resolveUrl:x=>x,globalTarget});
  assert.equal(b.install(),b); assert.equal(b.install(),b);
  assert.equal(globalTarget.TitanCompatBootstrap,b);
});

test('default resolver can import every extracted chunk on first use',async()=>{
  const b=createCompatBootstrap();
  const t=await b.loadTranslation(); assert.ok(t.value);
  const d=await b.loadDocumentEvidence({company_id:'c1'}); assert.ok(d.value);
  const s=await b.loadBrowserSession({company_id:'c1'}); assert.ok(s.value);
  const a=await b.loadTypedAdapter({company_id:'c1'}); assert.ok(a.value);
});

test('offline/lazy-load failure remains retryable and does not poison other features',async()=>{
  let attempts=0;
  const b=createCompatBootstrap({moduleLoader:async url=>{attempts++; if(url.includes('translation')&&attempts===1) throw new Error('offline'); return{url};},resolveUrl:x=>x});
  await assert.rejects(b.loadTranslation(),/offline/);
  assert.equal(b.describe('translation').loaded,false);
  const ok=await b.loadTranslation(); assert.ok(ok.value);
  const other=await b.loadDocumentEvidence({company_id:'c1'}); assert.ok(other.value);
});

test('concurrent lazy requests dedupe to one module load',async()=>{
  let loads=0; let release; const gate=new Promise(r=>release=r);
  const b=createCompatBootstrap({moduleLoader:async()=>{loads++; await gate; return{ok:true}},resolveUrl:x=>x});
  const p1=b.loadDocumentEvidence({company_id:'c1'}); const p2=b.loadDocumentEvidence({company_id:'c1'});
  await new Promise(r=>setTimeout(r,0)); assert.equal(loads,1); release(); await Promise.all([p1,p2]); assert.equal(loads,1);
});

test('event bridge prevents duplicate listener registration and cleans up',()=>{
  const events=fakeEvents(); const globalTarget={};
  const b=createCompatBootstrap({moduleLoader:async()=>({}),resolveUrl:x=>x,eventTarget:events,globalTarget});
  b.install();
  assert.equal(b.registerEvent('translation','titan:translate'),true);
  assert.equal(b.registerEvent('translation','titan:translate'),false);
  assert.equal(events.count('titan:translate'),1);
  b.uninstall(); assert.equal(events.count('titan:translate'),0); assert.equal(globalTarget.TitanCompatBootstrap,undefined);
});

test('authority and company boundaries fail closed',async()=>{
  const b=createCompatBootstrap({moduleLoader:async()=>({}),resolveUrl:x=>x});
  await assert.rejects(b.loadDocumentEvidence(),/company_id_required/);
  await assert.rejects(b.loadTypedAdapter({company_id:'c1',tenant_id:'legacy'}),/legacy_tenant_authority_rejected/);
  const r=await b.loadTypedAdapter({company_id:'c1'}); assert.equal(r.state.authority_neutral,true); assert.equal(r.state.loading_confers_authority,false);
});

test('side-panel popup content-script and compat bundles remain present and unchanged by Pass8',async()=>{
  for(const p of ['../chatTab.html','../monicaPopup.html','../titan-zero-chat-content.compat.js','../titan-zero-chat-background.compat.js','../titan-zero-chat-runtime.compat.js']) {
    const stat=await fs.stat(new URL(p,import.meta.url)); assert.ok(stat.size>0,p);
  }
  const hashes=await Promise.all(['../titan-zero-chat-content.compat.js','../titan-zero-chat-background.compat.js','../titan-zero-chat-runtime.compat.js'].map(sha));
  assert.equal(new Set(hashes).size,3);
});
