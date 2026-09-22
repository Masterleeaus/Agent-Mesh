(function(g){'use strict';
const SCHEMA='titan-zero.manager.idle-sweep.v2';
function freeze(v){if(!v||typeof v!=='object'||Object.isFrozen(v))return v;Object.freeze(v);for(const k of Object.keys(v))freeze(v[k]);return v;}
function arr(v){return Array.isArray(v)?v:[];}
function rank(v){return ({P0:0,P1:1,P2:2,P3:3}[String(v||'').toUpperCase()]??99);}
function plan(snapshot={},opts={}){
 const Q=g.TitanZeroManagerQueueState;if(!Q)throw new Error('GitHub queue state unavailable');
 const rows=arr(snapshot.workItems||snapshot.githubItems);if(!rows.length)throw new Error('GitHub work items required');
 const available=Q.projectGithub({workItems:rows}).eligible;const byId=new Map(rows.map(x=>[String(x.subgoal_id||x.id),x]));
 const assignments=[];
 for(const agent of arr(snapshot.agents).filter(a=>a&&a.state==='AVAILABLE'&&!a.execution_active).sort((a,b)=>String(a.id).localeCompare(String(b.id)))){
   const candidate=available.map(id=>byId.get(String(id))).filter(Boolean).sort((a,b)=>rank(a.priority)-rank(b.priority)||String(a.subgoal_id||a.id).localeCompare(String(b.subgoal_id||b.id)))[0];
   if(!candidate){assignments.push({agent:agent.id,status:'NO_ELIGIBLE_GITHUB_WORK'});continue;}
   if(!opts.mainSha&&!snapshot.mainSha)throw new Error('live GitHub main SHA required for claim request');
   assignments.push({agent:agent.id,subgoal_id:candidate.subgoal_id||candidate.id,status:'CANDIDATE_ONLY',claim_request:{operation:'CREATE_GITHUB_REF_ATOMICALLY',branch:'agent/'+String(candidate.subgoal_id||candidate.id),expected_absent:true,base_main_sha:opts.mainSha||snapshot.mainSha,on_conflict:'REFRESH_GITHUB_AND_RESELECT'}});
 }
 return freeze({schema:SCHEMA,source:'github',assignments,mutatesLocalState:false,createsClaim:false,authority:{durableTruth:'github',selection:'advisory',claim:'git-branch-ref',localLedgerMutation:false,dependencyUnlock:false,lifecycleAdvance:false}});
}
function sweep(){throw new Error('LOCAL_IDLE_SWEEP_FORBIDDEN use plan() and atomic GitHub claim requests');}
g.TitanZeroManagerIdleSweep=freeze({SCHEMA,plan,sweep,authority:freeze({durableTruth:'github',localMutation:false})});
})(typeof globalThis!=='undefined'?globalThis:this);
