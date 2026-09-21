import assert from 'node:assert/strict';
import fs from 'node:fs';
const graph=JSON.parse(fs.readFileSync(new URL('../titan-runtime/performance/compat-decomposition/pass02/STARTUP-CALL-GRAPH.json',import.meta.url)));
const reach=JSON.parse(fs.readFileSync(new URL('../titan-runtime/performance/compat-decomposition/pass02/STARTUP-REACHABILITY-MAP.json',import.meta.url)));
const domains=JSON.parse(fs.readFileSync(new URL('../titan-runtime/performance/compat-decomposition/pass02/DOMAIN-CLASSIFICATION.json',import.meta.url)));
assert.equal(graph.manager_merge,46);
assert.ok(graph.edges.some(e=>e.from==='manifest.content_scripts'&&e.to==='titan-zero-chat-content.compat.js'&&e.when==='document_start'));
assert.ok(graph.edges.some(e=>e.from==='compatibility/monica/background-runtime-boundary.mjs'&&e.to==='titan-zero-chat-background.compat.js'));
assert.deepEqual(reach.surfaces.background_service_worker.path,['manifest.background.service_worker','background-bootstrap.js','compatibility/monica/background-runtime-boundary.mjs','titan-zero-chat-background.compat.js']);
assert.equal(domains.classification_policy.feature_removal_for_size_only,false);
for (const n of ['titan-zero-chat-content.compat.js','titan-zero-chat-background.compat.js','titan-zero-chat-runtime.compat.js']) {
  assert.equal(domains.bundles[n].separability_status,'UNPROVEN_PASS2_CLASSIFICATION_ONLY');
  assert.ok(domains.bundles[n].always_on_shell_candidate.classification==='RETAIN_UNTIL_EQUIVALENCE_PROVEN');
}
assert.equal(domains.bundles['titan-zero-chat-content.compat.js'].startup_role,'content');
assert.equal(domains.bundles['titan-zero-chat-background.compat.js'].startup_role,'background');
assert.equal(domains.bundles['titan-zero-chat-runtime.compat.js'].startup_role,'runtime');
console.log('compat runtime decomposition pass02: PASS');
