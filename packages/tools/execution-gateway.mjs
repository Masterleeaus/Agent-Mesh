import crypto from 'node:crypto';

export const EXECUTION_CLASSES = Object.freeze({ NATIVE:'native', CONNECTED:'connected', OPERATED:'operated' });
export const EXECUTION_STATES = Object.freeze({
  REQUESTED:'REQUESTED', AUTHORIZED:'AUTHORIZED', EXECUTING:'EXECUTING', PROVIDER_ACKNOWLEDGED:'PROVIDER_ACKNOWLEDGED', VERIFYING:'VERIFYING', VERIFIED:'VERIFIED',
  SUCCEEDED:'VERIFIED', FAILED:'FAILED', DENIED:'DENIED', WAITING_APPROVAL:'WAITING_APPROVAL', WAITING_USER_AUTH:'WAITING_USER_AUTH', WAITING_MFA:'WAITING_MFA',
});

export class ExecutionError extends Error { constructor(code,message,details={}) { super(message); this.name='ExecutionError'; this.code=code; this.details=details; } }

/** Canonical governed provider gateway. Provider acknowledgement is never completion. */
export class ExecutionGateway {
  constructor({ providers=[], evidenceSink=async()=>{}, idempotencyStore=null, now=()=>new Date().toISOString() }={}) {
    this.providers=new Map(); this.evidenceSink=evidenceSink; this.idempotencyStore=idempotencyStore; this.now=now; this.completed=new Map();
    for (const provider of providers) this.registerProvider(provider);
  }
  registerProvider(provider) {
    if (!provider?.id || !provider?.executionClass || typeof provider.execute!=='function') throw new ExecutionError('INVALID_PROVIDER','Provider requires id, executionClass and execute()');
    this.providers.set(provider.id,provider);
  }
  listProviders() { return [...this.providers.values()].map(({id,executionClass,capabilities=[],health})=>({id,executionClass,capabilities:[...capabilities],health:health??'unknown'})); }

  async execute(request) {
    validateRequest(request);
    if (request.authority?.status==='approval_required') return this.waiting(request,EXECUTION_STATES.WAITING_APPROVAL);
    if (request.authority?.status!=='approved') return this.denied(request,'AUTHORITY_REQUIRED');
    if (request.authority?.expires_at && Date.parse(request.authority.expires_at)<=Date.now()) return this.denied(request,'AUTHORITY_EXPIRED');
    if (request.authority?.revoked===true) return this.denied(request,'AUTHORITY_REVOKED');
    if (request.risk?.status==='denied') return this.denied(request,'RISK_DENIED');

    const key=`${request.company_id}:${request.idempotency_key}`;
    const prior=await this.getCompleted(key);
    if (prior) return {...prior,duplicate:true};

    const provider=this.selectProvider(request); const startedAt=this.now();
    await this.emitTransition(request,provider,EXECUTION_STATES.REQUESTED,{started_at:startedAt});
    await this.emitTransition(request,provider,EXECUTION_STATES.AUTHORIZED,{});
    await this.emitTransition(request,provider,EXECUTION_STATES.EXECUTING,{});
    try {
      const raw=await provider.execute(Object.freeze({...request}));
      if (raw?.state===EXECUTION_STATES.WAITING_MFA || raw?.state===EXECUTION_STATES.WAITING_USER_AUTH || raw?.state===EXECUTION_STATES.WAITING_APPROVAL) return this.record(request,provider,raw.state,raw,startedAt);
      await this.emitTransition(request,provider,EXECUTION_STATES.PROVIDER_ACKNOWLEDGED,{external_ref:raw?.external_ref??null});
      await this.emitTransition(request,provider,EXECUTION_STATES.VERIFYING,{});
      if (typeof provider.verify!=='function') throw new ExecutionError('VERIFIER_REQUIRED','Consequential completion requires an independent provider verifier');
      const verification=await provider.verify(raw,request);
      const verified=verification===true || verification?.verified===true;
      if (!verified) throw new ExecutionError('OUTCOME_UNVERIFIED','Provider interaction completed but business outcome was not independently verified');
      const payload={...raw,verification:verification===true?(raw?.verification??{verified:true}):verification};
      const result=await this.record(request,provider,EXECUTION_STATES.VERIFIED,payload,startedAt);
      await this.setCompleted(key,result); return result;
    } catch(error) {
      return this.record(request,provider,EXECUTION_STATES.FAILED,{failure:{code:error?.code??'PROVIDER_FAILURE',message:String(error?.message??error)}},startedAt);
    }
  }

  async getCompleted(key) { if (this.idempotencyStore?.get) return (await this.idempotencyStore.get(key))??null; return this.completed.get(key)??null; }
  async setCompleted(key,result) { if (this.idempotencyStore?.set) await this.idempotencyStore.set(key,result); else this.completed.set(key,result); }
  selectProvider(request) {
    const candidates=[...this.providers.values()].filter(p=>(p.capabilities??[]).includes(request.capability)&&(!p.company_id||p.company_id===request.company_id)&&p.enabled!==false);
    if (!candidates.length) throw new ExecutionError('NO_PROVIDER',`No provider for ${request.capability}`);
    const pref=request.preferred_execution_classes??[EXECUTION_CLASSES.NATIVE,EXECUTION_CLASSES.CONNECTED,EXECUTION_CLASSES.OPERATED]; candidates.sort((a,b)=>pref.indexOf(a.executionClass)-pref.indexOf(b.executionClass)); return candidates[0];
  }
  waiting(request,state) { return {execution_id:request.execution_id,company_id:request.company_id,state,capability:request.capability}; }
  denied(request,code) { return {execution_id:request.execution_id,company_id:request.company_id,state:EXECUTION_STATES.DENIED,capability:request.capability,failure:{code}}; }
  async emitTransition(request,provider,state,payload) { await this.evidenceSink(this.evidence(request,provider,state,payload,null)); }
  evidence(request,provider,state,payload,startedAt) { return {
    evidence_id:crypto.randomUUID(),execution_id:request.execution_id,company_id:request.company_id,decision_id:request.decision_id??null,work_id:request.work_id??null,run_id:request.run_id??null,agent_id:request.agent_id??null,
    capability:request.capability,provider:provider.id,execution_class:provider.executionClass,state,started_at:startedAt,finished_at:this.now(),idempotency_key:request.idempotency_key,
    request_summary:redactRequest(request),external_ref:payload?.external_ref??null,observed_result:redactObserved(payload?.result??payload?.observed_result??null),verification:payload?.verification??null,failure:payload?.failure??null,final_outcome:state===EXECUTION_STATES.VERIFIED?'verified':state===EXECUTION_STATES.FAILED?'failed':null,
  }; }
  async record(request,provider,state,payload,startedAt) { const evidence=this.evidence(request,provider,state,payload,startedAt); await this.evidenceSink(evidence); return {execution_id:request.execution_id,company_id:request.company_id,state,capability:request.capability,provider:provider.id,execution_class:provider.executionClass,evidence}; }
}

function redactRequest(request) { return {capability:request.capability,input:redactObserved(request.input??null),decision_id:request.decision_id??null,work_id:request.work_id??null,run_id:request.run_id??null}; }
function redactObserved(value) { if (value==null) return value; if (Array.isArray(value)) return value.map(redactObserved); if (typeof value!=='object') return value; const out={}; for (const [k,v] of Object.entries(value)) out[k]=/secret|token|password|credential|authorization|cookie/i.test(k)?'[REDACTED]':redactObserved(v); return out; }
function validateRequest(request) {
  for (const field of ['execution_id','company_id','capability','idempotency_key']) if (!request?.[field]) throw new ExecutionError('INVALID_REQUEST',`Missing ${field}`);
  if (request.credential && typeof request.credential!=='object') throw new ExecutionError('RAW_CREDENTIAL_FORBIDDEN','Use a credential handle, never a raw credential');
  if (request.credential?.secret||request.credential?.token||request.credential?.password) throw new ExecutionError('RAW_CREDENTIAL_FORBIDDEN','Credential handles must not contain secrets');
}
