const fs=require('fs'),vm=require('vm'),assert=require('assert');
const c={console,setTimeout,clearTimeout};c.globalThis=c;vm.createContext(c);
const files=['src/repository/repository-policy.js','src/repository/repository-inventory.js','src/repository/repository-search.js','src/repository/symbol-index.js','src/repository/dependency-graph.js','src/repository/laravel-tracer.js','src/repository/migration-guard.js','src/repository/diff-engine.js','src/repository/impact-engine.js','src/repository/change-set.js','src/repository/rollback-planner.js','src/repository/mutation-envelope.js','src/repository/command-policy.js','src/repository/test-selector.js','src/repository/verification-planner.js','src/repository/dependency-analyzer.js','src/repository/git-intelligence.js','src/repository/log-analyzer.js','src/repository/error-classifier.js','src/integration/host-capabilities.js','src/integration/mcp-adapter.js','src/integration/remote-context-broker.js','src/catalog/repository-prompts.js','src/catalog/repository-skills.js','src/catalog/repository-profiles.js','src/repository/repository-coding-pack.js','src/integration/receiver-adapter.js','src/integration/repository-host-adapter.js','src/lib/repository-host-integration.js'];
for(const f of files)vm.runInContext(fs.readFileSync(f,'utf8'),c,{filename:f});
let writes=0,commands=0;
c.CodeeRepositoryHost={
 async createBackup(r){return {id:'b',verified:true,targets:r.targets,sha256:'a'.repeat(64)}},async verifyBackup(r){return r},
 async writeFile(){writes++;return {ok:true}},async deleteFile(){return {ok:true}},async runCommand(){commands++;return {ok:true}},
 async verifyMutation(){return {verified:true}},async auditMutation(){return {id:'a'}},async requestApproval(){return {approved:true}}
};
(async()=>{
 await assert.rejects(()=>c.CodeeRepositoryHostIntegration.callCapability('repository.rollback.plan',{changeSet:{changes:[{path:'../.env',operation:'modify',backupReceiptId:'b'}]}}),/scope|outside|sensitive/i,'rollback planning must validate raw changeset paths');
 await assert.rejects(()=>c.CodeeRepositoryHostIntegration.callCapability('repository.host.write',{path:'app/X.php',content:'x'.repeat(c.CodeeRepositoryHostIntegration.LIMITS.maxFileChars+1)}),/limit|large|maximum|exceed/i);
 assert.strictEqual(writes,0,'oversized write must not reach privileged host');
 await assert.rejects(()=>c.CodeeRepositoryHostIntegration.callCapability('repository.host.command',{command:'git status '+ 'x'.repeat(5000),scope:{targets:['app/X.php']}}),/length|long|maximum|limit/i);
 assert.strictEqual(commands,0,'oversized command must not reach privileged host');
 console.log('Repository privileged input bounds OK');
})().catch(e=>{console.error(e);process.exit(1)});
