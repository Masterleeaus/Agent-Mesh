const fs = require('fs');
const vm = require('vm');
const assert = require('assert');
const loadOrder = [
  'titan-zero-core-profile.js','titan-zero-snapshot-policy.js','titan-zero-project-detector.js','titan-zero-sql-analyzer.js','titan-zero-route-analyzer.js','titan-zero-theme-analyzer.js','titan-zero-context.js','titan-zero-diagnostics.js','titan-zero-prompts.js','titan-zero-skills.js','titan-zero-pack.js','titan-zero-schema-graph.js','titan-zero-migration-analyzer.js','titan-zero-tenancy-analyzer.js','titan-zero-php-architecture.js','titan-zero-frontend-analyzer.js','titan-zero-navigation-analyzer.js','titan-zero-impact-engine.js','titan-zero-test-matrix.js','titan-zero-runtime-diagnostics.js','titan-zero-model-schema-analyzer.js','titan-zero-route-consumer-index.js','titan-zero-version-analyzer.js','titan-zero-config-analyzer.js','titan-zero-project-graph.js','titan-zero-context-selector.js','titan-zero-command-catalog.js','titan-zero-risk-rules.js','titan-zero-error-classifier.js','titan-zero-knowledge.js','titan-zero-development-prompts.js','titan-zero-development-skills.js','titan-zero-development-profiles.js','titan-zero-developer-pack.js','titan-zero-receiver-adapter.js'
];
const context={console:{log(){},warn(){},error(){}},Map,Set,Object,Array,String,Number,Boolean,RegExp,JSON,Math}; context.globalThis=context; vm.createContext(context);
vm.runInContext(fs.readFileSync('src/lib/capability-registry.js','utf8'),context);
for(const f of loadOrder) vm.runInContext(fs.readFileSync(`src/titan-zero/${f}`,'utf8'),context);
vm.runInContext(fs.readFileSync('src/lib/titan-zero-host-integration.js','utf8'),context);

const sql = `CREATE TABLE \`users\` (\n \`id\` bigint NOT NULL,\n \`tenant_company_id\` bigint DEFAULT NULL,\n \`password\` varchar(255) NOT NULL,\n PRIMARY KEY (\`id\`)\n) ENGINE=InnoDB;\nINSERT INTO \`users\` VALUES (1,7,'SUPER_SECRET_ROW_VALUE');`;
const snapshot={
 files:{
  'composer.json':'{"require":{"laravel/framework":"^12.0"}}',
  'routes/web.php':"<?php Route::get('/health', [HealthController::class, 'show'])->name('health');",
  'app/Models/User.php':'<?php class User extends Model { protected $fillable = [\'tenant_company_id\']; }',
  'app/Extensions/Bad/Service.php':'<?php class Service {}',
  'integration-sources/private.txt':'DONOR_SECRET',
  'donor-extracted/private.txt':'DONOR_EXTRACTED_SECRET',
  '.env':'APP_KEY=TOP_SECRET_ENV',
  'storage/logs/laravel.log':'LOG_SECRET',
  'vendor/acme/lib.php':'VENDOR_SECRET',
  'node_modules/x/index.js':'NODE_SECRET',
  '.git/config':'GIT_SECRET',
  'private/secret.txt':'UNSCOPED_PRIVATE_SECRET'
 },
 sqlText:sql,
 navigation:[{id:1,parent_id:null,route:'health'}],
 permissions:['health.view']
};
const safe=context.CodeeTitanZeroHostIntegration.sanitizeSnapshot(snapshot);
assert.strictEqual(Object.prototype.hasOwnProperty.call(safe.files,'app/Extensions/Bad/Service.php'),true,'extension source must remain in scope');
for(const forbidden of ['integration-sources/private.txt','donor-extracted/private.txt','.env','storage/logs/laravel.log','vendor/acme/lib.php','node_modules/x/index.js','.git/config','private/secret.txt']) {
  assert.strictEqual(Object.prototype.hasOwnProperty.call(safe.files,forbidden),false,`must exclude ${forbidden}`);
}
assert(!safe.sqlText.includes('SUPER_SECRET_ROW_VALUE'),'sanitized SQL must not retain INSERT row values');
assert(/CREATE TABLE/i.test(safe.sqlText),'DDL must remain available');
const analysis=context.CodeeTitanZeroHostIntegration.analyze(snapshot, {autoDetect:false}, {task:'change User tenancy', changedPaths:['app/Models/User.php']});
assert(analysis.report.schemaGraph.stats.analyzedTables >= 1,'schema graph must be available');
assert(analysis.context.includes('Titan Zero Developer Intelligence'));
assert(!analysis.context.includes('SUPER_SECRET_ROW_VALUE'));
assert(!JSON.stringify(analysis.safeSummary).includes('SUPER_SECRET_ROW_VALUE'));
assert(analysis.impact.domains.includes('database') || analysis.impact.domains.includes('tenancy'));
assert(Array.isArray(analysis.testMatrix.commands));
console.log('Titan Zero snapshot safety and derived context OK');
