const fs=require('fs'),vm=require('vm'),assert=require('assert');
const c={};c.globalThis=c;vm.createContext(c);vm.runInContext(fs.readFileSync('src/titan-zero/titan-zero-runtime-diagnostics.js','utf8'),c);
const out=c.CodeeTitanZeroRuntimeDiagnostics.build({project:{recognized:true,confidence:1},migrations:{risks:[]},tenancy:{mixedBoundary:false},navigation:{},architecture:{containerBindings:[]},frontend:{bladeFiles:0,livewire:{components:[]},reactFiles:0,themeFamilies:[]},settings:{analyzeFrontend:false}});
const ext=out.checks.find(x=>x.id.includes('extension'));
assert(ext,'extension scope diagnostic must exist');
assert(!/app\/Extensions[^.]{0,80}(?:excluded|outside)/i.test(ext.detail),'current runtime diagnostics must not claim app/Extensions is excluded');
assert(/included|first-class|in scope/i.test(ext.detail),'runtime diagnostics must describe extension inclusion');
console.log('Titan runtime diagnostics extension scope rebase OK');
