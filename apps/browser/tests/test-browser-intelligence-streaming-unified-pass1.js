const assert=require('assert');
const fs=require('fs');
const vm=require('vm');

assert(fs.existsSync('src/intelligence/streaming.js'),'streaming runtime module must exist');
const context=vm.createContext({console,globalThis:{},TextDecoder,TextEncoder,ReadableStream,setTimeout,clearTimeout});
context.globalThis=context;
vm.runInContext(fs.readFileSync('src/intelligence/streaming.js','utf8'),context,{filename:'src/intelligence/streaming.js'});
const S=context.CodeeIntelligenceStreaming;
assert(S,'CodeeIntelligenceStreaming must be exported');

(async()=>{
  const asyncChunks=[];
  async function* generate(){yield 'hel'; yield 'lo';}
  const final1=await S.consume(generate(),{onChunk:chunk=>asyncChunks.push(chunk)});
  assert.deepStrictEqual(asyncChunks,['hel','lo']);
  assert.strictEqual(final1.text,'hello');
  assert.strictEqual(final1.chunkCount,2);

  const rs=new ReadableStream({start(controller){controller.enqueue(new TextEncoder().encode('a')); controller.enqueue(new TextEncoder().encode('b')); controller.close();}});
  const readChunks=[];
  const final2=await S.consume(rs,{onChunk:chunk=>readChunks.push(chunk)});
  assert.deepStrictEqual(readChunks,['a','b']);
  assert.strictEqual(final2.text,'ab');

  const sseChunks=[];
  async function* sse(){yield 'data: {"delta":"one"}\n\n'; yield 'data: {"delta":"two"}\n\ndata: [DONE]\n\n';}
  const final3=await S.consume(sse(),{format:'sse',onChunk:chunk=>sseChunks.push(chunk),mapSsePayload:p=>p.delta||''});
  assert.deepStrictEqual(sseChunks,['one','two']);
  assert.strictEqual(final3.termination,'done');
  assert.strictEqual(final3.text,'onetwo');

  await assert.rejects(()=>S.consume((async function*(){yield '12345'; yield '67890';})(),{maxBytes:6}),/stream byte limit/i);
  await assert.rejects(()=>S.consume((async function*(){yield 'a'; yield 'b';})(),{maxChunks:1}),/stream chunk limit/i);

  console.log('Browser intelligence unified pass 1 streaming runtime');
})().catch(err=>{console.error(err);process.exit(1);});
