const fs=require('fs'),vm=require('vm'),assert=require('assert');
const c={};c.globalThis=c;vm.createContext(c);vm.runInContext(fs.readFileSync('src/repository/command-policy.js','utf8'),c);
function req(cmd){return c.CodeeCommandPolicy.classify(cmd).effects.requiredBackups;}
assert(req('php artisan migrate').includes('database'));
assert(req('php artisan cache:clear').includes('generated_state'),'cache changes must backup generated/runtime state explicitly');
assert(req('php artisan storage:link').includes('filesystem'),'filesystem mutations need filesystem backup coverage');
assert(req('composer install').includes('generated_state'),'dependency installation mutates generated dependency state');
assert(req('npm test').includes('external'),'project test code may write external services; effect contract must make that explicit');
assert(req('git push origin main').includes('git_remote'),'remote Git mutation needs remote-state backup coverage');
assert.strictEqual(c.CodeeCommandPolicy.classify('git push --force origin main').class,'DESTRUCTIVE','force push must be destructive');
console.log('command effect manifest covers generated/filesystem/external/remote state');
