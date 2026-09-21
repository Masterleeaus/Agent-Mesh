const fs=require('fs'),vm=require('vm'),assert=require('assert');
const c={};c.globalThis=c;vm.createContext(c);vm.runInContext(fs.readFileSync('src/integration/mcp-governance-gateway.js','utf8'),c);

let classified=c.CodeeMcpGovernanceGateway.classifyTool({name:'titan.file.write',annotations:{readOnlyHint:true},classification:'READ'});
assert.strictEqual(classified.ok,true);
assert.strictEqual(classified.classification,'WRITE','remote READ hint must never downgrade a locally mutating tool name');
classified=c.CodeeMcpGovernanceGateway.classifyTool({name:'titan.database.drop',annotations:{readOnlyHint:true},classification:'READ'});
assert.strictEqual(classified.classification,'DESTRUCTIVE');
classified=c.CodeeMcpGovernanceGateway.classifyTool({name:'mystery.tool',classification:'READ',annotations:{readOnlyHint:true}});
assert.strictEqual(classified.ok,false,'unknown tool names must not become READ solely because remote metadata says so');
classified=c.CodeeMcpGovernanceGateway.classifyTool({name:'titan.project.info',annotations:{readOnlyHint:true}});
assert.strictEqual(classified.classification,'READ');
console.log('MCP local classification floor prevents remote risk downgrades');
