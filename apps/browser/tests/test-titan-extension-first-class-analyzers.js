const fs=require('fs'),vm=require('vm'),assert=require('assert');const c={};c.globalThis=c;vm.createContext(c);
for(const f of ['src/titan-zero/titan-zero-snapshot-policy.js','src/titan-zero/titan-zero-route-analyzer.js','src/titan-zero/titan-zero-migration-analyzer.js','src/titan-zero/titan-zero-php-architecture.js','src/titan-zero/titan-zero-frontend-analyzer.js','src/titan-zero/titan-zero-model-schema-analyzer.js','src/titan-zero/titan-zero-theme-analyzer.js'])vm.runInContext(fs.readFileSync(f,'utf8'),c,{filename:f});
const files={
 'app/Extensions/Foo/routes/web.php':`<?php Route::get('/foo',[\\App\\Extensions\\Foo\\Http\\Controllers\\FooController::class,'index'])->name('foo.index');`,
 'app/Extensions/Foo/database/migrations/2026_01_01_create_foo.php':`<?php Schema::create('foo_items', function($t){});`,
 'app/Extensions/Foo/app/Http/Controllers/FooController.php':`<?php namespace App\\Extensions\\Foo\\Http\\Controllers; class FooController {}`,
 'app/Extensions/Foo/app/Models/FooItem.php':`<?php namespace App\\Extensions\\Foo\\Models; class FooItem { protected $table='foo_items'; }`,
 'app/Extensions/Foo/app/Services/FooService.php':`<?php namespace App\\Extensions\\Foo\\Services; class FooService {}`,
 'app/Extensions/Foo/resources/views/admin/index.blade.php':`<div x-data>Foo</div>`,
 'app/Extensions/Foo/app/Livewire/FooPanel.php':`<?php class FooPanel {}`
};
const routes=c.CodeeTitanZeroRouteAnalyzer.analyze(files);assert(routes.routes.some(r=>r.path==='app/Extensions/Foo/routes/web.php'),'extension route must be analyzed');
const migrations=c.CodeeTitanZeroMigrationAnalyzer.analyze(files,{schemaGraph:{tableMap:{}}});assert(migrations.files.some(x=>x.path.includes('/Extensions/Foo/database/migrations/')),'extension migration must be analyzed');
const arch=c.CodeeTitanZeroPhpArchitecture.analyze(files);assert(arch.controllers.some(x=>x.path.includes('FooController.php')),'extension controller must be classified');assert(arch.services.some(x=>x.path.includes('FooService.php')),'extension service must be classified');
const model=c.CodeeTitanZeroModelSchemaAnalyzer.analyze(files,{tableMap:{foo_items:{columns:[]}}});assert(model.models.some(x=>x.path.includes('/Extensions/Foo/app/Models/')),'extension model must be analyzed');
const front=c.CodeeTitanZeroFrontendAnalyzer.analyze(files);assert(front.blades.some(x=>x.includes('/Extensions/Foo/resources/views/')),'extension Blade view must be analyzed');assert(front.livewire.components.some(x=>x.path.includes('/Extensions/Foo/app/Livewire/')),'extension Livewire component must be analyzed');
const themes=c.CodeeTitanZeroThemeAnalyzer.analyze(Object.keys(files));assert(themes.themes.some(x=>String(x.name).includes('Foo')),'extension view family must be represented in theme analysis');
console.log('Titan specialized analyzers treat extension-owned routes/migrations/models/controllers/frontend as first-class');
