(function(g){'use strict';
const SCHEMA='titan-code.manager.auto-rollover.v2';
function freeze(v){if(!v||typeof v!=='object'||Object.isFrozen(v))return v;Object.freeze(v);for(const k of Object.keys(v))freeze(v[k]);return v;}
function arr(v){return Array.isArray(v)?v:[];}
function plan(agentName,agent,completedIssue,eligibleIssues=[],ctx={}){
 const C=g.TitanZeroManagerSelfClaim;if(!C)throw new Error('manager self-claim selector unavailable');
 const completedId=String(completedIssue?.subgoal_id||completedIssue?.subgoalId||completedIssue?.packet_id||'').trim();
 if(!completedId)throw new Error('completed issue/subgoal required');
 const L=g.TitanZeroManagerLifecycle;if(!L||!L.dependencySatisfied(completedIssue))throw new Error('rollover requires GitHub-backed merged/completed issue evidence');
 const pick=C.select(agent,eligibleIssues,ctx);
 return freeze({schema:SCHEMA,agent:String(agentName||''),completed_subgoal_id:completedId,next:pick.selected||null,next_claim_branch:pick.claimBranch||null,action:pick.selected?'CREATE_GITHUB_CLAIM_REF':'WAIT_FOR_ELIGIBLE_ISSUE',authority:'github-branch-ref',localMutation:false,rule:'Rollover is advisory until the exact canonical agent/<subgoal-id> ref is atomically created in GitHub.'});
}
function claimRequest(agentName,agent,rolloverPlan,mainSha){
 const C=g.TitanZeroManagerSelfClaim;if(!C)throw new Error('manager self-claim selector unavailable');
 if(!rolloverPlan?.next)throw new Error('no eligible rollover issue');
 return C.claimRequest(agentName,agent,rolloverPlan.next,mainSha);
}
function rollover(){throw new Error('LOCAL_ROLLOVER_FORBIDDEN rollover cannot mutate ledger claims or issue lifecycle; atomically create the canonical GitHub claim branch');}
g.TitanZeroManagerAutoRollover=freeze({SCHEMA,plan,claimRequest,rollover,authority:freeze({durableTruth:'github',claim:'git-branch-ref',localMutation:false})});
})(typeof globalThis!=='undefined'?globalThis:this);
