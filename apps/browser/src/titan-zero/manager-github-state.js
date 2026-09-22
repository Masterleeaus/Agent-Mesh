(function(g){'use strict';
const SCHEMA='titan-code.manager.github-state.v2';
const LIFECYCLE=Object.freeze(['AVAILABLE','CLAIMED','ACTIVE','VERIFYING','READY','PR_OPEN','MERGED','COMPLETED','BLOCKED','FAILED','SUPERSEDED','REBASE_REQUIRED']);
function freeze(v){if(!v||typeof v!=='object'||Object.isFrozen(v))return v;Object.freeze(v);for(const k of Object.keys(v))freeze(v[k]);return v;}
function arr(v){return Array.isArray(v)?v:[];}
function clean(v,n=512){return String(v==null?'':v).trim().slice(0,n);}
function sha(v){const s=clean(v,64).toLowerCase();return /^[a-f0-9]{40,64}$/.test(s)?s:null;}
function requireShaIfPresent(v,label){if(v==null||v==='')return null;const out=sha(v);if(!out)throw new Error(`invalid GitHub ${label} SHA`);return out;}
function branchFor(subgoalId){const id=clean(subgoalId,160);if(!id)throw new Error('subgoal id required');return 'agent/'+id;}
function normalize(input={}){
 const issue=input.issue&&typeof input.issue==='object'?{...input.issue}:{};
 const subgoalId=clean(issue.subgoal_id||issue.subgoalId||input.subgoal_id||input.subgoalId||'',160);
 if(subgoalId)issue.subgoal_id=subgoalId;
 const branchObj=input.branch&&typeof input.branch==='object'?input.branch:null;
 const branch=typeof input.branch==='string'?clean(input.branch,240):clean(branchObj?.name||branchObj?.ref||'',240);
 const expected=subgoalId?branchFor(subgoalId):'';
 const branchEvidence=branchObj?branchObj.exists===true:false;
 const claimHint=input.claimBranchExists===true;
 const claimExists=Boolean(expected&&((branchEvidence&&branch===expected)||(claimHint&&(!branch||branch===expected))));
 return {
   issue,
   mainSha:requireShaIfPresent(input.mainSha,'main'),
   baseSha:requireShaIfPresent(input.baseSha||branchObj?.baseSha,'base'),
   headSha:requireShaIfPresent(input.headSha||branchObj?.headSha||input.pr?.headSha,'head'),
   branch:branch||null,
   expectedClaimBranch:expected||null,
   claimBranchExists:claimExists,
   pr:input.pr&&typeof input.pr==='object'?{...input.pr}:null,
   checks:arr(input.checks),
   compare:input.compare&&typeof input.compare==='object'?{...input.compare}:null,
   dependencyState:input.dependencyState&&typeof input.dependencyState==='object'?input.dependencyState:null,
   handoff:input.handoff&&typeof input.handoff==='object'?input.handoff:null,
   blocked:input.blocked===true,
   failed:input.failed===true,
   superseded:input.superseded===true,
   rebaseRequired:input.rebaseRequired===true
 };
}
function derive(input={}){
 const x=normalize(input), issue=x.issue, mainSha=x.mainSha, baseSha=x.baseSha, headSha=x.headSha;
 const branch=x.branch, expected=x.expectedClaimBranch, claimExists=x.claimBranchExists;
 const pr=x.pr, checks=x.checks, required=checks.filter(v=>v&&v.required!==false);
 const failed=required.some(v=>['FAILURE','FAILED','ERROR','CANCELLED','TIMED_OUT'].includes(clean(v.conclusion||v.status,40).toUpperCase()));
 const pending=required.some(v=>!['SUCCESS','PASSED','NEUTRAL','SKIPPED'].includes(clean(v.conclusion||v.status,40).toUpperCase()));
 const merged=Boolean(pr&&(pr.merged===true||pr.merged_at));
 const prOpen=Boolean(pr&&clean(pr.state,40).toUpperCase()==='OPEN');
 const issueClosed=clean(issue.state,40).toUpperCase()==='CLOSED';
 const compare=x.compare||{};
 const aheadBy=Number.isFinite(Number(compare.ahead_by))?Number(compare.ahead_by):null;
 const behindBy=Number.isFinite(Number(compare.behind_by))?Number(compare.behind_by):null;
 const behindMain=behindBy!==null?behindBy>0:Boolean(mainSha&&baseSha&&mainSha!==baseSha);
 const baseMatchesMain=Boolean(mainSha&&baseSha&&mainSha===baseSha);
 let state='AVAILABLE';
 if(x.superseded)state='SUPERSEDED';
 else if(x.blocked)state='BLOCKED';
 else if(x.failed||failed)state='FAILED';
 else if(merged&&issueClosed)state='COMPLETED';
 else if(merged)state='MERGED';
 else if(x.rebaseRequired)state='REBASE_REQUIRED';
 else if(prOpen&&required.length===0)state='PR_OPEN';
 else if(prOpen&&!pending)state='READY';
 else if(prOpen&&pending)state='VERIFYING';
 else if(prOpen)state='PR_OPEN';
 else if(claimExists&&headSha&&baseSha&&headSha!==baseSha)state='ACTIVE';
 else if(claimExists)state='CLAIMED';
 return freeze({
   schema:SCHEMA,
   state,
   issue:Object.freeze({
     number:Number(issue.number)||null,
     subgoal_id:clean(issue.subgoal_id,160)||null,
     state:clean(issue.state,40)||null
   }),
   git:Object.freeze({
     mainSha,baseSha,headSha,branch:branch||null,expectedClaimBranch:expected||null,
     claimExists,behindMain,behindBy,aheadBy,baseMatchesMain,rebaseRequired:x.rebaseRequired
   }),
   pr:pr?Object.freeze({
     number:Number(pr.number)||null,state:clean(pr.state,40)||null,merged,
     draft:pr.draft===true,readyForReview:pr.draft!==true
   }):null,
   checks:Object.freeze({required:required.length,pending,failed}),
   dependencyState:x.dependencyState,
   handoff:x.handoff,
   authority:Object.freeze({
     durableTruth:'github',
     claim:'git-branch-ref',
     baseline:'git-main-sha',
     merge:'github-pr-merge',
     localProjectionOnly:true,
     aiMayDerive:true,
     aiMaySet:false
   })
 });
}
g.TitanCodeManagerGitHubState=freeze({SCHEMA,LIFECYCLE,branchFor,normalize,derive});
})(typeof globalThis!=='undefined'?globalThis:this);
