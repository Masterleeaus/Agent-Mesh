(function(g){'use strict';
const SCHEMA='titan-code.manager.github-state.v1';
const LIFECYCLE=Object.freeze(['AVAILABLE','CLAIMED','ACTIVE','VERIFYING','READY','PR_OPEN','MERGED','COMPLETED','BLOCKED','FAILED','SUPERSEDED','REBASE_REQUIRED']);
function freeze(v){if(!v||typeof v!=='object'||Object.isFrozen(v))return v;Object.freeze(v);for(const k of Object.keys(v))freeze(v[k]);return v;}
function arr(v){return Array.isArray(v)?v:[];}
function clean(v,n=512){return String(v==null?'':v).trim().slice(0,n);}
function sha(v){const s=clean(v,64).toLowerCase();return /^[a-f0-9]{40,64}$/.test(s)?s:null;}
function branchFor(subgoalId){const id=clean(subgoalId,160);if(!id)throw new Error('subgoal id required');return 'agent/'+id;}
function derive(input={}){
 const issue=input.issue&&typeof input.issue==='object'?input.issue:{};
 const mainSha=sha(input.mainSha),baseSha=sha(input.baseSha),headSha=sha(input.headSha);
 const branch=clean(input.branch,240),expected=issue.subgoal_id?branchFor(issue.subgoal_id):'';
 const claimExists=input.claimBranchExists===true&&Boolean(expected)&&(!branch||branch===expected);
 const pr=input.pr&&typeof input.pr==='object'?input.pr:null;
 const checks=arr(input.checks); const required=checks.filter(x=>x&&x.required!==false);
 const checksFailed=required.some(x=>['FAILURE','FAILED','ERROR','CANCELLED','TIMED_OUT'].includes(clean(x.conclusion||x.status,40).toUpperCase()));
 const checksPending=required.some(x=>!['SUCCESS','PASSED','NEUTRAL','SKIPPED'].includes(clean(x.conclusion||x.status,40).toUpperCase()));
 const merged=Boolean(pr&&(pr.merged===true||pr.merged_at));
 const issueClosed=clean(issue.state,40).toUpperCase()==='CLOSED';
 const behindMain=input.behindMain===true||Boolean(input.compare&&Number(input.compare.behind_by)>0);
 let state='AVAILABLE';
 if(input.superseded===true)state='SUPERSEDED';
 else if(input.blocked===true)state='BLOCKED';
 else if(input.failed===true||checksFailed)state='FAILED';
 else if(merged&&issueClosed)state='COMPLETED';
 else if(merged)state='MERGED';
 else if(input.rebaseRequired===true)state='REBASE_REQUIRED';
 else if(pr&&clean(pr.state,40).toUpperCase()==='OPEN'&&required.length===0)state='PR_OPEN';
 else if(pr&&clean(pr.state,40).toUpperCase()==='OPEN'&&!checksPending)state='READY';
 else if(pr&&clean(pr.state,40).toUpperCase()==='OPEN'&&checksPending)state='VERIFYING';
 else if(pr&&clean(pr.state,40).toUpperCase()==='OPEN')state='PR_OPEN';
 else if(claimExists&&headSha&&baseSha&&headSha!==baseSha)state='ACTIVE';
 else if(claimExists)state='CLAIMED';
 return freeze({schema:SCHEMA,state,issue:Object.freeze({number:Number(issue.number)||null,subgoal_id:clean(issue.subgoal_id,160)||null,state:clean(issue.state,40)||null}),git:Object.freeze({mainSha,baseSha,headSha,branch:branch||null,expectedClaimBranch:expected||null,claimExists,behindMain}),pr:pr?Object.freeze({number:Number(pr.number)||null,state:clean(pr.state,40)||null,merged}):null,checks:Object.freeze({required:required.length,pending:checksPending,failed:checksFailed}),authority:Object.freeze({durableTruth:'github',claim:'git-branch-ref',baseline:'git-main-sha',merge:'github-pr-merge',localProjectionOnly:true})});
}
g.TitanCodeManagerGitHubState=freeze({SCHEMA,LIFECYCLE,branchFor,derive});
})(typeof globalThis!=='undefined'?globalThis:this);
