'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {load}=require('./load-pack');
const sample=JSON.parse(fs.readFileSync(path.join(__dirname,'real-titan-sample.json'),'utf8'));
const FILES=['src/repository/repository-policy.js','src/repository/repository-inventory.js','src/repository/repository-search.js','src/repository/symbol-index.js','src/repository/dependency-graph.js','src/repository/laravel-tracer.js','src/repository/migration-guard.js','src/repository/dependency-analyzer.js'];

test('real Titan snapshot treats Crm extension files as first-class repository code',()=>{
 const g=load(FILES); const inv=g.CodeeRepositoryInventory.build(sample); assert.ok(inv.extensionFiles>=6); assert.equal(inv.frameworkSignals.laravel,true);
 const symbols=g.CodeeSymbolIndex.build(sample); assert.ok(symbols.symbols.some(s=>s.path.includes('app/Extensions/Crm/')&&s.name==='CrmDashboardService'));
 const found=g.CodeeRepositorySearch.search(sample,'tenant_company_id',{limit:50}); assert.ok(found.matches.some(m=>m.path.includes('app/Extensions/Crm/')));
 const deps=g.CodeeDependencyAnalyzer.analyze(sample); assert.ok(deps.composer.dependencies.length>0);
});
