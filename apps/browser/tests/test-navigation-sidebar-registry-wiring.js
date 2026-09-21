const assert = require('assert');
const fs = require('fs');
const html = fs.readFileSync('src/sidebar/sidebar.html','utf8');
const js = fs.readFileSync('src/sidebar/sidebar.js','utf8');
const worker = fs.readFileSync('src/lib/service-worker.js','utf8');

assert(html.includes('id="codee-nav-links"'), 'sidebar must expose a registry-owned navigation container');
assert(!/data-nav-page="(?:runner|plans|prompts|skills|settings|diagnostics|about)"/.test(html), 'canonical navigation buttons must not remain hard-coded in HTML');
assert(html.includes('data-page="browser"'), 'Browser contract-only page must exist so readiness is honest');
assert(js.includes("action: 'GET_NAVIGATION_STATUS'"), 'sidebar must request canonical navigation from worker');
assert(js.includes('renderNavigationRegistry'), 'sidebar must render navigation from registry payload');
assert(js.includes('renderNavigationFallback'), 'sidebar must retain fail-closed Runner fallback');
assert(worker.includes("message.action === 'GET_NAVIGATION_STATUS'"), 'worker must expose canonical navigation status');
assert(worker.includes("'navigation-registry.js'"), 'worker must import navigation registry');
assert(worker.includes("'navigation-readiness.js'"), 'worker must import navigation readiness');
console.log('Sidebar navigation is registry-owned with fail-closed fallback');
