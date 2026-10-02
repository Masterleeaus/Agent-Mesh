const STATES=Object.freeze(['DRAFT','BUILT','VERIFIED','ACTIVE','ROLLED_BACK','FAILED']);
const LEGACY_KEYS=new Set(['tenant_id','tenant_company_id','tenant_company','account_id']);
const text=(value,field)=>{const output=String(value??'').trim();if(!output)throw new TypeError(`${field}-required`);return output};
const refs=value=>Object.freeze([...new Set((Array.isArray(value)?value:[]).map((item,index)=>text(item,`release-evidence-${index}`)))]);
function rejectLegacy(value,path='release'){
 if(!value||typeof value!=='object')return;
 if(Array.isArray(value)){value.forEach((item,index)=>rejectLegacy(item,`${path}[${index}]`));return;}
 for(const [key,nested] of Object.entries(value)){if(LEGACY_KEYS.has(key))throw new TypeError(`legacy-release-boundary:${path}.${key}`);rejectLegacy(nested,`${path}.${key}`);}
}
function evidence(input,state){
 const evidence_refs=refs(input.evidence_refs);
 if(['VERIFIED','ACTIVE','ROLLED_BACK'].includes(state)&&!evidence_refs.length)throw new TypeError(`release-${state.toLowerCase()}-evidence-required`);
 return evidence_refs;
}
export function createReleaseLifecycle(input={}){
 rejectLegacy(input);
 return Object.freeze({
  schema:'titan.deployment.release-lifecycle.v1',
  release_id:text(input.release_id,'release-id'),
  version:text(input.version,'release-version'),
  artifact_digest:text(input.artifact_digest,'release-artifact-digest'),
  company_id:input.company_id?text(input.company_id,'release-company-id'):null,
  previous_known_good:input.previous_known_good?text(input.previous_known_good,'release-previous-known-good'):null,
  state:'DRAFT',
  revision:0,
  events:Object.freeze([]),
  authority_effect:false,
  grants_authority:false,
 });
}
export function transitionReleaseLifecycle(current,input={}){
 rejectLegacy(input);
 if(!current||current.schema!=='titan.deployment.release-lifecycle.v1')throw new TypeError('release-lifecycle-required');
 if(input.company_id&&current.company_id!==text(input.company_id,'release-company-id'))throw new TypeError('release-cross-company');
 const next=text(input.state,'release-next-state');
 const idempotency_key=text(input.idempotency_key,'release-idempotency-key');
 const existing=current.events.find(event=>event.idempotency_key===idempotency_key);
 if(existing){if(existing.state!==next)throw new TypeError('release-idempotency-conflict');return current;}
 if(next==='ACTIVE'&&current.state!=='VERIFIED')throw new TypeError('release-build-before-switch-required');
 const priorIndex=STATES.indexOf(current.state);
 if(STATES.indexOf(next)!==priorIndex+1&&!(current.state==='ACTIVE'&&next==='ROLLED_BACK'))throw new TypeError('release-transition-invalid');
 if(next==='ROLLED_BACK'&&!current.previous_known_good)throw new TypeError('release-previous-known-good-required');
 const evidence_refs=evidence(input,next);
 const event=Object.freeze({
  event_id:text(input.event_id||`${current.release_id}:${current.revision+1}`,'release-event-id'),
  idempotency_key,state:next,evidence_refs,
  occurred_at:text(input.occurred_at||new Date().toISOString(),'release-event-time'),
 });
 return Object.freeze({...current,state:next,revision:current.revision+1,events:Object.freeze([...current.events,event])});
}
export function summarizeReleaseLifecycle(current={}){
 return Object.freeze({release_id:current.release_id,version:current.version,state:current.state,revision:Number(current.revision||0),previous_known_good:current.previous_known_good??null,authority_effect:false});
}
