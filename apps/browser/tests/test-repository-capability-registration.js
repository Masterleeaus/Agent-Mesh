const fs=require('fs'); const vm=require('vm'); const assert=require('assert');
const context={console:{log(){},warn(){},error(){}},Map,Set,Object,Array,String,Number,Boolean,RegExp,JSON,Math,Date}; context.globalThis=context; vm.createContext(context);
const load=f=>vm.runInContext(fs.readFileSync(f,'utf8'),context,{filename:f});
load('src/lib/capability-registry.js');
for(const f of [
'repository-policy.js','repository-inventory.js','repository-search.js','symbol-index.js','dependency-graph.js','laravel-tracer.js','migration-guard.js','diff-engine.js','impact-engine.js','change-set.js','rollback-planner.js','mutation-envelope.js','command-policy.js','test-selector.js','verification-planner.js','dependency-analyzer.js','git-intelligence.js','log-analyzer.js','error-classifier.js'
]) load(`src/repository/${f}`);
for(const f of ['host-capabilities.js','repository-host-adapter.js','mcp-adapter.js','remote-context-broker.js']) load(`src/integration/${f}`);
load('src/lib/repository-host-integration.js');
const registration=context.CodeeRepositoryHostIntegration.register();
assert.strictEqual(registration.registered,true);
const snapshot=context.CodeeCapabilityRegistry.snapshot();
assert.strictEqual(snapshot.repositoryCapabilities.length,28,'hidden compatibility adapter must register 28 repository/MCP capabilities');
assert.strictEqual(snapshot.prompts.length,0,'Browser Node must not register repository developer prompts');
assert.strictEqual(snapshot.skills.length,0,'Browser Node must not register repository developer skills');
assert.strictEqual(snapshot.profiles.length,0,'Browser Node must not register repository developer profiles');
assert(snapshot.contextProviders.some(x=>x.id==='repository-runner-context'));
assert(snapshot.contextProviders.some(x=>x.id==='repository-plan-preflight'));
assert(snapshot.settingsSections.some(x=>x.id==='repository-coding-intelligence'));
assert(snapshot.diagnosticsSections.some(x=>x.id==='repository-coding-intelligence'));
assert.strictEqual(registration.createdTopLevelTabs,0);
assert.strictEqual(registration.authority.planAdvance,false);
console.log('Repository compatibility capability registration OK');
