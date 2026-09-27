const fs=require('fs'); const vm=require('vm'); const assert=require('assert');
const loadOrder=['titan-zero-core-profile.js','titan-zero-snapshot-policy.js','titan-zero-project-detector.js','titan-zero-sql-analyzer.js','titan-zero-route-analyzer.js','titan-zero-theme-analyzer.js','titan-zero-context.js','titan-zero-diagnostics.js','titan-zero-prompts.js','titan-zero-skills.js','titan-zero-pack.js','titan-zero-schema-graph.js','titan-zero-migration-analyzer.js','titan-zero-tenancy-analyzer.js','titan-zero-php-architecture.js','titan-zero-frontend-analyzer.js','titan-zero-navigation-analyzer.js','titan-zero-impact-engine.js','titan-zero-test-matrix.js','titan-zero-runtime-diagnostics.js','titan-zero-model-schema-analyzer.js','titan-zero-route-consumer-index.js','titan-zero-version-analyzer.js','titan-zero-config-analyzer.js','titan-zero-project-graph.js','titan-zero-context-selector.js','titan-zero-command-catalog.js','titan-zero-risk-rules.js','titan-zero-error-classifier.js','titan-zero-knowledge.js','titan-zero-development-prompts.js','titan-zero-development-skills.js','titan-zero-development-profiles.js','titan-zero-developer-pack.js','titan-zero-receiver-adapter.js'];
const ctx={console:{log(){},warn(){},error(){}},Map,Set,Object,Array,String,Number,Boolean,RegExp,JSON,Math,Date}; ctx.globalThis=ctx; vm.createContext(ctx);
vm.runInContext(fs.readFileSync('src/lib/capability-registry.js','utf8'),ctx);
for(const f of loadOrder) vm.runInContext(fs.readFileSync(`src/titan-zero/${f}`,'utf8'),ctx);
vm.runInContext(fs.readFileSync('src/lib/titan-zero-host-integration.js','utf8'),ctx);

const registration=ctx.CodeeTitanZeroHostIntegration.register({ignoreExtensions:false,parseSqlRows:true});
assert.strictEqual(registration.createdTopLevelTabs,0);
assert.strictEqual(registration.authority.planAdvance,false);
assert.strictEqual(registration.authority.repositoryMutation,false);
assert.strictEqual(registration.authority.commandExecution,false);
assert.strictEqual(registration.authority.extensionInspection,true);
const registry=ctx.CodeeCapabilityRegistry.snapshot();
assert.strictEqual(registry.prompts.length,35);
assert.strictEqual(registry.skills.length,38);
assert.strictEqual(registry.profiles.length,14);
const settings=registry.settingsSections.find(s=>s.id==='titan-zero-developer-intelligence');
assert(settings,'Titan settings section must be registered');
const includeField=settings.fields.find(f=>f.key==='includeExtensions');
const rowsField=settings.fields.find(f=>f.key==='parseSqlRows');
assert.strictEqual(includeField.locked,true); assert.strictEqual(includeField.value,true);
assert.strictEqual(rowsField.locked,true); assert.strictEqual(rowsField.value,false);
const normalized=ctx.CodeeTitanZeroHostIntegration.normalizeSettings({ignoreExtensions:false,parseSqlRows:true});
assert.strictEqual(normalized.ignoreExtensions,false); assert.strictEqual(normalized.includeExtensions,true); assert.strictEqual(normalized.parseSqlRows,false);

const files={
 'artisan':'#!/usr/bin/env php',
 'app/Domains/Titan/Marker.php':'<?php namespace App\\Domains\\Titan; class Marker {}',
 'composer.json':JSON.stringify({require:{php:'^8.2','laravel/framework':'^10.0','livewire/livewire':'^3.5'}}),
 'package.json':JSON.stringify({dependencies:{react:'^19.2.5',alpinejs:'^3.15.8'},devDependencies:{vite:'^7.1.3',tailwindcss:'^3.4.15'},scripts:{build:'vite build'}}),
 'routes/web.php':"<?php Route::get('/dashboard',[DashboardController::class,'index'])->name('dashboard');",
 'app/Http/Controllers/DashboardController.php':"<?php namespace App\\Http\\Controllers; use App\\Services\\DashboardService; class DashboardController { public function __construct(DashboardService $service){} public function index(){} }",
 'app/Services/DashboardService.php':"<?php namespace App\\Services; use App\\Models\\Project; class DashboardService { public function load(){ return Project::query()->where('company_id',1)->get(); } }",
 'app/Models/Project.php':"<?php namespace App\\Models; use Illuminate\\Database\\Eloquent\\Model; class Project extends Model { protected $fillable=['company_id','name','ghost_column']; protected $casts=['settings'=>'array']; }",
 'resources/views/default/dashboard.blade.php':"<a href=\"{{ route('dashboard') }}\" x-data=\"{open:true}\">Dashboard</a>",
 'resources/js/app.jsx':"import React from 'react';",
 'database/migrations/2026_08_16_000001_add_project_status.php':"<?php return new class extends Migration { public function up(){ Schema::table('projects', function(Blueprint $table){ $table->string('status')->default('active')->index('projects_company_id_status_index_name_that_is_far_too_long_for_mysql_identifier_limit_123456789'); }); } };",
 'tests/Feature/DashboardTest.php':"<?php test('dashboard', fn()=>expect(true)->toBeTrue());",
 'app/Extensions/Secret/Hidden.php':"<?php namespace App\\Extensions\\Secret; class Hidden { public function routeName(){ return route('dashboard'); } }",
 '.env.local':'OPENAI_API_KEY=NEVER_EXPORT'
};
const sql=`
CREATE TABLE \`companies\` (\`id\` bigint unsigned NOT NULL, PRIMARY KEY (\`id\`));
CREATE TABLE \`projects\` (\`id\` bigint unsigned NOT NULL, \`company_id\` bigint unsigned DEFAULT NULL, \`name\` varchar(255) NOT NULL, \`settings\` json DEFAULT NULL, PRIMARY KEY (\`id\`));
CREATE TABLE \`tenant_notes\` (\`id\` bigint unsigned NOT NULL, \`tenant_company_id\` bigint unsigned NOT NULL, \`body\` text, PRIMARY KEY (\`id\`));
INSERT INTO \`projects\` VALUES (1,1,'NEVER_EXPORT_ROW',NULL);`;
const snapshot={files,sqlText:sql,navigation:[{id:1,parent_id:null,title:'Dashboard',route:'dashboard',permission:'dashboard.view'},{id:2,parent_id:999,title:'Broken',route:'missing.route',permission:'missing.permission'}],permissions:['dashboard.view']};
const analysis=ctx.CodeeTitanZeroHostIntegration.analyze(snapshot,{}, {task:'change project dashboard tenancy and status',changedPaths:['app/Models/Project.php','database/migrations/2026_08_16_000001_add_project_status.php','resources/views/default/dashboard.blade.php']});
assert.strictEqual(analysis.enabled,true);
assert.strictEqual(analysis.report.tenancy.mixedBoundary,true,'mixed tenancy boundary must be reported');
assert(analysis.report.migrations.risks.some(r=>r.code==='MYSQL_IDENTIFIER_TOO_LONG'),'migration warning must survive safe export');
assert(analysis.report.modelSchema.findings.some(f=>f.code==='FILLABLE_COLUMN_MISSING'),'model/schema drift must be derived');
assert(analysis.report.routeConsumers.knownRoutes.includes('dashboard'),'route consumers must be indexed');
assert(analysis.report.frontend.bladeFiles>=1 && analysis.report.frontend.reactFiles.length>=1,'frontend surfaces must be derived');
assert(analysis.impact.domains.includes('database') && analysis.impact.domains.includes('frontend'),'impact domains must be generated');
assert(Array.isArray(analysis.testMatrix.commands) && analysis.testMatrix.commands.length>0,'test matrix must be generated');
assert(analysis.testMatrix.commands.every(item=>item.mode==='recommendation'),'test matrix commands must remain recommendations');
assert(analysis.report.projectGraph.nodes.some(n=>String(n.path||'').startsWith('app/Extensions/')),'project graph must include relevant extension evidence');
const serialized=JSON.stringify(analysis);
assert(!serialized.includes('NEVER_EXPORT_ROW'),'SQL row values must never leave the host sanitizer');
assert(!serialized.includes('OPENAI_API_KEY=NEVER_EXPORT'),'env values must never leave the host sanitizer');
const commands=ctx.CodeeTitanZeroCommandCatalog.list();
assert(commands.length>0 && commands.every(command=>typeof command.execute==='undefined'),'donor command catalog must remain descriptors, never executable callbacks');

ctx.CodeeCapabilityRegistry.clear();
ctx.CodeeTitanZeroHostIntegration.register({enabled:false});
const disabledProvider=ctx.CodeeCapabilityRegistry.getContextProviders('runner')[0];
assert.strictEqual(disabledProvider.provide(snapshot),'','disabling Titan Zero must remove injected context');
console.log('Titan Zero full integration contract OK');
