const fs=require('fs'),assert=require('assert');
assert.equal(JSON.parse(fs.readFileSync('manifest.json')).version,'2.11.9');
assert.equal(JSON.parse(fs.readFileSync('package.json')).version,'2.11.9');
const readme=fs.readFileSync('README.md','utf8');
assert(readme.includes('Browser Intelligence Pass 06'));
assert(readme.includes('Inference RPC and Request Transport'));
assert(readme.includes('single governed inference RPC funnel'));
console.log('PASS browser intelligence pass6 release version');
