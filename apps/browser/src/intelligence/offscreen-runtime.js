(function attachCodeeOffscreenRuntime(global){
'use strict';

// Donor-first adaptation of Auto Browser v1.4.2 src/offscreen-manager.js.
// Codee keeps the donor's ref-counted, no-keepalive lifecycle but exposes it
// through the existing intelligence namespace and request/session identities.

const MESSAGE_SCHEMA='codee.intelligence.offscreen.v1';
const DEFAULTS=Object.freeze({
  url:'src/intelligence/offscreen.html',
  reasons:Object.freeze(['BLOBS']),
  justification:'Hosts model/inference asset Blob work for Codee browser intelligence only while a governed request is in flight; never used as a service-worker keepalive.'
});
const IDEMPOTENT_CREATE_RE=/single offscreen document|already exists|creation pending/i;
const IDEMPOTENT_CLOSE_RE=/no current offscreen document|no offscreen document/i;

function clean(value,max=180){return String(value??'').trim().slice(0,max);}

function createManager({offscreenApi,url=DEFAULTS.url,reasons=DEFAULTS.reasons,justification=DEFAULTS.justification,onError=null}={}){
  const retainers=new Set();
  let pending=null;

  async function runCreate(){
    try{await offscreenApi.createDocument({url,reasons:[...reasons],justification});}
    catch(error){if(!IDEMPOTENT_CREATE_RE.test(error?.message||'')){if(typeof onError==='function') onError(error); else throw error;}}
  }
  async function runClose(){
    try{await offscreenApi.closeDocument();}
    catch(error){if(!IDEMPOTENT_CLOSE_RE.test(error?.message||'')){if(typeof onError==='function') onError(error); else throw error;}}
  }
  function enqueue(operation){
    const previous=pending||Promise.resolve();
    const next=previous.then(operation,operation).finally(()=>{if(pending===next) pending=null;});
    pending=next;
    return next;
  }
  async function retain(key){
    const token=clean(key); if(!token) throw new Error('Offscreen retainer key required');
    if(!offscreenApi?.createDocument) return false;
    const wasEmpty=retainers.size===0;
    retainers.add(token);
    if(wasEmpty) await enqueue(runCreate);
    return true;
  }
  async function release(key){
    const token=clean(key); if(!token) return false;
    if(!offscreenApi?.closeDocument){retainers.delete(token); return false;}
    if(!retainers.delete(token)) return false;
    if(retainers.size===0) await enqueue(runClose);
    return true;
  }
  function isActive(){return retainers.size>0;}
  function retainerCount(){return retainers.size;}
  return Object.freeze({retain,release,isActive,retainerCount});
}

async function invoke({manager,transport,requestId,sessionId,operation='request',payload={}}={}){
  const rid=clean(requestId); const sid=clean(sessionId); const op=clean(operation,64);
  if(!manager?.retain||!manager?.release) throw new Error('Offscreen manager required');
  if(typeof transport!=='function') throw new Error('Offscreen transport required');
  if(!rid) throw new Error('requestId required');
  if(!sid) throw new Error('sessionId required');
  if(!['request','stream','embed','health','capabilities'].includes(op)) throw new Error(`Unsupported offscreen intelligence operation: ${op}`);
  await manager.retain(rid);
  try{
    return await transport(Object.freeze({schema:MESSAGE_SCHEMA,target:'codee-intelligence-offscreen',requestId:rid,sessionId:sid,operation:op,payload}));
  } finally {
    await manager.release(rid);
  }
}

function createChromeManager(chromeApi=global.chrome){return createManager({offscreenApi:chromeApi?.offscreen});}
function createChromeTransport(chromeApi=global.chrome){
  return async message=>{
    if(!chromeApi?.runtime?.sendMessage) throw new Error('Chrome runtime messaging unavailable');
    const response=await chromeApi.runtime.sendMessage(message);
    if(response?.ok===false){const error=new Error(response.error?.message||'Offscreen intelligence request failed'); error.code=response.error?.code||'OFFSCREEN_REQUEST_FAILED'; throw error;}
    return response;
  };
}

global.CodeeOffscreenRuntime=Object.freeze({MESSAGE_SCHEMA,DEFAULTS,createManager,createChromeManager,createChromeTransport,invoke});
})(typeof globalThis!=='undefined'?globalThis:this);
