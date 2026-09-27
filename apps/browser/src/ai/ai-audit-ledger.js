(function attachCodeeAIAuditLedger(global){
'use strict';
const MAX_ENTRIES=250; const rows=[];
function text(value,max=240){return global.CodeeAISanitizer?global.CodeeAISanitizer.redactString(value||'',max):String(value||'').slice(0,max);}
function record(input={}){
 const row=Object.freeze({
   timestamp:Number(input.timestamp)||Date.now(),requestId:text(input.requestId,160),managerId:text(input.managerId,160),planId:text(input.planId,160),runId:text(input.runId,160),stepId:text(input.stepId,160),
   purpose:text(input.purpose,240),provider:text(input.provider,160),model:text(input.model,240),privacyLevel:text(input.privacyLevel||'INTERNAL',40),costUsd:Math.max(0,Number(input.costUsd)||0),freeStatus:text(input.freeStatus||'UNKNOWN',80),
   latencyMs:Math.max(0,Math.floor(Number(input.latencyMs)||0)),outcome:text(input.outcome||'UNKNOWN',80),finishReason:text(input.finishReason||'',120),providerRequestId:text(input.providerRequestId||'',240),
   failover:global.CodeeAISanitizer?.immutable(Array.isArray(input.failover)?input.failover:[],{maxArray:12,maxString:500,maxNodes:300})||Object.freeze([])
 });
 rows.push(row); if(rows.length>MAX_ENTRIES)rows.splice(0,rows.length-MAX_ENTRIES); return row;
}
function list({limit=MAX_ENTRIES}={}){return rows.slice(-Math.max(1,Math.min(MAX_ENTRIES,Number(limit)||MAX_ENTRIES)));}
function clear(){rows.length=0;}
function status(){return Object.freeze({entries:rows.length,maxEntries:MAX_ENTRIES,bounded:true,persistent:false});}
global.CodeeAIAuditLedger=Object.freeze({record,list,clear,status,MAX_ENTRIES});
})(typeof globalThis!=='undefined'?globalThis:this);
