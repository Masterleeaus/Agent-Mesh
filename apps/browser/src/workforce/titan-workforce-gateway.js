(function attachTitanWorkforceGateway(global){
'use strict';
const READ_OPERATIONS=new Set([
 'deployment.gateway.status','deployment.mission.list','deployment.mission.get','deployment.intake.get','deployment.discovery.get','deployment.questions.get','deployment.participation.get','deployment.evidence.list','deployment.readiness.get','deployment.engineering.get','deployment.installation.get','deployment.commissioning.get','deployment.handover.get','deployment.change_request.list','deployment.receipts.list'
]);
const PROPOSE_OPERATIONS=new Set([
 'deployment.mission.create','deployment.mission.advance','deployment.participation.propose','deployment.evidence.request','deployment.engineering.propose','deployment.installation.propose','deployment.commissioning.propose','deployment.handover.prepare','deployment.change_request.accept'
]);
const MAX_PAYLOAD_CHARS=256000;
const COMPANY=/^[A-Za-z0-9._:-]{2,128}$/;
const ACTOR=/^[A-Za-z0-9._:@/-]{2,160}$/;
function uid(prefix){const id=global.crypto?.randomUUID?.()||`${Date.now()}-${Math.random().toString(36).slice(2,12)}`;return `${prefix}-${id}`;}
function clean(value,max=160){return String(value??'').trim().slice(0,max);}
function assertNoLegacy(input){for(const key of ['tenant_id','tenant_company_id','tenantCompanyId','companyId'])if(Object.prototype.hasOwnProperty.call(input||{},key))throw new Error('legacy-company-boundary-rejected');}
function sanitizePayload(value,depth=0,seen=new WeakSet()){
 if(depth>7)return '[TRUNCATED]';
 if(value==null||typeof value==='boolean'||typeof value==='number')return value;
 if(typeof value==='string')return value.slice(0,12000);
 if(typeof value!=='object')return String(value).slice(0,1000);
 if(seen.has(value))return '[Circular]';seen.add(value);
 if(Array.isArray(value))return value.slice(0,200).map(v=>sanitizePayload(v,depth+1,seen));
 const out={};for(const [key,child] of Object.entries(value).slice(0,200)){
  if(/^(password|secret|token|api[_-]?key|authorization|cookie|credential|client[_-]?secret)$/i.test(key)){out[key]='[REDACTED]';continue;}
  out[String(key).slice(0,120)]=sanitizePayload(child,depth+1,seen);
 }return out;
}
function createRequest(input={}){
 assertNoLegacy(input);
 const company_id=clean(input.company_id,128),actor_id=clean(input.actor_id,160),operation=clean(input.operation,180);
 if(!COMPANY.test(company_id))throw new Error('company_id-required');
 if(!ACTOR.test(actor_id))throw new Error('actor_id-required');
 const isRead=READ_OPERATIONS.has(operation),isPropose=PROPOSE_OPERATIONS.has(operation);
 if(!isRead&&!isPropose)throw new Error('operation-denied');
 const payload=sanitizePayload(input.payload&&typeof input.payload==='object'?input.payload:{});
 if(JSON.stringify(payload).length>MAX_PAYLOAD_CHARS)throw new Error('gateway-payload-too-large');
 const request_id=clean(input.request_id,160)||uid('wfreq');
 const trace_id=clean(input.trace_id,160)||uid('trace');
 return Object.freeze({
  schema:'titan.workforce.gateway.request.v1',request_id,company_id,actor_id,source_surface:'titan_code',target_domain:'deployment_workforce',operation,mode:isRead?'read':'propose',payload,
  idempotency_key:clean(input.idempotency_key,200)||`titan-code:${company_id}:${operation}:${request_id}`,
  trace_id,correlation_id:input.correlation_id?clean(input.correlation_id,160):null,causation_id:input.causation_id?clean(input.causation_id,160):null,
  deployment_mission_id:input.deployment_mission_id?clean(input.deployment_mission_id,160):null,client_workforce_handover_id:input.client_workforce_handover_id?clean(input.client_workforce_handover_id,160):null,
  requested_at:new Date().toISOString(),grants_authority:false
 });
}
function normalizeConfig(input={}){const endpoint=String(input.endpoint||'').trim();return Object.freeze({enabled:input.enabled!==false,endpoint,token:String(input.token||'').trim(),company_id:clean(input.company_id,128),actor_id:clean(input.actor_id||'authenticated',160)});}
function publicConfig(input={}){const c=normalizeConfig(input);return Object.freeze({...c,token:c.token?'configured':''});}
function assertConfig(config){if(!config.enabled)throw new Error('workforce-gateway-disabled');if(!config.endpoint)throw new Error('workforce-gateway-endpoint-required');if(!COMPANY.test(config.company_id))throw new Error('company_id-required');if(!ACTOR.test(config.actor_id))throw new Error('actor_id-required');}
function validateReceipt(receipt,request){if(!receipt||typeof receipt!=='object')throw new Error('invalid-workforce-gateway-receipt');if(receipt.schema!=='titan.workforce.gateway.receipt.v1')throw new Error('invalid-workforce-gateway-receipt-schema');if(receipt.company_id!==request.company_id)throw new Error('cross-company-workforce-receipt-rejected');if(receipt.request_id!==request.request_id)throw new Error('workforce-receipt-request-mismatch');if(receipt.grants_authority!==false)throw new Error('workforce-receipt-authority-violation');return receipt;}
function validateProjection(projection,request){if(projection==null)return null;if(!projection||typeof projection!=='object')throw new Error('invalid-workforce-gateway-projection');if(projection.schema!=='titan.workforce.gateway.projection.v1')throw new Error('invalid-workforce-gateway-projection-schema');if(projection.company_id!==request.company_id)throw new Error('cross-company-workforce-projection-rejected');if(projection.grants_authority!==false)throw new Error('workforce-projection-authority-violation');if(projection.target_surface!=='titan_code')throw new Error('workforce-projection-surface-mismatch');return projection;}
async function send(configInput,requestInput){
 const config=normalizeConfig(configInput);assertConfig(config);const request=requestInput?.schema==='titan.workforce.gateway.request.v1'?requestInput:createRequest({...requestInput,company_id:config.company_id,actor_id:config.actor_id});
 if(!global.CodeeApprovedNetworkTransport?.postJson)throw new Error('approved-network-transport-unavailable');
 const headers={'Content-Type':'application/json','X-Request-Id':request.request_id};if(config.token)headers.Authorization=`Bearer ${config.token}`;
 const response=await global.CodeeApprovedNetworkTransport.postJson(config.endpoint,request,{headers});
 if(!response.ok||response.json?.ok===false)throw new Error(String(response.json?.error||response.json?.reason||`workforce-gateway-http-${response.status}`).slice(0,1000));
 const receipt=response.json?.receipt||response.json;
 return {request,receipt:validateReceipt(receipt,request),projection:validateProjection(response.json?.projection||null,request),data:response.json?.data||null};
}
async function call(configInput,operation,options={}){const config=normalizeConfig(configInput);const request=createRequest({...options,company_id:config.company_id,actor_id:config.actor_id,operation,payload:options.payload||{}});return send(config,request);}
async function probe(config){return call(config,'deployment.gateway.status',{payload:{client:'titan-code',contract:'v1'}});}
global.CodeeTitanWorkforceGateway=Object.freeze({READ_OPERATIONS:Object.freeze([...READ_OPERATIONS]),PROPOSE_OPERATIONS:Object.freeze([...PROPOSE_OPERATIONS]),normalizeConfig,publicConfig,createRequest,validateReceipt,validateProjection,send,call,probe,sanitizePayload});
})(typeof globalThis!=='undefined'?globalThis:this);
