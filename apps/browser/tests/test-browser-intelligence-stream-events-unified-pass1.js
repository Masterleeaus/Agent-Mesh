const assert=require('assert');
const fs=require('fs');
const vm=require('vm');

const sent=[];
const listeners=[];
const chrome={runtime:{
  sendMessage:async message=>{sent.push(message);return undefined;},
  onMessage:{addListener:fn=>listeners.push(fn)}
}};
const context=vm.createContext({console,globalThis:{},chrome,TextDecoder,TextEncoder,ReadableStream,setTimeout,clearTimeout});
context.globalThis=context; context.globalThis.chrome=chrome;
vm.runInContext(fs.readFileSync('src/intelligence/streaming.js','utf8'),context,{filename:'streaming.js'});
context.CodeeOffscreenInferenceAdapter={
  async *stream(){yield 'A';yield 'B';},
  async request(){return {text:'one-shot'};}
};
vm.runInContext(fs.readFileSync('src/intelligence/offscreen-document.js','utf8'),context,{filename:'offscreen-document.js'});
const D=context.CodeeOffscreenDocument;
assert(D,'offscreen document must export runtime');

(async()=>{
  const response=await D.dispatch({schema:D.schema,target:D.target,operation:'stream',requestId:'req-1',sessionId:'sess-1',payload:{}});
  assert.strictEqual(response.ok,true);
  assert.strictEqual(response.requestId,'req-1');
  assert.strictEqual(response.result.text,'AB');
  assert.strictEqual(response.result.chunkCount,2);
  const chunks=sent.filter(x=>x.action==='INTELLIGENCE_STREAM_EVENT');
  assert.deepStrictEqual(chunks.map(x=>x.chunk),['A','B']);
  assert(chunks.every(x=>x.requestId==='req-1'&&x.sessionId==='sess-1'),'chunk events must preserve request/session identity');
  assert.deepStrictEqual(chunks.map(x=>x.index),[1,2]);
  console.log('Browser intelligence unified pass 1 stream event side channel');
})().catch(err=>{console.error(err);process.exit(1);});
