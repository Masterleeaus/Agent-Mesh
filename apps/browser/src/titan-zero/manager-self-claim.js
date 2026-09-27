(function(g){'use strict';
const SCHEMA='titan-code.manager.self-claim.v2';
function freeze(v){if(!v||typeof v!=='object'||Object.isFrozen(v))return v;Object.freeze(v);for(const k of Object.keys(v))freeze(v[k]);return v;}
const rank={P0:0,P1:1,P2:2,P3:3}; const arr=v=>Array.isArray(v)?v:[];
function issueId(x={}){return String(x.subgoal_id||x.subgoalId||x.packet_id||'').trim();}
function compatible(agent={},issue={}){const allowed=arr(issue.allowed_lanes);if(allowed.length&&!allowed.includes(agent.lane))return false;const required=arr(issue.required_capabilities),caps=new Set(arr(agent.capabilities));return !required.some(x=>!caps.has(x));}
function score(agent={},issue={}){let s=(rank[issue.priority]??99)*1000;const preferred=String(issue.owner_lane||issue.lane||'');if(preferred&&preferred!==String(agent.lane||''))s+=100;s+=Number(issue.roadmap_pass||999);return s;}
function select(agent={},issues=[],ctx={}){
 const branches=new Set(arr(ctx.claimBranches||ctx.branches).map(x=>typeof x==='string'?x:String(x?.name||x?.ref||'')).filter(Boolean));
 const openPrBranches=new Set(arr(ctx.openPRs||ctx.pullRequests).map(x=>String(x?.head?.ref||x?.head_ref||x?.branch||'')).filter(Boolean));
 const dep=ctx.dependencyState?.byPacket||ctx.dependencyState?.byIssue||{};
 const candidates=arr(issues).filter(x=>{if(!x)return false;const id=issueId(x);if(!id)return false;const open=String(x.state||x.status||'OPEN').toUpperCase();if(!['OPEN','AVAILABLE'].includes(open))return false;const branch='agent/'+id;if(branches.has(branch)||openPrBranches.has(branch))return false;if(!compatible(agent,x))return false;return !dep[id]||dep[id].eligible!==false;}).sort((a,b)=>score(agent,a)-score(agent,b)||issueId(a).localeCompare(issueId(b)));
 const selected=candidates[0]||null;
 return freeze({schema:SCHEMA,selected,candidates:candidates.map(issueId),claimBranch:selected?'agent/'+issueId(selected):null,authority:'github-branch-ref',rule:'Selection is advisory. Claim exists only after atomic creation of the exact agent/<subgoal-id> GitHub branch from the required current main SHA.'});
}
function claim(){throw new Error('LOCAL_CLAIM_FORBIDDEN atomically create the canonical agent/<subgoal-id> GitHub branch from current main SHA');}
function claimRequest(agentName,agent,issue,mainSha){const id=issueId(issue);if(!id)throw new Error('eligible issue/subgoal required');const sha=String(mainSha||'').trim().toLowerCase();if(!/^[a-f0-9]{40,64}$/.test(sha))throw new Error('current main git SHA required');return freeze({schema:SCHEMA,agent:String(agentName||''),subgoal_id:id,issue_number:Number(issue?.number)||null,branch:'agent/'+id,base_main_sha:sha,lane:String(agent?.lane||''),operation:'CREATE_GITHUB_REF_ATOMICALLY',ref:'refs/heads/agent/'+id,authority:'github-branch-ref',localMutation:false});}
g.TitanZeroManagerSelfClaim=freeze({SCHEMA,compatible,select,claim,claimRequest,authority:freeze({durableTruth:'github',claim:'git-branch-ref',selectionOnly:true})});
})(typeof globalThis!=='undefined'?globalThis:this);
