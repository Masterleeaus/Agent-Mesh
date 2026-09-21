(function attachCodeeChatGPTSubscriptionAdapter(global){
'use strict';
const PROVIDER_ID='chatgpt-subscription';
const capabilities=Object.freeze({text:true,structured_output:false,vision:false,reasoning:true,embeddings:false,long_context:false,tools:false,files:false,caching:false,batch:false});
function safeError(error){return String(error?.message||error||'subscription-transport-error').replace(/(bearer\s+|token[=: ]+|cookie[=: ]+)[^\s,;]+/ig,'$1[REDACTED]').slice(0,800);}
function create(config={}){
 const transport=config.transport||null;
 function requireTransport(){
   if(!global.CodeeSubscriptionTransportContract)throw new Error('subscription-transport-contract-unavailable');
   const result=global.CodeeSubscriptionTransportContract.validate(transport);
   if(!result.ok)throw new Error(`chatgpt-subscription-unavailable:${result.reason}`);
   return transport;
 }
 const adapter={
  id:PROVIDER_ID,displayName:'ChatGPT Subscription (Supported Client Boundary)',lifecycle:transport?.supported===true?'ACTIVE':'CONFIGURATION_REQUIRED',transport:'supported-client-boundary',
  metadata:Object.freeze({locality:'SUBSCRIPTION',costClass:'SUBSCRIPTION',advisoryOnly:true,authority:false,failClosed:true,credentialBoundary:true,cookieScraping:false,backendApiDirect:false,webpageAutomation:false,apiKeyProvider:false,capabilities}),
  connect:async()=>{const t=requireTransport();return t.connect();},
  disconnect:async()=>transport&&typeof transport.disconnect==='function'?transport.disconnect():{ok:true},
  health:async()=>{try{const t=requireTransport();const h=await t.health();return {ok:Boolean(h?.ok),available:Boolean(h?.ok),transport:t.id||'supported-client-boundary'};}catch(error){return {ok:false,available:false,error:safeError(error)};}},
  listModels:async()=>{const t=requireTransport();return (await t.listModels()||[]).map(row=>({id:String(row.id||row.model||''),displayName:String(row.displayName||row.id||row.model||'').slice(0,240)})).filter(x=>x.id);},
  getModel:async input=>{const rows=await adapter.listModels();const id=String(input?.model||input?.preferredModels?.[0]||'');return rows.find(x=>x.id===id)||rows[0]||null;},
  getCapabilities:async()=>capabilities,
  complete:async request=>{const t=requireTransport();const result=await t.complete(Object.freeze({...request,provider:PROVIDER_ID}));if(!result||typeof result!=='object')throw new Error('chatgpt-subscription-invalid-response');return {...result,authority:false,advisoryOnly:true,cost:result.cost||{status:'SUBSCRIPTION',usd:0}};},
  stream:async request=>{const t=requireTransport();return typeof t.stream==='function'?t.stream(request):adapter.complete(request);},
  embed:async()=>{throw new Error('chatgpt-subscription-embeddings-unsupported');},
  countTokens:async input=>Math.ceil(String(input?.task||input||'').length/4),
  estimateCost:async()=>({status:'SUBSCRIPTION',usd:0}),getQuota:async()=>({mode:'subscription-client-managed'}),getRateLimits:async()=>({mode:'subscription-client-managed'}),
  supportsTools:()=>false,supportsStructuredOutput:()=>false,supportsVision:()=>false,supportsReasoning:()=>true,supportsEmbeddings:()=>false,supportsLongContext:()=>false,supportsCaching:()=>false,supportsBatch:()=>false,supportsFiles:()=>false
 };
 return Object.freeze(adapter);
}
function isConfigured(config={}){return Boolean(config.transport&&global.CodeeSubscriptionTransportContract?.validate?.(config.transport)?.ok);}
global.CodeeChatGPTSubscriptionAdapter=Object.freeze({PROVIDER_ID,create,isConfigured});
})(typeof globalThis!=='undefined'?globalThis:this);
