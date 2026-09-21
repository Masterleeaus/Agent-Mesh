import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const read = (name) => fs.readFileSync(path.join(root, name), 'utf8');
const html = read('monicaOptions.html');
const handoff = read('titan-zero-options.html');
const theme = read('titan-theme.js');
const discovery = read('titan-settings-discovery.js');
const manifest = JSON.parse(read('manifest.json'));

test('one rich Settings centre is authoritative', () => {
  assert.equal(manifest.options_ui?.page, 'monicaOptions.html');
  assert.match(html, /data-titan-settings-authority="rich"/);
  assert.match(html, /<div id="root"><\/div>/);
  assert.match(html, /titan-zero-chat-content\.compat\.js/);
  assert.match(handoff, /data-titan-settings-authority="handoff"/);
  assert.match(handoff, /location\.replace\('\.\/monicaOptions\.html'\)/);
});

test('Theme & Colours exists only inside Settings with complete controls', () => {
  assert.match(html, /Theme &amp; Colours/);
  for (const mode of ['system','light','dark']) assert.match(html, new RegExp(`data-titan-theme-mode-choice="${mode}"`));
  for (const preset of ['titan','midnight','cobalt','graphite']) assert.match(html, new RegExp(`data-titan-theme-preset="${preset}"`));
  for (const key of ['background','primary','secondary','tertiary']) assert.match(html, new RegExp(`data-titan-theme-${key}`));
  assert.match(html, /data-titan-theme-reset/);
  assert.match(html, /data-titan-theme-preview/);
});

test('theme persistence has one canonical authority with migration cleanup', () => {
  assert.match(theme, /const STORAGE_KEY = 'titanZeroTheme'/);
  assert.match(theme, /const THEME_CONFIG_KEY = 'titanZeroThemeConfig'/);
  assert.match(theme, /LEGACY_RETRIEVER_THEME_KEY = 'theme'/);
  assert.match(theme, /remove\?\.\(LEGACY_RETRIEVER_THEME_KEY\)/);
  assert.doesNotMatch(theme, /set\?\.\(\{\s*\[LEGACY_RETRIEVER_THEME_KEY\]/s);
});

test('cross-surface propagation and discovery contracts are retained', () => {
  assert.match(theme, /querySelectorAll\('iframe'\)/);
  assert.match(theme, /MutationObserver/);
  assert.match(discovery, /Find settings/i);
  assert.match(discovery, /Appearance/);
  assert.match(discovery, /Models & Providers/);
  assert.match(discovery, /Privacy & Data/);
});

test('certification tree has no top-level theme destination or donor Settings title', () => {
  const candidates = fs.readdirSync(root).filter((f) => /\.(html|js)$/.test(f) && f !== 'monicaOptions.html');
  const combined = candidates.map((f) => read(f)).join('\n');
  assert.doesNotMatch(combined, />\s*Theme\s*&(?:amp;)?\s*Colou?rs\s*</i);
  const htmlCandidates = fs.readdirSync(root).filter((f) => /\.html$/.test(f));
  const htmlCombined = htmlCandidates.map((f) => read(f)).join('\n');
  assert.doesNotMatch(htmlCombined, /<title>[^<]*(Monica Options|Retriever Settings)[^<]*<\/title>/i);
});
