import assert from 'node:assert/strict';
import fs from 'node:fs';
const census=JSON.parse(fs.readFileSync(new URL('../titan-runtime/performance/compat-decomposition/pass01/COMPAT-RUNTIME-CENSUS.json',import.meta.url)));
const manifest=JSON.parse(fs.readFileSync(new URL('../manifest.json',import.meta.url)));
assert.equal(census.manager_base.merge,46);
assert.equal(census.target_total_bytes,47933157);
for (const name of ['titan-zero-chat-content.compat.js','titan-zero-chat-background.compat.js','titan-zero-chat-runtime.compat.js']) {
  const b=fs.readFileSync(new URL('../'+name,import.meta.url));
  const crypto=await import('node:crypto');
  assert.equal(b.length,census.targets[name].bytes,name+' size');
  assert.equal(crypto.createHash('sha256').update(b).digest('hex'),census.targets[name].sha256,name+' hash');
}
const cs=manifest.content_scripts.find(x=>x.js?.includes('titan-zero-chat-content.compat.js'));
assert.ok(cs); assert.equal(cs.run_at,'document_start'); assert.equal(cs.all_frames,true); assert.ok(cs.matches.includes('<all_urls>'));
assert.equal(census.targets['titan-zero-chat-content.compat.js'].startup_class,'ALWAYS_ON_ALL_WEB_PAGES');
assert.equal(census.targets['titan-zero-chat-background.compat.js'].startup_class,'BACKGROUND_STARTUP_IMPORT');
assert.equal(census.targets['titan-zero-chat-runtime.compat.js'].startup_class,'UI_SURFACE_ON_OPEN');
console.log('compat runtime decomposition pass01: PASS');
