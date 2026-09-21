const fs=require('fs'),vm=require('vm'),assert=require('assert');const c={};c.globalThis=c;vm.createContext(c);vm.runInContext(fs.readFileSync('src/repository/repository-policy.js','utf8'),c);
for(const path of ['.env.local/x','foo/.env/bar','foo/.npmrc/cache','nested/id_rsa/backup','app/.ssh/config','app/credential-vault/cache']) assert.strictEqual(c.CodeeRepositoryPolicy.isInScope(path),false,`secret-bearing segment accepted: ${path}`);
assert.strictEqual(c.CodeeRepositoryPolicy.isInScope('app/Extensions/EnvTools/src/Foo.php'),true);
console.log('Repository secret path segment safety OK');
