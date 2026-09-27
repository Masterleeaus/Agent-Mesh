(function attachCodeeIntelligenceRpc(global){
'use strict';

// Donor-first adaptation of Auto Browser v1.4.2 orchestration/rpc-transport.js.
// Codee preserves the donor's single-funnel messaging principle, but carries
// Codee intelligence request/session identities and routes effects only through
// the existing shared IntelligenceHost + governed OffscreenRuntime.

const C=global.CodeeIntelligenceContract;
const H=global.CodeeIntelligenceHost;
const O=global.CodeeOffscreenRuntime;
if(!C||!H||!O) throw new Error('Codee intelligence contract, host, and offscreen runtime must load before CodeeIntelligenceRpc');

const SCHEMA='codee.intelligence.rpc.v1';
const ACTION='INTELLIGENCE_RPC';
const STREAM_EVENT_ACTION='INTELLIGENCE_STREAM_EVENT';
const OPERATIONS=Object.freeze(['request','stream','embed','cancel','health','capabilities']);
const DEFAULT_RUNTIME_ID='browser-offscreen';
let chromeService=null;

function clean(value,max=180){return String(value??'').trim().slice(0,max);}
function normalizeContext(input={}){return C.createContext(input);}
function assertOperation(operation){const op=clean(operation,64); if(!OPERATIONS.includes(op)) throw new Error(`Unsupported intelligence RPC operation: ${op||'(empty)'}`); return op;}
function errorPayload(error){return Object.freeze({code:clean(error?.code||error?.name||'INTELLIGENCE_RPC_ERROR',80),message:clean(error?.message||error||'Intelligence RPC failed',500)});}

function createEnvelope({operation,context,payload={}}={}){
  const op=assertOperation(operation);
  const ctx=normalizeContext(context||{});
  return Object.freeze({schema:SCHEMA,operation:op,requestId:ctx.requestId,sessionId:ctx.sessionId,context:ctx,payload:payload&&typeof payload==='object'?payload:{}});
}
function assertEnvelope(input){
  if(!input||input.schema!==SCHEMA) throw new Error('Valid Codee intelligence RPC envelope required');
  const op=assertOperation(input.operation);
  const ctx=normalizeContext(input.context||{});
  if(clean(input.requestId)!==ctx.requestId) throw new Error('Intelligence RPC requestId/context mismatch');
  if(clean(input.sessionId)!==ctx.sessionId) throw new Error('Intelligence RPC sessionId/context mismatch');
  return {operation:op,context:ctx,payload:input.payload&&typeof input.payload==='object'?input.payload:{}};
}
function assertResponseIdentity(response,requestId){
  if(!response||typeof response!=='object') throw new Error('Invalid intelligence RPC response');
  if(clean(response.requestId)!==clean(requestId)) throw new Error('Intelligence RPC response requestId mismatch');
  return response;
}

function createOffscreenHostRuntime({offscreenRuntime=O,manager,transport,runtimeId=DEFAULT_RUNTIME_ID}={}){
  const id=clean(runtimeId,80)||DEFAULT_RUNTIME_ID;
  async function invoke(context,payload,operation){
    const response=await offscreenRuntime.invoke({manager,transport,requestId:context.requestId,sessionId:context.sessionId,operation,payload});
    assertResponseIdentity(response,context.requestId);
    if(response.ok===false){const error=new Error(response.error?.message||'Offscreen intelligence request failed');error.code=response.error?.code||'OFFSCREEN_REQUEST_FAILED';throw error;}
    return response.result;
  }
  return Object.freeze({
    id,primaryRuntime:'browser',
    request:(context,payload)=>invoke(context,payload,'request'),
    stream:(context,payload)=>invoke(context,payload,'stream'),
    embed:(context,payload)=>invoke(context,payload,'embed'),
    cancel:async(requestId,reason)=>Object.freeze({ok:false,requestId:clean(requestId),reason:clean(reason)||'cancelled',transportCancellation:false}),
    listModels:async()=>Object.freeze([]),
    getCapabilities:async()=>{
      const requestId=`capabilities-${Date.now()}`; const sessionId='codee-intelligence-runtime';
      const response=await offscreenRuntime.invoke({manager,transport,requestId,sessionId,operation:'capabilities',payload:{}});
      assertResponseIdentity(response,requestId); return response.result||{};
    },
    health:async()=>{
      const requestId=`health-${Date.now()}`; const sessionId='codee-intelligence-runtime';
      try{const response=await offscreenRuntime.invoke({manager,transport,requestId,sessionId,operation:'health',payload:{}});assertResponseIdentity(response,requestId);return response.result||{ok:true};}
      catch(error){return Object.freeze({ok:false,error:clean(error?.message,240)});}
    }
  });
}

function ensureRuntime(host,runtime,{primary=true}={}){
  if(!host.listRuntimes().some(entry=>entry.id===runtime.id)) host.registerRuntime(runtime,{primary});
  return runtime;
}

function createService({host=H,offscreenRuntime=O,manager,transport,runtimeId=DEFAULT_RUNTIME_ID,primary=true}={}){
  if(!manager) throw new Error('Intelligence RPC service requires offscreen manager');
  if(typeof transport!=='function') throw new Error('Intelligence RPC service requires transport');
  const runtime=ensureRuntime(host,createOffscreenHostRuntime({offscreenRuntime,manager,transport,runtimeId}),{primary});

  async function dispatch(rawEnvelope){
    const {operation,context,payload}=assertEnvelope(rawEnvelope);
    if(operation==='cancel'){
      const target=clean(payload.requestId); if(!target) throw new Error('Cancellation target requestId required');
      const record=host.getRequest(target); if(!record) return Object.freeze({ok:false,requestId:context.requestId,result:{ok:false,reason:'request-not-found'}});
      if(record.sessionId!==context.sessionId) throw new Error('Intelligence RPC session does not own request');
      const result=await host.cancel(target,clean(payload.reason,160)||'cancelled');
      return Object.freeze({ok:true,requestId:context.requestId,result});
    }
    if(operation==='health') return Object.freeze({ok:true,requestId:context.requestId,result:await host.health()});
    if(operation==='capabilities') return Object.freeze({ok:true,requestId:context.requestId,result:await runtime.getCapabilities()});
    const result=await host[operation](context,{...payload,runtimeId:runtime.id});
    return Object.freeze({ok:true,requestId:context.requestId,result});
  }
  return Object.freeze({runtimeId:runtime.id,dispatch});
}

function createClient(send,{eventSource=null}={}){
  if(typeof send!=='function') throw new Error('Intelligence RPC client send function required');
  async function call(operation,context,payload={}){
    const envelope=createEnvelope({operation,context,payload});
    const response=await send(Object.freeze({action:ACTION,envelope}));
    assertResponseIdentity(response,envelope.requestId);
    if(response.ok===false){const error=new Error(response.error?.message||response.error||'Intelligence RPC request failed');error.code=response.error?.code||'INTELLIGENCE_RPC_FAILED';throw error;}
    return response.result;
  }
  async function streamCall(context,payload={},options={}){
    const ctx=normalizeContext(context||{});
    const onChunk=typeof options?.onChunk==='function'?options.onChunk:null;
    let listener=null;
    if(onChunk&&eventSource?.addListener){
      listener=message=>{
        if(message?.action!==STREAM_EVENT_ACTION) return;
        if(clean(message.requestId)!==ctx.requestId||clean(message.sessionId)!==ctx.sessionId) return;
        onChunk(String(message.chunk??''),Object.freeze({index:Number(message.index)||0,totalBytes:Number(message.totalBytes)||0,requestId:ctx.requestId,sessionId:ctx.sessionId}));
      };
      eventSource.addListener(listener);
    }
    try{return await call('stream',ctx,payload);}
    finally{if(listener&&eventSource?.removeListener) eventSource.removeListener(listener);}
  }
  return Object.freeze({request:(context,payload)=>call('request',context,payload),stream:streamCall,embed:(context,payload)=>call('embed',context,payload),cancel:(context,requestId,reason)=>call('cancel',context,{requestId,reason}),health:context=>call('health',context,{}),capabilities:context=>call('capabilities',context,{})});
}
function createChromeClient(chromeApi=global.chrome){return createClient(message=>{if(!chromeApi?.runtime?.sendMessage) throw new Error('Chrome runtime messaging unavailable'); return chromeApi.runtime.sendMessage(message);},{eventSource:chromeApi?.runtime?.onMessage});}
function createChromeService(chromeApi=global.chrome){return createService({manager:O.createChromeManager(chromeApi),transport:O.createChromeTransport(chromeApi)});}
function getChromeService(chromeApi=global.chrome){if(!chromeService) chromeService=createChromeService(chromeApi); return chromeService;}
function handleChromeMessage(message,sendResponse,chromeApi=global.chrome){
  if(message?.action!==ACTION) return false;
  getChromeService(chromeApi).dispatch(message.envelope).then(sendResponse).catch(error=>sendResponse({ok:false,requestId:clean(message?.envelope?.requestId),error:errorPayload(error)}));
  return true;
}
function resetForTests(){chromeService=null;}

global.CodeeIntelligenceRpc=Object.freeze({SCHEMA,ACTION,STREAM_EVENT_ACTION,OPERATIONS,DEFAULT_RUNTIME_ID,createEnvelope,assertEnvelope,createOffscreenHostRuntime,createService,createClient,createChromeClient,createChromeService,getChromeService,handleChromeMessage,_resetForTests:resetForTests});
})(typeof globalThis!=='undefined'?globalThis:this);
