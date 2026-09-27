const assert = require('assert');
const fs = require('fs');
const html = fs.readFileSync('src/sidebar/sidebar.html', 'utf8');
const js = fs.readFileSync('src/sidebar/sidebar.js', 'utf8');
const css = fs.readFileSync('src/sidebar/sidebar.css', 'utf8');
const worker = fs.readFileSync('src/lib/service-worker.js', 'utf8');

for (const id of ['capability-registry-section','capability-search','capability-readiness-filter','capability-subsystem-filter','capability-refresh-btn','capability-summary','capability-table-body']) {
  assert(html.includes(`id="${id}"`), `Capability UI must contain ${id}`);
}
assert(js.includes('renderCapabilityRegistry'), 'Sidebar must render capability registry rows');
assert(js.includes('loadCapabilityRegistryUi'), 'Sidebar must load canonical capability status');
assert(js.includes("action: 'GET_CAPABILITY_REGISTRY'"), 'Capability UI must use canonical registry worker endpoint');
assert(worker.includes("'capability-status.js'"), 'Worker must import capability status normalizer');
assert(worker.includes('CodeeCapabilityStatus.build'), 'Worker must derive capability UI from canonical registry and runtime state');
assert(worker.includes('capabilityView'), 'Worker payload must expose normalized capability view');
assert(css.includes('.capability-table'), 'Capability UI must use theme-owned styling');
assert(css.includes('.capability-readiness'), 'Capability readiness must have a theme-owned visual treatment');
console.log('Capability Registry UI is wired to canonical runtime-derived status');
