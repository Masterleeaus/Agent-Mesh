const fs=require('fs'),vm=require('vm'),assert=require('assert');
let captured=null;
const c={console};c.globalThis=c;
c.CodeeRepositoryPolicy={isInScope:()=>true,normalize:x=>String(x),redactText:x=>String(x).replace(/abc123/g,'[redacted]')};
c.CodeeMcpRuntime={};c.CodeeMcpIntegrationAdapter={create:()=>({})};
c.CodeeMcpGovernanceGateway={call:async(_a,_cid,_tool,args)=>{captured=args;return {ok:true,result:{ok:true},mayAdvancePlan:false};}};
c.CodeeRemoteContextBroker={sanitizeArgs:v=>JSON.parse(JSON.stringify(v).replace(/abc123/g,'[redacted]')),safeJson:JSON.stringify};
vm.createContext(c);vm.runInContext(fs.readFileSync('src/lib/repository-host-integration.js','utf8'),c,{filename:'repository-host-integration'});
(async()=>{const exact={path:'app/A.php',content:'api_key="abc123"',reason:'exact'};const r=await c.CodeeRepositoryHostIntegration.callCapability('mcp.tool.call',{connectionId:'c1',tool:'titan_repository_write',args:exact},{enabled:true,consumeMcpRuntime:true});assert.strictEqual(r.ok,true);assert.deepStrictEqual(JSON.parse(JSON.stringify(captured)),exact,'repository capability must not redact mutation arguments before governance');console.log('MCP capability exact args v2.3.4 OK');})().catch(e=>{console.error(e);process.exit(1)});
