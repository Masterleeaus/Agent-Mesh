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
    'titan-zero-pack.js'
];

const sandbox = { console };
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
for (const file of modules) {
    vm.runInContext(fs.readFileSync(path.join(root, 'src/titan-zero', file), 'utf8'), sandbox, { filename: file });
}

const files = {
    'artisan': '#!/usr/bin/env php',
    'composer.json': JSON.stringify({ require: { php: '^8.2', 'laravel/framework': '^10.0', 'livewire/livewire': '^3.5' } }),
    'package.json': JSON.stringify({ dependencies: { react: '^19.2.5', 'react-dom': '^19.2.5', '@alpinejs/intersect': '^3.15.8' }, devDependencies: { vite: '^7.1.3', tailwindcss: '^3.4.15' } }),
    'routes/panel.php': "<?php Route::get('/dashboard', DashboardController::class)->name('dashboard');",
    'routes/web.php': "<?php Route::get('/', IndexController::class)->name('home');",
    'config/themes.php': '<?php return [];',
    'config/magicaiupdater.php': '<?php return [];',
    'app/Domains/Titan/README.md': 'Titan',
    'app/Http/Controllers/TitanWorkspaceProjectController.php': '<?php',
    'resources/views/default/page/home.blade.php': '<div></div>',
    'resources/views/modern/page/home.blade.php': '<div></div>',
    'app/Extensions/Broken/extension.json': '{}'
};

const sql = `
CREATE TABLE \`users\` (
  \`id\` bigint unsigned NOT NULL,
  \`email\` varchar(255) NOT NULL,
  \`password\` varchar(255) NOT NULL
) ENGINE=InnoDB;
CREATE TABLE \`projects\` (
  \`id\` bigint unsigned NOT NULL,
  \`company_id\` bigint unsigned DEFAULT NULL,
  \`settings\` json DEFAULT NULL
) ENGINE=InnoDB;
CREATE TABLE \`tenant_notes\` (
  \`id\` bigint unsigned NOT NULL,
  \`tenant_company_id\` bigint unsigned DEFAULT NULL
) ENGINE=InnoDB;
CREATE TABLE \`crm_contacts\` (
  \`id\` bigint unsigned NOT NULL,
  \`tenant_company_id\` bigint unsigned NOT NULL
) ENGINE=InnoDB;
CREATE TABLE \`ext_demo\` (
  \`id\` bigint unsigned NOT NULL
) ENGINE=InnoDB;
`;

const report = sandbox.CodeeTitanZeroCorePack.analyzeSnapshot({ files, sqlText: sql });
assert.equal(report.project.recognized, true, 'Titan Zero should be recognized');
assert.equal(report.project.ignoredFileCount, 0, 'extension files should be included in project scan');
assert.equal(report.project.stack.laravel, '^10.0');
assert.equal(sandbox.CodeeTitanZeroSnapshotPolicy.shouldIgnore('app/Extensions/CRM/file.php'), false);
assert.equal(sandbox.CodeeTitanZeroSnapshotPolicy.shouldIndex('routes/panel.php'), true);
assert.equal(report.schema.totalTablesInDump, 5);
assert.equal(report.schema.analyzedCoreTables, 5, 'all supplied schema tables should be analyzable after extension-scope rebase');
assert.equal(report.schema.ignoredTables, 0);
assert.equal(report.schema.sensitiveColumnCount, 1);
assert.equal(report.schema.tenancy.mixedCompanyBoundary, true);
assert.equal(report.routes.totalRouteCalls, 2);
assert.equal(report.themes.themeCount, 2);
assert.ok(report.context.includes('Titan Zero Core Project Context'));
assert.equal(report.diagnostics.id, 'titan-zero-core');

const descriptor = sandbox.CodeeTitanZeroCorePack.registrationDescriptor();
assert.equal(descriptor.authority.mayAdvancePlan, false);
assert.equal(descriptor.authority.mayMutateRepository, false);
assert.equal(descriptor.authority.mayInspectExtensions, true);
assert.equal(descriptor.prompts.length, 6);
assert.equal(descriptor.skills.length, 6);
assert.equal(descriptor.placements.runner, 'context_provider');
assert.equal(descriptor.placements.diagnostics, 'section:Titan Zero');

console.log('Titan Zero Core Intelligence Pack tests: PASS');
