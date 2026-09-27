(function attachCodeeBrowserLocalModelAdapter(global){
'use strict';
const PROVIDER_ID='browser-local-model';
const MODEL_ID='browser-local';
function create(config={}){
 const runtime=config.runtimeAdapter||config.runtime||null;
 if(!runtime||typeof runtime.generate!=='function')throw new TypeError('browser-local-model-runtime-required');
 const capabilities=Object.freeze({text:true,structured_output:false,vision:false,reasoning:true,embeddings:false,long_context:false,tools:false,files:false,caching:false,batch:false});
 const authority=Object.freeze({executeResult:false,advancePlan:false,mayExecuteMutation:false,mayGrantBrowserPermission:false,verificationAuthority:false,canonicalAuthority:false});
 async function health(){
   try{const row=typeof runtime.health==='function'?await runtime.health():null;return {ok:row?.health!=='unavailable',runtime:row||null,locality:'ON_DEVICE',authority};}
   catch(error){return {ok:false,error:String(error?.message||error),locality:'ON_DEVICE',authority};}
 }
 const adapter={
   id:PROVIDER_ID,displayName:'Browser Local AI (WebLLM / WebGPU)',lifecycle:'LOCAL',transport:'browser-model-runtime',
   metadata:Object.freeze({locality:'ON_DEVICE',costClass:'DEVICE_OWNED',advisoryOnly:true,authority:false,executionRuntime:'browser-model',reuses:['BrowserModelRuntimeAdapter','BrowserModelScheduler','BrowserModelResourceRouter','offscreen-runtime','streaming','diagnostics','fallback-runtime'],capabilities}),
   connect:async()=>({ok:true,locality:'ON_DEVICE',health:await health()}),disconnect:async()=>({ok:true}),health,
   listModels:async()=>[{id:MODEL_ID,displayName:'Browser Local Model',locality:'ON_DEVICE'}],
   getModel:async()=>({id:MODEL_ID,displayName:'Browser Local Model',locality:'ON_DEVICE'}),getCapabilities:async()=>capabilities,
   complete:async request=>{
     const task=String(request?.task||'').trim();if(!task)throw new Error('browser-local-model-task-required');
     const result=await runtime.generate({prompt:task},{requestId:request.requestId,model:request.preferredModels?.[0]||config.model||MODEL_ID,sessionId:request.sessionId,provider:PROVIDER_ID,disableNative:config.disableNative===true,nativeOnly:config.nativeOnly===true});
     if(result?.authority===true||result?.execution_authority===true||result?.verification_authority===true||result?.canonical_authority===true)throw new Error('browser-local-model-authority-violation');
     return {response:String(result?.text??''),model:String(result?.model||MODEL_ID),finishReason:result?.finish_reason||'stop',providerRequestId:String(result?.request_id||request.requestId||''),cost:{status:'LOCAL',usd:0},usage:result?.usage||{},runtime:result?.runtime||'browser-model',structurallyVerified:Boolean(result?.structurally_verified),authority:false,advisoryOnly:true};
   },
   stream:async request=>adapter.complete(request),embed:async()=>{throw new Error('browser-local-model-embeddings-unsupported');},
   countTokens:async input=>Math.ceil(String(input?.task||input||'').length/4),estimateCost:async()=>({status:'LOCAL',usd:0}),getQuota:async()=>({mode:'device-owned'}),getRateLimits:async()=>({mode:'device-managed'}),
   supportsTools:()=>false,supportsStructuredOutput:()=>false,supportsVision:()=>false,supportsReasoning:()=>true,supportsEmbeddings:()=>false,supportsLongContext:()=>false,supportsCaching:()=>false,supportsBatch:()=>false,supportsFiles:()=>false
 };
 return Object.freeze(adapter);
}
global.CodeeBrowserLocalModelAdapter=Object.freeze({PROVIDER_ID,MODEL_ID,create});
})(typeof globalThis!=='undefined'?globalThis:this);
