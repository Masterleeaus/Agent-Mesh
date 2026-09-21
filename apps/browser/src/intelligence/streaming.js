(function attachCodeeIntelligenceStreaming(global){
'use strict';

// Donor-first adaptation of Auto Browser's bounded SSE stream handling.
// This module normalizes multiple browser/provider stream shapes into one
// bounded Codee chunk pipeline without granting execution authority.

const SCHEMA='codee.intelligence.streaming.v1';
const DEFAULT_MAX_BYTES=8_000_000;
const DEFAULT_MAX_CHUNKS=20_000;
const DEFAULT_MAX_CHUNK_CHARS=1_000_000;

function cleanText(value){
  if(value==null) return '';
  if(typeof value==='string') return value;
  if(value instanceof Uint8Array) return new TextDecoder('utf-8',{fatal:true}).decode(value);
  if(value instanceof ArrayBuffer) return new TextDecoder('utf-8',{fatal:true}).decode(new Uint8Array(value));
  if(ArrayBuffer.isView(value)) return new TextDecoder('utf-8',{fatal:true}).decode(new Uint8Array(value.buffer,value.byteOffset,value.byteLength));
  if(typeof value==='object'&&typeof value.text==='string') return value.text;
  return String(value);
}
function byteLength(text){return new TextEncoder().encode(text).byteLength;}
function assertBound(name,value,{allowZero=false}={}){
  if(!Number.isSafeInteger(value)||(allowZero?value<0:value<=0)) throw new RangeError(`${name} must be ${allowZero?'a non-negative':'a positive'} safe integer`);
}
function toAsyncIterable(source){
  if(source==null) return (async function*(){})();
  if(typeof source==='string'||source instanceof Uint8Array||source instanceof ArrayBuffer||ArrayBuffer.isView(source)) return (async function*(){yield source;})();
  if(typeof source[Symbol.asyncIterator]==='function') return source;
  if(typeof source.getReader==='function'){
    return (async function*(){
      const reader=source.getReader();
      try{for(;;){const {done,value}=await reader.read(); if(done) break; yield value;}}
      finally{try{reader.releaseLock();}catch(_e){}}
    })();
  }
  if(typeof source[Symbol.iterator]==='function') return (async function*(){for(const part of source) yield part;})();
  return (async function*(){yield source;})();
}
function createSseDecoder({maxEventChars=DEFAULT_MAX_CHUNK_CHARS}={}){
  assertBound('maxEventChars',maxEventChars,{allowZero:true});
  let pending='';
  let data=[];
  let chars=0;
  let overflow=false;
  function reset(){data=[];chars=0;overflow=false;}
  function line(text,events){
    if(text===''){
      if(overflow){events.push({overflowed:true,data:''});reset();return;}
      if(data.length){events.push({overflowed:false,data:data.join('\n')});reset();}
      return;
    }
    if(overflow||text.startsWith(':')) return;
    const colon=text.indexOf(':');
    const field=colon<0?text:text.slice(0,colon);
    if(field!=='data') return;
    let value=colon<0?'':text.slice(colon+1); if(value.startsWith(' ')) value=value.slice(1);
    const next=chars+(data.length?1:0)+value.length;
    if(next>maxEventChars){overflow=true;data=[];return;}
    chars=next;data.push(value);
  }
  return Object.freeze({
    push(chunk){
      pending+=String(chunk||'');
      const events=[];
      let start=0;
      for(let i=0;i<pending.length;i++){
        const ch=pending[i]; if(ch!=='\n'&&ch!=='\r') continue;
        const current=pending.slice(start,i); line(current,events);
        if(ch==='\r'&&pending[i+1]==='\n') i++;
        start=i+1;
      }
      pending=pending.slice(start);
      if(pending.length>maxEventChars+6){overflow=true;pending='';}
      return events;
    },
    hasIncompleteTail(){return Boolean(pending.length||data.length||overflow);}
  });
}
async function consume(source,{onChunk=()=>{},format='text',mapSsePayload=null,maxBytes=DEFAULT_MAX_BYTES,maxChunks=DEFAULT_MAX_CHUNKS,maxChunkChars=DEFAULT_MAX_CHUNK_CHARS}={}){
  assertBound('maxBytes',maxBytes);assertBound('maxChunks',maxChunks);assertBound('maxChunkChars',maxChunkChars,{allowZero:true});
  if(typeof onChunk!=='function') throw new TypeError('onChunk must be a function');
  if(!['text','sse'].includes(format)) throw new Error(`Unsupported stream format: ${format}`);
  let totalBytes=0;let chunkCount=0;let text='';let termination='eof';let stopped=false;
  const sse=format==='sse'?createSseDecoder({maxEventChars:maxChunkChars}):null;
  const emit=async value=>{
    const chunk=cleanText(value); if(!chunk) return;
    if(chunk.length>maxChunkChars) throw Object.assign(new Error('Intelligence stream chunk limit exceeded'),{code:'INTELLIGENCE_STREAM_CHUNK_LIMIT'});
    const bytes=byteLength(chunk); totalBytes+=bytes; if(totalBytes>maxBytes) throw Object.assign(new Error('Intelligence stream byte limit exceeded'),{code:'INTELLIGENCE_STREAM_BYTE_LIMIT'});
    chunkCount++; if(chunkCount>maxChunks) throw Object.assign(new Error('Intelligence stream chunk limit exceeded'),{code:'INTELLIGENCE_STREAM_CHUNK_LIMIT'});
    text+=chunk; await onChunk(chunk,Object.freeze({index:chunkCount,bytes,totalBytes}));
  };
  for await(const raw of toAsyncIterable(source)){
    const rawText=cleanText(raw);
    if(format==='text'){await emit(rawText);continue;}
    const rawBytes=byteLength(rawText); totalBytes+=rawBytes; if(totalBytes>maxBytes) throw Object.assign(new Error('Intelligence stream byte limit exceeded'),{code:'INTELLIGENCE_STREAM_BYTE_LIMIT'});
    for(const event of sse.push(rawText)){
      if(event.overflowed) throw Object.assign(new Error('Intelligence SSE event limit exceeded'),{code:'INTELLIGENCE_STREAM_EVENT_LIMIT'});
      const payload=event.data.trim(); if(!payload) continue;
      if(payload==='[DONE]'){termination='done';stopped=true;break;}
      let parsed; try{parsed=JSON.parse(payload);}catch(_e){throw Object.assign(new Error('Malformed intelligence SSE payload'),{code:'INTELLIGENCE_STREAM_MALFORMED_SSE'});}
      const mapped=typeof mapSsePayload==='function'?mapSsePayload(parsed):parsed?.delta??parsed?.text??'';
      // Raw SSE bytes were already charged above; emit mapped text without double-charging bytes.
      const chunk=cleanText(mapped); if(chunk){
        if(chunk.length>maxChunkChars) throw Object.assign(new Error('Intelligence stream chunk limit exceeded'),{code:'INTELLIGENCE_STREAM_CHUNK_LIMIT'});
        chunkCount++; if(chunkCount>maxChunks) throw Object.assign(new Error('Intelligence stream chunk limit exceeded'),{code:'INTELLIGENCE_STREAM_CHUNK_LIMIT'});
        text+=chunk; await onChunk(chunk,Object.freeze({index:chunkCount,bytes:byteLength(chunk),totalBytes}));
      }
    }
    if(stopped) break;
  }
  if(format==='sse'&&!stopped&&sse.hasIncompleteTail()) throw Object.assign(new Error('Truncated intelligence SSE stream'),{code:'INTELLIGENCE_STREAM_TRUNCATED'});
  return Object.freeze({schema:SCHEMA,text,chunkCount,totalBytes,termination});
}

global.CodeeIntelligenceStreaming=Object.freeze({SCHEMA,DEFAULT_MAX_BYTES,DEFAULT_MAX_CHUNKS,DEFAULT_MAX_CHUNK_CHARS,createSseDecoder,toAsyncIterable,consume});
})(typeof globalThis!=='undefined'?globalThis:this);
