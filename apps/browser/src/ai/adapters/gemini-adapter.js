(function attachCodeeGeminiAdapter(global){
'use strict';
const BASE='https://generativelanguage.googleapis.com/v1beta';
const FREE_TIER_PREFERENCE=Object.freeze(['gemini-3.5-flash-lite','gemini-3.1-flash-lite','gemini-2.5-flash-lite','gemini-2.5-flash']);
function cleanModel(name){return String(name||'').replace(/^models\//,'');}
function textFromResponse(json){return (json?.candidates||[]).flatMap(c=>c?.content?.parts||[]).map(p=>p?.text||'').filter(Boolean).join('\n').trim();}
function create(config={}){
 const apiKey=String(config.apiKey||'').trim();let selectedModel=String(config.model||'').trim();let discovered=[];
 const auth={'X-Goog-Api-Key':apiKey,'Content-Type':'application/json','Accept':'application/json'};
 async function discoverModels(){if(!apiKey)throw new Error('gemini-api-key-required');const r=await global.CodeeApprovedNetworkTransport.getJson(`${BASE}/models`,{headers:auth});if(!r.ok)throw new Error(r.json?.error?.message||`gemini-http-${r.status}`);discovered=(r.json?.models||[]).filter(m=>(m.supportedGenerationMethods||[]).includes('generateContent')).map(m=>({id:cleanModel(m.name),displayName:m.displayName||cleanModel(m.name),inputTokenLimit:m.inputTokenLimit||0,outputTokenLimit:m.outputTokenLimit||0,methods:m.supportedGenerationMethods||[]}));if(!selectedModel){selectedModel=FREE_TIER_PREFERENCE.find(id=>discovered.some(m=>m.id===id))||discovered[0]?.id||'';}return discovered.slice();}
 async function ensureModel(){if(!selectedModel||!discovered.some(m=>m.id===selectedModel))await discoverModels();if(!selectedModel)throw new Error('gemini-no-compatible-model');return selectedModel;}
 const adapter={
  id:'gemini',displayName:'Google Gemini',lifecycle:apiKey?'FREE_LIMITED':'CONFIGURATION_REQUIRED',transport:'google-gemini-api',
  connect:async()=>({ok:Boolean(apiKey),configured:Boolean(apiKey)}),disconnect:async()=>({ok:true}),health:async()=>{try{return {ok:true,models:(await discoverModels()).length,model:selectedModel};}catch(error){return {ok:false,error:String(error.message||error)}}},
  listModels:async()=>discoverModels(),getModel:async()=>{const id=await ensureModel();return discovered.find(m=>m.id===id)||{id};},getCapabilities:async()=>({text:true,structured_output:true,vision:true,reasoning:true,long_context:true,files:true}),
  complete:async request=>{const model=await ensureModel();const system=String(request.systemInstructions||'').trim();const task=String(request.task||'').trim();const body={contents:[{role:'user',parts:[{text:task}]}]};if(system)body.systemInstruction={parts:[{text:system}]};const r=await global.CodeeApprovedNetworkTransport.postJson(`${BASE}/models/${encodeURIComponent(model)}:generateContent`,body,{headers:auth});if(!r.ok)throw new Error(r.json?.error?.message||`gemini-http-${r.status}`);return {response:textFromResponse(r.json),model,finishReason:r.json?.candidates?.[0]?.finishReason||'',providerRequestId:r.json?.responseId||'',cost:{status:'FREE_LIMITED',usd:0},usage:{promptTokens:r.json?.usageMetadata?.promptTokenCount||0,completionTokens:r.json?.usageMetadata?.candidatesTokenCount||0,totalTokens:r.json?.usageMetadata?.totalTokenCount||0}};},
  stream:async request=>adapter.complete(request),embed:async()=>{throw new Error('gemini-embeddings-not-enabled-in-this-adapter');},countTokens:async input=>Math.ceil(String(input?.task||input||'').length/4),estimateCost:async()=>({status:'FREE_LIMITED',usd:0}),getQuota:async()=>({mode:'provider-managed',freeTierCandidate:true}),getRateLimits:async()=>({mode:'provider-managed'}),
  supportsTools:()=>false,supportsStructuredOutput:()=>true,supportsVision:()=>true,supportsReasoning:()=>true,supportsEmbeddings:()=>false,supportsLongContext:()=>true,supportsCaching:()=>false,supportsBatch:()=>false,supportsFiles:()=>true,
  discoverModels,getSelectedModel:()=>selectedModel,setSelectedModel:value=>{selectedModel=cleanModel(value);return selectedModel;},freeTierPreference:FREE_TIER_PREFERENCE
 };
 return Object.freeze(adapter);
}
global.CodeeGeminiAdapter=Object.freeze({create,FREE_TIER_PREFERENCE,BASE});
})(typeof globalThis!=='undefined'?globalThis:this);
