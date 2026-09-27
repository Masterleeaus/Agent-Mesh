const fs=require('fs'),vm=require('vm'),assert=require('assert');const c={console,Map,Set,Object,Array,String,Number,Boolean,RegExp,JSON,Math,Date};c.globalThis=c;vm.createContext(c);vm.runInContext(fs.readFileSync('src/titan-zero/titan-zero-navigation-analyzer.js','utf8'),c);
const rows=[{id:1,parentId:null,label:'Root',route_name:'dashboard'},{id:2,parentId:1,label:'Child',route_name:'child'}];
const report=c.CodeeTitanZeroNavigationAnalyzer.analyze({navigation:rows,permissions:[]},{routes:[{name:'dashboard'},{name:'child'}]});
assert.strictEqual(report.maxDepth,2,'camelCase parentId must participate in hierarchy depth');
assert.strictEqual(report.roots.length,1,'camelCase parentId child must not be treated as a root');
assert.strictEqual(report.missingRoutes.length,0,'route_name alias must resolve against named routes');
assert.strictEqual(report.roots[0].id,1);
console.log('Titan Zero navigation metadata aliases OK');
