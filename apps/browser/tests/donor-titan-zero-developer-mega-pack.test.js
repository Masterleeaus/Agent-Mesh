const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const modules = [
  'titan-zero-core-profile.js',
  'titan-zero-snapshot-policy.js',
  'titan-zero-project-detector.js',
  'titan-zero-sql-analyzer.js',
  'titan-zero-route-analyzer.js',
  'titan-zero-theme-analyzer.js',
  'titan-zero-context.js',
  'titan-zero-diagnostics.js',
  'titan-zero-prompts.js',
  'titan-zero-skills.js',
  'titan-zero-pack.js',
  'titan-zero-schema-graph.js',
  'titan-zero-migration-analyzer.js',
  'titan-zero-tenancy-analyzer.js',
  'titan-zero-php-architecture.js',
  'titan-zero-frontend-analyzer.js',
  'titan-zero-navigation-analyzer.js',
  'titan-zero-impact-engine.js',
  'titan-zero-test-matrix.js',
  'titan-zero-runtime-diagnostics.js',
  'titan-zero-model-schema-analyzer.js',
  'titan-zero-route-consumer-index.js',
  'titan-zero-version-analyzer.js',
  'titan-zero-config-analyzer.js',
  'titan-zero-project-graph.js',
  'titan-zero-context-selector.js',
  'titan-zero-command-catalog.js',
  'titan-zero-risk-rules.js',
  'titan-zero-error-classifier.js',
  'titan-zero-knowledge.js',
  'titan-zero-development-prompts.js',
  'titan-zero-development-skills.js',
  'titan-zero-development-profiles.js',
  'titan-zero-developer-pack.js'
];

const sandbox = { console };
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
for (const file of modules) {
  const filename = path.join(root, 'src/titan-zero', file);
  vm.runInContext(fs.readFileSync(filename, 'utf8'), sandbox, { filename: file });
}

const files = {
  'artisan': '#!/usr/bin/env php',
  'composer.json': JSON.stringify({
    require: { php: '^8.2', 'laravel/framework': '^10.0', 'livewire/livewire': '^3.5' },
    'require-dev': { 'phpunit/phpunit': '^10.5' }
  }),
  'package.json': JSON.stringify({
    dependencies: { react: '^19.2.5', 'react-dom': '^19.2.5', alpinejs: '^3.15.8' },
    devDependencies: { vite: '^7.1.3', tailwindcss: '^3.4.15' },
    scripts: { build: 'vite build', test: 'vitest run' }
  }),
  'vite.config.mjs': "export default { build: { rollupOptions: { input: ['resources/js/app.jsx'] } } };",
  'routes/web.php': `<?php
    Route::middleware(['auth'])->group(function () {
      Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
      Route::post('/projects', [ProjectController::class, 'store'])->name('projects.store');
    });`,
  'routes/panel.php': `<?php Route::get('/settings', [SettingsController::class, 'index'])->middleware('auth')->name('settings');`,
  'app/Http/Controllers/ProjectController.php': `<?php namespace App\\Http\\Controllers;
    use App\\Services\\ProjectService;
    class ProjectController { public function __construct(private ProjectService $service) {} public function store() {} }`,
  'app/Services/ProjectService.php': `<?php namespace App\\Services; use App\\Models\\Project; class ProjectService { public function create(array $data) { return Project::create($data); } }`,
  'app/Models/Project.php': `<?php namespace App\\Models; use Illuminate\\Database\\Eloquent\\Model; class Project extends Model { protected $fillable=['company_id','name']; protected $casts=['settings'=>'array']; }`,
  'app/Providers/AppServiceProvider.php': `<?php namespace App\\Providers; use App\\Contracts\\Clock; use App\\Services\\SystemClock; class AppServiceProvider { public function register(){ $this->app->bind(Clock::class, SystemClock::class); } }`,
  'app/Livewire/DashboardWidget.php': `<?php namespace App\\Livewire; use Livewire\\Component; class DashboardWidget extends Component { public function render(){ return view('livewire.dashboard-widget'); } }`,
  'resources/views/default/dashboard.blade.php': `<x-layouts.app><livewire:dashboard-widget /></x-layouts.app>`,
  'resources/views/modern/dashboard.blade.php': `<x-layouts.app><div id="react-dashboard"></div></x-layouts.app>`,
  'resources/views/livewire/dashboard-widget.blade.php': `<div x-data="{open:true}" class="p-4">Widget</div>`,
  'resources/js/app.jsx': `import React from 'react'; import { createRoot } from 'react-dom/client';`,
  'database/migrations/2026_08_16_000001_add_project_status.php': `<?php return new class extends Migration { public function up(){ Schema::table('projects', function(Blueprint $table){ $table->string('status')->default('active')->index('projects_company_id_status_index_name_that_is_far_too_long_for_mysql_identifier_limit_123456789'); }); } };`,
  'tests/Feature/ProjectTest.php': `<?php test('creates project', function(){ expect(true)->toBeTrue(); });`,
  'app/Extensions/CRM/DoNotRead.php': '<?php secret extension internals',
  'resources/views/vendor/mail/html/layout.blade.php': '<html></html>'
};

const sql = `
CREATE TABLE \`companies\` (
  \`id\` bigint unsigned NOT NULL,
  \`name\` varchar(255) NOT NULL,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB;
CREATE TABLE \`projects\` (
  \`id\` bigint unsigned NOT NULL,
  \`company_id\` bigint unsigned DEFAULT NULL,
  \`user_id\` bigint unsigned DEFAULT NULL,
  \`name\` varchar(255) NOT NULL,
  \`settings\` json DEFAULT NULL,
  PRIMARY KEY (\`id\`),
  KEY \`projects_company_id_index\` (\`company_id\`),
  CONSTRAINT \`projects_company_fk\` FOREIGN KEY (\`company_id\`) REFERENCES \`companies\` (\`id\`)
) ENGINE=InnoDB;
CREATE TABLE \`tenant_notes\` (
  \`id\` bigint unsigned NOT NULL,
  \`tenant_company_id\` bigint unsigned NOT NULL,
  \`body\` text,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB;
CREATE TABLE \`users\` (
  \`id\` bigint unsigned NOT NULL,
  \`email\` varchar(255) NOT NULL,
  \`password\` varchar(255) NOT NULL,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB;
CREATE TABLE \`crm_contacts\` (\`id\` bigint unsigned NOT NULL) ENGINE=InnoDB;
`;

const navigation = [
  { id: 1, parent_id: null, title: 'Dashboard', route: 'dashboard', permission: 'dashboard.view' },
  { id: 2, parent_id: null, title: 'Settings', route: 'settings', permission: 'settings.view' },
  { id: 3, parent_id: 999, title: 'Broken', route: 'missing.route', permission: 'missing.permission' }
];

const permissions = ['dashboard.view', 'settings.view'];

const report = sandbox.CodeeTitanZeroDeveloperPack.analyzeSnapshot({ files, sqlText: sql, navigation, permissions });
assert.equal(report.project.recognized, true);
assert.equal(report.project.stack.alpine, '^3.15.8');
assert.equal(report.project.ignoredFileCount, 0);

assert.equal(report.schemaGraph.tables.length, 5, 'extension/domain-prefixed SQL tables are first-class after Mega Pack 2 scope rebase');
assert.equal(report.schemaGraph.foreignKeys.length, 1);
assert.equal(report.schemaGraph.indexes.some(index => index.name === 'projects_company_id_index'), true);
assert.equal(report.schemaGraph.sensitiveColumns.some(item => item.column === 'password'), true);

assert.equal(report.migrations.risks.some(risk => risk.code === 'MYSQL_IDENTIFIER_TOO_LONG'), true);
assert.equal(report.migrations.filesAnalyzed, 1);

assert.equal(report.tenancy.boundaries.company.tables.includes('projects'), true);
assert.equal(report.tenancy.boundaries.tenant_company.tables.includes('tenant_notes'), true);
assert.equal(report.tenancy.mixedBoundary, true);
assert.equal(report.tenancy.files.some(item => item.path === 'app/Models/Project.php'), true);

assert.equal(report.architecture.controllers.length, 1);
assert.equal(report.architecture.models.length, 1);
assert.equal(report.architecture.serviceProviders.length, 1);
assert.equal(report.architecture.containerBindings.some(binding => binding.abstract.endsWith('Clock') && binding.concrete.endsWith('SystemClock')), true);

assert.equal(report.frontend.bladeFiles >= 3, true);
assert.equal(report.frontend.livewire.components.length, 1);
assert.equal(report.frontend.reactFiles.length, 1);
assert.equal(report.frontend.alpineFiles.length, 1);
assert.equal(report.frontend.themeFamilies.some(theme => theme.name === 'default'), true);

assert.equal(report.navigation.items, 3);
assert.equal(report.navigation.brokenParents.length, 1);
assert.equal(report.navigation.missingRoutes.length, 1);
assert.equal(report.navigation.missingPermissions.length, 1);

const impact = sandbox.CodeeTitanZeroImpactEngine.analyze({
  changedPaths: ['app/Models/Project.php', 'database/migrations/2026_08_16_000001_add_project_status.php', 'resources/views/default/dashboard.blade.php'],
  report
});
assert.equal(impact.domains.includes('database'), true);
assert.equal(impact.domains.includes('frontend'), true);
assert.equal(impact.domains.includes('tenancy'), true);
assert.equal(impact.riskLevel === 'high' || impact.riskLevel === 'critical', true);

const matrix = sandbox.CodeeTitanZeroTestMatrix.build(impact, { files });
assert.equal(matrix.commands.some(item => item.command.includes('php artisan migrate:status')), true);
assert.equal(matrix.commands.some(item => item.command.includes('npm run build')), true);
assert.equal(matrix.commands.every(item => item.mode === 'recommendation'), true);

assert.equal(report.runtimeDiagnostics.checks.some(check => check.id === 'migration-risk'), true);
assert.equal(report.modelSchema.models.length, 1);
assert.equal(report.versions.laravel, '^10.0');
assert.equal(Array.isArray(report.config.envKeys), true);
assert.equal(report.routeConsumers.knownRoutes.includes('dashboard'), true);
assert.equal(report.projectGraph.nodes.some(node => node.id === 'table:projects'), true);
assert.equal(Array.isArray(report.risks), true);
assert.equal(report.context.includes('Titan Zero Developer Intelligence'), true);
assert.equal(report.context.includes('Model/schema drift'), true);
assert.equal(report.context.includes('Sensitive config env names'), true);
assert.equal(report.context.length <= 18000, true);

const descriptor = sandbox.CodeeTitanZeroDeveloperPack.registrationDescriptor();
assert.equal(descriptor.authority.mayAdvancePlan, false);
assert.equal(descriptor.authority.mayMutateRepository, false);
assert.equal(descriptor.authority.mayInspectExtensions, true);
assert.equal(descriptor.prompts.length >= 24, true);
assert.equal(descriptor.skills.length >= 24, true);
assert.equal(descriptor.profiles.length >= 12, true);
assert.equal(descriptor.placements.runner, 'context_provider');
assert.equal(descriptor.placements.diagnostics, 'section:Titan Zero');

assert.equal(sandbox.CodeeTitanZeroKnowledge.facts.length >= 20, true);
assert.equal(sandbox.CodeeTitanZeroKnowledge.safetyRules.some(rule => rule.includes('app/Extensions') && rule.includes('Include')), true);

console.log('Titan Zero Developer Intelligence Mega Pack tests: PASS');
