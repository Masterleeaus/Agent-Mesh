(function(g){'use strict';
const SCHEMA='titan-code.manager.github-state-projection.v2';
function freeze(v){if(!v||typeof v!=='object'||Object.isFrozen(v))return v;Object.freeze(v);for(const k of Object.keys(v))freeze(v[k]);return v;}
function canonical(){const api=g.TitanCodeManagerGitHubState;if(!api||typeof api.derive!=='function')throw new Error('canonical GitHub Manager state projection unavailable');return api;}
function normalize(input={}){
 const issue=input.issue&&typeof input.issue==='object'?{...input.issue}: {};
 if(!issue.subgoal_id&&issue.subgoalId)issue.subgoal_id=issue.subgoalId;
 if(!issue.subgoal_id&&input.subgoalId)issue.subgoal_id=input.subgoalId;
 const branch=input.branch&&typeof input.branch==='object'?input.branch:null;
 const pr=input.pr&&typeof input.pr==='object'?{...input.pr}:input.pr;
 return {...input,issue,branch:typeof input.branch==='string'?input.branch:(branch?.name||branch?.ref||null),baseSha:input.baseSha||branch?.baseSha||null,headSha:input.headSha||branch?.headSha||pr?.headSha||null,claimBranchExists:input.claimBranchExists===true||Boolean(branch&&branch.exists!==false)};
}
function derive(input={}){
 const out=canonical().derive(normalize(input));
 return freeze({...out,schema:SCHEMA,compatibilityProjection:true,canonicalSchema:canonical().SCHEMA,authority:out.authority});
}
function branchFor(subgoalId){return canonical().branchFor(subgoalId);}
g.TitanCodeManagerGitHubStateProjection=freeze({SCHEMA,get LIFECYCLE(){return canonical().LIFECYCLE;},branchFor,derive,canonical:'TitanCodeManagerGitHubState'});
})(typeof globalThis!=='undefined'?globalThis:this);
