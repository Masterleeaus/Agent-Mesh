const fs = require('fs');
const assert = require('assert');

const css = fs.readFileSync('src/sidebar/sidebar.css', 'utf8');

assert(/:root\s*\{[\s\S]*color-scheme\s*:\s*dark/i.test(css),
  'sidebar must declare a native dark color scheme');
for (const token of ['--bg', '--surface', '--surface-soft', '--text', '--muted', '--border', '--accent']) {
  assert(css.includes(`${token}:`), `sidebar dark theme must define ${token}`);
}
assert(/body\s*\{[\s\S]*background\s*:\s*var\(--bg\)/i.test(css),
  'body background must be driven by the theme token');
assert(/\.section\s*\{[\s\S]*background\s*:\s*var\(--surface\)/i.test(css),
  'section surfaces must be driven by the theme token');
assert(/#plan-input\s*\{[\s\S]*background\s*:\s*var\(--surface-soft\)/i.test(css),
  'plan editor must use a dark theme surface');

console.log('sidebar dark theme tokens OK');
