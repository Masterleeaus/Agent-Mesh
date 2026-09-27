const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const modules = [
  'titan-zero-core-profile.js','titan-zero-snapshot-policy.js','titan-zero-project-detector.js','titan-zero-sql-analyzer.js','titan-zero-route-analyzer.js','titan-zero-theme-analyzer.js','titan-zero-schema-graph.js','titan-zero-migration-analyzer.js','titan-zero-tenancy-analyzer.js','titan-zero-php-architecture.js','titan-zero-frontend-analyzer.js','titan-zero-navigation-analyzer.js','titan-zero-impact-engine.js','titan-zero-test-matrix.js','titan-zero-runtime-diagnostics.js','titan-zero-knowledge.js','titan-zero-development-prompts.js','titan-zero-development-skills.js','titan-zero-development-profiles.js',
  'titan-zero-model-schema-analyzer.js','titan-zero-route-consumer-index.js','titan-zero-version-analyzer.js','titan-zero-config-analyzer.js','titan-zero-project-graph.js','titan-zero-context-selector.js','titan-zero-command-catalog.js','titan-zero-risk-rules.js','titan-zero-error-classifier.js'
];
const sandbox = { console }; sandbox.globalThis = sandbox; vm.createContext(sandbox);
for (const file of modules) vm.runInContext(fs.readFileSync(path.join(root,'src/titan-zero',file),'utf8'), sandbox, { filename: file });

const files = {
  'composer.json': JSON.stringify({ require: { php: '^8.2', 'laravel/framework': '^10.0', 'livewire/livewire': '^3.5' }, 'require-dev': { 'pestphp/pest': '^2.0' } }),
  'package.json': JSON.stringify({ dependencies: { react: '^19.2.5', alpinejs: '^3.15.8' }, devDependencies: { vite: '^7.1.3', tailwindcss: '^3.4.15' }, scripts: { build:'vite build', dev:'vite' } }),
  'config/services.php': "<?php return ['openai'=>['key'=>env('OPENAI_API_KEY')], 'mail'=>['secret'=>env('MAIL_PASSWORD')]];",
  'config/app.php': "<?php return ['name'=>env('APP_NAME','Titan Zero')];",
  'routes/web.php': "<?php Route::get('/dashboard',[DashboardController::class,'index'])->name('dashboard');",
  'app/Http/Controllers/DashboardController.php': "<?php namespace App\\Http\\Controllers; use App\\Services\\DashboardService; class DashboardController { public function __construct(DashboardService $service){} public function index(){} }",
  'app/Services/DashboardService.php': "<?php namespace App\\Services; use App\\Models\\Project; class DashboardService { public function load(){ return Project::query()->where('company_id',1)->get(); } }",
  'app/Models/Project.php': "<?php namespace App\\Models; use Illuminate\\Database\\Eloquent\\Model; class Project extends Model { protected $fillable=['company_id','name','ghost_column']; protected $casts=['settings'=>'array']; }",
  'app/Models/Orphan.php': "<?php namespace App\\Models; use Illuminate\\Database\\Eloquent\\Model; class Orphan extends Model { protected $table='missing_table'; }",
  'resources/views/default/dashboard.blade.php': "<a href=\"{{ route('dashboard') }}\">Dashboard</a>",
  'resources/js/dashboard.js': "const url = window.routes?.dashboard;",
  'tests/Feature/DashboardTest.php': "<?php test('dashboard', fn()=>expect(true)->toBeTrue());",
  'app/Extensions/Feature/Hidden.php': "<?php route('dashboard');"
};
const sql = `
CREATE TABLE \`projects\` (
  \`id\` bigint unsigned NOT NULL,
  \`company_id\` bigint unsigned DEFAULT NULL,
  \`name\` varchar(255) NOT NULL,
  \`settings\` json DEFAULT NULL,
  PRIMARY KEY (\`id\`), KEY \`projects_company_id_index\` (\`company_id\`)
) ENGINE=InnoDB;
`;
const schema = sandbox.CodeeTitanZeroSchemaGraph.build(sql,{profile:sandbox.CodeeTitanZeroCoreProfile});
const routes = sandbox.CodeeTitanZeroRouteAnalyzer.analyze(files);
const architecture = sandbox.CodeeTitanZeroPhpArchitecture.analyze(files);
const frontend = sandbox.CodeeTitanZeroFrontendAnalyzer.analyze(files);
const modelSchema = sandbox.CodeeTitanZeroModelSchemaAnalyzer.analyze(files, schema);
assert.equal(modelSchema.models.length, 2);
assert.equal(modelSchema.findings.some(f=>f.code==='MODEL_TABLE_MISSING' && f.path.endsWith('Orphan.php')), true);
assert.equal(modelSchema.findings.some(f=>f.code==='FILLABLE_COLUMN_MISSING' && f.column==='ghost_column'), true);

const consumers = sandbox.CodeeTitanZeroRouteConsumerIndex.analyze(files, routes);
assert.equal(consumers.byRoute.dashboard.some(c=>c.path.includes('dashboard.blade.php')), true);
assert.equal(consumers.consumers.some(c=>c.path.startsWith('app/Extensions/')), true);

const detectorAlpine = sandbox.CodeeTitanZeroProjectDetector.detect({ 'artisan':'', 'composer.json':files['composer.json'], 'package.json':JSON.stringify({dependencies:{'@imacrayon/alpine-ajax':'^0.12.6','@alpinejs/intersect':'^3.15.8'}}), 'routes/panel.php':'', 'config/themes.php':'', 'app/Domains/Titan/README.md':'' }, { profile:sandbox.CodeeTitanZeroCoreProfile });
assert.equal(detectorAlpine.stack.alpine, '^3.15.8');

const versions = sandbox.CodeeTitanZeroVersionAnalyzer.analyze(files);
assert.equal(versions.php, '^8.2');
assert.equal(versions.laravel, '^10.0');
assert.equal(versions.react, '^19.2.5');
assert.equal(versions.buildScripts.includes('build'), true);

const configs = sandbox.CodeeTitanZeroConfigAnalyzer.analyze(files);
assert.equal(configs.files.length, 2);
assert.equal(configs.envKeys.includes('OPENAI_API_KEY'), true);
assert.equal(configs.envKeys.includes('MAIL_PASSWORD'), true);
assert.equal(configs.sensitiveEnvKeys.length, 2);
assert.equal(Object.prototype.hasOwnProperty.call(configs, 'envValues'), false);

const graph = sandbox.CodeeTitanZeroProjectGraph.build({ architecture, schemaGraph:schema, routes, frontend, modelSchema, routeConsumers:consumers }, files);
assert.equal(graph.nodes.some(n=>n.id==='table:projects'), true);
assert.equal(graph.edges.some(e=>e.kind==='model_table'), true);
assert.equal(graph.edges.some(e=>e.kind==='route_consumer'), true);
assert.equal(graph.nodes.some(n=>String(n.path||'').startsWith('app/Extensions/')), true);

const selected = sandbox.CodeeTitanZeroContextSelector.select(graph, 'change the project dashboard company query and route', { maxNodes: 12, maxEdges: 20 });
assert.equal(selected.nodes.length <= 12, true);
assert.equal(selected.nodes.some(n=>String(n.label).toLowerCase().includes('project') || String(n.label).toLowerCase().includes('dashboard')), true);

const commands = sandbox.CodeeTitanZeroCommandCatalog.list();
assert.equal(commands.some(c=>c.id==='artisan-route-list' && c.mutating===false), true);
assert.equal(commands.some(c=>c.id==='artisan-migrate' && c.requiresApproval===true), true);

const report = { project:{recognized:true}, migrations:{risks:[]}, tenancy:{mixedBoundary:true, unconstrainedSignals:[{path:'app/Services/DashboardService.php',column:'company_id'}]}, navigation:{brokenParents:[],missingRoutes:[],missingPermissions:[]}, modelSchema, architecture, frontend };
const risks = sandbox.CodeeTitanZeroRiskRules.evaluate(report);
assert.equal(risks.some(r=>r.code==='MIXED_TENANCY_BOUNDARY'), true);
assert.equal(risks.some(r=>r.code==='MODEL_SCHEMA_DRIFT'), true);

const error = sandbox.CodeeTitanZeroErrorClassifier.classify('Illuminate\\Contracts\\Container\\BindingResolutionException: Target [App\\Contracts\\Foo] is not instantiable while building [App\\Http\\Controllers\\BarController]');
assert.equal(error.category, 'container');
assert.equal(error.suggestedProfile, 'tz-runtime-debugger');

console.log('Titan Zero Developer advanced intelligence tests: PASS');
