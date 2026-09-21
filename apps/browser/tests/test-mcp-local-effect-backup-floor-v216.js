const fs=require('fs'),vm=require('vm'),assert=require('assert');
const c={};c.globalThis=c;vm.createContext(c);vm.runInContext(fs.readFileSync('src/integration/mcp-governance-gateway.js','utf8'),c);
const sha='a'.repeat(64);let executed=0;
function adapter(coverage){return{
 discover:async()=>({tools:[{name:'titan.database.mutate',classification:'WRITE'}]}),
 prepareToolMutation:async()=>({targets:[],requiredBackups:['repository'],effects:{complete:true,requiredBackups:['repository']}}),
 createToolBackup:async request=>({id:'b1',request}),
 verifyToolBackup:async()=>({id:'b1',verified:true,sha256:sha,coverage}),
 requestToolApproval:async()=>({approved:true}),callTool:async()=>{executed++;return{ok:true}},
 verifyToolMutation:async()=>({verified:true}),auditToolMutation:async()=>({id:'audit'})
};}
(async()=>{
 let r=await c.CodeeMcpGovernanceGateway.call(adapter(['repository']),'c','titan.database.mutate',{});
 assert.strictEqual(r.ok,false);assert.strictEqual(r.reason,'mcp-backup-coverage-incomplete');assert.strictEqual(r.missingBackup,'database');assert.strictEqual(executed,0);
 r=await c.CodeeMcpGovernanceGateway.call(adapter(['repository','database']),'c','titan.database.mutate',{});
 assert.strictEqual(r.ok,true);assert.strictEqual(executed,1);
 console.log('MCP local effect policy enforces database backup floor');
})().catch(e=>{console.error(e);process.exit(1)});
