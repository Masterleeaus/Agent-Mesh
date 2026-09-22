(function attachTitanCodeCodexBridge(global){
'use strict';
const ID='codex-chatgpt-account';
function bridge(){if(!global.CodeeTitanBridgeClient)throw new Error('titan-bridge-client-unavailable');return global.CodeeTitanBridgeClient;}
async function capabilities(config){const r=await bridge().call(config,'system.capabilities',{});if(!r.ok)return r;const c=r.result||{};const advertised=Boolean(c.codex===true||c.codex?.available===true||c.actions?.includes?.('codex.run')||c.actions?.includes?.('codex.status'));return {ok:advertised,available:advertised,capabilities:c.codex||null,reason:advertised?null:'codex-capability-not-advertised'};}
async function status(config){const c=await capabilities(config);if(!c.ok)return c;return bridge().call(config,'codex.status',{});}
function workContextText(context={}){if(!context||context.schema!=='titan-code.agent-mesh-work-context.v1')return '';const p=context.progress||{},claim=context.claim||{},pr=context.pr||{};return ['[TITAN CODE AGENT MESH WORK CONTEXT]','Issue: '+String(context.issue?.number||'')+' / '+String(context.issue?.subgoal_id||''),'Objective: '+String(context.objective||''),'Claim branch: '+String(claim.branch||''),'Git main/base/head: '+[claim.main_sha,claim.base_sha,claim.head_sha].filter(Boolean).join(' / '),'Lifecycle: '+String(context.lifecycle||''),'PR: '+String(pr.number||'none')+' '+String(pr.state||'')+(pr.draft?' draft':''),'Checks: '+JSON.stringify(context.checks||{}),'Current pass: '+String(p.current_pass??''),'Completed: '+JSON.stringify(p.completed||[]),'Current work: '+JSON.stringify(p.current_work||[]),'Next actions: '+JSON.stringify(p.next_actions||[]),'Blockers: '+JSON.stringify(p.blockers||[]),'Verification: '+JSON.stringify(p.verification||[]),'Do not repeat: '+JSON.stringify(p.do_not_repeat||[]),'Rules: '+JSON.stringify(context.instructions||[]),'Authority: '+JSON.stringify(context.authority||{}),'[END WORK CONTEXT]'].join('\n');}
function withWorkContext(task,context){const prefix=workContextText(context);return prefix?prefix+'\n\n'+String(task||''):String(task||'');}
async function run(config,request={}){
 const c=await capabilities(config);if(!c.ok)return c;
 let workContext=request.workContext||null;if(!workContext&&request.injectAgentMeshWorkContext!==false){try{const snapshot=await global.getManagerAISnapshot?.();const resolved=await global.getAgentMeshWorkContext?.(snapshot);if(resolved?.ok)workContext=resolved.context;}catch(_error){}}
 const payload={task:withWorkContext(request.task,workContext).slice(0,120000),cwd:String(request.cwd||'').slice(0,2000),mode:String(request.mode||'coding').slice(0,80),readOnly:request.readOnly!==false,metadata:{requestId:String(request.requestId||''),workerId:String(request.workerId||''),workContextSchema:String(workContext?.schema||'')}};
 if(!payload.task)return {ok:false,reason:'codex-task-required'};
 return bridge().call(config,'codex.run',payload);
}
function descriptor(){return Object.freeze({id:ID,displayName:'Codex via ChatGPT account (paired local client)',locality:'LOCAL_CLIENT',credentialMode:'CHATGPT_ACCOUNT',apiKeyRequired:false,cookieScraping:false,privateBackendCalls:false,requiresPairedBridge:true,privateDevelopmentOnly:true,titanZeroRuntimeDependency:false,authority:{advancePlan:false,directMutation:false}});}
global.TitanCodeCodexBridge=Object.freeze({ID,descriptor,capabilities,status,workContextText,withWorkContext,run});
})(typeof globalThis!=='undefined'?globalThis:this);
