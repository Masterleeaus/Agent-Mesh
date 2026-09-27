const fs = require('fs');
const assert = require('assert');

const html = fs.readFileSync('src/sidebar/sidebar.html', 'utf8');
const css = fs.readFileSync('src/sidebar/sidebar.css', 'utf8');
const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));

assert(/class=["'][^"']*brand-logo/.test(html), 'sidebar header must render the Codee logo');
assert(/class=["'][^"']*drawer-logo/.test(html), 'navigation drawer must render the Codee logo');
assert(/public\/branding\/codee-logo\.png/.test(html), 'sidebar must reference packaged Codee logo asset');
assert(fs.existsSync('public/branding/codee-logo.png'), 'packaged Codee logo asset must exist');

for (const token of ['--bg', '--accent-blue', '--accent-pink', '--accent-cyan', '--glow-blue', '--glow-pink']) {
  assert(css.includes(`${token}:`), `neon theme must define ${token}`);
}
assert(/--bg\s*:\s*#(?:000000|02030[0-9a-f])/i.test(css), 'theme base must be black / near-black');
assert(/linear-gradient\([^)]*var\(--accent-blue\)[\s\S]*var\(--accent-pink\)/i.test(css), 'primary branding must combine bright blue and pink');

assert(manifest.icons && manifest.icons['128'], 'manifest must expose Codee extension icon');
assert(manifest.action && manifest.action.default_icon, 'toolbar action must expose Codee icon');

console.log('sidebar black/slate/deep-blue branding and logo wiring OK');
