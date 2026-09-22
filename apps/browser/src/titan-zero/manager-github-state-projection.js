(function(g){'use strict';
const SCHEMA='titan-code.manager.github-state-projection.v1';
const LIFECYCLE=Object.freeze(['AVAILABLE','CLAIMED','ACTIVE','VERIFYING','READY','PR_OPEN','MERGED','COMPLETED','BLOCKED','FAILED','SUPERSEDED','REBASE_REQUIRED']);
function freeze(v){if(!v||typeof v!=='object'||Object.isFrozen(v))return v;Object.freeze(v);for(const k of Object.keys(v))freeze(v[k]);return v;}
function text(v){return String(v==null?'':v).trim();}
function sha(v){const s=text(v).toLowerCase();return /^[a-f0-9]{40}$/.test(s)?s:null;}
function branchFor(subgoalId){const id=text(subgoalId);if(!id)throw new Error('subgoal id required');return 'agent/'+id;}
function derive(input={}){
 const issue=input.issue||{}, branch=input.branch||null, pr=input.pr||null, checks=Array.isArray(input.checks)?input.checks:[], mainSha=sha(input.mainSha), baseSha=sha(input.baseSha||branch?.baseSha), headSha=sha(input.headSha||branch?.headSha||pr?.headSha);
 if(!mainSha)throw new Error('valid GitHub main SHA required');
 const issueOpen=String(issue.state||'').toLowerCase()==='open';
 const issueClosed=String(issue.state||'').toLowerCase()==='closed';
 const superseded=issue.superseded===true;
 const branchExists=Boolean(branch&&branch.exists!==false);
 const prOpen=Boolean(pr&&String(pr.state||'').toLowerCase()==='open');
 const merged=Boolean(pr&&pr.merged===true);
 const failing=checks.some(c=>['failure','failed','cancelled','timed_out','action_required'].includes(String(c?.conclusion||c?.status||'').toLowerCase()));
 const pending=checks.some(c=>['queued','pending','in_progress','requested','waiting'].includes(String(c?.status||c?.conclusion||'').toLowerCase()));
 const required=checks.filter(c=>c?.required!==false);
 const checksReady=required.length>0&&required.every(c=>['success','neutral','skipped'].includes(String(c?.conclusion||'').toLowerCase()));
 const behindMain=Boolean(branchExists&&baseSha&&baseSha!==mainSha&&(input.behindMain===true||input.diverged===true));
 let state='AVAILABLE';
 if(superseded)state='SUPERSEDED';
 else if(merged&&issueClosed)state='COMPLETED';
 else if(merged)state='MERGED';
 else if(failing)state='FAILED';
 else if(behindMain&&input.rebaseRequired===true)state='REBASE_REQUIRED';
 else if(prOpen&&checksReady)state='READY';
 else if(prOpen&&pending)state='VERIFYING';
 else if(prOpen)state='PR_OPEN';
 else if(branchExists&&headSha&&baseSha&&headSha!==baseSha)state='ACTIVE';
 else if(branchExists)state='CLAIMED';
 else if(!issueOpen)state='BLOCKED';
 return freeze({schema:SCHEMA,state,issueNumber:Number(issue.number)||null,subgoalId:text(input.subgoalId||issue.subgoalId)||null,claimBranch:branchFor(input.subgoalId||issue.subgoalId),mainSha,baseSha,headSha,issueOpen,branchExists,prOpen,merged,checksReady,failingChecks:failing,behindMain,authority:'github',authoritativeFacts:Object.freeze(['issue','branch','commit_sha','checks','pull_request','merge']),localRevisionAuthority:false,generationAuthority:false,aiAuthority:false});
}
g.TitanCodeManagerGitHubStateProjection=freeze({SCHEMA,LIFECYCLE,branchFor,derive});
})(typeof globalThis!=='undefined'?globalThis:this);
