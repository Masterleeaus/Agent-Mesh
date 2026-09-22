const LEGACY_BOUNDARY_KEYS=new Set(['tenant_id','tenant_company_id','tenantId','tenantCompanyId','business_id','account_id','workspace_id']);
export const TITAN_WORKFORCE_CREDENTIAL_SCHEMA='titan.workforce.qualification-credential.v1' as const;
export const TITAN_JOB_QUALIFICATION_REQUIREMENT_SCHEMA='titan.workforce.job-qualification-requirement.v1' as const;
export type CredentialType='trade_license'|'safety_training'|'equipment_operator'|'first_aid'|'confined_space'|'fall_protection'|'hazmat'|'backflow'|'gas_fitter'|'refrigerant_handling'|'other';
export type CredentialAdministrativeState='active'|'suspended'|'revoked';
export type CredentialComputedState='active'|'expiring_soon'|'expired'|'suspended'|'revoked';
const TYPES=new Set<CredentialType>(['trade_license','safety_training','equipment_operator','first_aid','confined_space','fall_protection','hazmat','backflow','gas_fitter','refrigerant_handling','other']);
const ADMIN_STATES=new Set<CredentialAdministrativeState>(['active','suspended','revoked']);
export interface QualificationProvenance{source:string;source_ref?:string|null;recorded_at:string;idempotency_key:string;trace_id?:string|null;correlation_id?:string|null}
export interface TitanQualificationCredentialInput{
 credential_id:string;company_id:string;worker_id:string;qualification_tag:string;credential_type:CredentialType;credential_name:string;issuing_body?:string|null;certificate_number?:string|null;
 issue_date:string;expiry_date?:string|null;administrative_state:CredentialAdministrativeState;renewal_reminder_days?:number;is_required?:boolean;evidence_refs:string[];notes?:string|null;provenance:QualificationProvenance;[key:string]:unknown;
}
export interface TitanJobQualificationRequirementInput{requirement_id:string;company_id:string;job_type:string;qualification_tag:string;mandatory:boolean;notes?:string|null;provenance:QualificationProvenance;[key:string]:unknown}
function rejectLegacy(v:unknown,path='input'):void{if(!v||typeof v!=='object')return;if(Array.isArray(v)){v.forEach((x,i)=>rejectLegacy(x,`${path}[${i}]`));return;}for(const[k,x]of Object.entries(v as Record<string,unknown>)){if(LEGACY_BOUNDARY_KEYS.has(k))throw new Error(`${path}.${k} is a legacy tenant boundary; company_id is required`);rejectLegacy(x,`${path}.${k}`);}}
function req(v:unknown,l:string):string{const s=String(v??'').trim();if(!s)throw new Error(`${l} is required`);return s}
function opt(v:unknown):string|null{const s=String(v??'').trim();return s||null}
function dateOnly(v:unknown,l:string):string{const s=req(v,l);if(!/^\d{4}-\d{2}-\d{2}$/.test(s)||Number.isNaN(Date.parse(`${s}T00:00:00Z`)))throw new Error(`${l} must be an ISO date`);return s}
function nonNegativeInt(v:unknown,l:string):number{const n=Number(v);if(!Number.isSafeInteger(n)||n<0)throw new Error(`${l} must be a non-negative integer`);return n}
function prov(p:QualificationProvenance){const at=req(p?.recorded_at,'provenance.recorded_at');if(Number.isNaN(Date.parse(at)))throw new Error('provenance.recorded_at must be an ISO date-time');return Object.freeze({source:req(p?.source,'provenance.source'),source_ref:opt(p?.source_ref),recorded_at:at,idempotency_key:req(p?.idempotency_key,'provenance.idempotency_key'),trace_id:opt(p?.trace_id),correlation_id:opt(p?.correlation_id)})}
export function deriveCredentialState(input:{administrative_state:CredentialAdministrativeState;expiry_date?:string|null;renewal_reminder_days?:number;as_of?:string}):Readonly<{state:CredentialComputedState;days_until_expiry:number|null;valid:boolean;renewal_due:boolean}>{
 if(!ADMIN_STATES.has(input.administrative_state))throw new Error('unsupported credential administrative state');
 const asOf=dateOnly(input.as_of??new Date().toISOString().slice(0,10),'as_of');
 if(input.administrative_state!=='active')return Object.freeze({state:input.administrative_state,days_until_expiry:null,valid:false,renewal_due:false});
 if(!input.expiry_date)return Object.freeze({state:'active',days_until_expiry:null,valid:true,renewal_due:false});
 const expiry=dateOnly(input.expiry_date,'expiry_date'),days=Math.floor((Date.parse(`${expiry}T00:00:00Z`)-Date.parse(`${asOf}T00:00:00Z`))/86400000);
 const reminder=nonNegativeInt(input.renewal_reminder_days??30,'renewal_reminder_days');
 if(days<0)return Object.freeze({state:'expired',days_until_expiry:days,valid:false,renewal_due:true});
 if(days<=reminder)return Object.freeze({state:'expiring_soon',days_until_expiry:days,valid:true,renewal_due:true});
 return Object.freeze({state:'active',days_until_expiry:days,valid:true,renewal_due:false});
}
export function buildTitanQualificationCredential(input:TitanQualificationCredentialInput,options:{as_of?:string}={}){
 rejectLegacy(input);if(!TYPES.has(input.credential_type))throw new Error('unsupported credential type');if(!ADMIN_STATES.has(input.administrative_state))throw new Error('unsupported credential administrative state');
 const issue_date=dateOnly(input.issue_date,'issue_date'),expiry_date=input.expiry_date?dateOnly(input.expiry_date,'expiry_date'):null;
 if(expiry_date&&Date.parse(`${expiry_date}T00:00:00Z`)<Date.parse(`${issue_date}T00:00:00Z`))throw new Error('expiry_date cannot precede issue_date');
 const renewal_reminder_days=nonNegativeInt(input.renewal_reminder_days??30,'renewal_reminder_days');
 const computed=deriveCredentialState({administrative_state:input.administrative_state,expiry_date,renewal_reminder_days,as_of:options.as_of});
 return Object.freeze({
  schema:TITAN_WORKFORCE_CREDENTIAL_SCHEMA,credential_id:req(input.credential_id,'credential_id'),company_id:req(input.company_id,'company_id'),worker_id:req(input.worker_id,'worker_id'),qualification_tag:req(input.qualification_tag,'qualification_tag'),
  credential_type:input.credential_type,credential_name:req(input.credential_name,'credential_name'),issuing_body:opt(input.issuing_body),certificate_number:opt(input.certificate_number),issue_date,expiry_date,
  administrative_state:input.administrative_state,computed_state:computed.state,days_until_expiry:computed.days_until_expiry,valid:computed.valid,renewal_due:computed.renewal_due,renewal_reminder_days,is_required:Boolean(input.is_required),
  evidence_refs:Object.freeze(input.evidence_refs.map(x=>req(x,'evidence_ref'))),notes:opt(input.notes),provenance:prov(input.provenance),
  qualification_owner:'shared_workforce_qualification_owner' as const,automatic_assignment:false as const,automatic_renewal:false as const,automatic_status_mutation:false as const,
  credential_validity_grants_authority:false as const,proposal_only:true as const,requires_fresh_authority:true as const,grants_authority:false as const,execution_permitted:false as const,
 });
}
export function buildTitanJobQualificationRequirement(input:TitanJobQualificationRequirementInput){
 rejectLegacy(input);return Object.freeze({schema:TITAN_JOB_QUALIFICATION_REQUIREMENT_SCHEMA,requirement_id:req(input.requirement_id,'requirement_id'),company_id:req(input.company_id,'company_id'),job_type:req(input.job_type,'job_type'),qualification_tag:req(input.qualification_tag,'qualification_tag'),mandatory:Boolean(input.mandatory),notes:opt(input.notes),provenance:prov(input.provenance),qualification_owner:'shared_workforce_qualification_owner' as const,automatic_assignment:false as const,grants_authority:false as const,execution_permitted:false as const});
}
export function assessWorkerQualification(input:{company_id:string;required_tags:readonly string[];credentials:ReadonlyArray<ReturnType<typeof buildTitanQualificationCredential>>}){
 const company_id=req(input.company_id,'company_id'),required=[...new Set(input.required_tags.map(x=>req(x,'required_tag')))];
 const crossCompany=input.credentials.filter(x=>x.company_id!==company_id);if(crossCompany.length)throw new Error('credential company_id must match assessment company_id');
 const validTags=new Set(input.credentials.filter(x=>x.valid).map(x=>x.qualification_tag));const missing=required.filter(x=>!validTags.has(x));
 return Object.freeze({company_id,eligible:missing.length===0,required_tags:Object.freeze(required),missing_or_invalid_tags:Object.freeze(missing),recommendation_only:true as const,automatic_assignment:false as const,qualification_bypass_permitted:false as const,grants_authority:false as const,execution_permitted:false as const});
}
