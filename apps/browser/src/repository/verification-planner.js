(function attachVerificationPlanner(global){
'use strict';
function build(input){const selected=global.CodeeTestSelector.select(input?.changedFiles||[],{includeGit:true});const risk=String(input?.risk||'medium').toLowerCase();const checks=[...selected.commands.map(command=>({type:'command',command,required:true}))];if(['high','critical'].includes(risk))checks.unshift({type:'backup_receipt',required:true},{type:'impact_review',required:true});checks.push({type:'changed_file_hashes',required:true});return {risk,checks,requiresEvidence:true,mayAdvancePlan:false,completionDecisionOwner:'codee_core_plan_state_machine'};}
global.CodeeVerificationPlanner=Object.freeze({build});
})(typeof globalThis!=='undefined'?globalThis:this);
