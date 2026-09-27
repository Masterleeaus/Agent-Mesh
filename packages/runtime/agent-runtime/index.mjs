import { randomUUID } from 'node:crypto';

export const RUN_STATES=Object.freeze(['QUEUED','RUNNING','WAITING_TOOL','WAITING_AGENT','WAITING_USER','WAITING_APPROVAL','WAITING_EXTERNAL','SUSPENDED','COMPLETED','FAILED','CANCELLED']);
const TERMINAL=new Set(['COMPLETED','FAILED','CANCELLED']);
const TRANSITIONS=Object.freeze({
 QUEUED:['RUNNING','CANCELLED'], RUNNING:['WAITING_TOOL','WAITING_AGENT','WAITING_USER','WAITING_APPROVAL','WAITING_EXTERNAL','SUSPENDED','COMPLETED','FAILED','CANCELLED'],
 WAITING_TOOL:['RUNNING','WAITING_APPROVAL','FAILED','CANCELLED'], WAITING_AGENT:['RUNNING','FAILED','CANCELLED'], WAITING_USER:['RUNNING','CANCELLED'], WAITING_APPROVAL:['RUNNING','FAILED','CANCELLED'], WAITING_EXTERNAL:['RUNNING','FAILED','CANCELLED'], SUSPENDED:['RUNNING','CANCELLED'], COMPLETED:[], FAILED:[], CANCELLED:[]
});
const required=(v,code)=>{const s=String(v??'').trim();if(!s)throw new Error(code);return s;};
export function normalizeCompanyId(input){
 const company_id=input?.company_id??input?.tenant_company_id??input?.tenant_id;
 const id=required(company_id,'runtime-company-id-required');
 if(input?.company_id&&input?.tenant_company_id&&String(input.company_id)!==String(input.tenant_company_id))throw new Error('runtime-company-id-conflict');
 if(input?.company_id&&input?.tenant_id&&String(input.company_id)!==String(input.tenant_id))throw new Error('runtime-company-id-conflict');
 return id;
}
export function assertTransition(from,to){if(!RUN_STATES.includes(to))throw new Error(`runtime-state-invalid:${to}`);if(!TRANSITIONS[from]?.includes(to))throw new Error(`runtime-transition-invalid:${from}->${to}`);return true;}
export class InMemoryRunStore {
 #runs=new Map();
 async create(run){if(this.#runs.has(run.run_id))throw new Error('runtime-run-exists');this.#runs.set(run.run_id,structuredClone(run));return this.get(run.company_id,run.run_id);}
 async get(company_id,run_id){const r=this.#runs.get(run_id);if(!r||r.company_id!==company_id)return null;return structuredClone(r);}
 async save(run){const current=this.#runs.get(run.run_id);if(current&&current.company_id!==run.company_id)throw new Error('runtime-company-boundary');this.#runs.set(run.run_id,structuredClone(run));return structuredClone(run);}
 async recoverable(){return [...this.#runs.values()].filter(r=>!TERMINAL.has(r.state)).map(structuredClone);}
}
export class RuntimeEventBus {
 #listeners=new Set();
 subscribe(listener){this.#listeners.add(listener);return()=>this.#listeners.delete(listener);}
 emit(event){for(const listener of this.#listeners)listener(structuredClone(event));}
}
export class TitanAgentRuntime {
 constructor({store,modelRouter,capabilities,authorityGateway,contextProvider,eventBus,clock=()=>new Date(),maxTurns=24}={}){
  if(!store||!modelRouter)throw new Error('runtime-store-and-model-router-required');this.store=store;this.modelRouter=modelRouter;this.capabilities=capabilities;this.authorityGateway=authorityGateway;this.contextProvider=contextProvider;this.events=eventBus??new RuntimeEventBus();this.clock=clock;this.maxTurns=maxTurns;
 }
 #event(run,type,data={}){const event={event_id:randomUUID(),type,at:this.clock().toISOString(),company_id:run.company_id,run_id:run.run_id,conversation_id:run.conversation_id,agent_id:run.agent_id,...data};this.events.emit(event);return event;}
 async #transition(run,to,detail={}){assertTransition(run.state,to);run.state=to;run.updated_at=this.clock().toISOString();run.wait=detail.wait??null;run.error=detail.error??null;await this.store.save(run);this.#event(run,to.startsWith('WAITING_')?'agent.waiting':to==='RUNNING'?'agent.resumed':to==='COMPLETED'?'run.completed':to==='FAILED'?'run.failed':to==='CANCELLED'?'run.cancelled':'run.state',{state:to,wait:run.wait,error:run.error});return run;}
 async start(input){const company_id=normalizeCompanyId(input);const now=this.clock().toISOString();const run={run_id:input.run_id??randomUUID(),company_id,actor_id:required(input.actor_id,'runtime-actor-id-required'),agent_id:required(input.agent_id,'runtime-agent-id-required'),role:String(input.role??'agent'),conversation_id:required(input.conversation_id??input.session_id,'runtime-conversation-id-required'),work_id:input.work_id??null,authority_context:input.authority_context??null,capability_context:input.capability_context??null,state:'QUEUED',messages:[...(input.messages??[])],turn:0,created_at:now,updated_at:now,wait:null,error:null,result:null};await this.store.create(run);this.#event(run,'run.started',{state:'QUEUED'});return this.#drive(run);}
 async resume({company_id,run_id,input}){const run=await this.store.get(company_id,run_id);if(!run)throw new Error('runtime-run-not-found');if(TERMINAL.has(run.state))throw new Error('runtime-run-terminal');if(input)run.messages.push(input);await this.#transition(run,'RUNNING');return this.#drive(run,true);}
 async cancel({company_id,run_id,reason='cancelled-by-user'}){const run=await this.store.get(company_id,run_id);if(!run)throw new Error('runtime-run-not-found');if(TERMINAL.has(run.state))return run;return this.#transition(run,'CANCELLED',{error:{code:'cancelled',message:reason}});}
 async #drive(run,alreadyRunning=false){if(!alreadyRunning)await this.#transition(run,'RUNNING');try{
  while(run.state==='RUNNING'){
   if(run.turn++>=this.maxTurns)throw new Error('runtime-turn-limit');
   const context=await this.contextProvider?.load?.({company_id:run.company_id,actor_id:run.actor_id,agent_id:run.agent_id,conversation_id:run.conversation_id,work_id:run.work_id})??{};
   this.#event(run,'reasoning.status',{status:'working'});
   const response=await this.modelRouter.next({identity:{company_id:run.company_id,actor_id:run.actor_id,agent_id:run.agent_id,role:run.role,run_id:run.run_id,conversation_id:run.conversation_id,work_id:run.work_id},messages:run.messages,context,capability_context:run.capability_context});
   if(response?.delta)this.#event(run,'message.delta',{delta:response.delta});
   if(response?.final!=null){run.result=response.final;run.messages.push({role:'assistant',content:response.final});return this.#transition(run,'COMPLETED');}
   if(response?.wait){const state=response.wait.state??'WAITING_EXTERNAL';if(!state.startsWith('WAITING_')&&state!=='SUSPENDED')throw new Error('runtime-wait-state-invalid');return this.#transition(run,state,{wait:response.wait});}
   const calls=Array.isArray(response?.tool_calls)?response.tool_calls:[];if(!calls.length)throw new Error('runtime-model-response-empty');
   for(const call of calls){this.#event(run,'tool.requested',{tool_call_id:call.id,capability:call.name});await this.#transition(run,'WAITING_TOOL',{wait:{tool_call_id:call.id,capability:call.name}});
    const capability=await this.capabilities?.resolve?.({company_id:run.company_id,name:call.name,agent_id:run.agent_id});if(!capability){await this.#transition(run,'RUNNING');throw new Error(`runtime-tool-unavailable:${call.name}`);}
    const decision=await this.authorityGateway?.authorize?.({company_id:run.company_id,actor_id:run.actor_id,agent_id:run.agent_id,run_id:run.run_id,conversation_id:run.conversation_id,capability:call.name,input:call.arguments,authority_context:run.authority_context});
    if(!decision||decision.status==='denied'){await this.#transition(run,'RUNNING');run.messages.push({role:'tool',tool_call_id:call.id,name:call.name,error:'authority-denied'});continue;}
    if(decision.status==='approval_required'){this.#event(run,'approval.required',{tool_call_id:call.id,capability:call.name,decision_id:decision.decision_id});return this.#transition(run,'WAITING_APPROVAL',{wait:{tool_call:call,decision}});}
    this.#event(run,'tool.started',{tool_call_id:call.id,capability:call.name});const result=await this.authorityGateway.execute({decision,capability,input:call.arguments,idempotency_key:call.id??`${run.run_id}:${run.turn}:${call.name}`});this.#event(run,'tool.completed',{tool_call_id:call.id,capability:call.name,evidence_ref:result?.evidence_ref??null});run.messages.push({role:'tool',tool_call_id:call.id,name:call.name,content:result?.output??result});await this.#transition(run,'RUNNING');
   }
  }
 }catch(error){if(run.state!=='RUNNING'){if(run.state==='WAITING_TOOL')await this.#transition(run,'RUNNING');}if(!TERMINAL.has(run.state))await this.#transition(run,'FAILED',{error:{code:error?.code??'runtime-failure',message:String(error?.message??error)}});return run;}}
 async recover(){const runs=await this.store.recoverable();return runs.map(r=>({company_id:r.company_id,run_id:r.run_id,state:r.state,wait:r.wait}));}
}
