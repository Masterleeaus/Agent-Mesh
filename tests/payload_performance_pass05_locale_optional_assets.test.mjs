import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createLocaleOnDemandLoader, normalizeLocale } from '../titan-runtime/performance/locale-on-demand-loader.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('normalizes locale ids and preserves fallback behavior', () => {
  assert.equal(normalizeLocale('pt-br'), 'pt_BR');
  assert.equal(normalizeLocale('EN_us'), 'en_US');
  assert.equal(normalizeLocale('bad locale'), 'en');
});

test('loads locale messages only on demand and deduplicates concurrent loads', async () => {
  let calls = 0;
  const loader = createLocaleOnDemandLoader({
    availableLocales: ['en','fr'],
    loadMessages: async (locale) => { calls++; return { locale, hello: 'x' }; },
  });
  assert.equal(calls, 0);
  const [a,b] = await Promise.all([loader.load('fr'), loader.load('fr')]);
  assert.equal(calls, 1);
  assert.equal(a, b);
  assert.equal(a.locale, 'fr');
  assert.equal(loader.isLoaded('fr'), true);
});

test('unknown regional locale falls back to base language then default', async () => {
  const seen = [];
  const loader = createLocaleOnDemandLoader({
    availableLocales: ['en','es'],
    loadMessages: async (locale) => { seen.push(locale); return {}; },
  });
  assert.equal((await loader.load('es_MX')).locale, 'es');
  assert.equal((await loader.load('zz_ZZ')).locale, 'en');
  assert.deepEqual(seen, ['es','en']);
});

test('locale loading is authority neutral', async () => {
  const audit=[];
  const loader=createLocaleOnDemandLoader({availableLocales:['en'],loadMessages:async()=>({}),auditSink:(e)=>audit.push(e)});
  await loader.load('en');
  assert.equal(audit[0].authority_neutral, true);
  assert.equal(audit[0].identity_confers_authority, false);
});

test('all current Titan locale files remain present', () => {
  const registry=JSON.parse(fs.readFileSync(path.join(root,'titan-runtime/performance/locale-registry-merge42.json'),'utf8'));
  assert.equal(registry.count, 55);
  for (const locale of registry.available_locales) {
    assert.equal(fs.existsSync(path.join(root,'titan-zero-locales',locale,'messages.json')), true, locale);
  }
});

test('Manager-authorized Phase2 routes point to retained compat runtimes', () => {
  const chat=fs.readFileSync(path.join(root,'chatTab.html'),'utf8');
  const opt=fs.readFileSync(path.join(root,'monicaOptions.html'),'utf8');
  const pop=fs.readFileSync(path.join(root,'monicaPopup.html'),'utf8');
  assert.match(chat,/titan-zero-chat-content\.compat\.js/);
  assert.match(opt,/titan-zero-chat-content\.compat\.js/);
  assert.doesNotMatch(chat,/\.\/content\.js/);
  assert.doesNotMatch(opt,/\.\/content\.js/);
  assert.match(pop,/titan-zero-chat-runtime\.compat\.js/);
  assert.match(pop,/titan-zero-chat-runtime\.compat\.css/);
  assert.doesNotMatch(pop,/monica-popup\.(?:js|css)/);
});

test('retired Phase2 code is absent while guarded compat and Retriever remain', () => {
  for (const rel of ['content.js','monica-popup.js','monica-popup.css']) assert.equal(fs.existsSync(path.join(root,rel)),false,rel);
  for (const rel of ['content.css','titan-zero-chat-content.compat.js','titan-zero-chat-content.compat.css','titan-zero-chat-runtime.compat.js','titan-zero-chat-runtime.compat.css','retriever-background.iife.js','compatibility/monica/background-runtime-boundary.mjs']) assert.equal(fs.existsSync(path.join(root,rel)),true,rel);
});
