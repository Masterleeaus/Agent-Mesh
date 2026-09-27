const fs=require('fs'),vm=require('vm'),assert=require('assert');const c={};c.globalThis=c;vm.createContext(c);vm.runInContext(fs.readFileSync('src/repository/repository-policy.js','utf8'),c);
assert.strictEqual(c.CodeeRepositoryPolicy.normalize('././app/./Extensions//Foo.php'),'app/Extensions/Foo.php','canonical normalization must collapse dot segments');
assert.strictEqual(c.CodeeRepositoryPolicy.classify('././app/./Extensions//Foo.php').domain,'extension','dot aliases must still classify as extension code');
console.log('Repository path normalization is canonical');
