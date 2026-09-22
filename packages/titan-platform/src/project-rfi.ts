const LEGACY_BOUNDARY_KEYS=new Set(['tenant_id','tenant_company_id','tenantId','tenantCompanyId','business_id','account_id','workspace_id']);
export const TITAN_PROJECT_RFI_SCHEMA='titan.business-ops.project-rfi.v1' as const;
export type RfiState='draft'|'open'|'pending_response'|'answered'|'closed'|'void';
export type RfiPriority='low'|'normal'|'high'|'critical';
export type RfiImpact='none'|'potential'|'confirmed';
const STATES=new Set<RfiState>(['draft','open','pending_response','answered','closed','void']);
const PRIORITIES=new Set<RfiPriority>(['low','normal','high','critical']);
const IMPACTS=new Set<RfiImpact>(['none','potential','confirmed']);

export interface RfiProvenance{source:string;source_ref?:string|null;recorded_at:string;idempotency_key:string;trace_id?:string|null;correlation_id?:string|null}
export interface TitanProjectRfiInput{
 rfi_id:string;company_id:string;project_id:string;work_order_id?:string|null;phase_ref?:string|null;
 subject:string;question:string;context?:string|null;reference?:string|null;
 submitted_by_ref:string;assigned_to_ref?:string|null;directed_to?:string|null;communication_thread_ref?:string|null;
 response?:string|null;responded_by_ref?:string|null;response_date?:string|null;
 state:RfiState;priority:RfiPriority;date_submitted:string;date_required?:string|null;
 cost_impact:RfiImpact;cost_impact_cents?:number|null;schedule_impact:RfiImpact;schedule_impact_days?:number|null;
 related_change_order_id?:string|null;document_refs?:string[];notes?:string|null;provenance:RfiProvenance;[key:string]:unknown;
}
function rejectLegacy(v:unknown,path='input'):void{if(!v||typeof v!=='object')return;if(Array.isArray(v)){v.forEach((x,i)=>rejectLegacy(x,`${path}[${i}]`));return;}for(const[k,x]of Object.entries(v as Record<string,unknown>)){if(LEGACY_BOUNDARY_KEYS.has(k))throw new Error(`${path}.${k} is a legacy tenant boundary; company_id is required`);rejectLegacy(x,`${path}.${k}`);}}
function req(v:unknown,l:string):string{const s=String(v??'').trim();if(!s)throw new Error(`${l} is required`);return s}
function opt(v:unknown):string|null{const s=String(v??'').trim();return s||null}
function dateOnly(v:unknown,l:string):string{const s=req(v,l);if(!/^\d{4}-\d{2}-\d{2}$/.test(s)||Number.isNaN(Date.parse(`${s}T00:00:00Z`)))throw new Error(`${l} must be an ISO date`);return s}
function dateTime(v:unknown,l:string):string{const s=req(v,l);if(Number.isNaN(Date.parse(s)))throw new Error(`${l} must be an ISO date-time`);return s}
function cents(v:unknown,l:string):number{const n=Number(v??0);if(!Number.isSafeInteger(n)||n<0)throw new Error(`${l} must be non-negative integer cents`);return n}
function days(v:unknown,l:string):number{const n=Number(v??0);if(!Number.isSafeInteger(n)||n<0)throw new Error(`${l} must be a non-negative integer`);return n}
function prov(p:RfiProvenance){return Object.freeze({source:req(p?.source,'provenance.source'),source_ref:opt(p?.source_ref),recorded_at:dateTime(p?.recorded_at,'provenance.recorded_at'),idempotency_key:req(p?.idempotency_key,'provenance.idempotency_key'),trace_id:opt(p?.trace_id),correlation_id:opt(p?.correlation_id)})}

export function deriveRfiTiming(input:{state:RfiState;date_submitted:string;date_required?:string|null;response_date?:string|null;as_of?:string}){
 if(!STATES.has(input.state))throw new Error('unsupported RFI state');
 const submitted=dateOnly(input.date_submitted,'date_submitted'), asOf=dateOnly(input.as_of??new Date().toISOString().slice(0,10),'as_of');
 const terminal=['answered','closed','void'].includes(input.state);
 const end=input.response_date?dateTime(input.response_date,'response_date').slice(0,10):asOf;
 const days_open=Math.max(0,Math.floor((Date.parse(`${end}T00:00:00Z`)-Date.parse(`${submitted}T00:00:00Z`))/86400000));
 const required=input.date_required?dateOnly(input.date_required,'date_required'):null;
 return Object.freeze({days_open,is_overdue:!terminal&&Boolean(required)&&Date.parse(`${asOf}T00:00:00Z`)>Date.parse(`${required}T00:00:00Z`)});
}

export function buildTitanProjectRfi(input:TitanProjectRfiInput,options:{as_of?:string}={}){
 rejectLegacy(input);if(!STATES.has(input.state))throw new Error('unsupported RFI state');if(!PRIORITIES.has(input.priority))throw new Error('unsupported RFI priority');
 if(!IMPACTS.has(input.cost_impact)||!IMPACTS.has(input.schedule_impact))throw new Error('unsupported RFI impact');
 const date_submitted=dateOnly(input.date_submitted,'date_submitted'),date_required=input.date_required?dateOnly(input.date_required,'date_required'):null;
 const response_date=input.response_date?dateTime(input.response_date,'response_date'):null;
 if(['answered','closed'].includes(input.state)&&!opt(input.response))throw new Error('answered or closed RFI requires a response');
 const cost_impact_cents=input.cost_impact_cents==null?null:cents(input.cost_impact_cents,'cost_impact_cents');
 const schedule_impact_days=input.schedule_impact_days==null?null:days(input.schedule_impact_days,'schedule_impact_days');
 if(input.cost_impact==='confirmed'&&cost_impact_cents==null)throw new Error('confirmed cost impact requires cost_impact_cents');
 if(input.schedule_impact==='confirmed'&&schedule_impact_days==null)throw new Error('confirmed schedule impact requires schedule_impact_days');
 const timing=deriveRfiTiming({state:input.state,date_submitted,date_required,response_date,as_of:options.as_of});
 return Object.freeze({
  schema:TITAN_PROJECT_RFI_SCHEMA,rfi_id:req(input.rfi_id,'rfi_id'),company_id:req(input.company_id,'company_id'),project_id:req(input.project_id,'project_id'),
  work_order_id:opt(input.work_order_id),phase_ref:opt(input.phase_ref),subject:req(input.subject,'subject'),question:req(input.question,'question'),context:opt(input.context),reference:opt(input.reference),
  submitted_by_ref:req(input.submitted_by_ref,'submitted_by_ref'),assigned_to_ref:opt(input.assigned_to_ref),directed_to:opt(input.directed_to),communication_thread_ref:opt(input.communication_thread_ref),
  response:opt(input.response),responded_by_ref:opt(input.responded_by_ref),response_date,state:input.state,priority:input.priority,date_submitted,date_required,
  cost_impact:input.cost_impact,cost_impact_cents,schedule_impact:input.schedule_impact,schedule_impact_days,related_change_order_id:opt(input.related_change_order_id),
  document_refs:Object.freeze([...(input.document_refs??[])].map(x=>req(x,'document_ref'))),notes:opt(input.notes),days_open:timing.days_open,is_overdue:timing.is_overdue,provenance:prov(input.provenance),
  related_change_order_is_reference_only:true as const,automatic_change_order_creation:false as const,automatic_change_order_approval:false as const,automatic_project_mutation:false as const,
  automatic_communication_send:false as const,proposal_only:true as const,requires_fresh_authority:true as const,grants_authority:false as const,execution_permitted:false as const,
 });
}
export function rfiChangeOrderRecommendation(rfi:ReturnType<typeof buildTitanProjectRfi>){
 const hasImpact=rfi.cost_impact!=='none'||rfi.schedule_impact!=='none';
 return Object.freeze({recommended:hasImpact&&!rfi.related_change_order_id,reason:hasImpact?'RFI_HAS_COST_OR_SCHEDULE_IMPACT':'NO_RECORDED_COMMERCIAL_IMPACT',
  company_id:rfi.company_id,project_id:rfi.project_id,rfi_id:rfi.rfi_id,proposal_only:true as const,create_change_order:false as const,grants_authority:false as const,execution_permitted:false as const});
}
