(function attachCodeeIntelligenceContract(global){
'use strict';

const REQUIRED_OPERATIONS=Object.freeze(['request','stream','cancel','embed','listModels','getCapabilities','health']);
const OPTIONAL_OPERATIONS=Object.freeze(['warmup','unload','resolveModel','explainRouting']);
const AUTHORITY=Object.freeze({
  mayAdvancePlan:false,mayCompletePlan:false,mayVerifyArtifact:false,mayExecuteMutation:false,
  mayWriteRepository:false,mayExecuteShell:false,mayMutateDatabase:false,mayGrantBrowserPermission:false,
  mayApproveBackup:false,mayChangeSpendPolicy:false,mayPromoteMemory:false
});
const RUNTIMES=Object.freeze(['browser','ollama','cloud','hybrid']);
const SCHEMA='codee.intelligence.contract.v1';
const CONTEXT_SCHEMA='codee.intelligence.context.v1';
let seq=0;

function clean(value,max=160){return String(value||'').trim().slice(0,max);}
function uniq(value,max=64){return [...new Set((Array.isArray(value)?value:[]).map(v=>clean(v,160)).filter(Boolean))].slice(0,max);}
function makeId(prefix){seq=(seq+1)%1000000; if(global.crypto?.randomUUID) return `${prefix}-${global.crypto.randomUUID()}`; return `${prefix}-${Date.now()}-${seq}`;}
function freeze(value){
  if(!value||typeof value!=='object'||Object.isFrozen(value)) return value;
  Object.freeze(value); for(const key of Object.keys(value)) freeze(value[key]); return value;
}
function createContext(input={}){
  const runtime=clean(input.runtime||'browser',24).toLowerCase();
  if(!RUNTIMES.includes(runtime)) throw new Error(`Invalid intelligence runtime: ${runtime}`);
  const context={
    schema:CONTEXT_SCHEMA,
    sessionId:clean(input.sessionId)||makeId('intel-session'),
    requestId:clean(input.requestId)||makeId('intel-request'),
    planId:clean(input.planId),runId:clean(input.runId),stepId:clean(input.stepId),
    tabId:Number.isInteger(Number(input.tabId))?Number(input.tabId):null,
    conversationIdentity:clean(input.conversationIdentity,512),
    projectId:clean(input.projectId),workspaceId:clean(input.workspaceId),
    runtime,
    preferredModels:uniq(input.preferredModels,32),
    skillIds:uniq(input.skillIds,64),
    memoryScopes:uniq(input.memoryScopes,32),
    evidenceIds:uniq(input.evidenceIds,256),
    authority:{...AUTHORITY}
  };
  return freeze(context);
}
function validateRuntime(runtime){
  if(!runtime||typeof runtime!=='object') return {ok:false,reason:'runtime-required'};
  if(!/^[a-z0-9][a-z0-9._-]{0,79}$/i.test(clean(runtime.id))) return {ok:false,reason:'invalid-runtime-id'};
  for(const operation of REQUIRED_OPERATIONS){
    if(typeof runtime[operation]!=='function') return {ok:false,reason:`missing-intelligence-operation:${operation}`,operation};
  }
  return {ok:true,id:clean(runtime.id),operations:[...REQUIRED_OPERATIONS],optional:OPTIONAL_OPERATIONS.filter(name=>typeof runtime[name]==='function')};
}
function assertRuntime(runtime){const result=validateRuntime(runtime); if(!result.ok) throw new Error(result.operation?`Codee intelligence runtime requires ${result.operation}()`:`Invalid Codee intelligence runtime: ${result.reason}`); return result;}
function descriptor(runtime,extra={}){
  const validation=assertRuntime(runtime);
  return freeze({schema:SCHEMA,id:validation.id,primaryRuntime:clean(extra.primaryRuntime||runtime.primaryRuntime||'browser',24),operations:validation.operations,optionalOperations:validation.optional,authority:{...AUTHORITY}});
}
function assertAdvisory(value){
  const authority=value?.authority;
  if(!authority||typeof authority!=='object') return false;
  return Object.keys(AUTHORITY).every(key=>authority[key]===false);
}

global.CodeeIntelligenceContract=Object.freeze({SCHEMA,CONTEXT_SCHEMA,REQUIRED_OPERATIONS,OPTIONAL_OPERATIONS,RUNTIMES,AUTHORITY,createContext,validateRuntime,assertRuntime,descriptor,assertAdvisory});
})(typeof globalThis!=='undefined'?globalThis:this);
