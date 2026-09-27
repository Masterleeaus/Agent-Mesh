const fs=require('fs'),vm=require('vm'),assert=require('assert');
const c={};c.globalThis=c;vm.createContext(c);vm.runInContext(fs.readFileSync('src/repository/command-policy.js','utf8'),c,{filename:'command-policy.js'});
const mutating=[
 'npm audit fix',
 'npm audit --fix',
 'pnpm audit --fix',
 'npm test -- --updateSnapshot',
 'yarn test -u',
 'php artisan test --update-snapshots',
 'git diff --output=app/report.diff',
 'git show --output app/show.txt HEAD'
];
for(const cmd of mutating){const r=c.CodeeCommandPolicy.classify(cmd);assert.notStrictEqual(r.class,'READ',`${cmd} must not bypass backup as READ`);assert.strictEqual(r.requiresBackup,true,`${cmd} must require backup`);}
for(const cmd of ['npm audit','pnpm audit']){assert.strictEqual(c.CodeeCommandPolicy.classify(cmd).class,'VERIFY',`${cmd} should be bounded verification`);}
for(const cmd of ['npm test','php artisan test']){const r=c.CodeeCommandPolicy.classify(cmd);assert.strictEqual(r.class,'EXECUTE',`${cmd} executes project code`);assert.strictEqual(r.requiresBackup,true);}
for(const cmd of ['git diff','git show HEAD']){assert.strictEqual(c.CodeeCommandPolicy.classify(cmd).class,'READ',`${cmd} should stay read-only`);}
console.log('Read-looking commands with mutating flags are backup-gated');
