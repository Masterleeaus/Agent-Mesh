(function(g){'use strict';
const SCHEMA='titan-zero.manager.live-state.v2';
const GITHUB_LIFECYCLE=Object.freeze(['AVAILABLE','CLAIMED','ACTIVE','VERIFYING','READY','PR_OPEN','MERGED','COMPLETED','BLOCKED','FAILED','SUPERSEDED','REBASE_REQUIRED']);
function freeze(v){if(!v||typeof v!=='object'||Object.isFrozen(v))return v;Object.freeze(v);for(const k of Object.keys(v))freeze(v[k]);return v;}
function githubFacts(input={}){return input.github||input.agentMesh||null;}
function reconcileGithub(facts){
 const drift=[];const issue=facts.issue||{},claim=facts.claim||{},git=facts.git||{},pr=facts.pullRequest||facts.pr||{},checks=facts.checks||{};
 if(!issue.number)drift.push('github-issue-missing');
 if(claim.branch&&facts.subgoal_id&&claim.branch!==`agent/${facts.subgoal_id}`)drift.push('claim-branch-noncanonical');
 if(claim.branch&&!claim.exists)drift.push('claim-branch-missing');
 if(claim.exists&&!claim.baseSha)drift.push('claim-base-sha-missing');
 if(git.headSha&&claim.headSha&&git.headSha!==claim.headSha)drift.push('head-sha-drift');
 if(pr.number&&pr.headBranch&&claim.branch&&pr.headBranch!==claim.branch)drift.push('pr-head-branch-mismatch');
 if(pr.number&&pr.baseBranch&&pr.baseBranch!=='main')drift.push('pr-base-not-main');
 if(pr.number&&pr.headSha&&git.headSha&&pr.headSha!==git.headSha)drift.push('pr-head-sha-moved');
 if(issue.state==='CLOSED'&&!pr.merged)drift.push('issue-closed-without-merged-pr');
 if(Number(git.behindBy||0)>0&&facts.lifecycle&&!['MERGED','COMPLETED','SUPERSEDED'].includes(facts.lifecycle))drift.push('branch-behind-main');
 if(checks.failed>0)drift.push('checks-failed');
 const failClosed=drift.some(x=>!['branch-behind-main','checks-failed'].includes(x));
 return freeze({schema:SCHEMA,source:'github',status:drift.length?'STATE_DRIFT_DETECTED':'CONSISTENT',drift,failClosed,lifecycle:GITHUB_LIFECYCLE.includes(facts.lifecycle)?facts.lifecycle:null});
}
function reconcileLegacy(input={}){const drift=[];const p=input.packet||{},c=input.claim||{},a=input.agent||{};if(p.packet_id&&c.packet&&p.packet_id!==c.packet)drift.push('packet-claim-id-mismatch');if(c.packet&&a.current_work_packet&&c.packet!==a.current_work_packet)drift.push('claim-agent-packet-mismatch');if(p.status==='AVAILABLE'&&['ACTIVE','CLAIMED'].includes(c.status))drift.push('packet-claims-state-drift');if(c.status==='ACTIVE'&&a.status&&a.status!=='ACTIVE')drift.push('claim-agent-status-drift');return freeze({schema:SCHEMA,source:'legacy-projection',status:drift.length?'STATE_DRIFT_DETECTED':'CONSISTENT',drift,failClosed:drift.length>0,lifecycle:null});}
function reconcile(input={}){const facts=githubFacts(input);return facts?reconcileGithub(facts):reconcileLegacy(input);}
g.TitanZeroManagerLiveState=freeze({SCHEMA,GITHUB_LIFECYCLE,reconcile,reconcileGithub,reconcileLegacy});
})(typeof globalThis!=='undefined'?globalThis:this);
