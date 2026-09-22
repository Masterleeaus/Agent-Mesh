(function(g){'use strict';
const SCHEMA='titan-zero.manager.live-state.v2';
function freeze(v){if(!v||typeof v!=='object'||Object.isFrozen(v))return v;Object.freeze(v);for(const k of Object.keys(v))freeze(v[k]);return v;}
function githubFacts(input={}){return input.github||input.agentMesh||null;}
function reconcileGithub(facts={}){
 const drift=[];const G=g.TitanCodeManagerGitHubState;
 if(!G||typeof G.derive!=='function')return freeze({schema:SCHEMA,source:'github',status:'STATE_DRIFT_DETECTED',drift:['github-state-projector-unavailable'],failClosed:true,lifecycle:null});
 const projected=G.derive({issue:facts.issue,mainSha:facts.git?.mainSha||facts.mainSha,baseSha:facts.claim?.baseSha||facts.git?.baseSha||facts.baseSha,headSha:facts.git?.headSha||facts.claim?.headSha||facts.headSha,branch:facts.claim?.branch||facts.branch,claimBranchExists:facts.claim?.exists===true||facts.claimBranchExists===true,pr:facts.pullRequest||facts.pr,checks:Array.isArray(facts.checks)?facts.checks:(facts.checks?.items||[]),compare:facts.compare,behindMain:facts.git?.behindMain,rebaseRequired:facts.lifecycle==='REBASE_REQUIRED'||facts.rebaseRequired,blocked:facts.lifecycle==='BLOCKED',failed:facts.lifecycle==='FAILED',superseded:facts.lifecycle==='SUPERSEDED'});
 const expected=projected.git.expectedClaimBranch;
 if(facts.claim?.branch&&expected&&facts.claim.branch!==expected)drift.push('claim-branch-noncanonical');
 if(facts.claim?.exists===true&&!projected.git.claimExists)drift.push('claim-branch-authority-mismatch');
 if(facts.pullRequest?.headBranch&&projected.git.branch&&facts.pullRequest.headBranch!==projected.git.branch)drift.push('pr-head-branch-mismatch');
 if(facts.pullRequest?.baseBranch&&facts.pullRequest.baseBranch!=='main')drift.push('pr-base-not-main');
 if(facts.pullRequest?.headSha&&projected.git.headSha&&facts.pullRequest.headSha!==projected.git.headSha)drift.push('pr-head-sha-moved');
 if(String(facts.issue?.state||'').toUpperCase()==='CLOSED'&&!projected.pr?.merged)drift.push('issue-closed-without-merged-pr');
 if(facts.lifecycle&&facts.lifecycle!==projected.state)drift.push('projected-lifecycle-drift');
 return freeze({schema:SCHEMA,source:'github',status:drift.length?'STATE_DRIFT_DETECTED':'CONSISTENT',drift,failClosed:drift.length>0,lifecycle:projected.state,github:projected});
}
function reconcileLegacy(input={}){const drift=[];const p=input.packet||{},c=input.claim||{},a=input.agent||{};if(p.packet_id&&c.packet&&p.packet_id!==c.packet)drift.push('packet-claim-id-mismatch');if(c.packet&&a.current_work_packet&&c.packet!==a.current_work_packet)drift.push('claim-agent-packet-mismatch');if(p.status==='AVAILABLE'&&['ACTIVE','CLAIMED'].includes(c.status))drift.push('packet-claims-state-drift');if(c.status==='ACTIVE'&&a.status&&a.status!=='ACTIVE')drift.push('claim-agent-status-drift');return freeze({schema:SCHEMA,source:'legacy-projection',status:drift.length?'STATE_DRIFT_DETECTED':'CONSISTENT',drift,failClosed:drift.length>0,lifecycle:null});}
function reconcile(input={}){const facts=githubFacts(input);return facts?reconcileGithub(facts):reconcileLegacy(input);}
g.TitanZeroManagerLiveState=freeze({SCHEMA,reconcile,reconcileGithub,reconcileLegacy});
})(typeof globalThis!=='undefined'?globalThis:this);
