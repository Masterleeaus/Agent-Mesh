const fs=require('fs'); const vm=require('vm'); const assert=require('assert');
const context={console:{log(){},warn(){},error(){}},Map,Set,Object,Array,String,Number,Boolean,RegExp,JSON,Math,Date}; context.globalThis=context; vm.createContext(context);
const load=f=>vm.runInContext(fs.readFileSync(f,'utf8'),context,{filename:f});
load('src/lib/capability-registry.js');
for(const f of [
'repository-policy.js','repository-inventory.js','repository-search.js','symbol-index.js','dependency-graph.js','laravel-tracer.js','migration-guard.js','diff-engine.js','impact-engine.js','change-set.js','rollback-planner.js','mutation-envelope.js','command-policy.js','test-selector.js','verification-planner.js','dependency-analyzer.js','git-intelligence.js','log-analyzer.js','error-classifier.js'
]) load(`src/repository/${f}`);
for(const f of ['host-capabilities.js','repository-host-adapter.js','mcp-adapter.js','remote-context-broker.js']) load(`src/integration/${f}`);
for(const f of ['repository-prompts.js','repository-skills.js','repository-profiles.js']) load(`src/catalog/${f}`);
load('src/repository/repository-coding-pack.js'); load('src/integration/receiver-adapter.js'); load('src/lib/repository-host-integration.js');
const registration=context.CodeeRepositoryHostIntegration.register();
assert.strictEqual(registration.registered,true);
const snapshot=context.CodeeCapabilityRegistry.snapshot();
assert.strictEqual(snapshot.repositoryCapabilities.length,28,'must register 28 repository capabilities');
assert.strictEqual(snapshot.prompts.length,24,'must register 24 repository prompts in isolation');
assert.strictEqual(snapshot.skills.length,28,'must register 28 repository skills in isolation');
assert.strictEqual(snapshot.profiles.length,10,'must retain 10 repository profiles');
assert(snapshot.contextProviders.some(x=>x.id==='repository-runner-context'));
assert(snapshot.contextProviders.some(x=>x.id==='repository-plan-preflight'));
assert(snapshot.settingsSections.some(x=>x.id==='repository-coding-intelligence'));
assert(snapshot.diagnosticsSections.some(x=>x.id==='repository-coding-intelligence'));
assert.strictEqual(registration.createdTopLevelTabs,0);
assert.strictEqual(registration.authority.planAdvance,false);
console.log('Repository capability registration OK');
