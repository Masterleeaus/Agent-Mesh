(function attachCodeeAIRequestContract(global){
'use strict';
const PRIVACY=new Set(['PUBLIC','INTERNAL','CONFIDENTIAL','SECRET','LOCAL_ONLY']);
const COST_MODES=new Set(['FREE_ONLY','BUDGETED','USER_FUNDED','AUTO']);
let requestCounter=0;
function id(value){return String(value||'').trim().slice(0,160);}
function list(value,max=40){return [...new Set((Array.isArray(value)?value:[]).map(v=>String(v||'').trim().slice(0,160)).filter(Boolean))].slice(0,max);}
function number(value,min,max,fallback){const n=Number(value);return Number.isFinite(n)?Math.min(max,Math.max(min,n)):fallback;}
function makeRequestId(){requestCounter=(requestCounter+1)%1000000; if(global.crypto?.randomUUID) return `ai-${global.crypto.randomUUID()}`; return `ai-${Date.now()}-${requestCounter}`;}
function create(input={}){
 if(!global.CodeeAISanitizer) throw new Error('Codee AI sanitizer is unavailable');
 const privacyLevel=String(input.privacyLevel||input.privacy?.level||'INTERNAL').toUpperCase();
 if(!PRIVACY.has(privacyLevel)) throw new Error(`Invalid AI privacy level: ${privacyLevel}`);
 const mode=String(input.costPolicy?.mode||'AUTO').toUpperCase();
 if(!COST_MODES.has(mode)) throw new Error(`Invalid AI cost policy: ${mode}`);
 const task=global.CodeeAISanitizer.redactString(input.task||'',120000); if(!task.trim()) throw new Error('AI request task is required');
 const out={
   schema:'codee.ai.request.v1',requestId:id(input.requestId)||makeRequestId(),managerId:id(input.managerId),planId:id(input.planId),runId:id(input.runId),stepId:id(input.stepId),contextHash:id(input.contextHash),
   purpose:global.CodeeAISanitizer.redactString(input.purpose||'general',240),task,systemInstructions:global.CodeeAISanitizer.redactString(input.systemInstructions||'',30000),
   evidence:global.CodeeAISanitizer.sanitize(Array.isArray(input.evidence)?input.evidence:[],{maxArray:200,maxString:20000,maxNodes:5000}),
   conversation:global.CodeeAISanitizer.sanitize(input.conversation||null,{maxArray:100,maxString:12000,maxNodes:2000}),
   requiredCapabilities:list(input.requiredCapabilities,40),preferredProviders:list(input.preferredProviders,30),forbiddenProviders:list(input.forbiddenProviders,30),preferredModels:list(input.preferredModels,30),
   privacy:{level:privacyLevel,allowCloud:!['SECRET','LOCAL_ONLY'].includes(privacyLevel),includeSecrets:false,includeCredentials:false},
   costPolicy:{mode,maxUsd:number(input.costPolicy?.maxUsd,0,100000,mode==='FREE_ONLY'?0:null),currency:String(input.costPolicy?.currency||'USD').toUpperCase().slice(0,8)},
   maximumContext:Math.floor(number(input.maximumContext,256,10000000,128000)),maximumOutput:Math.floor(number(input.maximumOutput,1,1000000,4096)),temperature:number(input.temperature,0,2,0.2),reasoningLevel:String(input.reasoningLevel||'auto').slice(0,40),
   tools:global.CodeeAISanitizer.sanitize(Array.isArray(input.tools)?input.tools:[],{maxArray:64,maxString:4000,maxNodes:3000}),requiredSchema:global.CodeeAISanitizer.sanitize(input.requiredSchema||null,{maxArray:100,maxString:4000,maxNodes:3000}),
   timeoutMs:Math.floor(number(input.timeoutMs,1000,300000,60000)),retryPolicy:{maxAttempts:Math.floor(number(input.retryPolicy?.maxAttempts,1,5,2)),allowFailover:input.retryPolicy?.allowFailover!==false},stream:Boolean(input.stream),
   authority:{mayAdvancePlan:false,mayCompletePlan:false,mayVerifyArtifact:false,mayExecuteMutation:false,mayWriteRepository:false,mayExecuteShell:false,mayMutateDatabase:false,mayGrantBrowserPermission:false,mayApproveBackup:false,mayChangeSpendPolicy:false,mayPromoteMemory:false}
 };
 return global.CodeeAISanitizer.deepFreeze(out);
}
global.CodeeAIRequestContract=Object.freeze({create,SCHEMA:'codee.ai.request.v1',privacyLevels:Object.freeze([...PRIVACY]),costModes:Object.freeze([...COST_MODES])});
})(typeof globalThis!=='undefined'?globalThis:this);
