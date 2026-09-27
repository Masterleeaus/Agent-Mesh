const fs=require('fs'); const vm=require('vm'); const assert=require('assert');
const context={console,Date,Map,Set,Object,Array,String,Number,Boolean,RegExp,JSON,Math}; context.globalThis=context; vm.createContext(context);
for(const f of ['repository-policy.js','mutation-envelope.js','command-policy.js']) vm.runInContext(fs.readFileSync(`src/repository/${f}`,'utf8'),context);
vm.runInContext(fs.readFileSync('src/integration/repository-host-adapter.js','utf8'),context);
(async()=>{
  const order=[];
  const host={
    async createBackup(req){order.push('backup');return {id:'b1',targets:req.targets,coverage:req.requiredBackups||[],sha256:'a'.repeat(64)}},
    async verifyBackup(r){order.push('verify-backup');return {...r,verified:true}},
    async verifyMutation(){order.push('verify-write');return {verified:true}},
    async auditMutation(){order.push('audit');return {id:'a1'}},
    async writeFile(){order.push('write');return {ok:true}},
    async deleteFile(){order.push('delete');return {ok:true}},
    async runCommand(){order.push('command');return {ok:true}},
    async requestApproval(){order.push('approval');return {approved:true}}
  };
  const adapter=context.CodeeRepositoryHostAdapter.create(host);
  await adapter.writeFile('app/Extensions/Crm/test.php','x');
  assert.deepStrictEqual(order,['backup','verify-backup','write','verify-write','audit']);
  order.length=0;
  await adapter.runCommand('git add app/Extensions/Crm/test.php',{targets:['app/Extensions/Crm/test.php']});
  assert.deepStrictEqual(order,['backup','verify-backup','approval','command','verify-write','audit']);
  let wrote=false;
  const bad=context.CodeeRepositoryHostAdapter.create({...host,async createBackup(req){return {id:'b2',targets:req.targets,coverage:req.requiredBackups||[],sha256:'a'.repeat(64)}},async verifyBackup(){return {id:'b2',targets:['app/x.php'],sha256:'a'.repeat(64),verified:false}},async writeFile(){wrote=true}});
  await assert.rejects(()=>bad.writeFile('app/x.php','x'),/Backup verification failed/);
  assert.strictEqual(wrote,false,'write must never run after failed backup verification');
  console.log('Repository backup-before-write governance OK');
})().catch(e=>{console.error(e);process.exit(1)});
