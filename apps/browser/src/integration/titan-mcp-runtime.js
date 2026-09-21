(function attachTitanMcpRuntime(global){
'use strict';

const CONNECTIONS_KEY='codeeMcpConnections';
const SECRETS_KEY='codeeMcpSecrets';
const APPROVALS_KEY='codeeMcpApprovals';
const RECEIPTS_KEY='codeeMcpMutationReceipts';
const PREPARED_KEY='codeeMcpPreparedMutations';
const DISCOVERY_TTL_MS=60*1000;
const MAX_CONNECTIONS=20;
const MAX_RECEIPTS=100;
const MAX_PREPARED=50;
const PROTOCOL_VERSION='2025-03-26';
const TITAN_CLIENT_CONTRACT_KEY='io.titanzero/client-contract';
const TITAN_POLICY_KEY='io.titanzero/tool-policy';
const cache=new Map();
const now=()=>Date.now();

function safeText(v,max=500){return String(v??'').replace(/[\u0000-\u001f\u007f]/g,' ').trim().slice(0,max);}
function normalizeBaseUrl(value){const u=new URL(String(value||''));if(!['http:','https:'].includes(u.protocol))throw new Error('Titan MCP URL must use http or https.');if(u.username||u.password)throw new Error('Titan MCP URL must not contain embedded credentials.');u.hash='';u.search='';u.pathname='/';return u.origin;}
function normalizeEndpoint(value){const endpoint=String(value||'/mcp/titan').trim();if(!endpoint.startsWith('/')||endpoint.startsWith('//')||endpoint.includes('?')||endpoint.includes('#'))throw new Error('MCP endpoint must be a root-relative path without query or fragment.');return endpoint.slice(0,200);}
function connectionId(baseUrl,name){const input=`${baseUrl}|${name}`;let h=2166136261;for(let i=0;i<input.length;i++){h^=input.charCodeAt(i);h=Math.imul(h,16777619);}return `titan-${(h>>>0).toString(16).padStart(8,'0')}`;}
async function storageGet(key,fallback){const out=await chrome.storage.local.get(key);return out&&out[key]!==undefined?out[key]:fallback;}
function stableFingerprint(value,prefix='fp'){const s=JSON.stringify(value);let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return `${prefix}-${(h>>>0).toString(16).padStart(8,'0')}`;}
function mutationFingerprint(connectionId,name,args){return stableFingerprint({connectionId:connectionId||'',name:name||'',args:args||{}},'mutation');}

async function listConnections(){const rows=await storageGet(CONNECTIONS_KEY,[]);const secrets=await storageGet(SECRETS_KEY,{});return (Array.isArray(rows)?rows:[]).map(x=>({...x,tokenConfigured:Boolean(secrets?.[x.id])}));}
async function saveConnection(input){
 const baseUrl=normalizeBaseUrl(input?.baseUrl);
 const name=safeText(input?.name||new URL(baseUrl).hostname,120)||'Titan MCP';
 const id=safeText(input?.id,160)||connectionId(baseUrl,name);
 const endpoint=normalizeEndpoint(input?.endpoint);
 const rows=await storageGet(CONNECTIONS_KEY,[]);
 const secrets=await storageGet(SECRETS_KEY,{});
 const nowIso=new Date().toISOString();
 const next={id,name,baseUrl,endpoint,enabled:input?.enabled!==false,kind:'titan',createdAt:nowIso,updatedAt:nowIso};
 const idx=rows.findIndex(x=>x?.id===id);
 if(idx>=0)rows[idx]={...rows[idx],...next,createdAt:rows[idx].createdAt||next.createdAt};else rows.push(next);
 if(rows.length>MAX_CONNECTIONS)throw new Error(`Maximum MCP connections exceeded (${MAX_CONNECTIONS}).`);
 const token=String(input?.token||'').trim();
 if(token){if(token.length>8192)throw new Error('Titan bearer token exceeds the supported size.');secrets[id]=token;}
 if(!secrets[id])throw new Error('A Titan bearer token is required for a new MCP connection.');
 await chrome.storage.local.set({[CONNECTIONS_KEY]:rows,[SECRETS_KEY]:secrets});cache.delete(id);
 return {ok:true,connection:{...next,tokenConfigured:true}};
}
async function removeConnection(id){
 const rows=await storageGet(CONNECTIONS_KEY,[]);const secrets=await storageGet(SECRETS_KEY,{});const prepared=await storageGet(PREPARED_KEY,{});
 delete secrets[id];for(const [key,row] of Object.entries(prepared||{}))if(row?.connectionId===id)delete prepared[key];
 await chrome.storage.local.set({[CONNECTIONS_KEY]:rows.filter(x=>x?.id!==id),[SECRETS_KEY]:secrets,[PREPARED_KEY]:prepared});cache.delete(id);return {ok:true};
}
async function getConnection(id){const rows=await storageGet(CONNECTIONS_KEY,[]);const c=rows.find(x=>x?.id===id);if(!c||c.enabled===false)throw new Error('MCP connection is unavailable or disabled.');const secrets=await storageGet(SECRETS_KEY,{});const token=secrets[id];if(!token)throw new Error('MCP connection has no bearer token configured.');return {...c,token};}
function rpcId(){return `codee-${Date.now()}-${Math.random().toString(16).slice(2)}`;}
async function rpc(connection,method,params={},notification=false){
 if(!global.CodeeApprovedNetworkTransport)throw new Error('Approved Codee network transport is unavailable.');
 const requestId=rpcId();const body={jsonrpc:'2.0',method,params};if(!notification)body.id=requestId;
 const response=await global.CodeeApprovedNetworkTransport.postJson(`${connection.baseUrl}${connection.endpoint||'/mcp/titan'}`,body,{headers:{Authorization:`Bearer ${connection.token}`,'Content-Type':'application/json',Accept:'application/json, text/event-stream','MCP-Protocol-Version':PROTOCOL_VERSION,'X-Request-Id':requestId}});
 if(notification&&response.status===202)return null;
 const payload=response.json||{};
 if(!response.ok)throw new Error(safeText(payload?.error?.message||`Titan MCP HTTP ${response.status}`,1200));
 if(payload?.error){const e=new Error(safeText(payload.error.message||'Titan MCP JSON-RPC error',1200));e.code=payload.error.code;throw e;}
 return payload?.result;
}
function clientContract(initialized){const value=initialized?._meta?.[TITAN_CLIENT_CONTRACT_KEY];return value&&typeof value==='object'&&value.schema==='titan-mcp-client-contract/1'?value:null;}
function toolPolicy(tool){const value=tool?._meta?.[TITAN_POLICY_KEY];return value&&typeof value==='object'&&value.schema==='titan-mcp-tool-policy/1'?value:null;}
async function discover(id,force=false){
 const c=await getConnection(id);const cached=cache.get(id);if(!force&&cached&&now()-cached.at<DISCOVERY_TTL_MS)return cached.value;
 const initialized=await rpc(c,'initialize',{protocolVersion:PROTOCOL_VERSION,capabilities:{},clientInfo:{name:'Codee Chrome Extension',version:'2.11.9'}});
 if(initialized?.protocolVersion!==PROTOCOL_VERSION)throw new Error(`Titan MCP protocol mismatch: expected ${PROTOCOL_VERSION}, received ${safeText(initialized?.protocolVersion||'unknown',80)}.`);
 await rpc(c,'notifications/initialized',{},true);
 const tools=await rpc(c,'tools/list',{});const prompts=await rpc(c,'prompts/list',{});const toolRows=Array.isArray(tools?.tools)?tools.tools:[];
 if(!toolRows.some(t=>t?.name==='titan_runtime_health')||!toolRows.some(t=>t?.name==='titan_backup_verify')||!toolRows.some(t=>t?.name==='titan_backup_manifest'))throw new Error('Connected MCP server does not expose the required Titan MCP runtime/backup tools.');
 const serverName=safeText(initialized?.serverInfo?.name,120);if(!/titan\s*mcp/i.test(serverName))throw new Error('Connected MCP server did not identify itself as Titan MCP.');
 const contract=clientContract(initialized);
 const hasTicketTools=toolRows.some(t=>t?.name==='titan_mutation_prepare')&&toolRows.some(t=>t?.name==='titan_mutation_commit');
 const twoPhase=Boolean(contract?.two_phase_mutation_tickets===true&&contract?.exact_argument_preservation_required===true&&hasTicketTools);
 const value={connectionId:id,serverInfo:initialized?.serverInfo||{},protocolVersion:initialized?.protocolVersion||null,capabilities:initialized?.capabilities||{},instructions:safeText(initialized?.instructions||'',8000),tools:toolRows,prompts:Array.isArray(prompts?.prompts)?prompts.prompts:[],discoveredAt:new Date().toISOString(),transport:'titan-streamable-http-jsonrpc',stateless:true,clientContract:contract||null,contractHash:safeText(contract?.contract_hash||'',128)||null,twoPhaseMutationTickets:twoPhase,mutationGuarantee:twoPhase?'titan-two-phase-ticket':'server-enforced-verified-prewrite'};
 cache.set(id,{at:now(),value});return value;
}
function normalizeToolResult(result){const structured=result?.structuredContent&&typeof result.structuredContent==='object'?result.structuredContent:result;if(result?.isError===true){const err=structured?.error||{};const e=new Error(safeText(err.message||'Titan MCP tool execution failed.',1200));e.code=safeText(err.code||'TITAN_TOOL_EXECUTION_FAILED',120);e.retryable=err.retryable===true;throw e;}return structured;}
async function callTool(id,name,args){const c=await getConnection(id);return normalizeToolResult(await rpc(c,'tools/call',{name,arguments:args&&typeof args==='object'?args:{}}));}
async function health(id){try{const d=await discover(id,true);const runtime=await callTool(id,'titan_runtime_health',{});return {ok:true,connectionId:id,serverInfo:d.serverInfo,protocolVersion:d.protocolVersion,toolCount:d.tools.length,promptCount:d.prompts.length,mutationGuarantee:d.mutationGuarantee,twoPhaseMutationTickets:d.twoPhaseMutationTickets,contractHash:d.contractHash,runtime};}catch(error){return {ok:false,connectionId:id,error:safeText(error?.message||error,1200)};}}
async function readResource(){return {ok:false,unavailable:true,reason:'titan-mcp-resources-not-exposed'};}
async function getPrompt(id,name,args){const c=await getConnection(id);return rpc(c,'prompts/get',{name,arguments:args&&typeof args==='object'?args:{}});}
function mutationTargets(name,args){const targets=[];if(typeof args?.path==='string')targets.push(args.path);if(Array.isArray(args?.files))for(const f of args.files)if(typeof f?.path==='string')targets.push(f.path);if(typeof args?.backupId==='string')targets.push(`backup:${args.backupId}`);return [...new Set(targets.map(x=>safeText(x,4096)).filter(Boolean))].slice(0,500);}
function requiredBackups(name,tool){const policy=toolPolicy(tool);if(Array.isArray(policy?.backup_domains)&&policy.backup_domains.length)return [...new Set(policy.backup_domains.map(x=>safeText(x,80)).filter(Boolean))];const n=String(name||'').toLowerCase();if(n.includes('database'))return ['database'];if(n.includes('repository'))return ['repository'];if(n.includes('artisan'))return ['runtime'];return ['full_state'];}
async function sha256Text(text){const bytes=new TextEncoder().encode(String(text));const digest=await crypto.subtle.digest('SHA-256',bytes);return Array.from(new Uint8Array(digest)).map(b=>b.toString(16).padStart(2,'0')).join('');}
function canonicalValue(value){if(Array.isArray(value))return value.map(canonicalValue);if(value&&typeof value==='object'){const out={};for(const key of Object.keys(value).sort())out[key]=canonicalValue(value[key]);return out;}return value;}
async function canonicalArgumentsSha256(value){return sha256Text(JSON.stringify(canonicalValue(value&&typeof value==='object'?value:{})));}
function parseExpiry(value,fallbackMs=4*60*1000){const parsed=Date.parse(String(value||''));return Number.isFinite(parsed)?parsed:now()+fallbackMs;}
function evidenceDomain(row,name){if(typeof row?.domain==='string'&&row.domain.trim())return safeText(row.domain,80).toLowerCase();if(row?.type==='database')return 'database';return String(name||'').includes('artisan')?'runtime':'repository';}
async function verifyPreparedBackups(connectionId,name,ticket,required){
 const rows=Array.isArray(ticket?.preapproval_backups)?ticket.preapproval_backups:[];
 if(!rows.length)throw new Error('Titan mutation preparation did not return pre-approval backup evidence.');
 const evidence=[];const domains=new Set();
 for(const row of rows){
  const id=safeText(row?.backup_id||row?.id,240);const type=row?.type==='database'?'database':'filesystem';if(!id)throw new Error('Titan pre-approval backup evidence is missing an identifier.');
  const verified=await callTool(connectionId,'titan_backup_verify',{backupId:id,type});if(verified?.valid!==true)throw new Error(`Titan ${type} backup ${id} failed independent Codee verification.`);
  const manifest=await callTool(connectionId,'titan_backup_manifest',{backupId:id,type});const domain=evidenceDomain(row,name);domains.add(domain);evidence.push({id,type,domain,verified:true,serverEvidence:row,verification:verified,manifest});
 }
 const requiredDomains=[...new Set((Array.isArray(required)?required:[]).map(x=>safeText(x,80).toLowerCase()).filter(Boolean))];
 for(const domain of requiredDomains)if(!domains.has(domain))throw new Error(`Titan pre-approval backup evidence does not cover required domain ${domain}.`);
 const sha256=await sha256Text(JSON.stringify(evidence));const ids=evidence.map(x=>x.id);
 return {id:ids[0],receiptId:ids[0],verified:true,sha256,coverage:[...domains],fullScope:false,serverEnforced:true,preapproval:true,backupIds:ids,evidence};
}
async function loadPrepared(fingerprint){const rows=await storageGet(PREPARED_KEY,{});const row=rows?.[fingerprint];if(!row)return null;if(Number(row.expiresAtMs||0)<=now()){delete rows[fingerprint];await chrome.storage.local.set({[PREPARED_KEY]:rows});return null;}return row.prepared||null;}
async function storePrepared(fingerprint,connectionId,prepared){const rows=await storageGet(PREPARED_KEY,{});for(const [key,row] of Object.entries(rows||{}))if(Number(row?.expiresAtMs||0)<=now())delete rows[key];rows[fingerprint]={connectionId,expiresAtMs:parseExpiry(prepared?.expiresAt),prepared};const keys=Object.keys(rows);if(keys.length>MAX_PREPARED)for(const key of keys.slice(0,keys.length-MAX_PREPARED))delete rows[key];await chrome.storage.local.set({[PREPARED_KEY]:rows});}
async function clearPreparedTicket(ticketId){const rows=await storageGet(PREPARED_KEY,{});let changed=false;for(const [key,row] of Object.entries(rows||{}))if(row?.prepared?.ticketId===ticketId){delete rows[key];changed=true;}if(changed)await chrome.storage.local.set({[PREPARED_KEY]:rows});}
async function prepareToolMutation(connectionId,name,args,tool){
 const discovery=await discover(connectionId);const targetTool=tool||discovery.tools.find(t=>t?.name===name);const backups=requiredBackups(name,targetTool);
 if(discovery.twoPhaseMutationTickets===true&&toolPolicy(targetTool)?.ticketable===true){
  const fingerprint=mutationFingerprint(connectionId,name,args);const cached=await loadPrepared(fingerprint);if(cached)return cached;
  const exactArgs=args&&typeof args==='object'?args:{};
  const localArgumentsSha256=await canonicalArgumentsSha256(exactArgs);
  const ticket=await callTool(connectionId,'titan_mutation_prepare',{tool:name,arguments:exactArgs});
  const ticketId=safeText(ticket?.ticket_id,240);if(!ticketId)throw new Error('Titan mutation preparation did not return a ticket id.');
  const approvalEvidence=ticket?.approval_evidence&&typeof ticket.approval_evidence==='object'?ticket.approval_evidence:{};
  const serverArgumentsSha256=safeText(ticket?.arguments_sha256||approvalEvidence?.arguments_sha256,128).toLowerCase();
  if(!/^[a-f0-9]{64}$/.test(serverArgumentsSha256)||serverArgumentsSha256!==localArgumentsSha256)throw new Error('Titan mutation ticket argument hash does not match the exact local arguments.');
  if(approvalEvidence.exact_arguments_bound!==true)throw new Error('Titan mutation ticket did not prove exact argument binding.');
  if(approvalEvidence?.arguments_sha256&&safeText(approvalEvidence.arguments_sha256,128).toLowerCase()!==serverArgumentsSha256)throw new Error('Titan approval evidence argument hash does not match the prepared ticket.');
  const requiredDomains=Array.isArray(approvalEvidence.backup_domains)&&approvalEvidence.backup_domains.length?approvalEvidence.backup_domains:backups;
  const backupReceipt=await verifyPreparedBackups(connectionId,name,ticket,requiredDomains);
  const prepared={complete:true,ticketId,argumentsSha256:serverArgumentsSha256,targets:Array.isArray(ticket?.targets)?ticket.targets:mutationTargets(name,args),requiredBackups:backupReceipt.coverage.slice(),effects:{complete:true,requiredBackups:backupReceipt.coverage.slice()},backupMode:'titan-two-phase-ticket',backupReceipt,approvalEvidence,expiresAt:ticket?.expires_at||approvalEvidence.expires_at||null,server:'titan-mcp',serverVersion:safeText(discovery.serverInfo?.version,80),toolAnnotations:targetTool?.annotations||{},toolPolicy:toolPolicy(targetTool)||null,clientContract:discovery.clientContract||null};
  await storePrepared(fingerprint,connectionId,prepared);return prepared;
 }
 if(discovery.mutationGuarantee!=='server-enforced-verified-prewrite')return {complete:false,reason:'titan-server-prewrite-guarantee-unavailable'};
 return {complete:true,targets:mutationTargets(name,args),requiredBackups:backups,effects:{complete:true,requiredBackups:backups},backupMode:'server-enforced-verified-prewrite',server:'titan-mcp',serverVersion:safeText(discovery.serverInfo?.version,80),toolAnnotations:targetTool?.annotations||{},toolPolicy:toolPolicy(targetTool)||null};
}
async function commitToolMutation(connectionId,ticketId){const id=safeText(ticketId,240);if(!id)throw new Error('Titan mutation ticket id is required.');const result=await callTool(connectionId,'titan_mutation_commit',{ticketId:id});if(result?.ticket?.status!=='committed'||result?.post_commit_evidence?.server_committed!==true)throw new Error('Titan mutation commit did not return committed server evidence.');await clearPreparedTicket(id);return result;}
function approvalFingerprint(req){const simple={connectionId:req?.connectionId||'',name:req?.name||'',classification:req?.classification||'',ticketId:req?.mutation?.ticketId||'',argumentsSha256:req?.mutation?.argumentsSha256||'',args:req?.mutation?.ticketId?'ticket-bound':(req?.args||{})};return stableFingerprint(simple,'approval');}
function redactPreview(text){let out=String(text??'');out=out.replace(/(authorization\s*:\s*bearer\s+)[^\s'"`]+/ig,'$1[redacted]');out=out.replace(/((?:api[_-]?key|password|secret|token)\s*[=:]\s*["']?)[^\s"';]+/ig,'$1[redacted]');return out.slice(0,4000);}
function sanitizedPreview(text){const raw=redactPreview(text);try{const broker=global.CodeeRemoteContextBroker;if(broker?.sanitizeArgs){const value=broker.sanitizeArgs({preview:raw});if(typeof value?.preview==='string')return safeText(value.preview,4000);}}catch{}return safeText(raw,4000);}
async function buildApprovalDetails(name,args){
 const n=String(name||'');const a=args&&typeof args==='object'?args:{};
 if(n==='titan_repository_write')return {kind:'repository-write',path:safeText(a.path,4096),contentBytes:new TextEncoder().encode(String(a.content??'')).byteLength,contentSha256:await sha256Text(String(a.content??'')),contentPreview:sanitizedPreview(a.content),sanitizedPreview:true,expectedSha256:safeText(a.expectedSha256,80)||null};
 if(n==='titan_repository_replace')return {kind:'repository-replace',path:safeText(a.path,4096),searchBytes:new TextEncoder().encode(String(a.search??'')).byteLength,searchSha256:await sha256Text(String(a.search??'')),replaceBytes:new TextEncoder().encode(String(a.replace??'')).byteLength,replaceSha256:await sha256Text(String(a.replace??'')),searchPreview:sanitizedPreview(a.search),replacePreview:sanitizedPreview(a.replace),expectedOccurrences:Number(a.expectedOccurrences||0)||null,expectedSha256:safeText(a.expectedSha256,80)||null,sanitizedPreview:true};
 if(n==='titan_repository_batch_write')return {kind:'repository-batch-write',files:await Promise.all((Array.isArray(a.files)?a.files:[]).slice(0,50).map(async f=>({path:safeText(f?.path,4096),contentBytes:new TextEncoder().encode(String(f?.content??'')).byteLength,contentSha256:await sha256Text(String(f?.content??'')),expectedSha256:safeText(f?.expected_sha256,80)||null}))),reason:safeText(a.reason,500)};
 if(n==='titan_database_mutate')return {kind:'database-mutate',connection:safeText(a.connection,200)||null,sqlBytes:new TextEncoder().encode(String(a.sql??'')).byteLength,sqlSha256:await sha256Text(String(a.sql??'')),sqlPreview:sanitizedPreview(a.sql),bindingsCount:Array.isArray(a.bindings)?a.bindings.length:0,sanitizedPreview:true};
 if(n==='titan_artisan_mutate')return {kind:'artisan-mutate',command:safeText(a.command,500),argumentKeys:a.arguments&&typeof a.arguments==='object'?Object.keys(a.arguments).slice(0,50):[],backupPaths:(Array.isArray(a.backupPaths)?a.backupPaths:[]).map(x=>safeText(x,4096)).slice(0,50),databaseMayChange:a.databaseMayChange===true};
 return {kind:safeText(n,200),path:safeText(a.path,4096)||null,backupId:safeText(a.backupId,240)||null,argumentKeys:Object.keys(a).slice(0,50)};
}
async function requestToolApproval(request){
 const approvalId=approvalFingerprint(request);const rows=await storageGet(APPROVALS_KEY,{});const existing=rows[approvalId];
 if(existing?.approved===true&&Number(existing.expiresAt||0)>now()){delete rows[approvalId];await chrome.storage.local.set({[APPROVALS_KEY]:rows});return {approved:true,approvalId,source:'explicit-one-shot'};}
 const mutation=request?.mutation||{};const evidence=request?.approvalEvidence||mutation?.approvalEvidence||{};const receipt=request?.backupReceipt||mutation?.backupReceipt||{};
 rows[approvalId]={approvalId,approved:false,createdAt:now(),expiresAt:Math.min(now()+10*60*1000,parseExpiry(mutation?.expiresAt,10*60*1000)),connectionId:safeText(request?.connectionId,200),name:safeText(request?.name,200),classification:safeText(request?.classification,40),ticketId:safeText(mutation?.ticketId||evidence?.ticket_id,240)||null,argumentsSha256:safeText(mutation?.argumentsSha256||evidence?.arguments_sha256,128)||null,exactArgumentsBound:evidence?.exact_arguments_bound===true,targets:(mutation?.targets||mutationTargets(request?.name,request?.args)).slice(0,50),reason:safeText(request?.args?.reason||'',500),backupGuarantee:mutation?.backupMode==='titan-two-phase-ticket'?'Titan prepared and independently verified recovery evidence before approval':'Titan creates and verifies the backup before its first write',backupDomains:(receipt?.coverage||mutation?.requiredBackups||[]).slice(0,16),backupIds:(receipt?.backupIds||[]).slice(0,16),details:await buildApprovalDetails(request?.name,request?.args)};
 await chrome.storage.local.set({[APPROVALS_KEY]:rows});try{await chrome.runtime.sendMessage({type:'CODEE_MCP_APPROVAL_REQUIRED',approval:rows[approvalId]});}catch{}
 return {approved:false,reason:'approval-required',approvalId,request:rows[approvalId]};
}
async function approveMutation(approvalId){const rows=await storageGet(APPROVALS_KEY,{});if(!rows[approvalId]||Number(rows[approvalId].expiresAt||0)<=now())throw new Error('Unknown or expired MCP approval request.');rows[approvalId]={...rows[approvalId],approved:true,approvedAt:now(),expiresAt:Math.min(Number(rows[approvalId].expiresAt||0),now()+5*60*1000)};await chrome.storage.local.set({[APPROVALS_KEY]:rows});return {ok:true,approvalId};}
async function denyMutation(approvalId){const rows=await storageGet(APPROVALS_KEY,{});if(rows[approvalId])delete rows[approvalId];await chrome.storage.local.set({[APPROVALS_KEY]:rows});return {ok:true,approvalId};}
async function listPendingApprovals(){const rows=await storageGet(APPROVALS_KEY,{});const out=[];let changed=false;for(const [id,row] of Object.entries(rows||{})){if(Number(row?.expiresAt||0)<=now()){delete rows[id];changed=true;continue;}if(row?.approved!==true)out.push(row);}if(changed)await chrome.storage.local.set({[APPROVALS_KEY]:rows});return out.sort((a,b)=>Number(b.createdAt||0)-Number(a.createdAt||0));}
function backupCandidates(name,mutation){const n=String(name||'').toLowerCase();const rows=[];const add=(id,type,domain)=>{id=safeText(id,240);if(id&&!rows.some(x=>x.id===id&&x.type===type))rows.push({id,type,domain});};if(n.includes('database')){add(mutation?.backup_id,'database','database');add(mutation?.pre_rollback_backup_id,'database','database');}else{const domain=n.includes('artisan')?'runtime':'repository';add(mutation?.backup_id,'filesystem',domain);add(mutation?.pre_rollback_backup_id,'filesystem',domain);}add(mutation?.filesystem_backup_id,'filesystem',n.includes('artisan')?'runtime':'repository');add(mutation?.database_backup_id,'database','database');return rows;}
async function verifyServerMutationBackup({connectionId,name,mutation,requiredBackups:requiredDomains}){const candidates=backupCandidates(name,mutation);if(!candidates.length)throw new Error('Titan mutation result did not include a recoverable backup identifier.');const evidence=[];const coverage=new Set();for(const row of candidates){const verified=await callTool(connectionId,'titan_backup_verify',{backupId:row.id,type:row.type});if(verified?.valid!==true)throw new Error(`Titan ${row.type} backup ${row.id} failed verification.`);const manifest=await callTool(connectionId,'titan_backup_manifest',{backupId:row.id,type:row.type});coverage.add(row.domain);evidence.push({...row,verified:true,verification:verified,manifest});}for(const domain of Array.isArray(requiredDomains)?requiredDomains:[])if(!coverage.has(domain))throw new Error(`Titan mutation backup evidence does not cover required domain ${domain}.`);const sha256=await sha256Text(JSON.stringify(evidence));return {id:candidates[0].id,receiptId:candidates[0].id,verified:true,sha256,coverage:[...coverage],fullScope:false,serverEnforced:true,backupIds:candidates.map(x=>x.id),evidence};}
async function verifyToolMutation({connectionId,name,mutation,commit}){
 const n=String(name||'').toLowerCase();
 try{
  if((n==='titan_repository_write'||n==='titan_repository_replace')&&mutation?.path&&mutation?.sha256){const read=await callTool(connectionId,'titan_repository_read',{path:mutation.path,maxBytes:1000000});const verified=String(read?.sha256||'').toLowerCase()===String(mutation.sha256).toLowerCase();return {verified,mode:'repository-sha256-readback',level:'client-readback'};}
  if(n==='titan_repository_batch_write'&&Array.isArray(mutation?.files)){for(const file of mutation.files.slice(0,50)){if(!file?.path||!file?.sha256)continue;const read=await callTool(connectionId,'titan_repository_read',{path:file.path,maxBytes:1000000});if(String(read?.sha256||'').toLowerCase()!==String(file.sha256).toLowerCase())return {verified:false,mode:'repository-batch-sha256-readback',level:'client-readback',path:file.path};}return {verified:true,mode:'repository-batch-sha256-readback',level:'client-readback'};}
  if(commit){const committed=commit?.ticket?.status==='committed'&&commit?.post_commit_evidence?.server_committed===true;return {verified:committed,mode:'titan-post-commit-evidence',level:'server-commit-evidence',evidence:commit?.post_commit_evidence||null};}
  return {verified:Boolean(mutation&&typeof mutation==='object'),mode:'titan-server-result-legacy',level:'legacy-server-result'};
 }catch(error){return {verified:false,error:safeText(error?.message||error,1000),level:'verification-error'};}
}
async function auditToolMutation(request){const id=`codee-mcp-${Date.now()}-${Math.random().toString(16).slice(2,10)}`;const rows=await storageGet(RECEIPTS_KEY,[]);rows.push({id,createdAt:new Date().toISOString(),connectionId:safeText(request?.connectionId,200),tool:safeText(request?.name,200),classification:safeText(request?.classification,40),ticketId:safeText(request?.ticketId||request?.prepared?.ticketId,240)||null,argumentsSha256:safeText(request?.prepared?.argumentsSha256,128)||null,backupIds:(request?.backupReceipt?.backupIds||[request?.backupReceipt?.id]).filter(Boolean).slice(0,16),backupDomains:(request?.backupReceipt?.coverage||[]).slice(0,16),verified:request?.verification?.verified===true,verificationLevel:safeText(request?.verification?.level||request?.verification?.mode,120)||null,serverCommitted:request?.commit?.post_commit_evidence?.server_committed===true});await chrome.storage.local.set({[RECEIPTS_KEY]:rows.slice(-MAX_RECEIPTS)});return {id,receiptId:id,serverAudit:true,backupIds:(request?.backupReceipt?.backupIds||[]).slice(0,16),verificationLevel:safeText(request?.verification?.level||'',120)||null};}
async function listMutationReceipts(){const rows=await storageGet(RECEIPTS_KEY,[]);return (Array.isArray(rows)?rows:[]).slice(-MAX_RECEIPTS).reverse();}

const api={implementsTransport:true,ownsMcpRuntime:true,mutationGuarantees:Object.freeze({backupBeforeWrite:'server-enforced-verified-prewrite',twoPhaseTickets:true,preferredFlow:'prepare-approve-commit'}),listConnections,saveConnection,removeConnection,discover,health,callTool,readResource,getPrompt,prepareToolMutation,commitToolMutation,requestToolApproval,approveMutation,denyMutation,listPendingApprovals,verifyServerMutationBackup,verifyToolMutation,auditToolMutation,listMutationReceipts,verifyArtifact:undefined,canonicalArgumentsSha256,clientCompatibility:{titanMcp:'>=1.5.0',protocol:PROTOCOL_VERSION,streamableHttp:true,chromeOrigin:typeof chrome!=='undefined'&&chrome.runtime?.id?`chrome-extension://${chrome.runtime.id}`:null}};
global.CodeeMcpRuntime=Object.freeze(api);
})(typeof globalThis!=='undefined'?globalThis:this);
