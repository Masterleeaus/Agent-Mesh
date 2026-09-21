import test from 'node:test';
import assert from 'node:assert/strict';
import {createCompatBootstrap} from '../titan-runtime/compat-decomposition/compat-bootstrap.mjs';
import {createCompatTranslationChunk,COMPAT_TRANSLATION_CHUNK_SCHEMA} from '../titan-runtime/compat-decomposition/chunks/translation.mjs';

test('translation is routed to dedicated optional compat chunk and remains lazy',async()=>{let loads=0,seen='';const b=createCompatBootstrap({moduleLoader:async url=>{loads++;seen=url;return{schema:COMPAT_TRANSLATION_CHUNK_SCHEMA}},resolveUrl:x=>x});assert.equal(loads,0);const r=await b.loadTranslation();assert.equal(loads,1);assert.equal(seen,'../compat-decomposition/chunks/translation.mjs');assert.equal(r.value.schema,COMPAT_TRANSLATION_CHUNK_SCHEMA);assert.equal(r.state.authority_neutral,true);});

test('translation chunk reuses canonical locale loader semantics',async()=>{const seen=[];const t=createCompatTranslationChunk({availableLocales:['en','fr','pt_BR'],defaultLocale:'en',loadMessages:async locale=>{seen.push(locale);return{hello:locale}}});assert.equal(t.schema,COMPAT_TRANSLATION_CHUNK_SCHEMA);assert.equal(t.normalizeLocale('pt-br'),'pt_BR');const a=await t.load('fr-FR');assert.equal(a.locale,'fr');assert.deepEqual(a.messages,{hello:'fr'});const b=await t.load('fr');assert.equal(seen.length,1);assert.equal(b,a);assert.equal(t.authority_neutral,true);assert.equal(t.loading_confers_authority,false);});

test('concurrent first-use bootstrap loads the translation chunk once',async()=>{let loads=0;let release;const gate=new Promise(r=>release=r);const b=createCompatBootstrap({moduleLoader:async()=>{loads++;await gate;return{ok:true}},resolveUrl:x=>x});const p1=b.loadTranslation();const p2=b.loadTranslation();release();const [a,c]=await Promise.all([p1,p2]);assert.equal(loads,1);assert.equal(a.value,c.value);});

test('offline chunk load fails closed and remains retryable without eager fallback',async()=>{let attempts=0;const b=createCompatBootstrap({moduleLoader:async()=>{attempts++;if(attempts===1)throw new Error('offline');return{ok:true}},resolveUrl:x=>x});await assert.rejects(b.loadTranslation(),/offline/);assert.equal(attempts,1);const r=await b.loadTranslation();assert.equal(attempts,2);assert.equal(r.value.ok,true);});

test('translation chunk message failure is retryable and preserves locale cache semantics',async()=>{let attempts=0;const t=createCompatTranslationChunk({availableLocales:['en'],loadMessages:async locale=>{attempts++;if(attempts===1)throw new Error('messages-offline');return{locale}}});await assert.rejects(t.load('en'),/messages-offline/);const r=await t.load('en');assert.equal(attempts,2);assert.equal(r.locale,'en');assert.equal(t.isLoaded('en'),true);});
