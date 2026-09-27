const assert = require('assert');
const fs = require('fs');

const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const nav = fs.readFileSync('src/lib/navigation-registry.js', 'utf8');
const worker = fs.readFileSync('src/lib/service-worker.js', 'utf8');
const scope = fs.readFileSync('TITAN-ZERO-BROWSER-NODE.md', 'utf8');

assert.strictEqual(manifest.name, 'Titan Zero Browser Node', 'extension manifest must use Titan Zero Browser Node identity');
assert.strictEqual(pkg.name, 'titan-zero-browser-node', 'package identity must be Titan Zero Browser Node');
assert(/company_id/.test(scope), 'product boundary must name company_id as canonical company boundary');
assert(/Zero/i.test(scope) && /Go/i.test(scope) && /Hub/i.test(scope), 'product boundary must align with Zero, Go and Hub surfaces');
assert(!/PRIVATE TITAN CODE DEVELOPMENT-ONLY/.test(worker), 'Browser Node worker must not declare itself private Titan Code');
assert(!/Canonical Titan Code remains this worker/.test(worker), 'Browser Node worker must not retain Titan Code ownership language');

for (const label of ['Zero','Work','Active Work','Outcomes','Evidence','Workforce','Browser','Intelligence','Connections','Tools & MCP','Knowledge','Diagnostics','Settings','About']) {
  assert(nav.includes(`label: '${label}'`), `operational navigation must expose ${label}`);
}
for (const forbidden of ['Repository Host','Prompts','Skills','AI Workforce']) {
  assert(!nav.includes(`label: '${forbidden}'`), `development-only menu label ${forbidden} must not be exposed`);
}

assert(!/label:\s*'Repository'/.test(nav), 'repository coding workspace must not be a primary Browser Node page');
assert(!/label:\s*'Titan Zero'[^\n]*page:\s*'titan-zero'/.test(nav), 'Titan Zero developer-analysis page must not be exposed as a Browser Node surface');

console.log('Titan Zero Browser Node product scope and operational navigation contract OK');
