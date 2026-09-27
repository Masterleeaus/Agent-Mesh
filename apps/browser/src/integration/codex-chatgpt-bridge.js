(function attachTitanCodeCodexBridge(global){
'use strict';
const ID='codex-chatgpt-account';
function bridge(){if(!global.CodeeTitanBridgeClient)throw new Error('titan-bridge-client-unavailable');return global.CodeeTitanBridgeClient;}
async function capabilities(config){const r=await bridge().call(config,'system.capabilities',{});if(!r.ok)return r;const c=r.result||{};const advertised=Boolean(c.codex===true||c.codex?.available===true||c.actions?.includes?.('codex.run')||c.actions?.includes?.('codex.status'));return {ok:advertised,available:advertised,capabilities:c.codex||null,reason:advertised?null:'codex-capability-not-advertised'};}
async function status(config){const c=await capabilities(config);if(!c.ok)return c;return bridge().call(config,'codex.status',{});}
async function run(config,request={}){
 const c=await capabilities(config);if(!c.ok)return c;
 const payload={task:String(request.task||'').slice(0,120000),cwd:String(request.cwd||'').slice(0,2000),mode:String(request.mode||'coding').slice(0,80),readOnly:request.readOnly!==false,metadata:{requestId:String(request.requestId||''),workerId:String(request.workerId||'')}};
 if(!payload.task)return {ok:false,reason:'codex-task-required'};
 return bridge().call(config,'codex.run',payload);
}
function descriptor(){return Object.freeze({id:ID,displayName:'Codex via ChatGPT account (paired local client)',locality:'LOCAL_CLIENT',credentialMode:'CHATGPT_ACCOUNT',apiKeyRequired:false,cookieScraping:false,privateBackendCalls:false,requiresPairedBridge:true,privateDevelopmentOnly:true,titanZeroRuntimeDependency:false,authority:{advancePlan:false,directMutation:false}});}
global.TitanCodeCodexBridge=Object.freeze({ID,descriptor,capabilities,status,run});
})(typeof globalThis!=='undefined'?globalThis:this);
