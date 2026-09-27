(function attachRepositoryEmbeddings(global){
'use strict';
const SCHEMA='titan-code-repository-embedding/v1';
const DEFAULT_DIMENSIONS=64;
const MIN_DIMENSIONS=16;
const MAX_DIMENSIONS=384;
const MAX_INPUT_CHARS=8000;
const MAX_BATCH=128;
function fail(code,message,details){const e=new Error(message);e.code=code;if(details)e.details=details;return e;}
function clamp(n,min,max,fallback){n=Number(n);return Number.isFinite(n)?Math.max(min,Math.min(max,n)):fallback;}
function redact(text){const value=String(text??'');return global.CodeeRepositoryPolicy?.redactText?global.CodeeRepositoryPolicy.redactText(value):value;}
function stableHash(input){let h=2166136261;const s=String(input);for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
function normalizeVector(values,dimensions){
 if(!Array.isArray(values)&&!(values instanceof Float32Array))throw fail('ERR_REPOSITORY_EMBEDDING_VECTOR','Embedding vector must be an array');
 const out=Array.from(values,Number).slice(0,dimensions);
 if(!out.length||out.some(v=>!Number.isFinite(v)))throw fail('ERR_REPOSITORY_EMBEDDING_VECTOR','Embedding vector contains invalid values');
 while(out.length<dimensions)out.push(0);
 let norm=0;for(const v of out)norm+=v*v;norm=Math.sqrt(norm);
 if(norm>0)for(let i=0;i<out.length;i++)out[i]=out[i]/norm;
 return Object.freeze(out);
}
function tokenize(text){return String(text||'').toLowerCase().match(/[a-z0-9_$.-]+/g)||[];}
function deterministicVector(text,dimensions){
 const vector=new Array(dimensions).fill(0);
 const tokens=tokenize(text);
 for(const token of tokens){
  const hash=stableHash(token);
  const index=hash%dimensions;
  const sign=(hash&0x80000000)?-1:1;
  vector[index]+=sign*(1+Math.min(token.length,32)/32);
 }
 return normalizeVector(vector,dimensions);
}
function normalizeInput(input,index){
 if(typeof input==='string')return {id:`input:${index}`,text:redact(input).slice(0,MAX_INPUT_CHARS),metadata:null};
 if(!input||typeof input!=='object')throw fail('ERR_REPOSITORY_EMBEDDING_INPUT','Embedding input must be string or object');
 const text=redact(input.text??input.content??'').slice(0,MAX_INPUT_CHARS);
 if(!text)throw fail('ERR_REPOSITORY_EMBEDDING_EMPTY','Embedding input text is required');
 return {id:String(input.id||input.chunk_id||input.evidence_id||`input:${index}`).slice(0,256),text,metadata:input.metadata??null};
}
function resultRecord(input,vector,meta){
 return Object.freeze({
  schema:SCHEMA,
  id:input.id,
  dimensions:vector.length,
  vector,
  provider:meta.provider,
  model:meta.model||null,
  backend:meta.backend||null,
  local:meta.local===true,
  deterministic:meta.deterministic===true,
  degraded:meta.degraded===true,
  fallback_reason:meta.fallback_reason||null,
  source_hash:stableHash(input.text).toString(16).padStart(8,'0'),
  advisory_only:true,
  authority:false,
  canonical:false,
  mutation_authorized:false,
  plan_advance:false
 });
}
class RepositoryEmbeddings{
 constructor(options){
  options=options||{};
  this.providers=Array.isArray(options.providers)?options.providers.filter(Boolean):[];
  this.dimensions=clamp(options.dimensions,MIN_DIMENSIONS,MAX_DIMENSIONS,DEFAULT_DIMENSIONS);
  this.allowDeterministicFallback=options.allowDeterministicFallback!==false;
 }
 capability(){
  return Object.freeze({schema:SCHEMA,provider_count:this.providers.length,dimensions:this.dimensions,local_first:true,deterministic_fallback:this.allowDeterministicFallback,max_input_chars:MAX_INPUT_CHARS,max_batch:MAX_BATCH,advisory_only:true,authority:false,canonical:false,mutation_authorized:false,plan_advance:false});
 }
 async embed(inputs,options){
  const list=(Array.isArray(inputs)?inputs:[inputs]).slice(0,MAX_BATCH).map(normalizeInput);
  if(!list.length)return [];
  const dimensions=clamp(options?.dimensions,MIN_DIMENSIONS,MAX_DIMENSIONS,this.dimensions);
  const ordered=this.providers.slice().sort((a,b)=>Number(b?.local===true)-Number(a?.local===true));
  const failures=[];
  for(const provider of ordered){
   if(typeof provider?.embed!=='function')continue;
   if(options?.localOnly&&provider.local!==true)continue;
   try{
    const response=await provider.embed(list.map(item=>item.text),{dimensions,signal:options?.signal});
    const vectors=Array.isArray(response)?response:response?.vectors;
    if(!Array.isArray(vectors)||vectors.length!==list.length)throw fail('ERR_REPOSITORY_EMBEDDING_PROVIDER_SHAPE','Embedding provider returned an invalid vector batch');
    return list.map((item,index)=>resultRecord(item,normalizeVector(vectors[index],dimensions),{
      provider:String(provider.name||response?.provider||'provider').slice(0,128),
      model:response?.model||provider.model||null,
      backend:response?.backend||provider.backend||null,
      local:provider.local===true||response?.local===true,
      deterministic:false,
      degraded:false
    }));
   }catch(error){
    if(options?.signal?.aborted)throw fail('ERR_REPOSITORY_EMBEDDING_CANCELLED','Embedding request cancelled');
    failures.push({provider:String(provider?.name||'provider').slice(0,128),code:String(error?.code||'ERR_PROVIDER').slice(0,128)});
   }
  }
  if(!this.allowDeterministicFallback||options?.allowDeterministicFallback===false){
   throw fail('ERR_REPOSITORY_EMBEDDING_UNAVAILABLE','No embedding provider available',{failures});
  }
  const fallbackReason=failures.length?'providers_failed':'no_provider_available';
  return list.map(item=>resultRecord(item,deterministicVector(item.text,dimensions),{
    provider:'deterministic-lexical-hash',model:null,backend:'cpu',local:true,deterministic:true,degraded:true,fallback_reason:fallbackReason
  }));
 }
}
global.CodeeRepositoryEmbeddings=Object.freeze({SCHEMA,DEFAULT_DIMENSIONS,MIN_DIMENSIONS,MAX_DIMENSIONS,MAX_INPUT_CHARS,MAX_BATCH,RepositoryEmbeddings,deterministicVector,normalizeVector});
})(typeof globalThis!=='undefined'?globalThis:this);
