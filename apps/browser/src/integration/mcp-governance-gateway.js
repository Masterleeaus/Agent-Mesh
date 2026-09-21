(function attachMcpGovernanceGateway(global){
'use strict';

const CLASSES=new Set(['READ','WRITE','EXECUTE','DESTRUCTIVE','COORDINATE']);
const SHA256=/^[a-f0-9]{64}$/i;
const MAX_MUTATION_ARGUMENT_BYTES=12*1024*1024;
const MAX_READ_ARGUMENT_BYTES=64*1024;
const TITAN_POLICY_KEY='io.titanzero/tool-policy';
const TITAN_POLICY_SCHEMA='titan-mcp-tool-policy/1';

function toolRows(discovery){
 if(Array.isArray(discovery))return discovery;
 if(Array.isArray(discovery?.tools))return discovery.tools;
 if(Array.isArray(discovery?.result?.tools))return discovery.result.tools;
 return [];
}
function findTool(discovery,name){
 const needle=String(name||'');
 return toolRows(discovery).find(t=>String(t?.name||'')===needle)||null;
}
function inferLocalToolClass(name){
 const tokens=String(name||'').toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
 const has=set=>tokens.some(token=>set.has(token));
 if(has(new Set(['delete','drop','destroy','wipe','purge','erase','force'])))return 'DESTRUCTIVE';
 if(has(new Set(['execute','exec','run','test','build','command','artisan','shell','click','type','press','drag','submit','navigate'])))return 'EXECUTE';
 if(has(new Set(['write','create','update','mutate','set','patch','install','uninstall','remove','rename','move','copy','migrate','seed','clear','restore','rollback','deploy','apply'])))return 'WRITE';
 if(has(new Set(['read','get','list','search','find','inspect','describe','status','health','summary','info','count','inventory','discover','schema','relationships','themes','logs','docs','project','stack','architecture','routes','route'])))return 'READ';
 return 'UNKNOWN';
}
function titanPolicy(tool){
 const name=String(tool?.name||'');
 if(!name.startsWith('titan_'))return null;
 const policy=tool?._meta?.[TITAN_POLICY_KEY];
 if(!policy||typeof policy!=='object'||policy.schema!==TITAN_POLICY_SCHEMA)return null;
 const classification=String(policy.classification||'').toUpperCase();
 if(!CLASSES.has(classification))return null;
 return {...policy,classification};
}
function classifyTool(tool){
 if(!tool)return {ok:false,classification:'UNKNOWN',reason:'mcp-tool-not-discovered'};
 const trusted=titanPolicy(tool);
 if(trusted)return {ok:true,classification:trusted.classification,source:'titan-policy',policy:trusted};
 const local=inferLocalToolClass(tool.name);
 const explicit=String(tool.codeeClassification||tool.classification||tool?.annotations?.codeeClassification||'').toUpperCase();
 if(tool?.annotations?.destructiveHint===true||local==='DESTRUCTIVE'||explicit==='DESTRUCTIVE')return {ok:true,classification:'DESTRUCTIVE',source:local==='DESTRUCTIVE'?'local-policy':'metadata-escalation'};
 if(local==='EXECUTE')return {ok:true,classification:'EXECUTE',source:'local-policy'};
 if(local==='WRITE')return {ok:true,classification:'WRITE',source:'local-policy'};
 if(explicit==='EXECUTE'||explicit==='WRITE')return {ok:true,classification:explicit,source:'metadata-escalation'};
 if(local==='READ'&&(explicit==='READ'||tool?.annotations?.readOnlyHint===true||!explicit))return {ok:true,classification:'READ',source:'local-policy'};
 return {ok:false,classification:'UNKNOWN',reason:'mcp-tool-classification-unknown'};
}
function requireFns(adapter,names){
 const missing=names.filter(n=>typeof adapter?.[n]!=='function');
 return missing.length?{ok:false,reason:'mcp-governance-host-not-ready',missing}:null;
}
function inferLocalRequiredBackups(name,classification){
 const tokens=String(name||'').toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
 const set=new Set();
 const has=(...values)=>values.some(value=>tokens.includes(value));
 if(has('database','db','schema','migration','migrate','seed','record','records','data'))set.add('database');
 if(has('file','files','repository','repo','source'))set.add('repository');
 if(has('config','cache','view','views','route','routes','settings')){set.add('runtime');set.add('generated_state');}
 if(has('git'))set.add('git');
 if(has('push','remote'))set.add('git_remote');
 if(String(classification||'')==='DESTRUCTIVE'&&set.size===0)set.add('full_state');
 return [...set];
}
function normalizeBackups(values){
 return [...new Set((Array.isArray(values)?values:[]).map(v=>String(v||'').trim().toLowerCase()).filter(v=>/^[a-z][a-z0-9_.:-]{0,79}$/.test(v)))].slice(0,32);
}
function normalizePrepared(value){
 const p=value&&typeof value==='object'?value:{};
 const targets=(Array.isArray(p.targets)?p.targets:[]).map(v=>String(v||'').trim()).filter(Boolean).slice(0,500);
 const requiredBackups=normalizeBackups(p.requiredBackups||p.effects?.requiredBackups);
 const complete=p.effects?.complete!==false&&p.complete!==false;
 return {...p,targets,requiredBackups,complete};
}
function rejectPrototypeKeys(value,seen=new Set()){
 if(!value||typeof value!=='object')return false;
 if(seen.has(value))return false;
 seen.add(value);
 for(const key of Object.keys(value)){
  if(key==='__proto__'||key==='constructor'||key==='prototype')return true;
  if(rejectPrototypeKeys(value[key],seen))return true;
 }
 return false;
}
function sanitizeCallArgs(args,maxBytes=MAX_MUTATION_ARGUMENT_BYTES){
 try{
  const source=args&&typeof args==='object'?args:{};
  if(rejectPrototypeKeys(source))return {ok:false,reason:'mcp-argument-payload-invalid'};
  const text=JSON.stringify(source);
  if(typeof text!=='string')return {ok:false,reason:'mcp-argument-payload-invalid'};
  const bytes=typeof TextEncoder!=='undefined'?new TextEncoder().encode(text).byteLength:text.length;
  if(bytes>maxBytes)return {ok:false,reason:'mcp-argument-payload-exceeds-limit',maxBytes};
  // JSON cloning validates and bounds the shape while preserving every string byte.
  // Never route mutation arguments through the remote-context redactor.
  return {ok:true,args:JSON.parse(text),bytes};
 }catch(error){
  return {ok:false,reason:'mcp-argument-payload-invalid',error:String(error?.message||error).slice(0,1000)};
 }
}
function validateBackup(receipt,createdId,requiredBackups){
 const id=String(receipt?.id||receipt?.receiptId||'').trim();
 if(receipt?.verified!==true||!id||id!==String(createdId||''))return {ok:false,reason:'mcp-backup-verification-failed'};
 const sha=String(receipt?.sha256||receipt?.checksum||'').trim();
 if(!SHA256.test(sha))return {ok:false,reason:'mcp-backup-verification-failed'};
 const coverage=new Set(normalizeBackups(receipt.coverage||receipt.coveredBackups));
 for(const domain of normalizeBackups(requiredBackups))if(!coverage.has(domain)&&receipt.fullScope!==true)return {ok:false,reason:'mcp-backup-coverage-incomplete',missing:domain};
 return {ok:true,receipt};
}
function mergePolicyBackups(prepared,classification){
 const trusted=classification?.policy;
 const authoritative=normalizeBackups(trusted?.backup_domains);
 const local=inferLocalRequiredBackups(prepared?.toolName||'',classification?.classification);
 return normalizeBackups([...(prepared?.requiredBackups||[]),...authoritative,...local]);
}
async function callReadOnly(adapter,connectionId,name,args){
 if(!adapter||typeof adapter.discover!=='function'||typeof adapter.callTool!=='function')return {ok:false,unavailable:true,reason:'mcp-runtime-not-installed',mayAdvancePlan:false};
 const safe=sanitizeCallArgs(args,MAX_READ_ARGUMENT_BYTES);
 if(!safe.ok)return {...safe,mayAdvancePlan:false};
 args=safe.args;
 let discovery;
 try{discovery=await adapter.discover(connectionId);}catch(error){return {ok:false,reason:'mcp-discovery-failed',error:String(error?.message||error).slice(0,1000),mayAdvancePlan:false};}
 const classification=classifyTool(findTool(discovery,name));
 if(!classification.ok)return {ok:false,reason:classification.reason,classification:'UNKNOWN',mayAdvancePlan:false};
 if(classification.classification!=='READ')return {ok:false,reason:'mcp-context-tool-not-read-only',classification:classification.classification,mayAdvancePlan:false};
 const result=await adapter.callTool(connectionId,name,args||{});
 return {ok:true,classification:'READ',result,mayAdvancePlan:false};
}
async function callTwoPhase(adapter,connectionId,name,args,tool,classification,prepared){
 const missing=requireFns(adapter,['requestToolApproval','commitToolMutation','verifyToolMutation','auditToolMutation']);
 if(missing)return {...missing,classification:classification.classification,mayAdvancePlan:false};
 const receipt=prepared.backupReceipt;
 const createdId=String(receipt?.id||receipt?.receiptId||'').trim();
 const backupCheck=validateBackup(receipt,createdId,prepared.requiredBackups);
 if(!backupCheck.ok)return {ok:false,reason:backupCheck.reason,missingBackup:backupCheck.missing||null,classification:classification.classification,mayAdvancePlan:false};
 const ticketId=String(prepared.ticketId||prepared.ticket_id||'').trim();
 if(!ticketId)return {ok:false,reason:'mcp-mutation-ticket-missing',classification:classification.classification,mayAdvancePlan:false};
 const approval=await adapter.requestToolApproval({connectionId,name,classification:classification.classification,args:args||{},tool,mutation:prepared,approvalEvidence:prepared.approvalEvidence||null,backupReceipt:receipt,backupGuarantee:{mode:'titan-two-phase-ticket',requiredBackups:prepared.requiredBackups.slice(),ticketId}});
 if(!approval||approval.approved!==true)return {ok:false,reason:'mcp-approval-denied',classification:classification.classification,approval:approval||null,backupReceipt:receipt,backupGuarantee:'titan-two-phase-ticket',ticketId,mayAdvancePlan:false};
 let commit;
 try{commit=await adapter.commitToolMutation(connectionId,ticketId);}catch(error){return {ok:false,reason:'mcp-tool-execution-failed',error:String(error?.message||error).slice(0,1000),classification:classification.classification,backupReceipt:receipt,backupGuarantee:'titan-two-phase-ticket',ticketId,mayAdvancePlan:false};}
 const mutation=commit?.mutation_result??commit?.mutationResult??commit?.result??commit;
 const verification=await adapter.verifyToolMutation({connectionId,name,classification:classification.classification,mutation,commit,prepared,backupReceipt:receipt,ticketId});
 if(!verification||verification.verified!==true)return {ok:false,reason:'mcp-post-write-verification-failed',classification:classification.classification,backupReceipt:receipt,verification:verification||null,ticketId,rollback:{backupReceiptId:createdId,targets:prepared.targets.slice(),requiredBackups:prepared.requiredBackups.slice()},mayAdvancePlan:false};
 const audit=await adapter.auditToolMutation({connectionId,name,classification:classification.classification,prepared,backupReceipt:receipt,mutation,commit,verification,ticketId});
 const auditId=String(audit?.receiptId||audit?.auditId||audit?.id||'').trim();
 if(!auditId)return {ok:false,reason:'mcp-audit-receipt-missing',classification:classification.classification,backupReceipt:receipt,verification,ticketId,rollback:{backupReceiptId:createdId,targets:prepared.targets.slice(),requiredBackups:prepared.requiredBackups.slice()},mayAdvancePlan:false};
 return {ok:true,classification:classification.classification,result:mutation,commit,backupReceipt:receipt,verification,auditReceipt:audit,ticketId,rollback:{backupReceiptId:createdId,targets:prepared.targets.slice(),requiredBackups:prepared.requiredBackups.slice()},backupGuarantee:'titan-two-phase-ticket',mayAdvancePlan:false};
}
async function call(adapter,connectionId,name,args){
 if(!adapter||typeof adapter.discover!=='function')return {ok:false,unavailable:true,reason:'mcp-runtime-not-installed',mayAdvancePlan:false};
 let discovery;
 try{discovery=await adapter.discover(connectionId);}catch(error){return {ok:false,reason:'mcp-discovery-failed',error:String(error?.message||error).slice(0,1000),mayAdvancePlan:false};}
 const tool=findTool(discovery,name);
 const classification=classifyTool(tool);
 if(!classification.ok)return {ok:false,reason:classification.reason,classification:'UNKNOWN',mayAdvancePlan:false};
 const maxBytes=classification.classification==='READ'?MAX_READ_ARGUMENT_BYTES:MAX_MUTATION_ARGUMENT_BYTES;
 const safe=sanitizeCallArgs(args,maxBytes);
 if(!safe.ok)return {...safe,classification:classification.classification,mayAdvancePlan:false};
 args=safe.args;
 if(classification.classification==='READ'||classification.classification==='COORDINATE'){
  if(typeof adapter.callTool!=='function')return {ok:false,unavailable:true,reason:'mcp-runtime-not-installed',classification:classification.classification,mayAdvancePlan:false};
  const result=await adapter.callTool(connectionId,name,args||{});
  return {ok:true,classification:classification.classification,result,mayAdvancePlan:false};
 }
 const missingBase=requireFns(adapter,['prepareToolMutation','requestToolApproval','verifyToolMutation','auditToolMutation']);
 if(missingBase)return {...missingBase,classification:classification.classification,mayAdvancePlan:false};
 const prepared=normalizePrepared(await adapter.prepareToolMutation(connectionId,name,args||{},tool));
 prepared.toolName=name;
 const isSealedTitanTicket=prepared.backupMode==='titan-two-phase-ticket'&&classification.source==='titan-policy';
 if(isSealedTitanTicket){
  // For sealed Titan tickets, the prepared evidence describes the exact dynamic recovery scope.
  // Do not inflate it with name heuristics or potential policy domains (for example Artisan may or may not touch the database).
  prepared.requiredBackups=normalizeBackups(prepared.requiredBackups||prepared.approvalEvidence?.backup_domains);
 }else{
  const policyBackups=normalizeBackups(classification?.policy?.backup_domains);
  const localBackups=classification.source==='titan-policy'?[]:inferLocalRequiredBackups(name,classification.classification);
  prepared.requiredBackups=normalizeBackups([...(prepared.requiredBackups||[]),...policyBackups,...localBackups]);
 }
 prepared.effects={...(prepared.effects&&typeof prepared.effects==='object'?prepared.effects:{}),requiredBackups:prepared.requiredBackups.slice()};
 if(!prepared.complete)return {ok:false,reason:'mcp-mutation-effects-incomplete',classification:classification.classification,mayAdvancePlan:false};
 if(prepared.targets.length===0&&prepared.requiredBackups.length===0)return {ok:false,reason:'mcp-mutation-effects-missing',classification:classification.classification,mayAdvancePlan:false};
 const twoPhase=prepared.backupMode==='titan-two-phase-ticket'&&adapter?.capabilityDescriptor?.twoPhaseMutationTickets===true;
 if(twoPhase)return callTwoPhase(adapter,connectionId,name,args,tool,classification,prepared);
 const serverMode=prepared.backupMode==='server-enforced-verified-prewrite'&&adapter?.capabilityDescriptor?.serverVerifiedPrewriteBackup===true;
 if(serverMode){
  const missingServer=requireFns(adapter,['callTool','verifyServerMutationBackup']);
  if(missingServer)return {...missingServer,classification:classification.classification,mayAdvancePlan:false};
  const approval=await adapter.requestToolApproval({connectionId,name,classification:classification.classification,args:args||{},mutation:prepared,backupGuarantee:{mode:'server-enforced-verified-prewrite',requiredBackups:prepared.requiredBackups.slice()}});
  if(!approval||approval.approved!==true)return {ok:false,reason:'mcp-approval-denied',classification:classification.classification,approval:approval||null,backupGuarantee:'server-enforced-verified-prewrite',mayAdvancePlan:false};
  let mutation;
  try{mutation=await adapter.callTool(connectionId,name,args||{});}catch(error){return {ok:false,reason:'mcp-tool-execution-failed',error:String(error?.message||error).slice(0,1000),classification:classification.classification,backupGuarantee:'server-enforced-verified-prewrite',mayAdvancePlan:false};}
  const verifiedBackup=await adapter.verifyServerMutationBackup({connectionId,name,classification:classification.classification,mutation,prepared,requiredBackups:prepared.requiredBackups});
  const createdId=String(verifiedBackup?.id||verifiedBackup?.receiptId||'').trim();
  const backupCheck=validateBackup(verifiedBackup,createdId,prepared.requiredBackups);
  if(!backupCheck.ok)return {ok:false,reason:backupCheck.reason,missingBackup:backupCheck.missing||null,classification:classification.classification,mutation,mayAdvancePlan:false};
  const verification=await adapter.verifyToolMutation({connectionId,name,classification:classification.classification,mutation,prepared,backupReceipt:verifiedBackup});
  if(!verification||verification.verified!==true)return {ok:false,reason:'mcp-post-write-verification-failed',classification:classification.classification,backupReceipt:verifiedBackup,verification:verification||null,rollback:{backupReceiptId:createdId,targets:prepared.targets.slice(),requiredBackups:prepared.requiredBackups.slice()},mayAdvancePlan:false};
  const audit=await adapter.auditToolMutation({connectionId,name,classification:classification.classification,prepared,backupReceipt:verifiedBackup,mutation,verification});
  const auditId=String(audit?.receiptId||audit?.auditId||audit?.id||'').trim();
  if(!auditId)return {ok:false,reason:'mcp-audit-receipt-missing',classification:classification.classification,backupReceipt:verifiedBackup,verification,rollback:{backupReceiptId:createdId,targets:prepared.targets.slice(),requiredBackups:prepared.requiredBackups.slice()},mayAdvancePlan:false};
  return {ok:true,classification:classification.classification,result:mutation,backupReceipt:verifiedBackup,verification,auditReceipt:audit,rollback:{backupReceiptId:createdId,targets:prepared.targets.slice(),requiredBackups:prepared.requiredBackups.slice()},backupGuarantee:'server-enforced-verified-prewrite',mayAdvancePlan:false};
 }
 const missingClient=requireFns(adapter,['callTool','createToolBackup','verifyToolBackup']);
 if(missingClient)return {...missingClient,classification:classification.classification,mayAdvancePlan:false};
 const backup=await adapter.createToolBackup({connectionId,name,classification:classification.classification,mutation:prepared,requiredBackups:prepared.requiredBackups});
 const createdId=String(backup?.id||backup?.receiptId||'').trim();
 if(!createdId)return {ok:false,reason:'mcp-backup-create-failed',classification:classification.classification,mayAdvancePlan:false};
 const verifiedBackup=await adapter.verifyToolBackup(backup,{connectionId,name,mutation:prepared,requiredBackups:prepared.requiredBackups});
 const backupCheck=validateBackup(verifiedBackup,createdId,prepared.requiredBackups);
 if(!backupCheck.ok)return {ok:false,reason:backupCheck.reason,missingBackup:backupCheck.missing||null,classification:classification.classification,mayAdvancePlan:false};
 const approval=await adapter.requestToolApproval({connectionId,name,classification:classification.classification,args:args||{},mutation:prepared,backupReceipt:verifiedBackup});
 if(!approval||approval.approved!==true)return {ok:false,reason:'mcp-approval-denied',classification:classification.classification,backupReceipt:verifiedBackup,rollback:{backupReceiptId:createdId,targets:prepared.targets.slice(),requiredBackups:prepared.requiredBackups.slice()},mayAdvancePlan:false};
 let mutation;
 try{mutation=await adapter.callTool(connectionId,name,args||{});}catch(error){return {ok:false,reason:'mcp-tool-execution-failed',error:String(error?.message||error).slice(0,1000),classification:classification.classification,backupReceipt:verifiedBackup,rollback:{backupReceiptId:createdId,targets:prepared.targets.slice(),requiredBackups:prepared.requiredBackups.slice()},mayAdvancePlan:false};}
 const verification=await adapter.verifyToolMutation({connectionId,name,classification:classification.classification,mutation,prepared,backupReceipt:verifiedBackup});
 if(!verification||verification.verified!==true)return {ok:false,reason:'mcp-post-write-verification-failed',classification:classification.classification,backupReceipt:verifiedBackup,verification:verification||null,rollback:{backupReceiptId:createdId,targets:prepared.targets.slice(),requiredBackups:prepared.requiredBackups.slice()},mayAdvancePlan:false};
 const audit=await adapter.auditToolMutation({connectionId,name,classification:classification.classification,prepared,backupReceipt:verifiedBackup,mutation,verification});
 const auditId=String(audit?.receiptId||audit?.auditId||audit?.id||'').trim();
 if(!auditId)return {ok:false,reason:'mcp-audit-receipt-missing',classification:classification.classification,backupReceipt:verifiedBackup,verification,rollback:{backupReceiptId:createdId,targets:prepared.targets.slice(),requiredBackups:prepared.requiredBackups.slice()},mayAdvancePlan:false};
 return {ok:true,classification:classification.classification,result:mutation,backupReceipt:verifiedBackup,verification,auditReceipt:audit,rollback:{backupReceiptId:createdId,targets:prepared.targets.slice(),requiredBackups:prepared.requiredBackups.slice()},mayAdvancePlan:false};
}

global.CodeeMcpGovernanceGateway=Object.freeze({classifyTool,inferLocalToolClass,inferLocalRequiredBackups,findTool,callReadOnly,call,normalizePrepared,validateBackup,sanitizeCallArgs,titanPolicy,MAX_MUTATION_ARGUMENT_BYTES,MAX_READ_ARGUMENT_BYTES});
})(typeof globalThis!=='undefined'?globalThis:this);
