const assert=require('assert');
const fs=require('fs');
const vm=require('vm');
const context=vm.createContext({console,globalThis:{},Date,setTimeout,clearTimeout}); context.globalThis=context;
vm.runInContext(fs.readFileSync('src/intelligence/offscreen-runtime.js','utf8'),context,{filename:'src/intelligence/offscreen-runtime.js'});
const O=context.CodeeOffscreenRuntime; assert(O,'CodeeOffscreenRuntime must be exported');
(async()=>{
 const calls=[];
 const offscreenApi={
   createDocument:async options=>{calls.push(['create',options]);},
   closeDocument:async()=>{calls.push(['close']);}
 };
 const manager=O.createManager({offscreenApi,url:'src/intelligence/offscreen.html'});
 assert.strictEqual(manager.isActive(),false);
 await manager.retain('req-a');
 assert.strictEqual(manager.isActive(),true);
 await manager.retain('req-b');
 assert.strictEqual(calls.filter(x=>x[0]==='create').length,1,'concurrent retainers must share one document');
 await manager.release('req-a');
 assert.strictEqual(calls.filter(x=>x[0]==='close').length,0,'document must remain while another request retains it');
 await manager.release('req-b');
 assert.strictEqual(calls.filter(x=>x[0]==='close').length,1,'last release must close document');
 assert.deepStrictEqual(Array.from(calls[0][1].reasons),['BLOBS']);
 assert(/inference|model/i.test(calls[0][1].justification));

 const createErrors=[];
 const idempotent=O.createManager({offscreenApi:{createDocument:async()=>{throw new Error('Only a single offscreen document may be created');},closeDocument:async()=>{}},onError:e=>createErrors.push(e)});
 await idempotent.retain('x');
 assert.strictEqual(createErrors.length,0,'idempotent create race must not surface as failure');
 await idempotent.release('x');

 const messages=[];
 const transport=async msg=>{messages.push(msg); return {ok:true,requestId:msg.requestId,result:{text:'hello'}};};
 const result=await O.invoke({manager,transport,requestId:'req-c',sessionId:'session-c',operation:'request',payload:{prompt:'hi'}});
 assert.strictEqual(result.result.text,'hello');
 assert.strictEqual(manager.isActive(),false,'invoke must release in finally');
 assert.strictEqual(messages[0].target,'codee-intelligence-offscreen');
 assert.strictEqual(messages[0].schema,O.MESSAGE_SCHEMA);
 assert.strictEqual(messages[0].requestId,'req-c');
 assert.strictEqual(messages[0].sessionId,'session-c');
 assert.strictEqual(messages[0].operation,'request');

 await assert.rejects(()=>O.invoke({manager,transport:async()=>{throw new Error('boom');},requestId:'req-d',sessionId:'session-d',operation:'request'}),/boom/);
 assert.strictEqual(manager.isActive(),false,'failed invoke must also release');

 const manifest=JSON.parse(fs.readFileSync('manifest.json','utf8'));
 assert(manifest.permissions.includes('offscreen'),'manifest must grant the MV3 offscreen permission');
 assert(fs.existsSync('src/intelligence/offscreen.html'));
 assert(fs.existsSync('src/intelligence/offscreen-document.js'));
 console.log('Browser intelligence donor-first pass 5 offscreen runtime');
})().catch(err=>{console.error(err);process.exit(1);});
