const LEGACY_BOUNDARY_KEYS=new Set(['tenant_id','tenant_company_id','tenantId','tenantCompanyId','business_id','account_id','workspace_id']);
export const TITAN_PROJECT_SUBMITTAL_SCHEMA='titan.business-ops.project-submittal.v1' as const;
export type SubmittalType='product_data'|'shop_drawing'|'sample'|'mock_up'|'test_report'|'certification'|'warranty_info'|'operation_manual'|'other';
export type SubmittalState='draft'|'submitted'|'under_review'|'approved'|'approved_as_noted'|'revise_and_resubmit'|'rejected'|'void';
const TYPES=new Set<SubmittalType>(['product_data','shop_drawing','sample','mock_up','test_report','certification','warranty_info','operation_manual','other']);
const STATES=new Set<SubmittalState>(['draft','submitted','under_review','approved','approved_as_noted','revise_and_resubmit','rejected','void']);
export interface SubmittalProvenance{source:string;source_ref?:string|null;recorded_at:string;idempotency_key:string;trace_id?:string|null;correlation_id?:string|null}
export interface TitanProjectSubmittalInput{
 submittal_id:string;company_id:string;project_id:string;work_order_id?:string|null;phase_ref?:string|null;title:string;description?:string|null;spec_section?:string|null;submittal_type:SubmittalType;
 manufacturer?:string|null;model_number?:string|null;product_description?:string|null;quantity?:number|null;unit_cost_cents?:number|null;alternatives_considered?:string|null;
 submitted_by_ref:string;submitted_to?:string|null;reviewer_ref?:string|null;communication_thread_ref?:string|null;
 state:SubmittalState;review_comments?:string|null;revision_number:number;previous_submittal_id?:string|null;
 date_submitted:string;date_required?:string|null;date_reviewed?:string|null;lead_time_days?:number|null;delivery_date?:string|null;
 document_refs:string[];notes?:string|null;provenance:SubmittalProvenance;[key:string]:unknown;
}
function rejectLegacy(v:unknown,path='input'):void{if(!v||typeof v!=='object')return;if(Array.isArray(v)){v.forEach((x,i)=>rejectLegacy(x,`${path}[${i}]`));return;}for(const[k,x]of Object.entries(v as Record<string,unknown>)){if(LEGACY_BOUNDARY_KEYS.has(k))throw new Error(`${path}.${k} is a legacy tenant boundary; company_id is required`);rejectLegacy(x,`${path}.${k}`);}}
function req(v:unknown,l:string):string{const s=String(v??'').trim();if(!s)throw new Error(`${l} is required`);return s}
function opt(v:unknown):string|null{const s=String(v??'').trim();return s||null}
function dateOnly(v:unknown,l:string):string{const s=req(v,l);if(!/^\\d{4}-\\d{2}-\\d{2}$/.test(s))throw new Error(l+' must be an ISO date');const d=new Date(s+'T00:00:00Z');if(Number.isNaN(d.getTime())||d.toISOString().slice(0,10)!==s)throw new Error(l+' must be an ISO date');return s}
function int(v:unknown,l:string,min=0):number{const n=Number(v);if(!Number.isSafeInteger(n)||n<min)throw new Error(`${l} must be an integer >= ${min}`);return n}
function prov(p:SubmittalProvenance){const at=req(p?.recorded_at,'provenance.recorded_at');if(Number.isNaN(Date.parse(at)))throw new Error('provenance.recorded_at must be an ISO date-time');return Object.freeze({source:req(p?.source,'provenance.source'),source_ref:opt(p?.source_ref),recorded_at:at,idempotency_key:req(p?.idempotency_key,'provenance.idempotency_key'),trace_id:opt(p?.trace_id),correlation_id:opt(p?.correlation_id)})}

export function deriveSubmittalReviewTiming(input:{state:SubmittalState;date_submitted:string;date_required?:string|null;date_reviewed?:string|null;as_of?:string}){
 if(!STATES.has(input.state))throw new Error('unsupported submittal state');
 const submitted=dateOnly(input.date_submitted,'date_submitted'),asOf=dateOnly(input.as_of??new Date().toISOString().slice(0,10),'as_of'),reviewed=input.date_reviewed?dateOnly(input.date_reviewed,'date_reviewed'):null;
 const end=reviewed??asOf;const days_in_review=Math.max(0,Math.floor((Date.parse(`${end}T00:00:00Z`)-Date.parse(`${submitted}T00:00:00Z`))/86400000));
 const required=input.date_required?dateOnly(input.date_required,'date_required'):null;
 const terminal=['approved','approved_as_noted','rejected','void','draft'].includes(input.state);
 return Object.freeze({days_in_review,is_overdue:!terminal&&Boolean(required)&&Date.parse(`${asOf}T00:00:00Z`)>Date.parse(`${required}T00:00:00Z`)});
}

export function buildTitanProjectSubmittal(input:TitanProjectSubmittalInput,options:{as_of?:string}={}){
 rejectLegacy(input);if(!TYPES.has(input.submittal_type))throw new Error('unsupported submittal type');if(!STATES.has(input.state))throw new Error('unsupported submittal state');
 const revision_number=int(input.revision_number,'revision_number',1),previous_submittal_id=opt(input.previous_submittal_id);
 if(revision_number>1&&!previous_submittal_id)throw new Error('revisions after 1 require previous_submittal_id');
 if(revision_number===1&&previous_submittal_id)throw new Error('revision 1 cannot reference previous_submittal_id');
 const date_submitted=dateOnly(input.date_submitted,'date_submitted'),date_required=input.date_required?dateOnly(input.date_required,'date_required'):null,date_reviewed=input.date_reviewed?dateOnly(input.date_reviewed,'date_reviewed'):null;
 const reviewer_ref=opt(input.reviewer_ref);
 if(['approved','approved_as_noted','revise_and_resubmit','rejected'].includes(input.state)&&(!date_reviewed||!reviewer_ref))throw new Error('review outcome requires reviewer_ref and date_reviewed');
 if(date_reviewed&&Date.parse(`${date_reviewed}T00:00:00Z`)<Date.parse(`${date_submitted}T00:00:00Z`))throw new Error('date_reviewed must not precede date_submitted');
 if(date_required&&Date.parse(`${date_required}T00:00:00Z`)<Date.parse(`${date_submitted}T00:00:00Z`))throw new Error('date_required must not precede date_submitted');
 if(input.state==='approved_as_noted'&&!opt(input.review_comments))throw new Error('approved_as_noted requires review_comments');
 if(input.state==='revise_and_resubmit'&&!opt(input.review_comments))throw new Error('revise_and_resubmit requires review_comments');
 const quantity=input.quantity==null?null:int(input.quantity,'quantity',0),unit_cost_cents=input.unit_cost_cents==null?null:int(input.unit_cost_cents,'unit_cost_cents',0);
 const total_cost_cents=quantity!=null&&unit_cost_cents!=null?quantity*unit_cost_cents:null;if(total_cost_cents!=null&&!Number.isSafeInteger(total_cost_cents))throw new Error('total_cost_cents exceeds safe integer range');
 const timing=deriveSubmittalReviewTiming({state:input.state,date_submitted,date_required,date_reviewed,as_of:options.as_of});
 return Object.freeze({
  schema:TITAN_PROJECT_SUBMITTAL_SCHEMA,submittal_id:req(input.submittal_id,'submittal_id'),company_id:req(input.company_id,'company_id'),project_id:req(input.project_id,'project_id'),
  work_order_id:opt(input.work_order_id),phase_ref:opt(input.phase_ref),title:req(input.title,'title'),description:opt(input.description),spec_section:opt(input.spec_section),submittal_type:input.submittal_type,
  manufacturer:opt(input.manufacturer),model_number:opt(input.model_number),product_description:opt(input.product_description),quantity,unit_cost_cents,total_cost_cents,alternatives_considered:opt(input.alternatives_considered),
  submitted_by_ref:req(input.submitted_by_ref,'submitted_by_ref'),submitted_to:opt(input.submitted_to),reviewer_ref,communication_thread_ref:opt(input.communication_thread_ref),
  state:input.state,review_comments:opt(input.review_comments),revision_number,previous_submittal_id,date_submitted,date_required,date_reviewed,
  lead_time_days:input.lead_time_days==null?null:int(input.lead_time_days,'lead_time_days',0),delivery_date:input.delivery_date?dateOnly(input.delivery_date,'delivery_date'):null,
  document_refs:Object.freeze(input.document_refs.map(x=>req(x,'document_ref'))),notes:opt(input.notes),days_in_review:timing.days_in_review,is_overdue:timing.is_overdue,provenance:prov(input.provenance),
  document_storage_authority:'canonical-document-system' as const,document_refs_only:true as const,automatic_document_copy:false as const,automatic_purchase_order_creation:false as const,
  automatic_project_mutation:false as const,automatic_communication_send:false as const,review_outcome_grants_execution_authority:false as const,proposal_only:true as const,requires_fresh_authority:true as const,grants_authority:false as const,execution_permitted:false as const,
 });
}

export function submittalRevisionRecommendation(submittal:ReturnType<typeof buildTitanProjectSubmittal>){
 const needed=submittal.state==='revise_and_resubmit';
 return Object.freeze({recommended:needed,company_id:submittal.company_id,project_id:submittal.project_id,source_submittal_id:submittal.submittal_id,next_revision_number:submittal.revision_number+1,
  create_revision:false as const,copy_documents:false as const,proposal_only:true as const,grants_authority:false as const,execution_permitted:false as const});
}
