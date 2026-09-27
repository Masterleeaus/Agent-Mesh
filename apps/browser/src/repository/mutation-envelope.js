(function attachMutationEnvelope(global){
'use strict';
const MUTATING_KINDS=new Set(['file_write','file_delete','database_write','command_mutation','git_write','rollback']);
const ALLOWED_BACKUPS=new Set(['repository','database','runtime','git']);
function boundedText(value,max){const text=String(value??'').slice(0,max);return global.CodeeRepositoryPolicy?.redactText?global.CodeeRepositoryPolicy.redactText(text):text;}
function normalizeRequiredBackups(values){return [...new Set((Array.isArray(values)?values:[]).map(v=>String(v||'').toLowerCase()).filter(v=>ALLOWED_BACKUPS.has(v)))];}
function validateRequest(request){
 if(!request||!MUTATING_KINDS.has(request.kind))throw new Error('A recognized mutating request kind is required.');
 const rawTargets=Array.isArray(request.targets)?request.targets:[];const targets=[];
 for(const rawTarget of rawTargets){if(!global.CodeeRepositoryPolicy.isInScope(rawTarget))throw new Error(`Mutation target is outside the governed repository scope: ${String(rawTarget||'')}`);const target=global.CodeeRepositoryPolicy.normalize(rawTarget);if(!target)continue;if(global.CodeeRepositoryPolicy.isSensitive(target))throw new Error(`Sensitive mutation target is blocked: ${target}`);targets.push(target);}
 const requiredBackups=normalizeRequiredBackups(request.requiredBackups||request.effects?.requiredBackups);
 if(!targets.length&&request.kind!=='command_mutation')throw new Error('Mutation must declare affected targets.');
 if(request.kind==='command_mutation'&&!targets.length&&!requiredBackups.length)throw new Error('Command mutation must declare affected targets or complete effect backups.');
 if(request.kind==='command_mutation'&&request.effects?.complete===false)throw new Error('Command effect manifest is incomplete; execution is blocked.');
 const out={kind:request.kind,targets:[...new Set(targets)],requiredBackups};
 if(request.effects&&typeof request.effects==='object')out.effects=request.effects;
 for(const key of ['runId','planId','stepId','correlationId','operationId'])if(request[key]!==undefined&&request[key]!==null){const value=boundedText(request[key],240);if(value)out[key]=value;}
 if(request.command!==undefined)out.command=boundedText(request.command,4000);
 if(Number.isFinite(Number(request.contentChars)))out.contentChars=Math.max(0,Math.min(Number(request.contentChars),Number.MAX_SAFE_INTEGER));
 return out;
}
function validateBackup(backup,targets,requiredBackups){
 if(!backup||backup.verified!==true||!String(backup.id||'').trim())throw new Error('Mutation requires a verified backup receipt before execution.');
 const covered=new Set((Array.isArray(backup.targets)?backup.targets:[]).filter(path=>global.CodeeRepositoryPolicy.isInScope(path)).map(global.CodeeRepositoryPolicy.normalize));
 for(const t of targets||[])if(!covered.has(t)&&backup.fullScope!==true)throw new Error(`Verified backup does not cover mutation target: ${t}`);
 const coverage=new Set((Array.isArray(backup.coverage)?backup.coverage:Array.isArray(backup.coveredBackups)?backup.coveredBackups:[]).map(v=>String(v||'').toLowerCase()));
 for(const domain of normalizeRequiredBackups(requiredBackups))if(!coverage.has(domain)&&backup.fullScope!==true)throw new Error(`Verified backup does not cover required ${domain} state.`);
 const checksum=String(backup.sha256||backup.manifestSha256||'').trim().toLowerCase();if(!/^[a-f0-9]{64}$/.test(checksum))throw new Error('Verified backup receipt requires a valid SHA-256 checksum.');
 return {...backup,id:String(backup.id).trim(),sha256:backup.sha256?checksum:backup.sha256,manifestSha256:backup.manifestSha256?checksum:backup.manifestSha256};
}
function authorize(request,backupReceipt){const valid=validateRequest(request);const backup=validateBackup(backupReceipt,valid.targets,valid.requiredBackups);return {request:{...valid},backupReceipt:{...backup},executionAllowed:true,requiresPostWriteVerification:true,requiresAuditReceipt:true,requiresRollbackMetadata:true,mayAdvancePlan:false,authorizedAt:new Date().toISOString()};}
function prepare(request){const valid=validateRequest(request);return {request:valid,executionAllowed:false,requiredBeforeExecution:['capture_backup','verify_backup_checksum','authorize_mutation'],backupScope:{targets:valid.targets,requiredBackups:valid.requiredBackups,kind:valid.kind,effects:valid.effects||null},mayAdvancePlan:false};}
global.CodeeMutationEnvelope=Object.freeze({prepare,authorize,validateRequest,validateBackup,normalizeRequiredBackups,MUTATING_KINDS:[...MUTATING_KINDS]});
})(typeof globalThis!=='undefined'?globalThis:this);
