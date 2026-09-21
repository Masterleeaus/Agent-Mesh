const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

const html = fs.readFileSync('src/sidebar/sidebar.html', 'utf8');
const css = fs.readFileSync('src/sidebar/sidebar.css', 'utf8');
const source = fs.readFileSync('src/sidebar/sidebar.js', 'utf8');

for (const id of ['menu-btn', 'nav-drawer', 'nav-backdrop', 'nav-close-btn']) {
  assert(new RegExp(`id=["']${id}["']`).test(html), `sidebar navigation must include #${id}`);
}

const expectedPages = ['runner', 'plans', 'browser', 'prompts', 'skills', 'settings', 'diagnostics', 'about'];
for (const page of expectedPages) {
  assert(new RegExp(`data-page=[\"']${page}[\"']`).test(html), `sidebar must define ${page} page`);
}
assert(/id=["']codee-nav-links["']/.test(html), 'hamburger menu must expose the registry-owned navigation container');
assert(!/data-nav-page=["'](?:runner|plans|prompts|skills|settings|diagnostics|about)["']/.test(html), 'canonical links must be rendered from the navigation registry rather than hard-coded');
assert(source.includes('renderNavigationRegistry'), 'sidebar must render the canonical navigation registry');

assert(/\.nav-drawer\s*\{[\s\S]*position\s*:\s*fixed/i.test(css),
  'navigation drawer must be an overlay rather than reflowing plan content');
assert(/\.app-page\s*\{[\s\S]*display\s*:\s*none/i.test(css),
  'inactive app pages must be hidden');
assert(/\.app-page\.active\s*\{[\s\S]*display\s*:\s*block/i.test(css),
  'active app page must be visible');

const context = {
  console: { log() {}, error() {}, warn() {} },
  document: { addEventListener() {}, getElementById() { return null; }, querySelectorAll() { return []; } },
  chrome: { runtime: { onMessage: { addListener() {} } } },
  Map,
  Promise,
  URL
};
vm.runInNewContext(source, context);

assert.strictEqual(typeof context.setActivePage, 'function', 'sidebar must expose setActivePage');
assert.strictEqual(typeof context.openNavigation, 'function', 'sidebar must expose openNavigation');
assert.strictEqual(typeof context.closeNavigation, 'function', 'sidebar must expose closeNavigation');
assert.strictEqual(typeof context.registerNavigationHandlers, 'function', 'sidebar must wire navigation controls');

console.log('sidebar hamburger navigation and placeholder pages OK');
