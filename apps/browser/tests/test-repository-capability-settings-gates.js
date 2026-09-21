const fs=require('fs'),vm=require('vm'),assert=require('assert');
const c={};c.globalThis=c;vm.createContext(c);
c.CodeeRepositoryPolicy={redactText:x=>String(x),isInScope:()=>true,normalize:x=>String(x)};
c.CodeeRepositoryInventory={build:()=>({ran:true})};
c.CodeeRepositoryReceiverAdapter={register:()=>({})};c.CodeeCapabilityRegistry={};
c.CodeeMcpIntegrationAdapter={create:()=>({callTool:async()=>({ran:true})})};c.CodeeMcpRuntime={};
vm.runInContext(fs.readFileSync('src/lib/repository-host-integration.js','utf8'),c);
(async()=>{
 const disabled=await c.CodeeRepositoryHostIntegration.callCapability('repository.inventory',{snapshot:{files:{a:'x'}}},{enabled:false});
 assert.strictEqual(disabled.unavailable,true,'disabled repository intelligence must gate direct repository capabilities');
 assert.strictEqual(disabled.reason,'repository-intelligence-disabled');
 const mcpDisabled=await c.CodeeRepositoryHostIntegration.callCapability('mcp.tool.call',{connectionId:'c',tool:'t'},{enabled:true,consumeMcpRuntime:false});
 assert.strictEqual(mcpDisabled.unavailable,true,'disabled MCP consumption must gate direct MCP capabilities');
 assert.strictEqual(mcpDisabled.reason,'mcp-consumption-disabled');
 console.log('Repository and MCP settings gate direct capabilities');
})().catch(e=>{console.error(e);process.exit(1)});
