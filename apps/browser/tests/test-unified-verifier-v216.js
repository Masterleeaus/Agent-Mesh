const fs = require('fs');
const assert = require('assert');

assert(fs.existsSync('package.json'), 'release must provide package.json');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
assert.strictEqual(pkg.scripts?.test, 'node tools/verify-browser-node.mjs', 'npm test must run the Browser Node canonical verifier');
assert.strictEqual(pkg.scripts?.['test:private-dev-legacy'], 'node tools/verify-codee.mjs', 'legacy Titan Code verifier must remain explicitly available');
assert(fs.existsSync('tools/verify-browser-node.mjs'), 'Browser Node verifier must exist');
assert(fs.existsSync('tools/verify-codee.mjs'), 'legacy verifier must remain available');
assert(fs.existsSync('tools/generate-source-manifest.mjs'), 'source manifest generator must exist');
assert(fs.existsSync('source-manifest.json'), 'release source manifest must exist');
const verifier = fs.readFileSync('tools/verify-browser-node.mjs', 'utf8');
for (const required of [
  'TITAN_ZERO_BROWSER_NODE_VERIFY: PASS',
  'isLegacyTest',
  'Titan Zero Browser Node',
  'source-manifest.json',
  'importScripts',
  'donor-repository-intelligence',
  'donor-workforce',
  'approved-network isolation'
]) assert(verifier.includes(required), `Browser Node verifier must cover ${required}`);
console.log('PASS Browser Node unified verifier contract');
