(function attachCodeeOpenAICompatibleLocalAdapter(global){
'use strict';
const PRESETS=Object.freeze({
 ollama:Object.freeze({id:'ollama-direct',displayName:'Ollama Direct',baseUrl:'http://127.0.0.1:11434/v1',locality:'LOCAL_DEVICE'}),
 lmstudio:Object.freeze({id:'lmstudio',displayName:'LM Studio',baseUrl:'http://127.0.0.1:1234/v1',locality:'LOCAL_DEVICE'}),
 llamacpp:Object.freeze({id:'llamacpp',displayName:'llama.cpp',baseUrl:'http://127.0.0.1:8080/v1',locality:'LOCAL_DEVICE'}),
 vllm:Object.freeze({id:'vllm',displayName:'vLLM',baseUrl:'http://127.0.0.1:8000/v1',locality:'LOCAL_DEVICE'}),
 custom:Object.freeze({id:'local-openai-compatible',displayName:'OpenAI-compatible local endpoint',baseUrl:'http://127.0.0.1:11434/v1',locality:'LOCAL_DEVICE'})
});
function cleanBase(value){const u=new URL(String(value||''));if(!['http:','https:'].includes(u.protocol))throw new Error('local-provider-http-required');if(u.username||u.password)throw new Error('local-provider-url-credentials-forbidden');u.hash='';u.search='';u.pathname=u.pathname.replace(/\/+$/,'');return u.toString().replace(/\/$/,'');}
function modelId(row){return String(row?.id||row?.name||row?.model||'').trim();}
function create(options={}){
 const preset=PRESETS[String(options.preset||'custom').toLowerCase()]||PRESETS.custom;
 const id=String(options.id||preset.id).trim();
 const displayName=String(options.displayName||preset.displayName).trim();
 const baseUrl=cleanBase(options.baseUrl||preset.baseUrl);
 const apiKey=String(options.apiKey||'').trim();
 const locality=String(options.locality||preset.locality||'LOCAL_DEVICE').toUpperCase();
 const customerHosted=locality==='CUSTOMER_HOSTED';
 let selectedModel=String(options.model||'').trim(),models=[];
 const transport=()=>{if(!global.CodeeApprovedNetworkTransport)throw new Error('approved-network-transport-unavailable');return global.CodeeApprovedNetworkTransport;};
 const authHeaders=()=>apiKey?{Authorization:`Bearer ${apiKey}`}:{ };
 async function requestGet(path){const r=await transport().getJson(`${baseUrl}${path}`,{headers:authHeaders()});if(!r.ok)throw new Error(`local-provider-http-${r.status}`);return r.json||{};}
 async function requestPost(path,body){const r=await transport().postJson(`${baseUrl}${path}`,body,{headers:{...authHeaders(),'Content-Type':'application/json'}});if(!r.ok)throw new Error(`local-provider-http-${r.status}`);return r.json||{};}
 async function discover(){const body=await requestGet('/models');const rows=Array.isArray(body.data)?body.data:Array.isArray(body.models)?body.models:[];models=rows.map(row=>typeof row==='string'?{id:row}:{...row,id:modelId(row)}).filter(row=>row.id);if(!selectedModel&&models.length)selectedModel=(models.find(x=>/qwen|coder|code/i.test(x.id))||models[0]).id;return models.slice();}
 async function ensureModel(){if(!selectedModel||!models.some(x=>x.id===selectedModel))await discover();if(!selectedModel)throw new Error('local-provider-no-installed-model');return selectedModel;}
 const capabilities=Object.freeze({text:true,structured_output:Boolean(options.structuredOutput),vision:Boolean(options.vision),reasoning:options.reasoning!==false,embeddings:Boolean(options.embeddings),long_context:true,tools:Boolean(options.tools),files:false,caching:false,batch:false});
 const adapter={
  id,displayName,lifecycle:'LOCAL',transport:'openai-compatible-local',metadata:Object.freeze({locality,customerHosted,endpointOrigin:new URL(baseUrl).origin,capabilities,preset:String(options.preset||'custom')}),
  connect:async()=>{const found=await discover();return {ok:true,models:found.length,locality};},disconnect:async()=>({ok:true}),health:async()=>{try{const found=await discover();return {ok:true,models:found.length,locality};}catch(error){return {ok:false,error:String(error?.message||error),locality};}},
  listModels:async()=>discover(),getModel:async()=>{const model=await ensureModel();return models.find(x=>x.id===model)||{id:model};},getCapabilities:async()=>capabilities,
  complete:async request=>{const model=await ensureModel();const messages=[];if(request.systemInstructions)messages.push({role:'system',content:request.systemInstructions});if(Array.isArray(request.conversation)){for(const row of request.conversation){if(row&&['system','user','assistant'].includes(row.role)&&row.content!=null)messages.push({role:row.role,content:String(row.content)});}}messages.push({role:'user',content:request.task||''});const body={model,messages,temperature:request.temperature??0.2,stream:false,max_tokens:request.maximumOutput||4096};if(request.requiredSchema&&capabilities.structured_output)body.response_format={type:'json_object'};const out=await requestPost('/chat/completions',body);const choice=out.choices?.[0]||{};const usage=out.usage||{};return {response:choice.message?.content??choice.text??'',model:out.model||model,finishReason:choice.finish_reason||'stop',providerRequestId:out.id||'',cost:{status:'LOCAL',usd:0},usage:{inputTokens:usage.prompt_tokens||0,outputTokens:usage.completion_tokens||0,cachedTokens:usage.prompt_tokens_details?.cached_tokens||0}};},
  stream:async request=>adapter.complete(request),
  embed:async input=>{if(!capabilities.embeddings)throw new Error('local-provider-embeddings-not-enabled');const model=await ensureModel();return requestPost('/embeddings',{model,input:input?.task||input?.input||input});},
  countTokens:async input=>Math.ceil(String(input?.task||input||'').length/4),estimateCost:async()=>({status:'LOCAL',usd:0}),getQuota:async()=>({mode:'local',locality}),getRateLimits:async()=>({mode:'local'}),
  supportsTools:()=>capabilities.tools,supportsStructuredOutput:()=>capabilities.structured_output,supportsVision:()=>capabilities.vision,supportsReasoning:()=>capabilities.reasoning,supportsEmbeddings:()=>capabilities.embeddings,supportsLongContext:()=>true,supportsCaching:()=>false,supportsBatch:()=>false,supportsFiles:()=>false,
  setSelectedModel:value=>{selectedModel=String(value||'').trim();return selectedModel;},getSelectedModel:()=>selectedModel
 };
 if(!/^[a-z0-9][a-z0-9._-]{0,79}$/i.test(id))throw new Error('invalid-local-provider-id');
 return Object.freeze(adapter);
}
global.CodeeOpenAICompatibleLocalAdapter=Object.freeze({PRESETS,create});
})(typeof globalThis!=='undefined'?globalThis:this);
