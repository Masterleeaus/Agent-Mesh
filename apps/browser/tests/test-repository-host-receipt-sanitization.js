const fs=require('fs'),vm=require('vm'),assert=require('assert');
const c={};c.globalThis=c;vm.createContext(c);
for(const f of ['src/repository/repository-policy.js','src/repository/mutation-envelope.js','src/repository/command-policy.js','src/integration/repository-host-adapter.js']) vm.runInContext(fs.readFileSync(f,'utf8'),c,{filename:f});
(async()=>{
 const audits=[];
 const host={
  async createBackup(r){return {id:'b1',targets:r.targets,sha256:'a'.repeat(64),token:'backup-secret',blob:'B'.repeat(5000)}} ,
  async verifyBackup(r){return {...r,verified:true}},
  async writeFile(){return {ok:true,token:'mutation-secret',blob:'M'.repeat(5000)}},
  async verifyMutation(){return {verified:true,authorization:'verify-secret',blob:'V'.repeat(5000)}},
  async auditMutation(payload){audits.push(payload);return {id:'a1',cookie:'audit-secret',blob:'A'.repeat(5000)}}
 };
 const result=await c.CodeeRepositoryHostAdapter.create(host).writeFile('app/Test.php','<?php');
 const returned=JSON.stringify(result);
 const audited=JSON.stringify(audits[0]);
 for(const secret of ['backup-secret','mutation-secret','verify-secret','audit-secret']) assert(!returned.includes(secret),`returned receipt leaked ${secret}`);
 for(const secret of ['backup-secret','mutation-secret','verify-secret']) assert(!audited.includes(secret),`audit payload leaked ${secret}`);
 assert(returned.length<10000,'returned host evidence must be bounded');
 assert(audited.length<10000,'audit host evidence must be bounded');
 assert.strictEqual(result.backupReceipt.id,'b1');
 assert.strictEqual(result.backupReceipt.verified,true);
 assert.strictEqual(result.verification.verified,true);
 assert.strictEqual(result.auditReceipt.id,'a1');
 console.log('Repository host receipts and audit evidence are redacted and bounded');
})().catch(e=>{console.error(e);process.exit(1)});
