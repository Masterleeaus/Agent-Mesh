(function(g){'use strict';
const SCHEMA='titan-code.agent-mesh-continuation.v1';
const RECEIPT_SCHEMA='titan-code.agent-mesh-takeover-receipt.v1';
function freeze(v){if(!v||typeof v!=='object'||Object.isFrozen(v))return v;Object.freeze(v);for(const k of Object.keys(v))freeze(v[k]);return v;}
function clean(v,n=2000){return String(v==null?'':v).trim().slice(0,n);}
function list(v,n=100){return (Array.isArray(v)?v:[]).slice(0,n).map(x=>clean(x));}
function checkpoint(input={}){
 const sid=clean(input.subgoal_id,160);if(!sid)throw new Error('subgoal_id required');
 const branch=clean(input.claim_branch,240)||'agent/'+sid;
 if(branch!=='agent/'+sid)throw new Error('canonical claim branch required');
 return freeze({schema:SCHEMA,issue_number:Number(input.issue_number)||null,subgoal_id:sid,claim_branch:branch,objective:clean(input.objective,8000),base_sha:clean(input.base_sha,64)||null,head_sha:clean(input.head_sha,64)||null,main_sha:clean(input.main_sha,64)||null,current_pass:input.current_pass==null?null:Number(input.current_pass),completed:list(input.completed),current_work:list(input.current_work),next_actions:list(input.next_actions),decisions:list(input.decisions),blockers:list(input.blockers),verification:list(input.verification),do_not_repeat:list(input.do_not_repeat),checkpoint_reason:clean(input.checkpoint_reason,120)||'progress',checkpointed_at:clean(input.checkpointed_at,80)||new Date().toISOString(),authority:freeze({durableTruth:'github',claim:'git-branch-ref',conversation:'disposable',localState:'projection-only',mayReleaseClaim:false,mayMerge:false})});
}
function takeover(input={}){
 const before=checkpoint(input.checkpoint||input);
 const from=clean(input.from_execution_session,240)||null,to=clean(input.to_execution_session,240)||null;
 if(!to)throw new Error('to_execution_session required');
 return freeze({schema:RECEIPT_SCHEMA,issue_number:before.issue_number,subgoal_id:before.subgoal_id,claim_branch:before.claim_branch,from_execution_session:from,to_execution_session:to,reason:clean(input.reason,120)||'SESSION_REPLACED',previous_head_sha:before.head_sha,takeover_head_sha:clean(input.takeover_head_sha,64)||before.head_sha,resume_pass:before.current_pass,uncommitted_work:clean(input.uncommitted_work,2000)||'UNKNOWN_VERIFY_BEFORE_CONTINUING',verification:before.verification,taken_over_at:clean(input.taken_over_at,80)||new Date().toISOString(),authority:freeze({sameClaimBranchRequired:true,claimReleased:false,durableTruth:'github',mayMerge:false})});
}
function resumeInstructions(cp={}){
 const c=checkpoint(cp);return freeze({schema:'titan-code.agent-mesh-resume.v1',issue_number:c.issue_number,subgoal_id:c.subgoal_id,claim_branch:c.claim_branch,instructions:['Read AGENTS.md and the linked issue.','Fetch current main SHA, canonical claim ref/head, open PR and checks.','Reconcile those GitHub facts with this checkpoint; GitHub wins on disagreement.','Verify any uncommitted/local work before reuse.','Resume current_pass/current_work; do not repeat completed work.'],current_pass:c.current_pass,current_work:c.current_work,next_actions:c.next_actions,do_not_repeat:c.do_not_repeat,authority:c.authority});
}
g.TitanCodeAgentMeshContinuation=freeze({SCHEMA,RECEIPT_SCHEMA,checkpoint,takeover,resumeInstructions});
})(typeof globalThis!=='undefined'?globalThis:this);
