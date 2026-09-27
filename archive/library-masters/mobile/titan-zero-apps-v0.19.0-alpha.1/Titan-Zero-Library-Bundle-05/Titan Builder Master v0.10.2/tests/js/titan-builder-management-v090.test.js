'use strict';
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const root = path.resolve(__dirname, '../..');
const js = fs.readFileSync(path.join(root, 'resources/assets/js/titan-builder-management.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'resources/assets/css/titan-builder-management.css'), 'utf8');
const layout = fs.readFileSync(path.join(root, 'resources/views/management/layout.blade.php'), 'utf8');

for (const needle of [
  'data-tbm-json-form', 'data-tbm-editor', 'data-tbm-asset-form', 'data-tbm-brand-form',
  'data-tbm-app-action', 'data-tbm-provision-set', 'data-tbm-app-preview', 'TitanGenerativeUI.renderSpec'
]) assert(js.includes(needle), `missing management behavior ${needle}`);
for (const unsafe of ['eval(', 'new Function(', 'document.write(']) assert(!js.includes(unsafe), `unsafe management runtime token ${unsafe}`);
assert(js.includes("'X-CSRF-TOKEN': csrf"), 'management requests must send CSRF token');
assert(js.includes("credentials: 'same-origin'"), 'management requests must keep same-origin credentials');
assert(js.includes('editor.dataset.projectSurface'), 'project preview must use the trusted project surface rather than page-spec surface');
assert(layout.includes('titan-builder-management.css'), 'layout must load management CSS');
assert(layout.includes('titan-builder-management.js'), 'layout must load management JS');
assert(css.includes('.tbm-sidebar') && css.includes('.tbm-editor') && css.includes('@media(max-width:800px)'), 'management CSS must include shell/editor/responsive rules');
console.log('Titan Builder management UI JS contract: PASS');
