(function(g){'use strict';
const SCHEMA='titan-code.manager.github-state.v2';
const LIFECYCLE=Object.freeze(['AVAILABLE','CLAIMED','ACTIVE','VERIFYING','READY','PR_OPEN','MERGED','COMPLETED','BLOCKED','FAILED','SUPERSEDED','REBASE_REQUIRED']);
function freeze(v){if(!v||typeof v!=='object'||Object.isFrozen(v))return v;Object.freeze(v);for(const k of Object.keys(v))freeze(v[k]);return v;}
function arr(v){return Array.isArray(v)?v:[];}
function clean(v,n=512){return String(v==null?'':v).trim().slice(0,n);}
function sha(v){const s=clean(v,64).toLowerCase();return /^[a-f0-9]{40,64}$/.test(s)?s:null;}
function requireShaIfPresent(v,label){if(v==null||v==='')return null;const out=sha(v);if(!out)throw new Error(`invalid GitHub ${label} SHA`);return out;}
function branchFor(subgoalId){const id=clean(subgoalId,160);if(!id)throw new Error('subgoal id required');return 'agent/'+id;}
function derive(input={}){
 const issue=input.issue&&typeof input.issue==='object'?input.issue:{};
 const subgoalId=clean(issue.subgoal_id||issue.subgoalId||input.subgoal_id||input.subgoalId,160);
 const mainSha=requireShaIfPresent(input.mainSha,'main'),baseSha=requireShaIfPresent(input.baseSha,'base'),headSha=requireShaIfPresent(input.headSha,'head');
 const branchObj=input.branch&&typeof input.branch==='object'?input.branch:null;
 const branch=clean(typeof input.branch==='string'?input.branch:(branchObj?.name||branchObj?.ref),240);
 const expected=subgoalId?branchFor(subgoalId):'';
 const branchEvidence=branchObj?branchObj.exists===true:false;
 const claimExists=Boolean(expected&&((branchEvidence&&branch===expected)||(input.claimBranchExists===true&&(!branch||branch===expected))));
 const pr=input.pr&&typeof input.pr==='object'?input.pr:null;
 const checks=arr(input.checks),required=checks.filter(x=>x&&x.required!==false);
 const checksFailed=required.some(x=>['FAILURE','FAILED','ERROR','CANCELLED','TIMED_OUT'].includes(clean(x.conclusion||x.status,40).toUpperCase()));
 const checksPending=required.some(x=>!['SUCCESS','PASSED','NEUTRAL','SKIPPED'].includes(clean(x.conclusion||x.status,40).toUpperCase()));
 const merged=Boolean(pr&&Number(pr.number)>0&&(pr.merged===true||pr.merged_at)),issueClosed=clean(issue.state,40).toUpperCase()==='CLOSED';
 const compare=input.compare&&typeof input.compare==='object'?input.compare:{};
 const aheadBy=Number.isFinite(Number(compare.ahead_by))?Number(compare.ahead_by):null;
 const behindBy=Number.isFinite(Number(compare.behind_by))?Number(compare.behind_by):null;
 const behindMain=behindBy!==null?behindBy>0:Boolean(mainSha&&baseSha&&mainSha!==baseSha);
 const rebaseRequired=input.rebaseRequired===true,baseMatchesMain=Boolean(mainSha&&baseSha&&mainSha===baseSha);
 let state='AVAILABLE';
 if(input.superseded===true)state='SUPERSEDED';
 else if(input.blocked===true)state='BLOCKED';
 else if(input.failed===true||checksFailed)state='FAILED';
 else if(merged&&issueClosed)state='COMPLETED';
 else if(merged)state='MERGED';
 else if(rebaseRequired)state='REBASE_REQUIRED';
 else if(pr&&clean(pr.state,40).toUpperCase()==='OPEN'&&required.length===0)state='PR_OPEN';
 else if(pr&&clean(pr.state,40).toUpperCase()==='OPEN'&&!checksPending)state='READY';
 else if(pr&&clean(pr.state,40).toUpperCase()==='OPEN'&&checksPending)state='VERIFYING';
 else if(pr&&clean(pr.state,40).toUpperCase()==='OPEN')state='PR_OPEN';
 else if(claimExists&&headSha&&baseSha&&headSha!==baseSha)state='ACTIVE';
 else if(claimExists)state='CLAIMED';
 return freeze({schema:SCHEMA,state,issue:Object.freeze({number:Number(issue.number)||null,subgoal_id:subgoalId||null,state:clean(issue.state,40)||null}),git:Object.freeze({mainSha,baseSha,headSha,branch:branch||null,expectedClaimBranch:expected||null,claimExists,behindMain,behindBy,aheadBy,baseMatchesMain,rebaseRequired}),pr:pr?Object.freeze({number:Number(pr.number)||null,state:clean(pr.state,40)||null,merged,draft:pr.draft===true}):null,checks:Object.freeze({required:required.length,pending:checksPending,failed:checksFailed}),authority:Object.freeze({durableTruth:'github',claim:'git-branch-ref',baseline:'git-main-sha',merge:'github-pr-merge',localProjectionOnly:true,aiMayDerive:true,aiMaySet:false})});
}
g.TitanCodeManagerGitHubState=freeze({SCHEMA,LIFECYCLE,branchFor,derive});
})(typeof globalThis!=='undefined'?globalThis:this);
