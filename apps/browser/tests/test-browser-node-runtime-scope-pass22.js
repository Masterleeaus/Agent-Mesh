const fs = require('fs');
const path = require('path');
const assert = require('assert');

const worker = fs.readFileSync(path.join(__dirname, '..', 'src', 'lib', 'service-worker.js'), 'utf8');

const forbiddenStartupModules = [
  '../repository/repository-policy.js',
  '../repository/repository-inventory.js',
  '../repository/repository-search.js',
  '../repository/symbol-index.js',
  '../repository/dependency-graph.js',
  '../repository/laravel-tracer.js',
  '../repository/migration-guard.js',
  '../repository/diff-engine.js',
  '../repository/impact-engine.js',
  '../repository/change-set.js',
  '../repository/rollback-planner.js',
  '../repository/mutation-envelope.js',
  '../repository/command-policy.js',
  '../repository/test-selector.js',
  '../repository/verification-planner.js',
  '../repository/dependency-analyzer.js',
  '../repository/git-intelligence.js',
  '../repository/log-analyzer.js',
  '../repository/error-classifier.js',
  '../integration/repository-host-adapter.js',
  '../catalog/repository-prompts.js',
  '../catalog/repository-skills.js',
  '../catalog/repository-profiles.js',
  '../repository/repository-coding-pack.js',
  'repository-host-integration.js',
  '../titan-zero/titan-zero-development-prompts.js',
  '../titan-zero/titan-zero-development-skills.js',
  '../titan-zero/titan-zero-development-profiles.js',
  '../titan-zero/titan-zero-developer-pack.js'
];

for (const modulePath of forbiddenStartupModules) {
  assert(!worker.includes(modulePath), `development-only startup module must not load in Browser Node: ${modulePath}`);
}

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

console.log('PASS: Browser Node startup graph excludes development-only repository/coding modules');
