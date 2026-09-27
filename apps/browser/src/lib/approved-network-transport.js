(function attachApprovedNetworkTransport(global){
'use strict';
const MAX_REQUEST_BYTES=13*1024*1024;
const MAX_RESPONSE_BYTES=8*1024*1024;
const ALLOWED_HEADERS=new Set(['authorization','content-type','accept','mcp-protocol-version','x-request-id','x-goog-api-key']);
function safeUrl(value){const u=new URL(String(value||''));if(!['https:','http:'].includes(u.protocol))throw new Error('Approved network transport only supports http/https.');if(u.username||u.password)throw new Error('Credentials are not allowed in transport URLs.');u.hash='';return u;}
async function ensureOrigin(u){const origin=`${u.origin}/*`;if(!chrome.permissions?.contains)return true;const has=await chrome.permissions.contains({origins:[origin]});if(has)return true;const granted=await chrome.permissions.request({origins:[origin]});if(!granted)throw new Error(`Chrome host permission was denied for ${u.origin}.`);return true;}
function headers(input){const out={};for(const [rawKey,rawValue] of Object.entries(input&&typeof input==='object'?input:{})){const key=String(rawKey||'').toLowerCase();if(!ALLOWED_HEADERS.has(key))continue;const value=String(rawValue??'').replace(/[\r\n]/g,'').slice(0,8192);if(value)out[rawKey]=value;}return out;}
function byteLength(text){if(typeof TextEncoder!=='undefined')return new TextEncoder().encode(String(text)).byteLength;return String(text).length;}
function parseEventStream(text,expectedId){
 const events=[];
 for(const block of String(text||'').split(/\r?\n\r?\n/)){
  if(!block.trim())continue;
  const data=[];
  for(const line of block.split(/\r?\n/)){
   if(line.startsWith('data:'))data.push(line.slice(5).replace(/^ /,''));
  }
  if(!data.length)continue;
  const raw=data.join('\n');
  if(raw==='[DONE]')continue;
  try{events.push(JSON.parse(raw));}catch{throw new Error('Approved network SSE response contains invalid JSON data.');}
 }
 if(!events.length)return {};
 if(expectedId!==undefined&&expectedId!==null){const match=events.find(event=>String(event?.id??'')===String(expectedId));if(match)return match;}
 return events[events.length-1];
}
async function getJson(url,options={}){
 const u=safeUrl(url);await ensureOrigin(u);
 const requestHeaders=headers(options.headers);if(!Object.keys(requestHeaders).some(k=>k.toLowerCase()==='accept'))requestHeaders.Accept='application/json';
 const response=await fetch(u.toString(),{method:'GET',headers:requestHeaders,redirect:'error',credentials:'omit',referrerPolicy:'no-referrer',cache:'no-store'});
 const text=await response.text();if(byteLength(text)>MAX_RESPONSE_BYTES)throw new Error('Approved network response exceeds the response-size limit.');let json={};if(text){try{json=JSON.parse(text);}catch{throw new Error('Approved network response is not valid JSON.');}}return {ok:response.ok,status:response.status,headers:{contentType:String(response.headers?.get?.('Content-Type')||'').toLowerCase()||null},json};
}
async function postJson(url,body,options={}){
 const u=safeUrl(url);await ensureOrigin(u);
 const payload=JSON.stringify(body??{});
 if(byteLength(payload)>MAX_REQUEST_BYTES)throw new Error('Approved network request exceeds the request-size limit.');
 const requestHeaders=headers(options.headers);
 if(!Object.keys(requestHeaders).some(k=>k.toLowerCase()==='accept'))requestHeaders.Accept='application/json, text/event-stream';
 const response=await fetch(u.toString(),{method:'POST',headers:requestHeaders,body:payload,redirect:'error',credentials:'omit',referrerPolicy:'no-referrer',cache:'no-store'});
 const text=await response.text();
 if(byteLength(text)>MAX_RESPONSE_BYTES)throw new Error('Approved network response exceeds the response-size limit.');
 const contentType=String(response.headers?.get?.('Content-Type')||'').toLowerCase();
 let json={};
 if(text){
  if(contentType.includes('text/event-stream'))json=parseEventStream(text,body?.id);
  else{try{json=JSON.parse(text);}catch{throw new Error('Approved network response is not valid JSON.');}}
 }
 return {ok:response.ok,status:response.status,headers:{protocolVersion:response.headers?.get?.('MCP-Protocol-Version')||null,contentType:contentType||null},json};
}
global.CodeeApprovedNetworkTransport=Object.freeze({getJson,postJson,parseEventStream,MAX_REQUEST_BYTES,MAX_RESPONSE_BYTES});
})(typeof globalThis!=='undefined'?globalThis:this);
