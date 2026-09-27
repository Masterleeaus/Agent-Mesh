const fs=require('fs'),vm=require('vm'),assert=require('assert');const c={};c.globalThis=c;vm.createContext(c);vm.runInContext(fs.readFileSync('src/lib/capability-registry.js','utf8'),c);
c.CodeeCapabilityRegistry.registerSkills([{id:'s',name:'Original',nested:{value:1},items:[{x:1}]}]);
const stored=c.CodeeCapabilityRegistry.getSkill('s');
try{stored.name='Mutated';stored.nested.value=2;stored.items[0].x=2;}catch(_e){}
const snap=c.CodeeCapabilityRegistry.snapshot().skills[0];
assert.strictEqual(snap.name,'Original');assert.strictEqual(snap.nested.value,1);assert.strictEqual(snap.items[0].x,1,'registered capability records must be immutable after registration');
console.log('Capability registry records are immutable');
