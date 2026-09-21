const fs=require('fs'),vm=require('vm'),assert=require('assert'),nodeCrypto=require('crypto');
const store={};
const chrome={
 storage:{local:{get:async k=>typeof k==='string'?{[k]:store[k]}:store,set:async v=>Object.assign(store,v),remove:async k=>{delete store[k];}}},
 permissions:{contains:async()=>true,request:async()=>true},
 runtime:{id:'abcdefghijklmnopabcdefghijklmnop',sendMessage:async()=>({ok:true})}
};
const calls=[];
const exact={path:'app/A.php',content:'api_key=\"abc123\"',reason:'write exact code'};
const canonicalExact={content:exact.content,path:exact.path,reason:exact.reason};
const argsHash=nodeCrypto.createHash('sha256').update(JSON.stringify(canonicalExact)).digest('hex');
const shaWrite='d'.repeat(64),manifestSha='c'.repeat(64);
const titanPolicy=(classification,extra={})=>({'io.titanzero/tool-policy':{schema:'titan-mcp-tool-policy/1',classification,backup_domains:[],ticketable:false,...extra}});
const toolRows=[
 {name:'titan_runtime_health',annotations:{readOnlyHint:true},_meta:titanPolicy('READ')},
 {name:'titan_backup_verify',annotations:{readOnlyHint:true},_meta:titanPolicy('READ')},
 {name:'titan_backup_manifest',annotations:{readOnlyHint:true},_meta:titanPolicy('READ')},
 {name:'titan_repository_read',annotations:{readOnlyHint:true},_meta:titanPolicy('READ')},
 {name:'titan_mutation_prepare',annotations:{readOnlyHint:false,destructiveHint:false},_meta:titanPolicy('COORDINATE')},
 {name:'titan_mutation_commit',annotations:{readOnlyHint:false,destructiveHint:true},_meta:titanPolicy('DESTRUCTIVE')},
 {name:'titan_repository_write',annotations:{readOnlyHint:false,destructiveHint:false},_meta:titanPolicy('WRITE',{ticketable:true,preferred_mutation_flow:'prepare-commit',backup_domains:['repository'],exact_arguments_required:true})}
];
const c={chrome,crypto:globalThis.crypto,TextEncoder,URL,console};c.globalThis=c;
c.CodeeRemoteContextBroker={sanitizeArgs:v=>JSON.parse(JSON.stringify(v).replace(/abc123/g,'[redacted]'))};
c.CodeeApprovedNetworkTransport={postJson:async(_url,body)=>{
 calls.push([body.method,body.params?.name||'',body.params?.arguments||null]);
 let result={};
 if(body.method==='initialize')result={protocolVersion:'2025-03-26',serverInfo:{name:'Titan MCP',version:'1.5.0'},capabilities:{tools:{},prompts:{}},_meta:{'io.titanzero/client-contract':{schema:'titan-mcp-client-contract/1',contract_hash:'e'.repeat(64),two_phase_mutation_tickets:true,prepare_tool:'titan_mutation_prepare',commit_tool:'titan_mutation_commit',status_tool:'titan_mutation_status',exact_argument_preservation_required:true,repository_max_write_bytes:1048576,mutation_ticket_max_argument_bytes:12582912}}};
 else if(body.method==='tools/list')result={tools:toolRows};
 else if(body.method==='prompts/list')result={prompts:[]};
 else if(body.method==='tools/call'&&body.params.name==='titan_mutation_prepare')result={content:[],structuredContent:{ticket_id:'mt_'+'a'.repeat(32),status:'prepared',tool:'titan_repository_write',arguments_sha256:argsHash,targets:['app/A.php'],backup_domains:['repository'],preapproval_backups:[{type:'filesystem',domain:'repository',backup_id:'pre-1',verified:true,manifest_schema:3,manifest_sha256:manifestSha,coverage:['app/A.php']}],approval_evidence:{schema:'titan-mcp-approval-evidence/1',ticket_id:'mt_'+'a'.repeat(32),tool:'titan_repository_write',arguments_sha256:argsHash,exact_arguments_bound:true,targets:['app/A.php'],backup_domains:['repository'],preapproval_backups:[{type:'filesystem',domain:'repository',backup_id:'pre-1',verified:true}],all_backups_verified:true,expires_at:'2099-01-01T00:00:00Z'},expires_at:'2099-01-01T00:00:00Z'},isError:false};
 else if(body.method==='tools/call'&&body.params.name==='titan_backup_verify')result={content:[],structuredContent:{valid:true,backup_id:'pre-1',errors:[]},isError:false};
 else if(body.method==='tools/call'&&body.params.name==='titan_backup_manifest')result={content:[],structuredContent:{schema:3,backup_id:'pre-1',paths:[{path:'app/A.php'}]},isError:false};
 else if(body.method==='tools/call'&&body.params.name==='titan_mutation_commit')result={content:[],structuredContent:{ticket:{ticket_id:'mt_'+'a'.repeat(32),status:'committed'},mutation_result:{path:'app/A.php',sha256:shaWrite,backup_id:'post-1'},preapproval_backup_verified:true,single_use:true,post_commit_evidence:{schema:'titan-mcp-post-commit-evidence/1',server_committed:true,verification_level:'server-commit-evidence',ticket_id:'mt_'+'a'.repeat(32)}},isError:false};
 else if(body.method==='tools/call'&&body.params.name==='titan_repository_read')result={content:[],structuredContent:{path:'app/A.php',sha256:shaWrite,content:'api_key="abc123"'},isError:false};
 else if(body.method==='tools/call'&&body.params.name==='titan_runtime_health')result={content:[],structuredContent:{status:'ok'},isError:false};
 return {ok:true,status:body.method==='notifications/initialized'?202:200,headers:{contentType:'application/json'},json:body.method==='notifications/initialized'?{}:{jsonrpc:'2.0',id:body.id,result}};
}};
vm.createContext(c);vm.runInContext(fs.readFileSync('src/integration/titan-mcp-runtime.js','utf8'),c,{filename:'runtime'});
(async()=>{
 const r=c.CodeeMcpRuntime;
 const saved=await r.saveConnection({name:'Titan',baseUrl:'https://titan.example',token:'secret-token'});
 const d=await r.discover(saved.connection.id,true);
 assert.strictEqual(d.twoPhaseMutationTickets,true);assert.strictEqual(d.clientContract.schema,'titan-mcp-client-contract/1');assert.strictEqual(d.mutationGuarantee,'titan-two-phase-ticket');
 const prep=await r.prepareToolMutation(saved.connection.id,'titan_repository_write',exact,d.tools.find(t=>t.name==='titan_repository_write'));
 assert.strictEqual(prep.complete,true);assert.strictEqual(prep.backupMode,'titan-two-phase-ticket');assert.strictEqual(prep.ticketId,'mt_'+'a'.repeat(32));assert.deepStrictEqual(JSON.parse(JSON.stringify(prep.backupReceipt.coverage)),['repository']);assert.strictEqual(prep.backupReceipt.verified,true);assert.strictEqual(prep.approvalEvidence.exact_arguments_bound,true);
 const prepareCall=calls.find(x=>x[0]==='tools/call'&&x[1]==='titan_mutation_prepare');assert.ok(prepareCall);assert.strictEqual(prepareCall[2].arguments.content.includes('abc123'),true,'runtime must preserve exact mutation arguments when preparing');
 let approval=await r.requestToolApproval({connectionId:saved.connection.id,name:'titan_repository_write',classification:'WRITE',args:exact,mutation:prep,approvalEvidence:prep.approvalEvidence,backupReceipt:prep.backupReceipt});
 assert.strictEqual(approval.approved,false);const pending=(await r.listPendingApprovals())[0];assert.strictEqual(pending.ticketId,prep.ticketId);assert.strictEqual(pending.argumentsSha256,argsHash);assert.strictEqual(pending.backupDomains.includes('repository'),true);assert.ok(pending.details&&pending.details.contentSha256,'approval must include bounded material mutation details');assert.strictEqual(JSON.stringify(pending.details).includes('abc123'),false,'stored approval preview must not persist obvious secrets');
 await r.approveMutation(pending.approvalId);
 approval=await r.requestToolApproval({connectionId:saved.connection.id,name:'titan_repository_write',classification:'WRITE',args:exact,mutation:prep,approvalEvidence:prep.approvalEvidence,backupReceipt:prep.backupReceipt});assert.strictEqual(approval.approved,true);
 const commit=await r.commitToolMutation(saved.connection.id,prep.ticketId);assert.strictEqual(commit.ticket.status,'committed');
 const verification=await r.verifyToolMutation({connectionId:saved.connection.id,name:'titan_repository_write',mutation:commit.mutation_result,commit,prepared:prep,backupReceipt:prep.backupReceipt,ticketId:prep.ticketId});assert.strictEqual(verification.verified,true);assert.strictEqual(verification.level,'client-readback');
 await r.auditToolMutation({connectionId:saved.connection.id,name:'titan_repository_write',classification:'WRITE',prepared:prep,backupReceipt:prep.backupReceipt,mutation:commit.mutation_result,commit,verification,ticketId:prep.ticketId});
 const receipts=await r.listMutationReceipts();assert.strictEqual(receipts.length,1);assert.strictEqual(receipts[0].verificationLevel,'client-readback');assert.strictEqual(r.clientCompatibility.titanMcp,'>=1.5.0');assert.strictEqual(r.clientCompatibility.chromeOrigin,'chrome-extension://abcdefghijklmnopabcdefghijklmnop');
 console.log('Titan MCP runtime v2.3.4 OK');
})().catch(e=>{console.error(e);process.exit(1)});
