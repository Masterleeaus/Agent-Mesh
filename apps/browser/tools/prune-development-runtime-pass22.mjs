#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const workerPath = path.join(root, 'src', 'lib', 'service-worker.js');
let source = fs.readFileSync(workerPath, 'utf8');
const before = source;

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
  const quoted = `'${modulePath}',`;
  source = source.split('\n').filter(line => !line.includes(quoted)).join('\n');
}

const oldViews = "const CURRENT_NAVIGATION_VIEWS = Object.freeze(['dashboard','runner','plans','history','artifacts','intelligence','workforce','repository','titan-zero','browser','connections','mcp','repository-host','prompts','skills','knowledge','settings','diagnostics','about']);";
const newViews = "const CURRENT_NAVIGATION_VIEWS = Object.freeze(['dashboard','runner','plans','history','artifacts','intelligence','workforce','browser','connections','mcp','knowledge','settings','diagnostics','about']);";
if (source.includes(oldViews)) source = source.replace(oldViews, newViews);
else if (!source.includes(newViews)) throw new Error('Navigation view declaration is not in an expected state');

for (const modulePath of forbiddenStartupModules) {
  if (source.includes(`'${modulePath}',`)) throw new Error(`Development-only startup module remains: ${modulePath}`);
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
  if (!source.includes(`'${required}',`)) throw new Error(`Required operational startup module missing: ${required}`);
}

if (source === before) {
  console.log('Browser Node development runtime already pruned; no changes required.');
  process.exit(0);
}
fs.writeFileSync(workerPath, source);
console.log('Pruned development-only repository/coding startup modules from Browser Node.');
