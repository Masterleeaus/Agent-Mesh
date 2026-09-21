(function attachCodeeAIRouter(global){
'use strict';
const LOCALITY_ORDER=Object.freeze(['ON_DEVICE','LOCAL_DEVICE','CUSTOMER_HOSTED','SUBSCRIPTION','BYO_API','TITAN_MANAGED']);
const HEALTH_ORDER=Object.freeze({READY:0,HEALTHY:0,AVAILABLE:0,UNKNOWN:2,DEGRADED:4,UNAVAILABLE:99,FAILED:99});
function norm(v){return String(v||'').trim().toUpperCase();}
function localityRank(v){const i=LOCALITY_ORDER.indexOf(norm(v));return i<0?LOCALITY_ORDER.length:i;}
function healthRank(v){const n=norm(v);return Object.prototype.hasOwnProperty.call(HEALTH_ORDER,n)?HEALTH_ORDER[n]:2;}
function capMap(row){return row?.capabilities&&typeof row.capabilities==='object'?row.capabilities:{};}
function modelCandidates(providerId){return global.CodeeAIModelRegistry?.list?.({providerId})||[];}
function modelSupports(model,required){const caps=capMap(model);return (required||[]).every(c=>c==='text'||Boolean(caps[c]));}
function providerSupports(row,required){const caps=capMap(row);if(!required?.length)return true;return required.every(c=>c==='text'||caps[c]!==false);}
function privacyAllows(locality,privacyLevel,allowCloud){const p=norm(privacyLevel||'INTERNAL');if(allowCloud===false||p==='SECRET'||p==='LOCAL_ONLY')return ['ON_DEVICE','LOCAL_DEVICE','CUSTOMER_HOSTED'].includes(norm(locality));return true;}
function costAllows(row,mode){const m=norm(mode||'AUTO');if(m!=='FREE_ONLY')return true;return ['ON_DEVICE','LOCAL_DEVICE','CUSTOMER_HOSTED'].includes(norm(row.locality))||['LOCAL','FREE','FREE_LIMITED','FREE_DEVELOPMENT','FREE_CREDIT_LIMITED','FREE_TRIAL'].includes(norm(row.lifecycle));}
function score(row,models,options){
 const preferred=new Map((options.preferredProviders||[]).map((id,i)=>[String(id),i]));
 const preferredRank=preferred.has(row.id)?preferred.get(row.id):preferred.size?100:0;
 const healthy=models.length?Math.min(...models.map(m=>healthRank(m.health))):2;
 const reliability=models.length?Math.max(...models.map(m=>Number(m.reliabilityScore)||0)):0;
 return preferredRank*100000+localityRank(row.locality)*1000+healthy*100-Math.round(reliability*50);
}
function select(input={}){
 const required=[...new Set((input.requiredCapabilities||['text']).map(String))];
 const forbidden=new Set((input.forbiddenProviders||[]).map(String));
 const privacyLevel=input.privacyLevel||input.privacy?.level||'INTERNAL';
 const allowCloud=input.allowCloud??input.privacy?.allowCloud;
 const mode=input.costPolicy?.mode||input.costMode||'AUTO';
 const rows=(global.CodeeIntelligenceCatalogue?.list?.({kind:'INFERENCE'})||[]).filter(row=>{
   if(forbidden.has(row.id))return false;
   if(['RETIRED','TEMPORARILY_UNAVAILABLE'].includes(norm(row.lifecycle)))return false;
   if(!privacyAllows(row.locality,privacyLevel,allowCloud))return false;
   if(!costAllows(row,mode))return false;
   return providerSupports(row,required);
 });
 const ranked=[];
 for(const row of rows){
   const allModels=modelCandidates(row.id); const capableModels=allModels.filter(m=>modelSupports(m,required)&&!['UNAVAILABLE','FAILED'].includes(norm(m.health)));
   if(allModels.length&&capableModels.length===0)continue;
   ranked.push({providerId:row.id,locality:row.locality,transport:row.transport,models:capableModels.map(m=>m.modelId),score:score(row,capableModels,input),reason:{privacyLevel:norm(privacyLevel),costMode:norm(mode),requiredCapabilities:required.slice(),locality:row.locality}});
 }
 ranked.sort((a,b)=>a.score-b.score||a.providerId.localeCompare(b.providerId));
 return Object.freeze({schema:'titan.code.ai.route.v1',selected:ranked[0]||null,candidates:Object.freeze(ranked.map(x=>Object.freeze(x))),authority:Object.freeze({execution:false,verification:false,canonical:false}),tenantBoundary:'company_id'});
}
async function request(input={}){
 if(!global.CodeeProviderGateway?.request)return Object.freeze({ok:false,reason:'provider-gateway-unavailable'});
 const route=select(input);if(!route.selected)return Object.freeze({ok:false,reason:'no-routable-provider',route});
 const preferred=[route.selected.providerId,...route.candidates.slice(1).map(x=>x.providerId)];
 return global.CodeeProviderGateway.request({...input,preferredProviders:preferred,preferredModels:input.preferredModels?.length?input.preferredModels:route.selected.models});
}
function status(){return Object.freeze({schema:'titan.code.ai.router.status.v1',installed:true,localityOrder:LOCALITY_ORDER,authority:'CodeeProviderGateway',tenantBoundary:'company_id',privateDevelopmentOnly:true,titanZeroRuntimeDependency:false});}
global.CodeeAIRouter=Object.freeze({LOCALITY_ORDER,select,request,status});
})(typeof globalThis!=='undefined'?globalThis:this);
