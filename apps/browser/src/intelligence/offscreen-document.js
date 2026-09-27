(function attachCodeeOffscreenDocument(global){
'use strict';
const schema='codee.intelligence.offscreen.v1';
const target='codee-intelligence-offscreen';
const streamAction='INTELLIGENCE_STREAM_EVENT';

function errorPayload(error){return {code:String(error?.code||error?.name||'OFFSCREEN_RUNTIME_ERROR').slice(0,80),message:String(error?.message||error||'Offscreen intelligence failure').slice(0,500)};}
async function emitStreamChunk(message,chunk,meta={}){
  if(!global.chrome?.runtime?.sendMessage) return;
  try{
    await global.chrome.runtime.sendMessage(Object.freeze({
      action:streamAction,
      requestId:String(message.requestId||''),
      sessionId:String(message.sessionId||''),
      chunk:String(chunk??''),
      index:Number(meta.index)||0,
      totalBytes:Number(meta.totalBytes)||0
    }));
  }catch(_e){/* A disappearing listener must not invalidate model generation. */}
}
async function dispatch(message){
  if(message?.schema!==schema||message?.target!==target) return null;
  const adapter=global.CodeeOffscreenInferenceAdapter;
  if(message.operation==='health') return {ok:true,requestId:message.requestId,result:{available:Boolean(adapter),host:'offscreen'}};
  if(message.operation==='capabilities') return {ok:true,requestId:message.requestId,result:adapter?.getCapabilities?await adapter.getCapabilities():{available:false}};
  if(!adapter) return {ok:false,requestId:message.requestId,error:{code:'OFFSCREEN_ADAPTER_UNAVAILABLE',message:'No browser inference adapter is registered in the offscreen document yet.'}};
  const fn=adapter[message.operation];
  if(typeof fn!=='function') return {ok:false,requestId:message.requestId,error:{code:'OFFSCREEN_OPERATION_UNSUPPORTED',message:`Offscreen adapter does not support ${message.operation}.`}};
  try{
    if(message.operation==='stream'){
      const streaming=global.CodeeIntelligenceStreaming;
      if(!streaming?.consume) throw Object.assign(new Error('Codee streaming runtime is unavailable in offscreen document'),{code:'STREAMING_RUNTIME_UNAVAILABLE'});
      const source=await fn({requestId:message.requestId,sessionId:message.sessionId,payload:message.payload||{}});
      const options=message.payload?.streamOptions&&typeof message.payload.streamOptions==='object'?message.payload.streamOptions:{};
      const result=await streaming.consume(source,{
        format:options.format||'text',
        maxBytes:options.maxBytes||streaming.DEFAULT_MAX_BYTES,
        maxChunks:options.maxChunks||streaming.DEFAULT_MAX_CHUNKS,
        maxChunkChars:options.maxChunkChars||streaming.DEFAULT_MAX_CHUNK_CHARS,
        mapSsePayload:typeof options.mapSsePayload==='function'?options.mapSsePayload:null,
        onChunk:(chunk,meta)=>emitStreamChunk(message,chunk,meta)
      });
      return {ok:true,requestId:message.requestId,result};
    }
    return {ok:true,requestId:message.requestId,result:await fn({requestId:message.requestId,sessionId:message.sessionId,payload:message.payload||{}})};
  }
  catch(error){return {ok:false,requestId:message.requestId,error:errorPayload(error)};}
}

if(global.chrome?.runtime?.onMessage?.addListener){
  global.chrome.runtime.onMessage.addListener((message,_sender,sendResponse)=>{
    if(message?.schema!==schema||message?.target!==target) return undefined;
    dispatch(message).then(sendResponse).catch(error=>sendResponse({ok:false,requestId:message?.requestId,error:errorPayload(error)}));
    return true;
  });
}
global.CodeeOffscreenDocument=Object.freeze({schema,target,streamAction,dispatch});
})(typeof globalThis!=='undefined'?globalThis:this);
