const fs=require('fs');const vm=require('vm');const assert=require('assert');
const c={console,Map,Set,Object,Array,String,Number,Boolean,RegExp,JSON,Math};c.globalThis=c;vm.createContext(c);
vm.runInContext(fs.readFileSync('src/titan-zero/titan-zero-navigation-analyzer.js','utf8'),c);
vm.runInContext(fs.readFileSync('src/titan-zero/titan-zero-risk-rules.js','utf8'),c);
vm.runInContext(fs.readFileSync('src/titan-zero/titan-zero-runtime-diagnostics.js','utf8'),c);
const nav=c.CodeeTitanZeroNavigationAnalyzer.analyze({navigation:[
  {id:1,parent_id:2,title:'One',route:'shared.route'},
  {id:2,parent_id:1,title:'Two',route:'shared.route'}
],permissions:[]},{routes:[{name:'shared.route'}]});
assert(Array.isArray(nav.cycles) && nav.cycles.length>0,'parent cycles must be reported');
assert(nav.maxDepth < 20,'cyclic navigation must not masquerade as maxDepth=99');
assert.strictEqual(nav.duplicateRoutes.length,1,'duplicate navigation routes must be reported');
const risks=c.CodeeTitanZeroRiskRules.evaluate({navigation:nav});
assert(risks.some(item=>item.code==='NAVIGATION_DRIFT'),'cycles/duplicate navigation routes must trigger NAVIGATION_DRIFT');
const diagnostics=c.CodeeTitanZeroRuntimeDiagnostics.build({project:{recognized:true},migrations:{risks:[]},tenancy:{mixedBoundary:false},navigation:nav,architecture:{},frontend:{bladeFiles:1,livewire:{components:[]},reactFiles:[],themeFamilies:[]}});
const navCheck=diagnostics.checks.find(item=>item.id==='navigation');
assert.strictEqual(navCheck.status,'warn','runtime diagnostics must warn on cycles/duplicate routes');
assert(/cycle|duplicate/i.test(navCheck.detail),'runtime diagnostics must explain structural navigation drift');
console.log('Titan Zero navigation cycles and duplicate-route risk OK');
