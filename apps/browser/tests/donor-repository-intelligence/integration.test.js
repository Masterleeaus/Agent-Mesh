'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {load}=require('./load-pack');
const FILES=['src/integration/host-capabilities.js','src/integration/mcp-adapter.js','src/integration/mcp-governance-gateway.js','src/integration/remote-context-broker.js'];

test('MCP adapter consumes host runtime rather than implementing transport', async()=>{
 const g=load(FILES);
 const calls=[];
 const host={
  listConnections:async()=>[{id:'titan',health:'ok'}],
  discover:async(id)=>({id,tools:[{name:'titan.project.info',annotations:{readOnlyHint:true}}],resources:[],prompts:[]}),
  callTool:async(id,name,args)=>{calls.push({id,name,args});return {ok:true,content:{project:'Titan Zero'}};},
  readResource:async()=>({ok:true}), getPrompt:async()=>({ok:true}), health:async()=>({ok:true})
 };
 const adapter=g.CodeeMcpIntegrationAdapter.create(host);
 const result=await adapter.callTool('titan','titan.project.info',{});
 assert.equal(result.ok,true);
 assert.equal(calls.length,1);
 assert.equal(adapter.implementsTransport,false);
});

test('remote context broker bounds evidence and labels provenance', async()=>{
 const g=load(FILES);
 const adapter={discover:async()=>({tools:[{name:'titan.schema.summary',annotations:{readOnlyHint:true}}]}),callTool:async()=>({ok:true,content:{schema:'x'.repeat(1000)}})};
 const report=await g.CodeeRemoteContextBroker.gather(adapter,[{connectionId:'titan',tool:'titan.schema.summary',args:{}}],{maxChars:300});
 assert.equal(report.items.length,1);
 assert.equal(report.items[0].connectionId,'titan');
 assert.ok(JSON.stringify(report).length<1200);
});
