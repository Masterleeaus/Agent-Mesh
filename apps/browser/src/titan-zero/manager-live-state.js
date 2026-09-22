(function(g){'use strict';
const SCHEMA='titan-zero.manager.live-state.v3';
function freeze(v){if(!v||typeof v!=='object'||Object.isFrozen(v))return v;Object.freeze(v);for(const k of Object.keys(v))freeze(v[k]);return v;}
function githubFacts(input={}){return input.github||input.agentMesh||null;}
function reconcileGithub(facts={}){
 const drift=[],G=g.TitanCodeManagerGitHubState;
 if(!G||typeof G.derive!=='function')return freeze({schema:SCHEMA,source:'github',status:'STATE_DRIFT_DETECTED',drift:['github-state-projector-unavailable'],failClosed:true,lifecycle:null,authority:{durableTruth:'github',localProjectionOnly:true}});
 let projected;
 try{
  projected=G.derive({issue:facts.issue,mainSha:facts.git?.mainSha||facts.mainSha,baseSha:facts.claim?.baseSha||facts.git?.baseSha||facts.baseSha,headSha:facts.git?.headSha||facts.claim?.headSha||facts.headSha,branch:facts.claim?.branch||facts.branch,claimBranchExists:facts.claim?.exists===true||facts.claimBranchExists===true,pr:facts.pullRequest||facts.pr,checks:Array.isArray(facts.checks)?facts.checks:(facts.checks?.items||[]),compare:facts.compare,rebaseRequired:facts.lifecycle==='REBASE_REQUIRED'||facts.rebaseRequired,blocked:facts.lifecycle==='BLOCKED',failed:facts.lifecycle==='FAILED',superseded:facts.lifecycle==='SUPERSEDED'});
 }catch(error){
  return freeze({schema:SCHEMA,source:'github',status:'STATE_DRIFT_DETECTED',drift:['invalid-github-state-evidence'],error:String(error?.message||error).slice(0,300),failClosed:true,lifecycle:null,authority:{durableTruth:'github',localProjectionOnly:true}});
 }
 const expected=projected.git.expectedClaimBranch,pr=facts.pullRequest||facts.pr||null;
 if((facts.claim?.exists===true||facts.claimBranchExists===true)&&!projected.git.claimExists)drift.push('claim-branch-authority-mismatch');
 if(facts.claim?.branch&&expected&&facts.claim.branch!==expected)drift.push('claim-branch-noncanonical');
 if(pr?.headBranch&&projected.git.branch&&pr.headBranch!==projected.git.branch)drift.push('pr-head-branch-mismatch');
 if(pr?.baseBranch&&pr.baseBranch!=='main')drift.push('pr-base-not-main');
 if(pr?.headSha&&projected.git.headSha&&String(pr.headSha).toLowerCase()!==projected.git.headSha)drift.push('pr-head-sha-moved');
 if(String(facts.issue?.state||'').toUpperCase()==='CLOSED'&&!projected.pr?.merged)drift.push('issue-closed-without-merged-pr');
 if(facts.lifecycle&&facts.lifecycle!==projected.state)drift.push('projected-lifecycle-drift');
 return freeze({schema:SCHEMA,source:'github',status:drift.length?'STATE_DRIFT_DETECTED':'CONSISTENT',drift:[...new Set(drift)],failClosed:drift.length>0,lifecycle:projected.state,github:projected,authority:{durableTruth:'github',claim:'git-branch-ref',merge:'github-pr-merge',localProjectionOnly:true,aiMaySet:false}});
}
function reconcileLegacy(input={}){const drift=[];const p=input.packet||{},c=input.claim||{},a=input.agent||{};if(p.packet_id&&c.packet&&p.packet_id!==c.packet)drift.push('packet-claim-id-mismatch');if(c.packet&&a.current_work_packet&&c.packet!==a.current_work_packet)drift.push('claim-agent-packet-mismatch');if(p.status==='AVAILABLE'&&['ACTIVE','CLAIMED'].includes(c.status))drift.push('packet-claims-state-drift');if(c.status==='ACTIVE'&&a.status&&a.status!=='ACTIVE')drift.push('claim-agent-status-drift');return freeze({schema:SCHEMA,source:'legacy-projection',status:drift.length?'STATE_DRIFT_DETECTED':'CONSISTENT',drift,failClosed:true,lifecycle:null,authority:{durableTruth:'legacy-compatibility-only',localProjectionOnly:true,mayClaim:false,mayUnlockDependency:false,mayComplete:false,mayRequestMerge:false}});}
function reconcile(input={}){const facts=githubFacts(input);if(facts)return reconcileGithub(facts);if(input.compatibilityMode===true)return reconcileLegacy(input);return freeze({schema:SCHEMA,source:'unavailable',status:'GITHUB_STATE_REQUIRED',drift:['github-state-required'],failClosed:true,lifecycle:null,authority:{durableTruth:'github',localProjectionOnly:true,mayClaim:false,mayUnlockDependency:false,mayComplete:false,mayRequestMerge:false}});}
g.TitanZeroManagerLiveState=freeze({SCHEMA,reconcile,reconcileGithub,reconcileLegacy,legacyMigrationOnly:true});
})(typeof globalThis!=='undefined'?globalThis:this);
