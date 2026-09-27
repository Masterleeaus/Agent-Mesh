'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {load}=require('./load-pack');
const FILES=['src/repository/repository-policy.js','src/repository/dependency-analyzer.js','src/repository/git-intelligence.js','src/repository/log-analyzer.js','src/repository/error-classifier.js','src/repository/change-set.js','src/repository/rollback-planner.js','src/repository/diff-engine.js'];

test('dependency analyzer reads composer/npm metadata without secret values',()=>{
 const g=load(FILES); const report=g.CodeeDependencyAnalyzer.analyze({files:{
  'composer.json':JSON.stringify({require:{php:'^8.2','laravel/framework':'^10.0'},'require-dev':{'pestphp/pest':'*'}}),
  'package.json':JSON.stringify({dependencies:{react:'^19.0.0'},devDependencies:{vite:'^7.0.0'},scripts:{build:'vite build'}})
 }});
 assert.equal(report.composer.php,'^8.2'); assert.ok(report.composer.dependencies.some(x=>x.name==='laravel/framework'));
 assert.ok(report.npm.dependencies.some(x=>x.name==='react')); assert.ok(report.risk.some(x=>x.name==='pestphp/pest'));
});

test('git intelligence reports conflicts and branch state deterministically',()=>{
 const g=load(FILES); const r=g.CodeeGitIntelligence.summarize({branch:'feature/x\n',status:' M app/Foo.php\n?? app/Extensions/New/file.php\nUU routes/web.php\n',diff:'<<<<<<< HEAD\na\n=======\nb\n>>>>>>> other'});
 assert.equal(r.branch,'feature/x'); assert.equal(r.changed.length,3); assert.equal(r.conflicted.length,1); assert.equal(r.hasConflictMarkers,true); assert.equal(r.mayAdvancePlan,false);
});

test('log analyzer redacts credentials and error classifier recognizes Laravel failures',()=>{
 const g=load(FILES); const log='[2026-08-16 01:00:00] production.ERROR: password=hunter2 Failed to open stream: No such file or directory\n#0 /app/test.php';
 const parsed=g.CodeeLogAnalyzer.analyze(log); assert.equal(parsed.entries.length,1); assert.doesNotMatch(parsed.entries[0].message,/hunter2/);
 const c=g.CodeeErrorClassifier.classify(parsed.entries[0].message); assert.equal(c.code,'MISSING_FILE');
});

test('rollback plan requires backup receipts and a fresh pre-rollback backup',()=>{
 const g=load(FILES); const set=g.CodeeChangeSet.create({id:'set-1',changes:[{path:'app/Foo.php',operation:'modify',backupReceiptId:'b1',verified:true}]});
 const rollback=g.CodeeRollbackPlanner.build(set); assert.equal(rollback.canRollback,true); assert.equal(rollback.actions[0].requiresCurrentStateBackup,true); assert.equal(rollback.mayAdvancePlan,false);
});

test('exact replacement rejects ambiguous edits',()=>{
 const g=load(FILES); assert.throws(()=>g.CodeeDiffEngine.exactReplacement('x\nx\n','x','y'),/ambiguous/i); const p=g.CodeeDiffEngine.exactReplacement('a\nb\n','b','B'); assert.match(p.after,/B/);
});
