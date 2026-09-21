const fs=require('fs');const vm=require('vm');const assert=require('assert');
const load=['titan-zero-core-profile.js','titan-zero-snapshot-policy.js','titan-zero-project-detector.js','titan-zero-sql-analyzer.js','titan-zero-route-analyzer.js','titan-zero-theme-analyzer.js','titan-zero-context.js','titan-zero-diagnostics.js','titan-zero-prompts.js','titan-zero-skills.js','titan-zero-pack.js','titan-zero-schema-graph.js','titan-zero-migration-analyzer.js','titan-zero-tenancy-analyzer.js','titan-zero-php-architecture.js','titan-zero-frontend-analyzer.js','titan-zero-navigation-analyzer.js','titan-zero-impact-engine.js','titan-zero-test-matrix.js','titan-zero-runtime-diagnostics.js','titan-zero-model-schema-analyzer.js','titan-zero-route-consumer-index.js','titan-zero-version-analyzer.js','titan-zero-config-analyzer.js','titan-zero-project-graph.js','titan-zero-context-selector.js','titan-zero-command-catalog.js','titan-zero-risk-rules.js','titan-zero-error-classifier.js','titan-zero-knowledge.js','titan-zero-development-prompts.js','titan-zero-development-skills.js','titan-zero-development-profiles.js','titan-zero-developer-pack.js','titan-zero-receiver-adapter.js'];
const c={console:{log(){},warn(){},error(){}},Map,Set,Object,Array,String,Number,Boolean,RegExp,JSON,Math,Date};c.globalThis=c;vm.createContext(c);vm.runInContext(fs.readFileSync('src/lib/capability-registry.js','utf8'),c);for(const f of load)vm.runInContext(fs.readFileSync('src/titan-zero/'+f,'utf8'),c);vm.runInContext(fs.readFileSync('src/lib/titan-zero-host-integration.js','utf8'),c);
const secret='TOKEN_SECRET_93F8E';
const analysis=c.CodeeTitanZeroHostIntegration.analyze({files:{
  artisan:'x','composer.json':'{}','routes/panel.php':`<?php Route::get('/${secret}',fn()=>1)->name('panel.${secret}');`,
  'config/themes.php':'<?php return [];','app/Domains/Titan/Marker.php':'<?php class Marker {}'
}},{autoDetect:true},{task:'panel route'});
assert.strictEqual(analysis.applicable,true);
assert(!analysis.context.includes(secret),'bounded AI context must not contain route literal secrets');
assert(!JSON.stringify(analysis.selected).includes(secret),'returned selected context must not expose source-derived secret literals');
assert(!JSON.stringify(analysis.safeSummary).includes(secret),'persisted safe summary must not expose source-derived secret literals');
console.log('Titan Zero selected context strips source-derived literals');
