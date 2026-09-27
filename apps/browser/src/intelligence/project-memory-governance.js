(function attachProjectMemoryGovernance(global){
'use strict';
const SCHEMA='titan-code-project-memory-governance/v1';
const DECISION_SCHEMA='titan-code-project-memory-decision/v1';
const PROMOTED_SCHEMA='titan-code-project-memory-record/v1';
const ALLOWED_AUTHORITY_TYPES=Object.freeze(['human','system-policy']);
function fail(code,message,details){const e=new Error(message);e.code=code;if(details!==undefined)e.details=details;return e;}
function stableHash(input){let h=2166136261;const s=String(input);for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return (h>>>0).toString(16).padStart(8,'0');}
function advisoryAuthority(){return {advisory_only:true,authority:false,canonical:false,mutation_authorized:false,plan_advance:false,promotion_authority:false};}
function normalizeAuthority(input){
 if(!input||typeof input!=='object')throw fail('ERR_PROJECT_MEMORY_AUTHORITY_REQUIRED','Memory decision requires explicit authority context');
 const type=String(input.type||input.authority_type||'').trim();
 if(!ALLOWED_AUTHORITY_TYPES.includes(type))throw fail('ERR_PROJECT_MEMORY_AUTHORITY_TYPE','Memory authority must be human or system-policy',{type});
 if(input.authorized!==true)throw fail('ERR_PROJECT_MEMORY_AUTHORITY_DENIED','Memory decision authority is not authorized');
 const actor=String(input.actor||input.actor_id||'').trim();
 if(!actor)throw fail('ERR_PROJECT_MEMORY_AUTHORITY_ACTOR','Memory decision requires an identified actor');
 const reason=String(input.reason||'').trim();
 if(!reason)throw fail('ERR_PROJECT_MEMORY_AUTHORITY_REASON','Memory decision requires a reason');
 if(type==='system-policy'){
   const policy=String(input.policy||input.policy_id||'').trim();
   if(!policy)throw fail('ERR_PROJECT_MEMORY_AUTHORITY_POLICY','System-policy decisions require a policy identifier');
   return Object.freeze({type,actor,reason:reason.slice(0,2048),policy:policy.slice(0,256),authorized:true});
 }
 return Object.freeze({type,actor,reason:reason.slice(0,2048),policy:null,authorized:true});
}
function assertCandidate(candidate){
 if(!candidate||typeof candidate!=='object'||candidate.status!=='CANDIDATE'||candidate.promotion_state!=='UNREVIEWED')throw fail('ERR_PROJECT_MEMORY_CANDIDATE_STATE','Memory decision requires an unreviewed candidate');
 if(candidate.authority===true||candidate.canonical===true||candidate.promotion_authority===true)throw fail('ERR_PROJECT_MEMORY_CANDIDATE_AUTHORITY','Candidate attempted to carry protected authority');
 return candidate;
}
function decisionId(candidateId,decision,authority){return `memory-decision:${stableHash([candidateId,decision,authority.type,authority.actor,authority.policy||''].join('\u241f'))}`;}
class ProjectMemoryGovernance{
 constructor({store,now}={}){if(!store||typeof store.get!=='function'||typeof store.remove!=='function')throw fail('ERR_PROJECT_MEMORY_STORE_REQUIRED','Project-memory governance requires a candidate store');this.store=store;this.now=typeof now==='function'?now:()=>Date.now();this.decisions=new Map();this.promoted=new Map();}
 capability(){return Object.freeze({schema:SCHEMA,allowed_authority_types:ALLOWED_AUTHORITY_TYPES.slice(),requires_explicit_authorization:true,model_can_promote:false,automatic_promotion:false,automatic_rejection:false,...advisoryAuthority()});}
 _resolveCandidate(id){const candidate=assertCandidate(this.store.get(String(id)));return candidate;}
 _record(candidate,decision,authority){const at=this.now();const id=decisionId(candidate.candidate_id,decision,authority);const record=Object.freeze({schema:DECISION_SCHEMA,decision_id:id,candidate_id:candidate.candidate_id,decision,authority_type:authority.type,actor:authority.actor,policy:authority.policy,reason:authority.reason,decided_at:at,candidate_model_derived:candidate.model_derived===true,candidate_deterministic:candidate.deterministic===true,provenance:candidate.provenance,...advisoryAuthority()});this.decisions.set(id,record);return record;}
 promote(candidateId,authorityInput){const authority=normalizeAuthority(authorityInput);const candidate=this._resolveCandidate(candidateId);const decision=this._record(candidate,'PROMOTED',authority);const memory=Object.freeze({schema:PROMOTED_SCHEMA,memory_id:`project-memory:${stableHash(candidate.candidate_id)}`,candidate_id:candidate.candidate_id,status:'PROMOTED',category:candidate.category,scope:candidate.scope,text:candidate.text,confidence:candidate.confidence,deterministic:candidate.deterministic,model_derived:candidate.model_derived,provenance:candidate.provenance,promotion:Object.freeze({decision_id:decision.decision_id,authority_type:decision.authority_type,actor:decision.actor,policy:decision.policy,reason:decision.reason,decided_at:decision.decided_at}),trusted_for_context:true,canonical:false,mutation_authorized:false,plan_advance:false,authority:false,promotion_authority:false});this.promoted.set(memory.memory_id,memory);this.store.remove(candidate.candidate_id);return memory;}
 reject(candidateId,authorityInput){const authority=normalizeAuthority(authorityInput);const candidate=this._resolveCandidate(candidateId);const decision=this._record(candidate,'REJECTED',authority);this.store.remove(candidate.candidate_id);return decision;}
 getPromoted(id){return this.promoted.get(String(id))||null;}
 listPromoted(){return Object.freeze(Array.from(this.promoted.values()));}
 listDecisions(){return Object.freeze(Array.from(this.decisions.values()));}
}
global.CodeeProjectMemoryGovernance=Object.freeze({SCHEMA,DECISION_SCHEMA,PROMOTED_SCHEMA,ALLOWED_AUTHORITY_TYPES,ProjectMemoryGovernance,normalizeAuthority,decisionId});
})(typeof globalThis!=='undefined'?globalThis:this);
