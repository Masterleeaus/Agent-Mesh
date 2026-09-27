const fs=require('fs'),vm=require('vm'),assert=require('assert');
const c={};c.globalThis=c;vm.createContext(c);
for(const f of ['src/repository/repository-policy.js','src/repository/command-policy.js','src/repository/test-selector.js']) vm.runInContext(fs.readFileSync(f,'utf8'),c,{filename:f});
const r=c.CodeeTestSelector.select(['app/Services/Foo.php','app/Extensions/CRM/Models/Bar.php'],{includeGit:true});
const syntax=r.commands.filter(x=>x.startsWith('php -l '));
assert.strictEqual(syntax.length,2,'changed PHP files should get concrete syntax checks');
assert(!r.commands.some(x=>x.includes('<changed-php-files>')),'verification commands must not contain shell-redirection placeholders');
for(const cmd of syntax){const p=c.CodeeCommandPolicy.classify(cmd);assert.strictEqual(p.class,'VERIFY',`${cmd} must be executable by safe command channel`);}
console.log('Repository test selection emits concrete safe PHP syntax commands');
