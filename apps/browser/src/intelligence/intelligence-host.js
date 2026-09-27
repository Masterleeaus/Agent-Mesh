(function attachCodeeIntelligenceHost(global){
'use strict';

const C=global.CodeeIntelligenceContract;
if(!C) throw new Error('CodeeIntelligenceContract must be loaded before CodeeIntelligenceHost');

const HOST_SCHEMA='codee.intelligence.host.v1';
const MAX_QUEUE=256;
const MAX_HISTORY=256;
const runtimes=new Map();
const sessions=new Map();
const requests=new Map();
const queues=new Map();
const history=[];
let seq=0;

function now(){return Date.now();}
function clean(v,max=512){return String(v??'').trim().slice(0,max);}
function makeId(prefix){seq=(seq+1)%1000000; if(global.crypto?.randomUUID) return `${prefix}-${global.crypto.randomUUID()}`; return `${prefix}-${now()}-${seq}`;}
function pushHistory(event){history.push(Object.freeze({...event,at:now()})); if(history.length>MAX_HISTORY) history.splice(0,history.length-MAX_HISTORY);}
function sessionKey(ctx){return clean(ctx.sessionId,180);}
function assertContext(ctx){if(!ctx||ctx.schema!==C.CONTEXT_SCHEMA) throw new Error('Valid Codee intelligence context required'); if(!sessionKey(ctx)) throw new Error('sessionId required'); if(!clean(ctx.requestId,180)) throw new Error('requestId required'); if(!C.assertAdvisory(ctx)) throw new Error('Intelligence context authority must remain advisory'); return ctx;}
function requestKey(ctx){return clean(ctx.requestId,180);}
function ensureSession(ctx){
  const key=sessionKey(ctx); const existing=sessions.get(key);
  const identity={planId:clean(ctx.planId),runId:clean(ctx.runId),tabId:ctx.tabId,conversationIdentity:clean(ctx.conversationIdentity,512),runtime:clean(ctx.runtime,24)};
  if(existing){
    const mismatch=['planId','runId','tabId','conversationIdentity'].some(k=>existing.identity[k]!==identity[k]);
    if(mismatch) throw new Error('Session identity collision');
    existing.lastSeenAt=now(); return existing;
  }
  const value={sessionId:key,identity,createdAt:now(),lastSeenAt:now(),activeRequests:new Set()}; sessions.set(key,value); return value;
}
function registerRuntime(runtime,{primary=false}={}){
  const validation=C.assertRuntime(runtime); const id=validation.id;
  runtimes.set(id,{runtime,registeredAt:now(),primary:Boolean(primary)});
  if(!queues.has(id)) queues.set(id,{active:false,items:[]});
  if(primary){for(const [otherId,entry] of runtimes){if(otherId!==id) entry.primary=false;}}
  pushHistory({type:'runtime-registered',runtimeId:id,primary:Boolean(primary)});
  return C.descriptor(runtime,{primaryRuntime:runtime.primaryRuntime||'browser'});
}
function unregisterRuntime(runtimeId){const id=clean(runtimeId,80); if(!runtimes.has(id)) return false; const q=queues.get(id); if(q?.active||q?.items?.length) throw new Error('Cannot unregister busy intelligence runtime'); runtimes.delete(id); queues.delete(id); pushHistory({type:'runtime-unregistered',runtimeId:id}); return true;}
function resolveRuntime(ctx,requestedId){
  const explicit=clean(requestedId,80); if(explicit&&runtimes.has(explicit)) return [explicit,runtimes.get(explicit).runtime];
  const preferred=(ctx.preferredModels||[]).find(id=>runtimes.has(id)); if(preferred) return [preferred,runtimes.get(preferred).runtime];
  for(const [id,entry] of runtimes){if(entry.primary) return [id,entry.runtime];}
  const first=runtimes.entries().next(); if(!first.done) return [first.value[0],first.value[1].runtime];
  throw new Error('No Codee intelligence runtime registered');
}
function pump(runtimeId){
  const q=queues.get(runtimeId); if(!q||q.active) return; const item=q.items.shift(); if(!item) return; q.active=true;
  const record=requests.get(item.requestId); if(!record||record.state==='cancelled'){q.active=false; item.reject(Object.assign(new Error('Intelligence request cancelled'),{code:'INTELLIGENCE_CANCELLED'})); pump(runtimeId); return;}
  record.state='running'; record.startedAt=now(); pushHistory({type:'request-started',requestId:item.requestId,sessionId:item.sessionId,runtimeId});
  Promise.resolve().then(()=>item.invoke()).then(value=>{
    if(record.state==='cancelled') throw Object.assign(new Error('Stale intelligence response rejected after cancellation'),{code:'INTELLIGENCE_STALE_RESPONSE'});
    record.state='completed'; record.completedAt=now(); pushHistory({type:'request-completed',requestId:item.requestId,sessionId:item.sessionId,runtimeId}); item.resolve(value);
  }).catch(err=>{
    if(record.state!=='cancelled') record.state='failed'; record.completedAt=now(); record.errorCode=clean(err?.code||err?.name||'ERROR',80); pushHistory({type:'request-failed',requestId:item.requestId,sessionId:item.sessionId,runtimeId,code:record.errorCode}); item.reject(err);
  }).finally(()=>{const s=sessions.get(item.sessionId); s?.activeRequests.delete(item.requestId); q.active=false; pump(runtimeId);});
}
function enqueue(ctx,runtimeId,invoke){
  const id=requestKey(ctx); if(requests.has(id)) throw new Error(`Duplicate intelligence requestId: ${id}`); const session=ensureSession(ctx); const q=queues.get(runtimeId); if(!q) throw new Error(`Unknown intelligence runtime: ${runtimeId}`); if(q.items.length>=MAX_QUEUE) throw new Error('Intelligence queue is full');
  const record={requestId:id,sessionId:session.sessionId,runtimeId,state:'queued',createdAt:now(),context:ctx}; requests.set(id,record); session.activeRequests.add(id); pushHistory({type:'request-queued',requestId:id,sessionId:session.sessionId,runtimeId});
  const promise=new Promise((resolve,reject)=>{q.items.push({requestId:id,sessionId:session.sessionId,invoke,resolve,reject}); pump(runtimeId);});
  return promise.finally(()=>{if(requests.size>MAX_HISTORY*2){for(const [key,value] of requests){if(['completed','failed','cancelled'].includes(value.state)) requests.delete(key); if(requests.size<=MAX_HISTORY) break;}}});
}
function normalizeContext(input={}){return input?.schema===C.CONTEXT_SCHEMA?assertContext(input):C.createContext(input);}
function request(input={},payload={}){const ctx=normalizeContext(input); const [runtimeId,runtime]=resolveRuntime(ctx,payload.runtimeId); return enqueue(ctx,runtimeId,()=>runtime.request(ctx,payload));}
function embed(input={},payload={}){const ctx=normalizeContext(input); const [runtimeId,runtime]=resolveRuntime(ctx,payload.runtimeId); return enqueue(ctx,runtimeId,()=>runtime.embed(ctx,payload));}
function stream(input={},payload={}){const ctx=normalizeContext(input); const [runtimeId,runtime]=resolveRuntime(ctx,payload.runtimeId); return enqueue(ctx,runtimeId,()=>runtime.stream(ctx,payload));}
async function cancel(requestId,reason='cancelled'){
  const id=clean(requestId,180); const record=requests.get(id); if(!record) return {ok:false,reason:'request-not-found'}; if(['completed','failed','cancelled'].includes(record.state)) return {ok:false,reason:`request-${record.state}`}; record.state='cancelled'; record.cancelledAt=now(); record.cancelReason=clean(reason,160); const entry=runtimes.get(record.runtimeId); try{await entry?.runtime?.cancel?.(id,reason,record.context);}catch(_e){} pushHistory({type:'request-cancelled',requestId:id,sessionId:record.sessionId,runtimeId:record.runtimeId}); return {ok:true,requestId:id};
}
function getRequest(requestId){const r=requests.get(clean(requestId,180)); return r?Object.freeze({requestId:r.requestId,sessionId:r.sessionId,runtimeId:r.runtimeId,state:r.state,createdAt:r.createdAt,startedAt:r.startedAt||null,completedAt:r.completedAt||null,cancelledAt:r.cancelledAt||null,errorCode:r.errorCode||null}):null;}
function getSession(sessionId){const s=sessions.get(clean(sessionId,180)); return s?Object.freeze({sessionId:s.sessionId,identity:Object.freeze({...s.identity}),createdAt:s.createdAt,lastSeenAt:s.lastSeenAt,activeRequests:Object.freeze([...s.activeRequests])}):null;}
async function health(){const runtimeHealth=[]; for(const [id,entry] of runtimes){let value; try{value=await entry.runtime.health();}catch(err){value={ok:false,error:clean(err?.message,240)}} runtimeHealth.push({id,primary:entry.primary,health:value,queued:queues.get(id)?.items.length||0,active:Boolean(queues.get(id)?.active)});} return Object.freeze({schema:HOST_SCHEMA,ok:runtimeHealth.some(x=>x.health?.ok!==false),runtimeCount:runtimes.size,sessionCount:sessions.size,runtimes:Object.freeze(runtimeHealth)});}
function listRuntimes(){return Object.freeze([...runtimes].map(([id,e])=>Object.freeze({id,primary:e.primary,registeredAt:e.registeredAt})));}
function getHistory(limit=50){return Object.freeze(history.slice(-Math.max(1,Math.min(Number(limit)||50,MAX_HISTORY))));}
function resetForTests(){runtimes.clear();sessions.clear();requests.clear();queues.clear();history.splice(0);}

global.CodeeIntelligenceHost=Object.freeze({HOST_SCHEMA,MAX_QUEUE,registerRuntime,unregisterRuntime,listRuntimes,request,stream,embed,cancel,getRequest,getSession,health,getHistory,_resetForTests:resetForTests});
})(typeof globalThis!=='undefined'?globalThis:this);
