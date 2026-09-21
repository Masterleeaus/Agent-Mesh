const fs=require('fs'),vm=require('vm'),assert=require('assert');const c={};c.globalThis=c;vm.createContext(c);for(const f of ['src/repository/repository-policy.js','src/repository/mutation-envelope.js'])vm.runInContext(fs.readFileSync(f,'utf8'),c,{filename:f});
const req={kind:'file_write',targets:['app/Test.php']};
assert.throws(()=>c.CodeeMutationEnvelope.authorize(req,{id:'b',verified:true,targets:['app/Test.php'],sha256:'abc'}),/checksum|sha/i,'verified backup checksum must be a real SHA-256');
const valid='a'.repeat(64);assert.doesNotThrow(()=>c.CodeeMutationEnvelope.authorize(req,{id:'b',verified:true,targets:['app/Test.php'],sha256:valid}));
console.log('Backup authorization requires a strict SHA-256 receipt');
