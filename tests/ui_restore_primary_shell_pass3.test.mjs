import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (p) => fs.readFileSync(p, 'utf8');

test('rich startup pages load Titan shell adapter and Titan titles', () => {
  const chat = read('chatTab.html');
  const popup = read('monicaPopup.html');
  const settings = read('monicaOptions.html');
  for (const html of [chat, popup, settings]) {
    assert.match(html, /titan-rich-shell\.css/);
    assert.match(html, /titan-rich-shell\.js/);
    assert.doesNotMatch(html, /class="titan-theme-settings-link"/);
  }
  assert.match(chat, /<title>Titan Zero(?: AI Workspace)?<\/title>/);
  assert.match(settings, /<title>Titan Zero Settings<\/title>/);
});

test('shell adapter performs narrow product-facing renames without deleting rich runtime', () => {
  const js = read('titan-rich-shell.js');
  assert.match(js, /\['Monica', 'Titan Zero'\]/);
  assert.match(js, /\['Bots', 'Workforce Agents'\]/);
  assert.match(js, /\['Options', 'Settings'\]/);
  assert.match(js, /MutationObserver/);
  assert.match(js, /data-titan-product/);
  assert.ok(fs.statSync('titan-zero-chat-content.compat.js').size > 20_000_000);
  assert.equal(fs.existsSync('content.js'), false, 'retired donor content.js must stay absent');
  assert.ok(fs.statSync('titan-zero-chat-runtime.compat.js').size > 5_000_000);
  assert.equal(fs.existsSync('monica-popup.js'), false, 'retired donor popup runtime must stay absent');
});
