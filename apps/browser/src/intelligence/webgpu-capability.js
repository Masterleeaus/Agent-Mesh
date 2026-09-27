(function attachCodeeWebGpuCapability(global){
'use strict';

const SCHEMA='codee.intelligence.webgpu-capability.v1';
const PROFILE_SCHEMA='codee.intelligence.compute-profile.v1';
const CACHE_TTL_MS=30000;
let cached=null;
let cachedAt=0;

function now(){return Date.now();}
function finite(v){const n=Number(v);return Number.isFinite(n)?n:null;}
function text(v,max=160){return String(v??'').trim().slice(0,max);}
function safeLimit(limits,key){try{return finite(limits?.[key]);}catch(_e){return null;}}
function snapshotLimits(limits){
  const keys=['maxBufferSize','maxStorageBufferBindingSize','maxUniformBufferBindingSize','maxComputeWorkgroupStorageSize','maxComputeInvocationsPerWorkgroup','maxComputeWorkgroupsPerDimension','maxStorageBuffersPerShaderStage','maxBindGroups'];
  const out={}; for(const key of keys){const value=safeLimit(limits,key);if(value!==null) out[key]=value;} return Object.freeze(out);
}
function snapshotFeatures(features){try{return Object.freeze(Array.from(features||[]).map(v=>text(v,80)).filter(Boolean).sort());}catch(_e){return Object.freeze([]);}}
function fallback(reason,extra={}){
  return Object.freeze({schema:SCHEMA,available:false,reason:text(reason,120)||'webgpu-unavailable',secureContext:extra.secureContext??null,userAgent:text(extra.userAgent,240),adapter:null,device:null,profile:Object.freeze({schema:PROFILE_SCHEMA,id:'fallback',webgpu:false,recommendedMaxModelBytes:0,recommendedContextTokens:2048,maxConcurrentInference:1,preferQuantization:'q4',allowGpuEmbeddings:false,reason:text(reason,120)||'webgpu-unavailable'}),probedAt:now()});
}
function classify(adapterInfo={},limits={},options={}){
  const maxBuffer=finite(limits.maxBufferSize)||0;
  const storage=finite(limits.maxStorageBufferBindingSize)||0;
  const workgroup=finite(limits.maxComputeWorkgroupStorageSize)||0;
  const memoryHint=finite(options.deviceMemoryGB)||0;
  let id='constrained';
  if((maxBuffer>=1073741824&&storage>=536870912)||(memoryHint>=12&&maxBuffer>=536870912)) id='high';
  else if((maxBuffer>=536870912&&storage>=268435456)||(memoryHint>=8&&maxBuffer>=268435456)) id='balanced';
  const integrated=/integrated|intel|apple/i.test(`${adapterInfo.vendor||''} ${adapterInfo.architecture||''} ${adapterInfo.description||''}`);
  if(id==='high'&&integrated&&memoryHint>0&&memoryHint<12) id='balanced';
  const settings=id==='high'?{recommendedMaxModelBytes:5500000000,recommendedContextTokens:16384,preferQuantization:'q4f16',allowGpuEmbeddings:true}:id==='balanced'?{recommendedMaxModelBytes:3000000000,recommendedContextTokens:8192,preferQuantization:'q4',allowGpuEmbeddings:true}:{recommendedMaxModelBytes:1500000000,recommendedContextTokens:4096,preferQuantization:'q4',allowGpuEmbeddings:false};
  return Object.freeze({schema:PROFILE_SCHEMA,id,webgpu:true,maxConcurrentInference:1,...settings,reason:'adapter-limits'});
}
async function requestAdapterInfo(adapter){
  try{if(typeof adapter?.requestAdapterInfo==='function'){const info=await adapter.requestAdapterInfo(); return Object.freeze({vendor:text(info?.vendor,120),architecture:text(info?.architecture,120),device:text(info?.device,120),description:text(info?.description,240)});}}catch(_e){}
  try{const info=adapter?.info; if(info) return Object.freeze({vendor:text(info.vendor,120),architecture:text(info.architecture,120),device:text(info.device,120),description:text(info.description,240)});}catch(_e){}
  return Object.freeze({vendor:'',architecture:'',device:'',description:''});
}
async function probe(options={}){
  const force=Boolean(options.force); const stamp=now(); if(!force&&cached&&stamp-cachedAt<CACHE_TTL_MS) return cached;
  const nav=options.navigator||global.navigator;
  const secure=options.secureContext!==undefined?Boolean(options.secureContext):(global.isSecureContext===undefined?null:Boolean(global.isSecureContext));
  if(!nav) return cache(fallback('navigator-unavailable',{secureContext:secure}));
  if(!nav.gpu||typeof nav.gpu.requestAdapter!=='function') return cache(fallback('webgpu-api-unavailable',{secureContext:secure,userAgent:nav.userAgent}));
  let adapter;
  try{adapter=await nav.gpu.requestAdapter({powerPreference:options.powerPreference||'high-performance'});}catch(err){return cache(fallback('adapter-request-failed',{secureContext:secure,userAgent:nav.userAgent,error:text(err?.message,160)}));}
  if(!adapter) return cache(fallback('adapter-unavailable',{secureContext:secure,userAgent:nav.userAgent}));
  const adapterInfo=await requestAdapterInfo(adapter); const adapterLimits=snapshotLimits(adapter.limits); const adapterFeatures=snapshotFeatures(adapter.features);
  let device=null,deviceError='';
  if(options.requestDevice!==false){try{device=await adapter.requestDevice();}catch(err){deviceError=text(err?.message||err?.name,160);}}
  const limits=device?snapshotLimits(device.limits):adapterLimits; const features=device?snapshotFeatures(device.features):adapterFeatures;
  const memoryHint=finite(options.deviceMemoryGB??nav.deviceMemory);
  const profile=classify(adapterInfo,limits,{deviceMemoryGB:memoryHint});
  const result=Object.freeze({schema:SCHEMA,available:true,reason:device?'ready':'adapter-only',secureContext:secure,userAgent:text(nav.userAgent,240),deviceMemoryGB:memoryHint,adapter:Object.freeze({info:adapterInfo,limits:adapterLimits,features:adapterFeatures}),device:Object.freeze({created:Boolean(device),error:deviceError,limits,features}),profile,probedAt:now()});
  if(device&&options.releaseDevice!==false){try{device.destroy?.();}catch(_e){}}
  return cache(result);
}
function cache(value){cached=value;cachedAt=now();return value;}
function clearCache(){cached=null;cachedAt=0;}
function getCached(){return cached;}
function recommend(capability,model={}){
  const cap=capability||cached; if(!cap?.available) return Object.freeze({ok:false,reason:cap?.reason||'not-probed',profileId:'fallback'});
  const bytes=finite(model.bytes)||0; const context=finite(model.contextTokens)||0; const profile=cap.profile;
  const reasons=[]; if(bytes&&bytes>profile.recommendedMaxModelBytes) reasons.push('model-too-large'); if(context&&context>profile.recommendedContextTokens) reasons.push('context-too-large');
  return Object.freeze({ok:reasons.length===0,profileId:profile.id,reasons:Object.freeze(reasons),recommendedMaxModelBytes:profile.recommendedMaxModelBytes,recommendedContextTokens:profile.recommendedContextTokens,preferQuantization:profile.preferQuantization,allowGpuEmbeddings:profile.allowGpuEmbeddings});
}

global.CodeeWebGpuCapability=Object.freeze({SCHEMA,PROFILE_SCHEMA,CACHE_TTL_MS,probe,classify,recommend,getCached,clearCache});
})(typeof globalThis!=='undefined'?globalThis:this);
