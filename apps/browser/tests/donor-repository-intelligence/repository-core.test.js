'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('./load-pack');

const FILES = [
  'src/repository/repository-policy.js',
  'src/repository/repository-inventory.js',
  'src/repository/repository-search.js',
  'src/repository/symbol-index.js',
  'src/repository/dependency-graph.js',
  'src/repository/laravel-tracer.js',
  'src/repository/migration-guard.js'
];

test('repository scope includes app/Extensions while secrets remain blocked', () => {
  const g = load(FILES);
  assert.equal(g.CodeeRepositoryPolicy.isInScope('app/Extensions/TitanCRM/Services/CrmService.php'), true);
  assert.equal(g.CodeeRepositoryPolicy.isSensitive('.env'), true);
  assert.equal(g.CodeeRepositoryPolicy.isSensitive('storage/keys/private.pem'), true);
  assert.equal(g.CodeeRepositoryPolicy.isSensitive('app/Extensions/TitanCRM/extension.json'), false);
});

test('inventory and bounded search cover core and extensions', () => {
  const g = load(FILES);
  const snapshot = { files: {
    'app/Models/User.php': '<?php namespace App\\Models; class User {}',
    'app/Extensions/TitanCRM/Models/Contact.php': '<?php namespace App\\Extensions\\TitanCRM\\Models; class Contact {}',
    '.env': 'APP_KEY=secret'
  }};
  const inventory = g.CodeeRepositoryInventory.build(snapshot);
  assert.equal(inventory.files, 2);
  assert.equal(inventory.extensionFiles, 1);
  const matches = g.CodeeRepositorySearch.search(snapshot, 'Contact', { limit: 20 });
  assert.equal(matches.matches.length, 1);
  assert.match(matches.matches[0].path, /Extensions/);
});

test('symbol and dependency graph trace Laravel extension code', () => {
  const g = load(FILES);
  const snapshot = { files: {
    'routes/web.php': "Route::get('/contacts', [ContactController::class, 'index'])->name('contacts.index');",
    'app/Extensions/TitanCRM/Http/Controllers/ContactController.php': "<?php namespace App\\Extensions\\TitanCRM\\Http\\Controllers; use App\\Extensions\\TitanCRM\\Services\\ContactService; class ContactController { public function index(ContactService $service) { return $service->all(); }}",
    'app/Extensions/TitanCRM/Services/ContactService.php': "<?php namespace App\\Extensions\\TitanCRM\\Services; use App\\Extensions\\TitanCRM\\Models\\Contact; class ContactService { public function all(){ return Contact::query()->get(); }}",
    'app/Extensions/TitanCRM/Models/Contact.php': "<?php namespace App\\Extensions\\TitanCRM\\Models; class Contact extends Model {}"
  }};
  const symbols = g.CodeeSymbolIndex.build(snapshot);
  assert.ok(symbols.symbols.some(s => s.name === 'ContactController'));
  const graph = g.CodeeDependencyGraph.build(snapshot, symbols);
  assert.ok(graph.edges.some(e => e.to.includes('ContactService')));
  const trace = g.CodeeLaravelTracer.trace(snapshot, { routeName: 'contacts.index' });
  assert.equal(trace.route.name, 'contacts.index');
  assert.ok(trace.relatedFiles.some(p => p.includes('ContactController.php')));
});

test('migration guard flags destructive and tenancy-sensitive changes', () => {
  const g = load(FILES);
  const snapshot = { files: {
    'database/migrations/2026_08_16_000000_update_contacts.php': "Schema::table('contacts', function (Blueprint $table) { $table->dropColumn('tenant_company_id'); $table->string('name')->change(); });"
  }};
  const report = g.CodeeMigrationGuard.analyze(snapshot);
  assert.equal(report.highestSeverity, 'critical');
  assert.ok(report.findings.some(f => f.code === 'TENANCY_BOUNDARY_REMOVAL'));
});
