const fs = require('fs');
const assert = require('assert');

assert(fs.existsSync('package.json'), 'release must provide package.json');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
assert.strictEqual(pkg.scripts?.test, 'node tools/verify-codee.mjs', 'npm test must run the canonical verifier');
assert(fs.existsSync('tools/verify-codee.mjs'), 'canonical verifier must exist');
assert(fs.existsSync('tools/generate-source-manifest.mjs'), 'source manifest generator must exist');
assert(fs.existsSync('source-manifest.json'), 'release source manifest must exist');
const verifier = fs.readFileSync('tools/verify-codee.mjs', 'utf8');
for (const required of [
  'CODEE_FULL_VERIFY: PASS',
  'test-',
  'node --check',
  'manifest.json',
  'importScripts',
  'unzip',
  'donor-repository-intelligence',
  'donor-workforce',
  'MAX_PARALLEL_TESTS',
  'source-manifest.json'
]) assert(verifier.includes(required), `verifier must cover ${required}`);
console.log('unified verifier contract OK');
