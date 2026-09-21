(function attachCodeeAIResponseContract(global){
'use strict';
function num(value,min=0,max=Number.MAX_SAFE_INTEGER,fallback=0){const n=Number(value);return Number.isFinite(n)?Math.min(max,Math.max(min,n)):fallback;}
function create(input={}){
 if(!global.CodeeAISanitizer) throw new Error('Codee AI sanitizer is unavailable');
 const out={
   schema:'codee.ai.response.v1',requestId:String(input.requestId||'').slice(0,160),provider:String(input.provider||'unknown').slice(0,160),model:String(input.model||'unknown').slice(0,240),
   response:global.CodeeAISanitizer.redactString(input.response??input.text??'',120000),structuredResult:global.CodeeAISanitizer.sanitize(input.structuredResult??input.result??null,{maxNodes:5000,maxArray:200,maxString:20000}),
   toolCalls:global.CodeeAISanitizer.sanitize(Array.isArray(input.toolCalls)?input.toolCalls:[],{maxArray:64,maxNodes:3000,maxString:4000}),reasoningSummary:global.CodeeAISanitizer.redactString(input.reasoningSummary||'',12000),
   usage:{inputTokens:Math.floor(num(input.inputTokens??input.usage?.inputTokens)),outputTokens:Math.floor(num(input.outputTokens??input.usage?.outputTokens)),cachedTokens:Math.floor(num(input.cachedTokens??input.usage?.cachedTokens))},
   cost:{usd:num(input.costUsd??input.cost?.usd,0,100000,0),status:String(input.freeStatus||input.cost?.status||'UNKNOWN').slice(0,80)},latencyMs:Math.floor(num(input.latencyMs,0,3600000,0)),finishReason:String(input.finishReason||'unknown').slice(0,120),
   warnings:global.CodeeAISanitizer.sanitize(Array.isArray(input.warnings)?input.warnings:[],{maxArray:40,maxString:2000,maxNodes:500}),confidence:num(input.confidence,0,1,0),providerRequestId:String(input.providerRequestId||'').slice(0,240),verificationStatus:String(input.verificationStatus||'UNVERIFIED').slice(0,80),
   failoverHistory:global.CodeeAISanitizer.sanitize(Array.isArray(input.failoverHistory)?input.failoverHistory:[],{maxArray:20,maxString:2000,maxNodes:1000}),
   authority:{mayAdvancePlan:false,mayCompletePlan:false,mayVerifyArtifact:false,mayExecuteMutation:false,mayWriteRepository:false,mayExecuteShell:false,mayMutateDatabase:false,mayGrantBrowserPermission:false,mayApproveBackup:false,mayChangeSpendPolicy:false,mayPromoteMemory:false}
 };
 return global.CodeeAISanitizer.deepFreeze(out);
}
global.CodeeAIResponseContract=Object.freeze({create,SCHEMA:'codee.ai.response.v1'});
})(typeof globalThis!=='undefined'?globalThis:this);
