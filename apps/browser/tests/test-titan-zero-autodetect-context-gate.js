const fs=require('fs'); const vm=require('vm'); const assert=require('assert');
const loadOrder=['titan-zero-core-profile.js','titan-zero-snapshot-policy.js','titan-zero-project-detector.js','titan-zero-sql-analyzer.js','titan-zero-route-analyzer.js','titan-zero-theme-analyzer.js','titan-zero-context.js','titan-zero-diagnostics.js','titan-zero-prompts.js','titan-zero-skills.js','titan-zero-pack.js','titan-zero-schema-graph.js','titan-zero-migration-analyzer.js','titan-zero-tenancy-analyzer.js','titan-zero-php-architecture.js','titan-zero-frontend-analyzer.js','titan-zero-navigation-analyzer.js','titan-zero-impact-engine.js','titan-zero-test-matrix.js','titan-zero-runtime-diagnostics.js','titan-zero-model-schema-analyzer.js','titan-zero-route-consumer-index.js','titan-zero-version-analyzer.js','titan-zero-config-analyzer.js','titan-zero-project-graph.js','titan-zero-context-selector.js','titan-zero-command-catalog.js','titan-zero-risk-rules.js','titan-zero-error-classifier.js','titan-zero-knowledge.js','titan-zero-development-prompts.js','titan-zero-development-skills.js','titan-zero-development-profiles.js','titan-zero-developer-pack.js','titan-zero-receiver-adapter.js'];
const ctx={console:{log(){},warn(){},error(){}},Map,Set,Object,Array,String,Number,Boolean,RegExp,JSON,Math,Date};ctx.globalThis=ctx;vm.createContext(ctx);
vm.runInContext(fs.readFileSync('src/lib/capability-registry.js','utf8'),ctx);for(const f of loadOrder)vm.runInContext(fs.readFileSync(`src/titan-zero/${f}`,'utf8'),ctx);vm.runInContext(fs.readFileSync('src/lib/titan-zero-host-integration.js','utf8'),ctx);

const generic={files:{
  artisan:'#!/usr/bin/env php',
  'composer.json':JSON.stringify({require:{'laravel/framework':'^12.0'}}),
  'routes/web.php':"<?php Route::get('/health', fn()=> 'ok')->name('health');",
  'app/Models/User.php':'<?php class User extends Model {}'
}};
const automatic=ctx.CodeeTitanZeroHostIntegration.analyze(generic,{autoDetect:true},{task:'health'});
assert.strictEqual(automatic.report.project.recognized,false,'fixture must be a non-Titan Laravel project');
assert.strictEqual(automatic.applicable,false,'auto-detect must decline non-Titan projects');
assert.strictEqual(automatic.context,'','non-Titan projects must not receive Titan context when auto-detect is enabled');
assert.deepStrictEqual(JSON.parse(JSON.stringify(automatic.impact)),{domains:[],riskLevel:'low',recommendations:[]},'non-Titan projects must not receive Titan impact advice');
assert.strictEqual(automatic.safeSummary.context,'','stored summary must not retain Titan context for an inapplicable project');

const explicit=ctx.CodeeTitanZeroHostIntegration.analyze(generic,{autoDetect:false},{task:'health'});
assert.strictEqual(explicit.applicable,true,'disabling auto-detect means explicit analysis was requested');
assert(explicit.context.includes('Titan Zero Developer Intelligence'),'explicit analysis must still produce Titan context');

const recognized={files:{
  artisan:'#!/usr/bin/env php',
  'composer.json':JSON.stringify({require:{'laravel/framework':'^12.0'}}),
  'routes/panel.php':"<?php Route::get('/panel', fn()=> 'ok')->name('panel');",
  'config/themes.php':'<?php return [];',
  'app/Domains/Titan/Marker.php':'<?php namespace App\\Domains\\Titan; class Marker {}'
}};
const titan=ctx.CodeeTitanZeroHostIntegration.analyze(recognized,{autoDetect:true},{task:'panel'});
assert.strictEqual(titan.report.project.recognized,true,'fixture must be recognized as Titan Zero');
assert.strictEqual(titan.applicable,true,'auto-detect must enable recognized Titan Zero projects');
assert(titan.context.includes('Titan Zero Developer Intelligence'),'recognized Titan projects must receive context');
console.log('Titan Zero auto-detect context gate OK');
