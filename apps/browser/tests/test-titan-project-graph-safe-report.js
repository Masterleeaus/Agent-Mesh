const fs=require('fs'),vm=require('vm'),assert=require('assert');
const c={};c.globalThis=c;vm.createContext(c);
for(const f of ['src/repository/repository-policy.js','src/lib/titan-zero-host-integration.js']) vm.runInContext(fs.readFileSync(f,'utf8'),c,{filename:f});
const report=c.CodeeTitanZeroHostIntegration.buildSafeReport({
 projectGraph:{
  nodes:[{id:'route:secret',type:'route',path:'routes/web.php',label:'token=super-secret',uri:'/x?token=super-secret',metadata:{password:'super-secret'}}],
  edges:[{from:'route:secret',to:'controller:1',kind:'routes_to',label:'api_key=super-secret',metadata:{secret:'super-secret'}}]
 },settings:{}
});
const json=JSON.stringify(report.projectGraph);
assert(!json.includes('super-secret'),'safe report project graph must not retain source-derived secret literals');
assert.strictEqual(report.projectGraph.nodes[0].type,'route');
assert.strictEqual(report.projectGraph.nodes[0].path,'routes/web.php');
assert.strictEqual(report.projectGraph.edges[0].kind,'routes_to');
assert(!('uri' in report.projectGraph.nodes[0]),'safe graph should omit route URIs');
console.log('Titan safe report project graph is structural and redacted');
