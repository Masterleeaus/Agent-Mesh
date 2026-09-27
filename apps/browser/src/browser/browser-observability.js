(function attachCodeeBrowserObservability(global){
'use strict';
const MAX_EVENTS=500, MAX_BODY=200000;
const buffers=new Map(); const attached=new Set();
function requireChrome(){if(!global.chrome?.debugger?.attach||!global.chrome?.debugger?.sendCommand)throw new Error('browser-debugger-api-unavailable');}
function buf(tabId){const id=Number(tabId);if(!buffers.has(id))buffers.set(id,{console:[],network:[],requests:new Map(),updatedAt:Date.now()});return buffers.get(id);}
function push(list,item){list.push(item);if(list.length>MAX_EVENTS)list.splice(0,list.length-MAX_EVENTS);}
function safe(v,n=20000){const s=typeof v==='string'?v:JSON.stringify(v??null);return s.length>n?s.slice(0,n)+'…':s;}
async function attach(tabId){requireChrome();const target={tabId:Number(tabId)};try{await global.chrome.debugger.attach(target,'1.3');}catch(e){if(!/already attached/i.test(String(e?.message||e)))throw e;}await global.chrome.debugger.sendCommand(target,'Runtime.enable');await global.chrome.debugger.sendCommand(target,'Network.enable');attached.add(Number(tabId));buf(tabId);return {ok:true,tabId:Number(tabId)};}
function onDetach(source,reason){if(source?.tabId==null)return;attached.delete(Number(source.tabId));const b=buf(source.tabId);b.updatedAt=Date.now();b.console.push({ts:Date.now(),type:'debugger.detached',level:'warning',message:String(reason||'detached')});}
function onEvent(source,method,params){const tabId=source?.tabId;if(tabId==null)return;const b=buf(tabId);b.updatedAt=Date.now();const ts=Date.now();
 if(method==='Runtime.consoleAPICalled'){const args=(params.args||[]).map(a=>safe(a?.value!==undefined?a.value:(a?.description||a?.type||''),4000));push(b.console,{ts,type:'console',level:String(params.type||'log'),message:args.join(' '),url:params.stackTrace?.callFrames?.[0]?.url||null});}
 if(method==='Runtime.exceptionThrown'){push(b.console,{ts,type:'exception',level:'error',message:safe(params.exceptionDetails?.exception?.description||params.exceptionDetails?.text||'Runtime exception',12000),url:params.exceptionDetails?.url||null,line:params.exceptionDetails?.lineNumber??null,column:params.exceptionDetails?.columnNumber??null});}
 if(method==='Network.requestWillBeSent'){const r={requestId:String(params.requestId),ts,type:'request',url:String(params.request?.url||''),method:String(params.request?.method||'GET'),resourceType:String(params.type||''),status:null,statusText:null,error:null};b.requests.set(r.requestId,r);push(b.network,r);}
 if(method==='Network.responseReceived'){const id=String(params.requestId),r=b.requests.get(id)||{requestId:id,ts};Object.assign(r,{responseTs:ts,type:'response',status:Number(params.response?.status||0),statusText:String(params.response?.statusText||''),mimeType:String(params.response?.mimeType||''),url:String(params.response?.url||r.url||'')});b.requests.set(id,r);}
 if(method==='Network.loadingFailed'){const id=String(params.requestId),r=b.requests.get(id)||{requestId:id,ts};Object.assign(r,{failedTs:ts,type:'failed',error:String(params.errorText||'network request failed'),blockedReason:params.blockedReason||null,canceled:Boolean(params.canceled)});b.requests.set(id,r);push(b.network,r);}
 if(method==='Network.loadingFinished'){const id=String(params.requestId),r=b.requests.get(id);if(r){r.finishedTs=ts;r.encodedDataLength=Number(params.encodedDataLength||0);}}
}
function init(){if(global.chrome?.debugger?.onEvent&&!global.__CodeeBrowserObservabilityBound){global.chrome.debugger.onEvent.addListener(onEvent);global.chrome.debugger.onDetach?.addListener(onDetach);global.__CodeeBrowserObservabilityBound=true;}}
async function latest(tabId,limit=100){await attach(tabId);const b=buf(tabId);return {ok:true,tabId:Number(tabId),events:b.console.slice(-Math.min(500,Math.max(1,Number(limit)||100))),updatedAt:b.updatedAt};}
async function errors(tabId,limit=100){const r=await latest(tabId,Math.max(limit,100));return {...r,events:r.events.filter(e=>e.level==='error'||e.type==='exception'||e.type==='debugger.detached').slice(-Math.min(500,Math.max(1,Number(limit)||100)))};}
async function network(tabId,limit=100){await attach(tabId);const b=buf(tabId);return {ok:true,tabId:Number(tabId),requests:[...b.requests.values()].slice(-Math.min(1000,Math.max(1,Number(limit)||100))),updatedAt:b.updatedAt};}
async function networkErrors(tabId,limit=100){const r=await network(tabId,Math.max(limit,100));return {...r,requests:r.requests.filter(x=>x.error||x.status>=400).slice(-Math.min(500,Math.max(1,Number(limit)||100)))};}
async function request(tabId,requestId){await attach(tabId);const r=buf(tabId).requests.get(String(requestId));if(!r)throw new Error('browser-network-request-not-found');return {ok:true,request:r};}
async function responseBody(tabId,requestId,maxChars=200000){await attach(tabId);const n=Math.min(MAX_BODY,Math.max(1,Number(maxChars)||200000));const r=await global.chrome.debugger.sendCommand({tabId:Number(tabId)},'Network.getResponseBody',{requestId:String(requestId)});return {ok:true,requestId:String(requestId),body:safe(r?.body||'',n),base64Encoded:Boolean(r?.base64Encoded),truncated:String(r?.body||'').length>n};}
function clear(tabId){const b=buf(tabId);b.console=[];b.network=[];b.requests.clear();b.updatedAt=Date.now();return {ok:true,tabId:Number(tabId),cleared:true};}
function status(){return {schema:'titan.code.browser.observability.status.v1',implemented:['browser.console.latest','browser.console.errors','browser.console.clear','browser.network.list','browser.network.errors','browser.network.request','browser.network.response_body'],attachedTabs:[...attached],maxEvents:MAX_EVENTS,maxResponseBody:MAX_BODY,privateDevelopmentOnly:true,titanZeroRuntimeDependency:false,authority:{mayAdvancePlan:false,mayMutateRepository:false,mayMutateServer:false}};}
init();
global.CodeeBrowserObservability=Object.freeze({attach,latest,errors,network,networkErrors,request,responseBody,clear,status});
})(typeof globalThis!=='undefined'?globalThis:this);
