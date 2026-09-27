const fs=require('fs'),vm=require('vm'),assert=require('assert');
const c={};c.globalThis=c;vm.createContext(c);vm.runInContext(fs.readFileSync('src/integration/mcp-governance-gateway.js','utf8'),c);
(async()=>{
 let calls=[];
 const readAdapter={discover:async()=>({tools:[{name:'titan.project.info',annotations:{readOnlyHint:true}}]}),callTool:async()=>{calls.push('call');return{ok:true}}};
 let out=await c.CodeeMcpGovernanceGateway.call(readAdapter,'c','titan.project.info',{});assert.strictEqual(out.ok,true);assert.deepStrictEqual(calls,['call']);
 const unknownAdapter={discover:async()=>({tools:[{name:'mystery.tool'}]}),callTool:async()=>({ok:true})};
 out=await c.CodeeMcpGovernanceGateway.call(unknownAdapter,'c','mystery.tool',{});assert.strictEqual(out.ok,false);assert.strictEqual(out.reason,'mcp-tool-classification-unknown');
 calls=[];
 const governed={
  discover:async()=>({tools:[{name:'titan.file.write',annotations:{readOnlyHint:false,destructiveHint:false},codeeClassification:'WRITE'}]}),
  prepareToolMutation:async()=>{calls.push('prepare');return{kind:'mcp_write',targets:['app/Test.php']};},
  createToolBackup:async()=>{calls.push('backup');return{id:'b1'};},verifyToolBackup:async()=>{calls.push('verify-backup');return{id:'b1',verified:true,sha256:'c'.repeat(64),coverage:['repository']};},
  requestToolApproval:async()=>{calls.push('approve');return{approved:true};},callTool:async()=>{calls.push('call');return{changed:true};},
  verifyToolMutation:async()=>{calls.push('verify-write');return{verified:true};},auditToolMutation:async()=>{calls.push('audit');return{receiptId:'audit1'};}
 };
 out=await c.CodeeMcpGovernanceGateway.call(governed,'c','titan.file.write',{path:'app/Test.php'});assert.strictEqual(out.ok,true);assert.deepStrictEqual(calls,['prepare','backup','verify-backup','approve','call','verify-write','audit']);assert.strictEqual(out.rollback.backupReceiptId,'b1');
 console.log('MCP governance classifies tools and backup-gates mutations');
})().catch(e=>{console.error(e);process.exit(1)});
