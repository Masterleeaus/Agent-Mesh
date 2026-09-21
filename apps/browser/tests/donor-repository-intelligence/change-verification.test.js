'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('./load-pack');
const FILES = [
 'src/repository/repository-policy.js','src/repository/diff-engine.js','src/repository/impact-engine.js','src/repository/change-set.js','src/repository/rollback-planner.js','src/repository/mutation-envelope.js','src/repository/command-policy.js','src/repository/test-selector.js','src/repository/verification-planner.js'
];

test('diff and impact report changed lines and likely dependents', () => {
 const g=load(FILES);
 const diff=g.CodeeDiffEngine.diff('a\nb\nc\n','a\nB\nc\nd\n');
 assert.ok(diff.hunks.length >= 1);
 assert.equal(diff.stats.added >= 1,true);
 const snapshot={files:{'app/Services/A.php':'class A {}','app/Http/Controllers/B.php':'use App\\Services\\A; class B {}'}};
 const impact=g.CodeeImpactEngine.analyze(snapshot,['app/Services/A.php']);
 assert.ok(impact.impacted.some(x=>x.path==='app/Http/Controllers/B.php'));
});

test('mutation envelope refuses execution without verified backup receipt', () => {
 const g=load(FILES);
 const request={kind:'file_write',targets:['app/Test.php'],payload:{content:'<?php'}};
 assert.throws(()=>g.CodeeMutationEnvelope.authorize(request,null),/verified backup/i);
 const authorized=g.CodeeMutationEnvelope.authorize(request,{id:'backup-1',verified:true,targets:['app/Test.php'],sha256:'a'.repeat(64)});
 assert.equal(authorized.executionAllowed,true);
 assert.equal(authorized.backupReceipt.id,'backup-1');
});

test('commands are classified and targeted tests are selected from changed files', () => {
 const g=load(FILES);
 assert.equal(g.CodeeCommandPolicy.classify('php artisan migrate').class,'WRITE');
 assert.equal(g.CodeeCommandPolicy.classify('rm -rf storage').class,'DESTRUCTIVE');
 const selected=g.CodeeTestSelector.select(['app/Http/Controllers/CustomerController.php','resources/js/customer.jsx','database/migrations/2026.php']);
 assert.ok(selected.commands.includes('php artisan test'));
 assert.ok(selected.commands.some(c=>c.includes('npm')));
 assert.ok(selected.commands.includes('php artisan migrate:status'));
});

test('verification plan preserves plan authority boundary', () => {
 const g=load(FILES);
 const plan=g.CodeeVerificationPlanner.build({changedFiles:['app/Foo.php'],risk:'high'});
 assert.equal(plan.mayAdvancePlan,false);
 assert.equal(plan.requiresEvidence,true);
 assert.ok(plan.checks.length>0);
});
