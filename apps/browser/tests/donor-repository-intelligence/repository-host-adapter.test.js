'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {load}=require('./load-pack');
const FILES=['src/repository/repository-policy.js','src/repository/mutation-envelope.js','src/repository/command-policy.js','src/integration/repository-host-adapter.js'];

test('repository host adapter backs up, verifies, writes, verifies and audits in order',async()=>{
 const g=load(FILES); const events=[];
 const host={
  createBackup:async req=>{events.push(['backup',req]);return {id:'b1',verified:false,targets:req.targets,sha256:'a'.repeat(64)};},
  verifyBackup:async r=>{events.push(['verify-backup',r.id]);return {...r,verified:true};},
  writeFile:async (p,c)=>{events.push(['write',p,c]);return {path:p,bytes:c.length};},
  verifyMutation:async r=>{events.push(['verify-write',r.path]);return {verified:true,sha256:'after'};},
  auditMutation:async r=>{events.push(['audit',r.kind]);return {id:'audit1'};}
 };
 const a=g.CodeeRepositoryHostAdapter.create(host);
 const result=await a.writeFile('app/Extensions/CRM/Test.php','<?php echo 1;', {runId:'r1'});
 assert.deepEqual(events.map(x=>x[0]),['backup','verify-backup','write','verify-write','audit']);
 assert.equal(result.backupReceipt.verified,true); assert.equal(result.verification.verified,true); assert.equal(result.mayAdvancePlan,false);
});

test('repository host adapter fails closed when backup verification fails',async()=>{
 const g=load(FILES); let wrote=false;
 const host={createBackup:async req=>({id:'b1',targets:req.targets,sha256:'a'.repeat(64)}),verifyBackup:async r=>({...r,verified:false}),writeFile:async()=>{wrote=true;},verifyMutation:async()=>({verified:true}),auditMutation:async()=>({id:'audit-never'})};
 const a=g.CodeeRepositoryHostAdapter.create(host);
 await assert.rejects(()=>a.writeFile('app/Test.php','x'),/backup verification failed/i); assert.equal(wrote,false);
});
