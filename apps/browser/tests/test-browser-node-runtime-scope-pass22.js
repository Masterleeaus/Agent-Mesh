const fs = require('fs');
const path = require('path');
const assert = require('assert');

const worker = fs.readFileSync(path.join(__dirname, '..', 'src', 'lib', 'service-worker.js'), 'utf8');

const navMatch = worker.match(/const CURRENT_NAVIGATION_VIEWS = Object\.freeze\(\[([^\]]+)\]\);/);
assert(navMatch, 'CURRENT_NAVIGATION_VIEWS must remain declared');
for (const view of ['repository', 'repository-host', 'prompts', 'skills', 'titan-zero']) {
  assert(!navMatch[1].includes(`'${view}'`), `development-only view must not be routable: ${view}`);
}

for (const required of [
  '../browser/browser-capability-contract.js',
  '../browser/browser-policy.js',
  '../browser/browser-perception.js',
  '../browser/browser-interaction.js',
  '../ai/provider-gateway.js',
  '../intelligence/intelligence-host.js',
  '../integration/titan-mcp-runtime.js',
  '../workforce/personal-workforce.js',
  '../workforce/titan-workforce-gateway.js',
  'workforce-host-integration.js'
]) {
  assert(worker.includes(required), `operational Browser Node runtime must remain loaded: ${required}`);
}

// Compatibility libraries may remain loaded until their live worker consumers are converged.
// Product scope is enforced by routability and the visible-surface regression, not by
// prematurely deleting dependencies that still back verified runtime APIs.
console.log('PASS: Browser Node routes only product surfaces while preserving required runtime compatibility');
