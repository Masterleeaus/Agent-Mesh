const fs=require('fs'),vm=require('vm'),assert=require('assert');const c={};c.globalThis=c;vm.createContext(c);for(const f of ['src/repository/repository-policy.js','src/repository/mutation-envelope.js','src/repository/command-policy.js','src/integration/repository-host-adapter.js'])vm.runInContext(fs.readFileSync(f,'utf8'),c,{filename:f});
const host={runCommand:async()=>({ok:true})};const adapter=c.CodeeRepositoryHostAdapter.create(host);
(async()=>{
 await assert.rejects(()=>adapter.runCommand('git status',{cwd:'../outside'},{}),/scope|cwd|outside|governed/i,'read commands must reject unsafe working directories');
 await assert.rejects(()=>adapter.runCommand('git status',{targets:['../.env']},{}),/scope|target|governed/i,'read commands must reject unsafe target scope');
 console.log('Repository command scope is validated for read operations');
})().catch(e=>{console.error(e);process.exit(1)});
