const fs = require('fs');
const assert = require('assert');

const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));
const worker = fs.readFileSync('src/lib/service-worker.js', 'utf8');

assert(manifest.side_panel && manifest.side_panel.default_path === 'src/sidebar/sidebar.html',
  'manifest must declare the Codee side panel path');
assert((manifest.permissions || []).includes('sidePanel'),
  'manifest must request the sidePanel permission');
assert(/chrome\.sidePanel\s*\.\s*setPanelBehavior\s*\(\s*\{\s*openPanelOnActionClick\s*:\s*true\s*\}/s.test(worker),
  'service worker must configure toolbar clicks to open the side panel');
assert(/typeof\s+chrome\.sidePanel\?\.setPanelBehavior\s*===\s*['"]function['"]/.test(worker),
  'service worker must guard Side Panel API availability');
assert(!/chrome\.sidePanel\s*\.\s*open\s*\(/.test(worker),
  'service worker must not call sidePanel.open() outside a direct user gesture');

console.log('side-panel wiring OK');
