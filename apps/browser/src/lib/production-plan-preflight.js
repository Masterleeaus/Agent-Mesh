(function attachCodeeProductionPlanPreflight(global){
'use strict';
const arr=v=>Array.isArray(v)?v:[];
const yes=v=>v===true;
function issue(code,message,severity='blocker'){return Object.freeze({code:String(code).slice(0,120),message:String(message).slice(0,300),severity});}
function evaluate(input={}){
 const r=input.requirements||{},e=input.evidence||{}, blockers=[],warnings=[];
 const block=(c,m)=>blockers.push(issue(c,m)); const warn=(c,m)=>warnings.push(issue(c,m,'warning'));
 if(r.schema!=='codee.plan.requirements.v1') block('requirements.invalid','Canonical plan requirements are missing or invalid.');
 if(r.conversation?.required){if(!yes(e.conversation?.bound))block('conversation.not-bound','Exact target conversation is not safely bound.'); if(!yes(e.conversation?.composerReady))block('conversation.composer-not-ready','Target conversation composer is not ready.');}
 if(r.provider?.required){if(!yes(e.provider?.available))block('provider.unavailable','Required AI/provider path is unavailable.'); if(!yes(e.provider?.policyCompatible))block('provider.policy-incompatible','Available provider does not satisfy plan privacy/provider policy.'); if(r.cost?.explicitPaidApprovalRequired&&!yes(e.provider?.costApproved))block('provider.cost-not-approved','Required provider cost policy has not been approved.');}
 if(r.repository?.read&&!yes(e.repository?.readReady))block('repository.read-not-ready','Repository READ capability is not ready.');
 if(r.repository?.write&&!yes(e.repository?.writeReady))block('repository.write-not-ready','Repository WRITE capability is not ready.');
 if(r.repository?.commands&&!yes(e.repository?.commandReady))block('repository.command-not-ready','Repository command execution is not ready.');
 if(r.repository?.destructive&&!yes(e.repository?.destructiveReady))block('repository.destructive-not-ready','Destructive repository authority is not ready.');
 for(const domain of arr(r.backup?.domains)){if(!arr(e.backup?.verifiedDomains).includes(domain))block(`backup.${domain}-not-verified`,`${domain} backup is not verified for this plan.`);}
 if(r.artifactHost?.required){if(!yes(e.artifactHost?.connected))block('artifact-host.not-connected','Artifact Host is not connected.'); if(r.artifactHost?.receiptRequired&&!yes(e.artifactHost?.receiptCapable))block('artifact-host.receipt-unavailable','Artifact verification receipts are unavailable.'); if(r.artifactHost?.requireContentManifest&&!yes(e.artifactHost?.contentManifestCapable))block('artifact-host.manifest-unavailable','Strict artifact content-manifest verification is unavailable.');}
 if(r.mcp?.required&&!yes(e.mcp?.ready))block('mcp.not-ready','Required MCP runtime/connection is not ready.');
 if(r.browser?.required){if(!yes(e.browser?.ready))block('browser.not-ready','Browser Control Engine is not ready.'); for(const cap of arr(r.browser?.capabilities)){if(!arr(e.browser?.capabilities).includes(cap))block('browser.capability-missing',`Browser capability ${cap} is unavailable.`);}}
 if(e.workforce&&e.workforce.ready===false)warn('workforce.degraded','Managers & AI Workforce is degraded; deterministic execution may continue.');
 if(e.project&&e.project.identified===false)warn('project.unidentified','Project identity is not established; repository targeting context may be reduced.');
 const status=blockers.length?'BLOCKED':(warnings.length?'READY_WITH_WARNINGS':'READY');
 return Object.freeze({schema:'codee.plan.preflight.v1',evaluatedAt:new Date().toISOString(),status,blockers:Object.freeze(blockers),warnings:Object.freeze(warnings),summary:Object.freeze({blockers:blockers.length,warnings:warnings.length}),authority:Object.freeze({mayAdvancePlan:false,mayMutate:false,mayGrantCapability:false,mayOverrideBlocker:false})});
}
global.CodeeProductionPlanPreflight=Object.freeze({evaluate});
})(typeof globalThis!=='undefined'?globalThis:this);
