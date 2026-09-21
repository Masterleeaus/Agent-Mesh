const fs=require('fs'),vm=require('vm'),assert=require('assert');
const c={console};c.globalThis=c;vm.createContext(c);
for(const f of ['src/repository/repository-policy.js','src/lib/repository-host-integration.js'])vm.runInContext(fs.readFileSync(f,'utf8'),c,{filename:f});
const files={};for(let i=0;i<2000;i++)files[`vendor/pkg${i}/x.php`]='ignored';for(let i=0;i<4000;i++)files[`app/Extensions/E${i}/src/X.php`]='<?php class X{}';
const snap=c.CodeeRepositoryHostIntegration.sanitizeSnapshot({files});
assert.strictEqual(Object.keys(snap.files).length,4000,'ignored/generated files must be filtered before analyzed-file limit');
console.log('snapshot filter-before-limit OK');
