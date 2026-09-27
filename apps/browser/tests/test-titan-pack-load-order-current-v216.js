const fs = require('fs');
const assert = require('assert');

const sw = fs.readFileSync('src/lib/service-worker.js', 'utf8');
const pack = JSON.parse(fs.readFileSync('src/titan-zero/pack.json', 'utf8'));
const docs = fs.readFileSync('docs/titan-zero/AGENT-INTEGRATION-PROMPT.md', 'utf8');

const active = [...sw.matchAll(/['"]\.\.\/titan-zero\/([^'"]+\.js)['"]/g)]
  .map(m => `src/titan-zero/${m[1]}`);
assert(active.length > 20, 'service worker must load the active Titan analyzer pack');
assert.deepStrictEqual(pack.load_order, active, 'pack.json load_order must exactly reflect production Titan import order');
assert(!pack.load_order.includes('src/titan-zero/titan-zero-pack.js'), 'legacy CorePack must not be advertised as production load order');
assert(/production_note/i.test(JSON.stringify(pack)), 'pack metadata must explain that legacy donor modules are non-production');

for (const stale of [
  '- ignoreExtensions: true and **locked**',
  'Never ingest `app/Extensions/*` for this pack.',
  '`app/Extensions/*` cannot enter the Titan Zero snapshot or graph.'
]) {
  assert(!docs.includes(stale), `current integration prompt must not contain executable-looking stale instruction: ${stale}`);
}
assert(/HISTORICAL|SUPERSEDED/i.test(docs), 'historical Mega Pack 1 scope must remain clearly labelled as superseded');

console.log('Titan pack load order and historical scope drift OK');
