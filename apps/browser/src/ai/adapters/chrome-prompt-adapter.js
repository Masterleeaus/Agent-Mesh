(function attachCodeeChromePromptAdapter(global){
'use strict';
const PROVIDER_ID='chrome-prompt-api';
function apiFrom(runtime){
 if(runtime)return runtime;
 if(global.LanguageModel)return global.LanguageModel;
 if(global.ai?.languageModel)return global.ai.languageModel;
 return null;
}
async function availability(api){
 if(!api)return 'unavailable';
 try{
   if(typeof api.availability==='function')return String(await api.availability());
   if(typeof api.capabilities==='function'){const c=await api.capabilities();return String(c?.available||c?.availability||'available');}
   if(typeof api.create==='function')return 'available';
 }catch(_error){return 'unavailable';}
 return 'unavailable';
}
function availableValue(value){return !['unavailable','no','false','unsupported'].includes(String(value||'').toLowerCase());}
function create(config={}){
 const runtime=config.runtime||null;
 let session=null;
 async function getApi(){const api=apiFrom(runtime);if(!api)throw new Error('chrome-prompt-api-unavailable');const a=await availability(api);if(!availableValue(a))throw new Error(`chrome-prompt-api-${a}`);return api;}
 async function getSession(request={}){
   if(session)return session;
   const api=await getApi();
   if(typeof api.create!=='function')throw new Error('chrome-prompt-api-create-unavailable');
   const opts={};
   if(request.systemInstructions)opts.initialPrompts=[{role:'system',content:String(request.systemInstructions)}];
   session=await api.create(opts);return session;
 }
 async function close(){try{session?.destroy?.();}catch(_error){}session=null;return {ok:true};}
 const capabilities=Object.freeze({text:true,structured_output:false,vision:false,reasoning:true,embeddings:false,long_context:false,tools:false,files:false,caching:false,batch:false});
 const adapter={
   id:PROVIDER_ID,displayName:'Chrome Built-in AI (Prompt API)',lifecycle:'LOCAL',transport:'chrome-built-in-prompt-api',
   metadata:Object.freeze({locality:'ON_DEVICE',costClass:'DEVICE_OWNED',pageBound:true,advisoryOnly:true,authority:false,capabilities}),
   connect:async()=>{const api=await getApi();return {ok:true,availability:await availability(api),locality:'ON_DEVICE'};},
   disconnect:close,
   health:async()=>{try{const api=await getApi();return {ok:true,availability:await availability(api),locality:'ON_DEVICE'};}catch(error){return {ok:false,error:String(error?.message||error),locality:'ON_DEVICE'};}},
   listModels:async()=>[{id:'chrome-built-in',displayName:'Chrome Built-in AI',locality:'ON_DEVICE'}],
   getModel:async()=>({id:'chrome-built-in',displayName:'Chrome Built-in AI',locality:'ON_DEVICE'}),
   getCapabilities:async()=>capabilities,
   complete:async request=>{const s=await getSession(request);const task=String(request?.task||'').trim();if(!task)throw new Error('chrome-prompt-api-task-required');let text;if(typeof s.prompt==='function')text=await s.prompt(task);else if(typeof s.generate==='function')text=await s.generate(task);else throw new Error('chrome-prompt-api-prompt-unavailable');return {response:String(text??''),model:'chrome-built-in',finishReason:'stop',providerRequestId:'',cost:{status:'LOCAL',usd:0},usage:{},authority:false,advisoryOnly:true};},
   stream:async request=>adapter.complete(request),
   embed:async()=>{throw new Error('chrome-prompt-api-embeddings-unsupported');},
   countTokens:async input=>Math.ceil(String(input?.task||input||'').length/4),estimateCost:async()=>({status:'LOCAL',usd:0}),getQuota:async()=>({mode:'device-owned'}),getRateLimits:async()=>({mode:'device-managed'}),
   supportsTools:()=>false,supportsStructuredOutput:()=>false,supportsVision:()=>false,supportsReasoning:()=>true,supportsEmbeddings:()=>false,supportsLongContext:()=>false,supportsCaching:()=>false,supportsBatch:()=>false,supportsFiles:()=>false
 };
 return Object.freeze(adapter);
}
async function isAvailable(runtime){const a=await availability(apiFrom(runtime));return availableValue(a);}
global.CodeeChromePromptAdapter=Object.freeze({PROVIDER_ID,create,isAvailable});
})(typeof globalThis!=='undefined'?globalThis:this);
