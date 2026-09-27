const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

const html = fs.readFileSync('src/sidebar/sidebar.html', 'utf8');
const css = fs.readFileSync('src/sidebar/sidebar.css', 'utf8');
const source = fs.readFileSync('src/sidebar/sidebar.js', 'utf8');
const navSource = fs.readFileSync('src/lib/navigation-registry.js', 'utf8');

for (const id of ['menu-btn', 'nav-drawer', 'nav-backdrop', 'nav-close-btn']) {
  assert(new RegExp(`id=["']${id}["']`).test(html), `sidebar navigation must include #${id}`);
}

const operationalPages = ['dashboard','runner','plans','history','artifacts','workforce','browser','intelligence','connections','mcp','knowledge','settings','diagnostics','about'];
for (const page of operationalPages) {
  assert(new RegExp(`data-page=[\"']${page}[\"']`).test(html), `sidebar must define operational ${page} page`);
}
assert(/id=["']codee-nav-links["']/.test(html), 'hamburger menu must expose the registry-owned navigation container');
assert(source.includes('renderNavigationRegistry'), 'sidebar must render the canonical navigation registry');
for (const forbidden of ['Repository Host','Prompts','Skills','AI Workforce']) {
  assert(!navSource.includes(`label: '${forbidden}'`), `${forbidden} must not be exposed in Titan Zero Browser Node navigation`);
}

assert(/\.nav-drawer\s*\{[\s\S]*position\s*:\s*fixed/i.test(css),
  'navigation drawer must be an overlay rather than reflowing operational content');
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

console.log('Titan Zero Browser Node sidebar operational navigation surfaces OK');
