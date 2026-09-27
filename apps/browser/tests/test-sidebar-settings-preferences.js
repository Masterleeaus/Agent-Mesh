const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

const html = fs.readFileSync('src/sidebar/sidebar.html', 'utf8');
const source = fs.readFileSync('src/sidebar/sidebar.js', 'utf8');
const css = fs.readFileSync('src/sidebar/sidebar.css', 'utf8');

for (const id of [
  'setting-compact-mode',
  'setting-reduced-glow',
  'setting-auto-open-plans',
  'setting-confirm-stop',
  'setting-remember-page',
  'settings-save-btn',
  'settings-reset-btn'
]) {
  assert(new RegExp(`id=["']${id}["']`).test(html), `settings page must include #${id}`);
}

assert(/\.compact-mode\b/.test(css), 'settings must support compact density class');
assert(/\.reduced-glow\b/.test(css), 'settings must support reduced glow class');

const context = {
  console: { log() {}, error() {}, warn() {} },
  document: { addEventListener() {}, getElementById() { return null; }, querySelectorAll() { return []; }, body: { classList: { toggle() {}, add() {}, remove() {} } } },
  chrome: { runtime: { onMessage: { addListener() {} } } },
  Map,
  Promise,
  URL
};
vm.runInNewContext(source, context);

for (const fn of ['normalizePreferences', 'applyPreferences', 'loadPreferences', 'savePreferences', 'resetPreferences', 'registerSettingsHandlers']) {
  assert.strictEqual(typeof context[fn], 'function', `sidebar must expose ${fn}`);
}

const normalized = context.normalizePreferences({ compactMode: true, confirmBeforeStop: false, junk: true });
assert.strictEqual(normalized.compactMode, true, 'known compact preference must survive normalization');
assert.strictEqual(normalized.confirmBeforeStop, false, 'known stop-confirm preference must survive normalization');
assert.strictEqual(Object.prototype.hasOwnProperty.call(normalized, 'junk'), false, 'unknown settings must not be persisted');
assert.strictEqual(normalized.autoOpenPlans, true, 'unspecified settings must use safe defaults');

console.log('sidebar settings preferences scaffold and behavior OK');
