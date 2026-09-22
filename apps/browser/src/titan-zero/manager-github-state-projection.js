(function(g){'use strict';
const SCHEMA='titan-code.manager.github-state-projection.v3';
function freeze(v){if(!v||typeof v!=='object'||Object.isFrozen(v))return v;Object.freeze(v);for(const k of Object.keys(v))freeze(v[k]);return v;}
function canonical(){const api=g.TitanCodeManagerGitHubState;if(!api||typeof api.derive!=='function')throw new Error('canonical GitHub Manager state projection unavailable');return api;}
function normalize(input={}){
 const issue=input.issue&&typeof input.issue==='object'?{...input.issue}:{};
 const subgoalId=issue.subgoal_id||issue.subgoalId||input.subgoal_id||input.subgoalId||input.subgoalId;
 if(subgoalId)issue.subgoal_id=subgoalId;
 const branch=input.branch&&typeof input.branch==='object'?{...input.branch}:input.branch;
 return {...input,issue,branch};
}
function derive(input={}){
 const out=canonical().derive(normalize(input));
 return freeze({...out,schema:SCHEMA,compatibilityProjection:true,canonicalSchema:canonical().SCHEMA,authority:'github',authorityFacts:out.authority});
}
function branchFor(subgoalId){return canonical().branchFor(subgoalId);}
g.TitanCodeManagerGitHubStateProjection=freeze({
 SCHEMA,
 get LIFECYCLE(){return canonical().LIFECYCLE;},
 branchFor,derive,
 canonical:'TitanCodeManagerGitHubState',
 authority:'compatibility-only'
});
})(typeof globalThis!=='undefined'?globalThis:this);
