'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {load}=require('./load-pack');
const FILES=[
 'src/repository/repository-policy.js','src/repository/repository-inventory.js','src/repository/repository-search.js','src/repository/symbol-index.js','src/repository/dependency-graph.js','src/repository/laravel-tracer.js','src/repository/migration-guard.js','src/repository/diff-engine.js','src/repository/impact-engine.js','src/repository/change-set.js','src/repository/rollback-planner.js','src/repository/mutation-envelope.js','src/repository/command-policy.js','src/repository/test-selector.js','src/repository/verification-planner.js','src/repository/dependency-analyzer.js','src/repository/git-intelligence.js','src/repository/log-analyzer.js','src/repository/error-classifier.js','src/integration/host-capabilities.js','src/integration/mcp-adapter.js','src/integration/remote-context-broker.js','src/catalog/repository-prompts.js','src/catalog/repository-skills.js','src/catalog/repository-profiles.js','src/repository/repository-coding-pack.js','src/integration/receiver-adapter.js'
];

test('pack descriptor is large, additive and never advances plans',()=>{
 const g=load(FILES);
 const d=g.CodeeRepositoryCodingPack.registrationDescriptor();
 assert.equal(d.authority.mayAdvancePlan,false);
 assert.equal(d.authority.implementsMcpRuntime,false);
 assert.equal(d.scope.extensionsIncluded,true);
 assert.ok(d.prompts.length>=20);
 assert.ok(d.skills.length>=20);
 assert.ok(d.profiles.length>=8);
 assert.ok(d.capabilities.length>=20);
});

test('receiver adapter registers into existing surfaces without new top-level tabs',()=>{
 const g=load(FILES);
 const events=[];
 const host={
  registerRepositoryCapability:x=>events.push(['cap',x]),
  registerPrompts:x=>events.push(['prompts',x]), registerSkills:x=>events.push(['skills',x]), registerProfiles:x=>events.push(['profiles',x]),
  registerDiagnosticsSection:x=>events.push(['diag',x]), registerSettingsSection:x=>events.push(['settings',x]), registerContextProvider:x=>events.push(['context',x])
 };
 const result=g.CodeeRepositoryReceiverAdapter.register(host,{});
 assert.equal(result.createdTopLevelTabs,0);
 assert.equal(result.authority.planAdvance,false);
 assert.ok(events.length>=7);
});
