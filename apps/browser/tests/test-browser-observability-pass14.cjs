const fs=require('fs'),vm=require('vm'),assert=require('assert');
const events=[]; const listeners={event:null,detach:null};
const ctx={console,globalThis:null,chrome:{debugger:{attach:async()=>{},sendCommand:async(t,m,p)=>m==='Runtime.evaluate'?{result:{value:true}}:m==='Network.getResponseBody'?{body:'{"ok":true}',base64Encoded:false}:{},onEvent:{addListener:f=>listeners.event=f},onDetach:{addListener:f=>listeners.detach=f}}}};ctx.globalThis=ctx;vm.createContext(ctx);
vm.runInContext(fs.readFileSync('src/browser/browser-observability.js','utf8'),ctx,{filename:'browser-observability.js'});
(async()=>{
 assert.ok(ctx.CodeeBrowserObservability);
 await ctx.CodeeBrowserObservability.attach(7);
 listeners.event({tabId:7},'Runtime.consoleAPICalled',{type:'error',args:[{value:'boom'}]});
 listeners.event({tabId:7},'Network.requestWillBeSent',{requestId:'1',request:{url:'https://example.test/api',method:'GET'},type:'Fetch'});
 listeners.event({tabId:7},'Network.responseReceived',{requestId:'1',response:{status:500,statusText:'Server Error',mimeType:'application/json',url:'https://example.test/api'}});
 const ce=await ctx.CodeeBrowserObservability.errors(7,10); assert.equal(ce.events.length,1); assert.equal(ce.events[0].level,'error');
 const ne=await ctx.CodeeBrowserObservability.networkErrors(7,10); assert.equal(ne.requests.length,1); assert.equal(ne.requests[0].status,500);
 const body=await ctx.CodeeBrowserObservability.responseBody(7,'1',100); assert.equal(body.body,'{"ok":true}');
 const st=ctx.CodeeBrowserObservability.status(); assert.ok(st.implemented.includes('browser.console.errors')); assert.equal(st.titanZeroRuntimeDependency,false);
 console.log('Pass14 browser observability OK');
})().catch(e=>{console.error(e);process.exit(1)});
