const fs=require('fs'),vm=require('vm'),assert=require('assert');
const c={};c.globalThis=c;vm.createContext(c);vm.runInContext(fs.readFileSync('src/integration/mcp-governance-gateway.js','utf8'),c);
let calls=[];let allow=false;
const titan={
 capabilityDescriptor:{serverVerifiedPrewriteBackup:true},
 discover:async()=>({tools:[{name:'titan_repository_write',annotations:{readOnlyHint:false}}]}),
 prepareToolMutation:async()=>({complete:true,targets:['app/A.php'],requiredBackups:['repository'],effects:{complete:true,requiredBackups:['repository']},backupMode:'server-enforced-verified-prewrite'}),
 requestToolApproval:async()=>allow?{approved:true,approvalId:'a1'}:{approved:false,reason:'approval-required',approvalId:'a1'},
 callTool:async()=>{calls.push('call');return {path:'app/A.php',backup_id:'b1',sha256:'a'.repeat(64)}},
 verifyServerMutationBackup:async()=>{calls.push('backup-verify');return {id:'b1',verified:true,sha256:'b'.repeat(64),coverage:['repository']}},
 verifyToolMutation:async()=>{calls.push('verify-write');return {verified:true}},
 auditToolMutation:async()=>{calls.push('audit');return {receiptId:'audit1'}}
};
(async()=>{
 let r=await c.CodeeMcpGovernanceGateway.call(titan,'c','titan_repository_write',{path:'app/A.php'});
 assert.strictEqual(r.ok,false);assert.strictEqual(r.reason,'mcp-approval-denied');assert.deepStrictEqual(calls,[]);
 allow=true;r=await c.CodeeMcpGovernanceGateway.call(titan,'c','titan_repository_write',{path:'app/A.php'});
 assert.strictEqual(r.ok,true);assert.strictEqual(r.backupGuarantee,'server-enforced-verified-prewrite');assert.strictEqual(r.backupReceipt.id,'b1');assert.deepStrictEqual(calls,['call','backup-verify','verify-write','audit']);
 const impostor={...titan,capabilityDescriptor:{serverVerifiedPrewriteBackup:false}};
 r=await c.CodeeMcpGovernanceGateway.call(impostor,'c','titan_repository_write',{path:'app/A.php'});
 assert.strictEqual(r.ok,false);assert.strictEqual(r.reason,'mcp-governance-host-not-ready');assert.ok(r.missing.includes('createToolBackup'));
 console.log('MCP server prewrite mode v2.3.3 OK');
})().catch(e=>{console.error(e);process.exit(1)});
