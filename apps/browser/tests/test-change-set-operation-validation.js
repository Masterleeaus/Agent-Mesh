const fs=require('fs'),vm=require('vm'),assert=require('assert');const c={};c.globalThis=c;vm.createContext(c);for(const f of ['src/repository/repository-policy.js','src/repository/change-set.js'])vm.runInContext(fs.readFileSync(f,'utf8'),c,{filename:f});
assert.throws(()=>c.CodeeChangeSet.create({changes:[{path:'app/A.php',operation:'explode'}]}),/operation/i,'unknown change-set operations must fail closed');
console.log('Change-set operations are validated');
