const fs=require('fs'),vm=require('vm'),assert=require('assert');
const c={};c.globalThis=c;vm.createContext(c);vm.runInContext(fs.readFileSync('src/integration/mcp-governance-gateway.js','utf8'),c,{filename:'gateway'});
let approval=false;const calls=[];
const tool={name:'titan_repository_write',annotations:{readOnlyHint:false,destructiveHint:false},_meta:{'io.titanzero/tool-policy':{schema:'titan-mcp-tool-policy/1',classification:'WRITE',ticketable:true,backup_domains:['repository'],preferred_mutation_flow:'prepare-commit'}}};
const prepared={complete:true,ticketId:'mt_'+'a'.repeat(32),argumentsSha256:'b'.repeat(64),targets:['app/A.php'],requiredBackups:['repository'],backupMode:'titan-two-phase-ticket',backupReceipt:{id:'pre-1',receiptId:'pre-1',verified:true,sha256:'c'.repeat(64),coverage:['repository'],backupIds:['pre-1'],evidence:[{id:'pre-1',type:'filesystem'}]},approvalEvidence:{schema:'titan-mcp-approval-evidence/1',exact_arguments_bound:true}};
const adapter={
 capabilityDescriptor:{serverVerifiedPrewriteBackup:true,twoPhaseMutationTickets:true},
 discover:async()=>({tools:[tool]}),
 prepareToolMutation:async(_cid,name,args)=>{calls.push(['prepare',name,JSON.stringify(args)]);return prepared;},
 requestToolApproval:async req=>{calls.push(['approval',req.mutation.ticketId]);return approval?{approved:true,approvalId:'a1'}:{approved:false,approvalId:'a1'};},
 commitToolMutation:async(_cid,ticketId)=>{calls.push(['commit',ticketId]);return {ticket:{ticket_id:ticketId,status:'committed'},mutation_result:{path:'app/A.php',sha256:'d'.repeat(64),backup_id:'post-1'},preapproval_backup_verified:true};},
 verifyToolMutation:async()=>{calls.push(['verify']);return {verified:true,mode:'repository-sha256-readback',level:'client-readback'};},
 auditToolMutation:async()=>{calls.push(['audit']);return {receiptId:'audit1'};}
};
(async()=>{
 let r=await c.CodeeMcpGovernanceGateway.call(adapter,'c1','titan_repository_write',{path:'app/A.php',content:'api_key="abc123"',reason:'test'});
 assert.strictEqual(r.ok,false);assert.strictEqual(r.reason,'mcp-approval-denied');assert.deepStrictEqual(calls.map(x=>x[0]),['prepare','approval']);
 approval=true;calls.length=0;
 r=await c.CodeeMcpGovernanceGateway.call(adapter,'c1','titan_repository_write',{path:'app/A.php',content:'api_key="abc123"',reason:'test'});
 assert.strictEqual(r.ok,true);assert.strictEqual(r.backupGuarantee,'titan-two-phase-ticket');assert.strictEqual(r.ticketId,prepared.ticketId);assert.strictEqual(r.verification.level,'client-readback');assert.deepStrictEqual(calls.map(x=>x[0]),['prepare','approval','commit','verify','audit']);
 assert.strictEqual(calls[0][2].includes('abc123'),true,'prepare must receive exact unredacted arguments');
 console.log('MCP two-phase ticket governance v2.3.4 OK');
})().catch(e=>{console.error(e);process.exit(1)});
