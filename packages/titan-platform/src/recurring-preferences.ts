const LEGACY_KEYS=new Set(["tenant_id","tenant_company_id","tenantId","tenantCompanyId","business_id","account_id","workspace_id"]);
export const TITAN_RECURRING_PREFERENCES_SCHEMA="titan.business-ops.recurring-preferences.v1" as const;
export type RecurringPreferredWeekday="mon"|"tue"|"wed"|"thu"|"fri"|"sat"|"sun";
const DAYS=new Set<RecurringPreferredWeekday>(["mon","tue","wed","thu","fri","sat","sun"]);
export interface TitanRecurringPreferencesInput{
 company_id:string;schedule_id:string;preferred_weekday?:RecurringPreferredWeekday|null;preferred_time?:string|null;
 seasonal_months?:number[];pause_until?:string|null;generate_advance_days?:number;required_part_refs?:string[];checklist_template_ref?:string|null;
 provenance:{source:string;recorded_at:string;idempotency_key:string};[key:string]:unknown;
}
function rejectLegacy(v:unknown,path="input"):void{if(!v||typeof v!=="object")return;if(Array.isArray(v)){v.forEach((x,i)=>rejectLegacy(x,`${path}[${i}]`));return}for(const[k,x]of Object.entries(v as Record<string,unknown>)){if(LEGACY_KEYS.has(k))throw new Error(`${path}.${k} is a legacy tenant boundary; company_id is required`);rejectLegacy(x,`${path}.${k}`)}}
function req(v:unknown,n:string){const s=String(v??"").trim();if(!s)throw new Error(`${n} is required`);return s}
function date(v:unknown,n:string){const s=req(v,n);if(!/^\d{4}-\d{2}-\d{2}$/.test(s)){throw new Error(`${n} must be an ISO date`)}const d=new Date(`${s}T00:00:00Z`);if(d.toISOString().slice(0,10)!==s)throw new Error(`${n} must be an ISO date`);return s}
export function buildTitanRecurringPreferences(input:TitanRecurringPreferencesInput){
 rejectLegacy(input);const company_id=req(input.company_id,"company_id"),schedule_id=req(input.schedule_id,"schedule_id");
 if(input.preferred_weekday&&!DAYS.has(input.preferred_weekday))throw new Error("unsupported preferred_weekday");
 const preferred_time=input.preferred_time?req(input.preferred_time,"preferred_time"):null;if(preferred_time&&!/^([01]\d|2[0-3]):[0-5]\d$/.test(preferred_time))throw new Error("preferred_time must be HH:MM");
 const seasonal_months=Object.freeze([...new Set(input.seasonal_months??[])].sort((a,b)=>a-b));if(seasonal_months.some(m=>!Number.isInteger(m)||m<1||m>12))throw new Error("seasonal_months must contain month numbers 1-12");
 const generate_advance_days=input.generate_advance_days??0;if(!Number.isInteger(generate_advance_days)||generate_advance_days<0||generate_advance_days>365)throw new Error("generate_advance_days must be 0-365");
 const recorded_at=req(input.provenance?.recorded_at,"provenance.recorded_at");if(Number.isNaN(Date.parse(recorded_at)))throw new Error("provenance.recorded_at must be ISO date-time");
 return Object.freeze({schema:TITAN_RECURRING_PREFERENCES_SCHEMA,company_id,schedule_id,preferred_weekday:input.preferred_weekday??null,preferred_time,seasonal_months,pause_until:input.pause_until?date(input.pause_until,"pause_until"):null,generate_advance_days,required_part_refs:Object.freeze((input.required_part_refs??[]).map(x=>req(x,"required_part_ref"))),checklist_template_ref:input.checklist_template_ref?req(input.checklist_template_ref,"checklist_template_ref"):null,provenance:Object.freeze({source:req(input.provenance?.source,"provenance.source"),recorded_at,idempotency_key:req(input.provenance?.idempotency_key,"provenance.idempotency_key")}),recommendation_only:true as const,automatic_assignment:false as const,automatic_scheduling:false as const,automatic_generation:false as const,requires_fresh_authority:true as const,grants_authority:false as const,execution_permitted:false as const});
}
export function assessRecurringPreferenceWindow(preferences:ReturnType<typeof buildTitanRecurringPreferences>,candidate_date:string){
 const candidate=date(candidate_date,"candidate_date"),month=Number(candidate.slice(5,7));
 const paused=!!preferences.pause_until&&candidate<=preferences.pause_until;
 const seasonal=preferences.seasonal_months.length===0||preferences.seasonal_months.includes(month);
 return Object.freeze({eligible:!paused&&seasonal,reasons:Object.freeze([...(paused?["PAUSED_UNTIL"]:[]),...(!seasonal?["OUTSIDE_SEASON"]:[])]),recommendation_only:true as const,execution_permitted:false as const});
}
