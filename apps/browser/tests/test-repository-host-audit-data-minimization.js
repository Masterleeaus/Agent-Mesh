const fs=require('fs'),vm=require('vm'),assert=require('assert'),crypto=require('crypto');
const c={console,crypto:{subtle:{}},TextEncoder};c.globalThis=c;vm.createContext(c);
for(const f of ['src/repository/repository-policy.js','src/repository/mutation-envelope.js','src/repository/command-policy.js','src/integration/repository-host-adapter.js'])vm.runInContext(fs.readFileSync(f,'utf8'),c,{filename:f});
(async()=>{
 const audits=[];let wrote=false;
 const host={
  async createBackup(req){return {id:'b1',verified:true,targets:req.targets,coverage:req.requiredBackups||[],sha256:'a'.repeat(64)}},
  async verifyBackup(r){return r},
  async writeFile(){wrote=true;return {ok:true}},
  async verifyMutation(){return {verified:true}},
  async auditMutation(x){audits.push(x);return {id:'audit1'}},
  async runCommand(){throw new Error('must not run')},
  async requestApproval(){return {approved:false}}
 };
 const a=c.CodeeRepositoryHostAdapter.create(host);
 const secret='token=super-secret-value';
 await a.writeFile('app/Services/X.php',secret,{correlationId:'c1',token:'super-secret-value',blob:'x'.repeat(10000)});
 assert.strictEqual(wrote,true);
 const json=JSON.stringify(audits[0]);
 assert(!json.includes('super-secret-value'),'audit must not retain raw content or secret metadata');
 assert(!json.includes('x'.repeat(1000)),'audit metadata must be bounded');
 assert(!audits[0].request?.payload?.content,'audit request must not contain raw file content');
 audits.length=0;
 await assert.rejects(()=>a.runCommand('php artisan migrate',{targets:['database/migrations/2026_01_01_x.php']},{token:'cmd-secret'}),/approval denied/i);
 assert.strictEqual(audits.length,1,'approval denial should be audited');
 assert.strictEqual(audits[0].status,'approval_denied');
 assert(!JSON.stringify(audits[0]).includes('cmd-secret'),'denial audit metadata should be redacted');
 console.log('Repository host audit data minimization OK');
})().catch(e=>{console.error(e);process.exit(1)});
