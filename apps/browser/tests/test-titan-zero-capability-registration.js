const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

const loadOrder = [
  'titan-zero-core-profile.js','titan-zero-snapshot-policy.js','titan-zero-project-detector.js','titan-zero-sql-analyzer.js','titan-zero-route-analyzer.js','titan-zero-theme-analyzer.js','titan-zero-context.js','titan-zero-diagnostics.js','titan-zero-prompts.js','titan-zero-skills.js','titan-zero-pack.js','titan-zero-schema-graph.js','titan-zero-migration-analyzer.js','titan-zero-tenancy-analyzer.js','titan-zero-php-architecture.js','titan-zero-frontend-analyzer.js','titan-zero-navigation-analyzer.js','titan-zero-impact-engine.js','titan-zero-test-matrix.js','titan-zero-runtime-diagnostics.js','titan-zero-model-schema-analyzer.js','titan-zero-route-consumer-index.js','titan-zero-version-analyzer.js','titan-zero-config-analyzer.js','titan-zero-project-graph.js','titan-zero-context-selector.js','titan-zero-command-catalog.js','titan-zero-risk-rules.js','titan-zero-error-classifier.js','titan-zero-knowledge.js','titan-zero-development-prompts.js','titan-zero-development-skills.js','titan-zero-development-profiles.js','titan-zero-developer-pack.js','titan-zero-receiver-adapter.js'
];

const context = { console: { log(){}, warn(){}, error(){} }, Map, Set, Object, Array, String, Number, Boolean, RegExp, JSON, Math };
context.globalThis = context;
vm.createContext(context);
vm.runInContext(fs.readFileSync('src/lib/capability-registry.js','utf8'), context);
for (const file of loadOrder) vm.runInContext(fs.readFileSync(`src/titan-zero/${file}`,'utf8'), context);
vm.runInContext(fs.readFileSync('src/lib/titan-zero-host-integration.js','utf8'), context);

const result = context.CodeeTitanZeroHostIntegration.register();
assert.strictEqual(result.registered, true);
const snapshot = context.CodeeCapabilityRegistry.snapshot();
assert.strictEqual(snapshot.prompts.length, 35, 'must register all 35 prompts');
assert.strictEqual(snapshot.skills.length, 38, 'must register all 38 skills');
assert.strictEqual(snapshot.profiles.length, 14, 'must retain all 14 profiles in canonical capability data');
assert(snapshot.contextProviders.some(p => p.id === 'titan-zero-runner-context'));
assert(snapshot.contextProviders.some(p => p.id === 'titan-zero-plan-preflight'));
assert.strictEqual(snapshot.settingsSections.length, 1);
assert.strictEqual(snapshot.diagnosticsSections.length, 1);
assert.strictEqual(result.createdTopLevelTabs, 0, 'must not create a Titan Zero top-level tab');
assert.deepStrictEqual(JSON.parse(JSON.stringify(result.authority)), {planAdvance:false, repositoryMutation:false, commandExecution:false, extensionInspection:true});
console.log('Titan Zero capability registration OK');
