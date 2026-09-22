(function attachCodeeProviderGateway(global){
'use strict';
const AUTHORITY=Object.freeze({executeResult:false,advancePlan:false,mayAdvancePlan:false,mayExecuteMutation:false,mayGrantBrowserPermission:false});
function audit(request,response={},outcome='UNKNOWN',extra={}){
 try{return global.CodeeAIAuditLedger?.record?.({requestId:request?.requestId||'',managerId:request?.managerId||'',planId:request?.planId||'',runId:request?.runId||'',stepId:request?.stepId||'',purpose:request?.purpose||'',provider:response?.provider||extra.provider||'',model:response?.model||extra.model||'',privacyLevel:request?.privacy?.level||'INTERNAL',costUsd:response?.cost?.usd||0,freeStatus:response?.cost?.status||'UNKNOWN',latencyMs:response?.latencyMs||extra.latencyMs||0,outcome,finishReason:response?.finishReason||extra.finishReason||'',providerRequestId:response?.providerRequestId||'',failover:extra.failover||[]});}catch(_error){return null;}
}
function eligible(request){
 const preferred=request.preferredProviders||[], forbidden=new Set(request.forbiddenProviders||[]); let rows=global.CodeeAIProviderRegistry?.list?.()||[];
 rows=rows.filter(row=>!forbidden.has(row.id)&&!['RETIRED','TEMPORARILY_UNAVAILABLE'].includes(row.lifecycle));
 if(request.privacy?.allowCloud===false) rows=rows.filter(row=>row.lifecycle==='LOCAL');
 if(request.costPolicy?.mode==='FREE_ONLY') rows=rows.filter(row=>['LOCAL','FREE','FREE_LIMITED','FREE_DEVELOPMENT','FREE_CREDIT_LIMITED','FREE_TRIAL'].includes(row.lifecycle));
 if(preferred.length){const rank=new Map(preferred.map((id,index)=>[id,index]));rows=rows.filter(row=>rank.has(row.id)).sort((a,b)=>rank.get(a.id)-rank.get(b.id));}
 else rows.sort((a,b)=>(a.lifecycle==='LOCAL'?-1:0)-(b.lifecycle==='LOCAL'?-1:0));
 return rows;
}
function failure(reason,request=null,extra={}){return Object.freeze({ok:false,reason,requestId:request?.requestId||null,...extra,authority:AUTHORITY});}
async function supportsRequest(adapter,request){
 const caps=await Promise.resolve(adapter.getCapabilities(request));
 const map=caps&&typeof caps==='object'?caps:{};
 const checks={tools:'supportsTools',structured_output:'supportsStructuredOutput',vision:'supportsVision',reasoning:'supportsReasoning',embeddings:'supportsEmbeddings',long_context:'supportsLongContext',caching:'supportsCaching',batch:'supportsBatch',files:'supportsFiles'};
 for(const capability of request.requiredCapabilities||[]){
   if(capability==='text') continue;
   const method=checks[capability];
   if(method&&typeof adapter[method]==='function'){
     if(!await Promise.resolve(adapter[method](request))) return false;
     continue;
   }
   if(!map[capability]) return false;
 }
 return true;
}
async function resolveAgentMeshWorkContext(input={}){if(input.workContext)return input.workContext;if(input.injectAgentMeshWorkContext!==true)return null;try{const snapshot=await global.getManagerAISnapshot?.();const result=await global.getAgentMeshWorkContext?.(snapshot);return result?.ok?result.context:null;}catch(_error){return null;}}
async function request(input={}){
 const workContext=await resolveAgentMeshWorkContext(input);if(workContext)input={...input,workContext};
 if(!global.CodeeAIRequestContract||!global.CodeeAIResponseContract||!global.CodeeAIProviderRegistry) return failure('ai-gateway-runtime-incomplete');
 let normalized; try{normalized=global.CodeeAIRequestContract.create(input);}catch(error){return failure('invalid-ai-request',null,{error:String(error?.message||error).slice(0,1000)});}
 const providers=eligible(normalized); if(!providers.length){audit(normalized,{},'NO_PROVIDER');return failure('no-eligible-provider',normalized);}
 const errors=[]; let capableCount=0;
 for(const adapter of providers){
   try{
     if(!await supportsRequest(adapter,normalized)) continue;
     capableCount+=1;
     const started=Date.now(); const raw=await adapter.complete(normalized); const payload=raw&&typeof raw==='object'?raw:{response:String(raw??'')};
     const response=global.CodeeAIResponseContract.create({...payload,requestId:normalized.requestId,provider:adapter.id,model:payload.model||normalized.preferredModels?.[0]||'unknown',latencyMs:payload.latencyMs??Date.now()-started});
     audit(normalized,response,'SUCCESS',{failover:errors});
     return Object.freeze({ok:true,request:normalized,response,provider:adapter.id,model:response.model,authority:AUTHORITY});
   }catch(error){errors.push({provider:adapter.id,error:String(error?.message||error).slice(0,1000)});if(normalized.retryPolicy?.allowFailover===false)break;}
 }
 if(capableCount===0){audit(normalized,{},'NO_CAPABLE_PROVIDER');return failure('no-capable-provider',normalized);}
 audit(normalized,{},'FAILED',{failover:errors});
 return failure('all-providers-failed',normalized,{errors:global.CodeeAISanitizer?.immutable(errors,{maxArray:20,maxString:1000})||errors});
}
async function requestAdvisory(legacy={}){
 const preferred=String(legacy.preferredProvider||'auto');
 const result=await request({managerId:legacy.managerId,purpose:'workforce-advisory',task:legacy.task||'',systemInstructions:legacy.reason||'',evidence:(legacy.contextRefs||[]).map(id=>({id})),preferredProviders:preferred&&preferred!=='auto'?[preferred]:[],privacyLevel:'INTERNAL',costPolicy:{mode:'AUTO'},requiredCapabilities:['text']});
 if(!result.ok&&result.reason==='no-eligible-provider')return Object.freeze({ok:true,queued:true,advisory:true,reason:'provider-gateway-has-no-configured-provider',requestId:result.requestId,authority:AUTHORITY});
 return Object.freeze({...result,advisory:true,authority:AUTHORITY});
}
function registerProvider(adapter){return global.CodeeAIProviderRegistry.register(adapter);}
function status(){const providers=global.CodeeAIProviderRegistry?.status?.()||{providers:0,active:0,local:0};const models=global.CodeeAIModelRegistry?.status?.()||{models:0,healthy:0,local:0,free:0};return Object.freeze({schema:'codee.ai.gateway.status.v1',gatewayInstalled:true,providers:providers.providers||0,activeProviders:providers.active||0,localProviders:providers.local||0,models:models.models||0,healthyModels:models.healthy||0,inferenceReady:(providers.active||0)>0,authority:AUTHORITY});}
global.CodeeProviderGateway=Object.freeze({request,requestAdvisory,registerProvider,status,resolveAgentMeshWorkContext});
})(typeof globalThis!=='undefined'?globalThis:this);
