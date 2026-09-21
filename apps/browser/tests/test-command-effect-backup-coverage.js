const fs=require('fs'),vm=require('vm'),assert=require('assert');
const c={};c.globalThis=c;vm.createContext(c);
for(const f of ['src/repository/repository-policy.js','src/repository/command-policy.js','src/repository/mutation-envelope.js','src/integration/repository-host-adapter.js'])vm.runInContext(fs.readFileSync(f,'utf8'),c,{filename:f});
const sha='a'.repeat(64);let executed=0;
const base={
 createBackup:async()=>({id:'b1',sha256:sha,targets:['database/migrations/x.php']}),
 verifyBackup:async r=>({...r,verified:true}),
 requestApproval:async()=>({approved:true}),
 runCommand:async()=>{executed++;return {ok:true}},
 verifyMutation:async()=>({verified:true}),auditMutation:async()=>({id:'audit1'})
};
(async()=>{
 const policy=c.CodeeCommandPolicy.classify('php artisan migrate');
 assert.strictEqual(policy.class,'WRITE');
 const effects=c.CodeeCommandPolicy.effectManifest('php artisan migrate');
 assert(effects.requiredBackups.includes('database'));
 const adapter=c.CodeeRepositoryHostAdapter.create(base);
 await assert.rejects(()=>adapter.runCommand('php artisan migrate',{targets:['database/migrations/x.php']},{}),/database|backup/i);
 assert.strictEqual(executed,0,'migrate must not execute with file-only backup');
 const good={...base,createBackup:async()=>({id:'b2',sha256:sha,coverage:['database']}),verifyBackup:async r=>({...r,verified:true})};
 const adapter2=c.CodeeRepositoryHostAdapter.create(good);
 const out=await adapter2.runCommand('php artisan migrate',{},{});
 assert.strictEqual(out.classification.class,'WRITE');
 assert.strictEqual(executed,1);
 console.log('command effect backup coverage OK');
})().catch(e=>{console.error(e);process.exit(1)});
