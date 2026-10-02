export const TITAN_VISUAL_EVIDENCE_CONTRACT={schema:"titan.visual-evidence/v1",authority:"observation-and-review-proposal-only",model_owner:"#1055",evidence_owner:"#913"} as const;
export type VisualUncertainty="LOW"|"MEDIUM"|"HIGH"|"UNAVAILABLE";
export type ReviewState="PENDING"|"HUMAN_REVIEW"|"ACCEPTED_OBSERVATION"|"REJECTED";
export type EvidenceRef=Readonly<{company_id:string;evidence_id:string;revision:number;subject_type:"visit"|"job"|"asset"|"inspection";subject_id:string;captured_at:string;purpose:"quality"|"before-after"|"asset-passport"|"safety"|"completion-assurance"|"quote-variation";consent_ref:string;media_ref:string;mime_type:string;byte_size:number;accepted:boolean}>;
export type VisualRequest=Readonly<{request_id:string;company_id:string;subject_type:EvidenceRef["subject_type"];subject_id:string;source_revision:number;evidence_refs:readonly EvidenceRef[];purpose:EvidenceRef["purpose"];consent_ref:string;created_at:string;offline:boolean;max_payload_bytes:number}>;
export type VisualFinding=Readonly<{finding_id:string;category:"quality"|"change"|"safety"|"completion"|"asset-identity"|"quote-variation";summary:string;explanation:string;source_refs:readonly string[];confidence:number;uncertainty:VisualUncertainty;review_state:ReviewState;verified:false}>;
export type VisualResult=Readonly<{schema:string;request_id:string;company_id:string;subject_type:EvidenceRef["subject_type"];subject_id:string;source_revision:number;captured_at:string;observed_at:string;purpose:EvidenceRef["purpose"];provider_ref:string;model_ref:string;method_version:string;confidence:number;uncertainty:VisualUncertainty;review_state:ReviewState;findings:readonly VisualFinding[];lineage:Readonly<{source_evidence_refs:readonly string[];derivation_ref:string;review_decision_ref:string|null;observed_verification_ref:string|null}>;prompt_data:Readonly<{media_refs:readonly string[];included_fields:readonly string[];raw_media_logged:false;secrets_included:false}>;authority_effect:false;verified:false}>;
export type VisualProvider=Readonly<{id:string;model_ref:string;health:"healthy"|"degraded"|"offline";analyze:(input:Readonly<{request_id:string;company_id:string;subject_type:string;subject_id:string;purpose:string;media_refs:readonly string[];source_revision:number}> )=>Promise<Readonly<{confidence:number;findings:readonly Omit<VisualFinding,"review_state"|"verified"|"finding_id">[];method_version:string}>>}>;
export type CaptureChecklist=Readonly<{id:string;revision:number;company_id:string;subject_type:string;items:readonly Readonly<{id:string;label:string;required:boolean;purpose:string}>[]}>;
export type CaptureGuidance=Readonly<{checklist_id:string;checklist_revision:number;company_id:string;subject_id:string;missing_items:readonly string[];quality:"READY"|"INCOMPLETE"|"LOW_QUALITY";offline_queued:boolean;source_refs:readonly string[];authority_effect:false}>;
export type VisualProposal=Readonly<{proposal_id:string;company_id:string;kind:"CHANGE_FINDING"|"ASSET_PASSPORT"|"INSPECTION_PROFILE"|"COMPLETION_ASSURANCE"|"QUOTE_VARIATION";source_revision:number;finding_refs:readonly string[];evidence_refs:readonly string[];uncertainty:VisualUncertainty;review_state:"PENDING_REVIEW";authority_effect:false}>;
const need=(v:unknown,k:string)=>{const s=String(v??"").trim();if(!s)throw Error("visual_"+k+"_required");return s};
const iso=(v:string)=>{const n=new Date(v);if(!Number.isFinite(n.getTime()))throw Error("visual_time_invalid");return n.toISOString()};
const payloadSize=(v:unknown)=>new TextEncoder().encode(JSON.stringify(v)).byteLength;
const key=(v:unknown)=>{let h=2166136261;for(const c of JSON.stringify(v))h=Math.imul(h^c.charCodeAt(0),16777619);return(h>>>0).toString(16)};
const validConfidence=(n:number)=>Number.isFinite(n)&&n>=0&&n<=1;
export function validateVisualRequest(r:VisualRequest):VisualRequest{
 need(r.request_id,"request_id");need(r.company_id,"company_id");need(r.subject_id,"subject_id");need(r.consent_ref,"consent_ref");
 if(!Number.isInteger(r.source_revision)||r.source_revision<1)throw Error("visual_source_revision_invalid");
 if(!r.evidence_refs.length)throw Error("visual_evidence_required");
 for(const e of r.evidence_refs){if(e.company_id!==r.company_id)throw Error("visual_cross_company_evidence");if(!e.accepted)throw Error("visual_evidence_not_accepted");if(e.subject_id!==r.subject_id||e.subject_type!==r.subject_type)throw Error("visual_subject_mismatch");if(e.consent_ref!==r.consent_ref)throw Error("visual_consent_mismatch");if(!Number.isInteger(e.revision)||e.revision<1)throw Error("visual_evidence_revision_invalid");if(!["image/jpeg","image/png","image/webp","image/heic"].includes(e.mime_type))throw Error("visual_format_unsupported");if(e.byte_size<=0||e.byte_size>20000000)throw Error("visual_media_size_invalid");iso(e.captured_at)}
 if(payloadSize({fields:["company_id","subject_type","subject_id","purpose","media_refs"],refs:r.evidence_refs.map(e=>e.media_ref)})>r.max_payload_bytes)throw Error("visual_prompt_payload_too_large");
 return r;
}
export function createCaptureGuidance(i:{checklist:CaptureChecklist;company_id:string;subject_id:string;captured:readonly EvidenceRef[];offline:boolean;low_quality_refs?:readonly string[]}):CaptureGuidance{
 if(i.checklist.company_id!==i.company_id)throw Error("visual_checklist_company_mismatch");
 const mine=i.captured.filter(e=>e.company_id===i.company_id&&e.subject_id===i.subject_id);
 const have=new Set(mine.map(e=>e.evidence_id));
 const missing=i.checklist.items.filter(x=>x.required&&!have.has(x.id)).map(x=>x.id);
 const low=new Set(i.low_quality_refs??[]);
 return{checklist_id:i.checklist.id,checklist_revision:i.checklist.revision,company_id:i.company_id,subject_id:i.subject_id,missing_items:missing,quality:low.size?"LOW_QUALITY":missing.length?"INCOMPLETE":"READY",offline_queued:i.offline,source_refs:mine.map(e=>e.evidence_id+":"+e.revision),authority_effect:false};
}
export function pairBeforeAfter(before:EvidenceRef,after:EvidenceRef,company_id:string){
 if(before.company_id!==company_id||after.company_id!==company_id)throw Error("visual_cross_company_evidence");
 if(before.subject_type!==after.subject_type||before.subject_id!==after.subject_id)throw Error("visual_comparison_subject_mismatch");
 if(!before.accepted||!after.accepted)throw Error("visual_evidence_not_accepted");
 if(new Date(after.captured_at)<new Date(before.captured_at))throw Error("visual_comparison_time_order_invalid");
 return{company_id,before_ref:before.evidence_id+":"+before.revision,after_ref:after.evidence_id+":"+after.revision,basis:"same-subject-purpose" as const,source_revision:Math.max(before.revision,after.revision),captured_at:[iso(before.captured_at),iso(after.captured_at)] as const};
}
export async function analyzeVisualEvidence(r:VisualRequest,provider:VisualProvider|null,opts:{min_confidence?:number;source_revision_now?:number}={}):Promise<VisualResult>{
 validateVisualRequest(r);const refs=r.evidence_refs.map(e=>e.evidence_id+":"+e.revision),base={schema:TITAN_VISUAL_EVIDENCE_CONTRACT.schema,request_id:r.request_id,company_id:r.company_id,subject_type:r.subject_type,subject_id:r.subject_id,source_revision:r.source_revision,captured_at:r.evidence_refs.map(e=>e.captured_at).sort()[0],observed_at:new Date().toISOString(),purpose:r.purpose,provider_ref:provider?.id??"native-offline",model_ref:provider?.model_ref??"none",method_version:"native-guidance/v1",confidence:0,uncertainty:"UNAVAILABLE" as VisualUncertainty,review_state:"HUMAN_REVIEW" as ReviewState,findings:[] as VisualFinding[],lineage:{source_evidence_refs:refs,derivation_ref:"visual:"+key({request:r.request_id,refs}),review_decision_ref:null,observed_verification_ref:null},prompt_data:{media_refs:[] as string[],included_fields:["company_id","subject_type","subject_id","purpose","evidence_refs","source_revision"],raw_media_logged:false as const,secrets_included:false as const},authority_effect:false as const,verified:false as const};
 if(r.offline||!provider||provider.health==="offline"||opts.source_revision_now!==undefined&&opts.source_revision_now!==r.source_revision)return{...base,uncertainty:"UNAVAILABLE",review_state:"HUMAN_REVIEW"};
 try{const result=await provider.analyze({request_id:r.request_id,company_id:r.company_id,subject_type:r.subject_type,subject_id:r.subject_id,purpose:r.purpose,media_refs:r.evidence_refs.map(e=>e.media_ref),source_revision:r.source_revision});
 if(!validConfidence(result.confidence))throw Error("visual_provider_confidence_invalid");
 const conflict=opts.source_revision_now!==undefined&&opts.source_revision_now!==r.source_revision;
 const findings=result.findings.map((f,i)=>({finding_id:"finding:"+key([r.request_id,i,f]),...f,confidence:validConfidence(f.confidence)?f.confidence:0,review_state:conflict||f.uncertainty==="HIGH"||f.confidence<(opts.min_confidence??.65)?"HUMAN_REVIEW" as const:"PENDING" as const,verified:false as const}));
 const review=conflict||result.confidence<(opts.min_confidence??.65)||findings.some(f=>f.review_state==="HUMAN_REVIEW")?"HUMAN_REVIEW" as const:"PENDING" as const;
 return{...base,provider_ref:provider.id,model_ref:provider.model_ref,method_version:result.method_version,confidence:result.confidence,uncertainty:conflict?"HIGH" as const:findings.some(f=>f.uncertainty==="HIGH")?"HIGH" as const:findings.some(f=>f.uncertainty==="MEDIUM")?"MEDIUM" as const:"LOW" as const,review_state:review,findings,lineage:{...base.lineage,derivation_ref:"visual:"+key({request:r.request_id,refs,model:provider.model_ref,version:result.method_version})},prompt_data:{...base.prompt_data,media_refs:r.evidence_refs.map(e=>e.media_ref)}};
 }catch{return{...base,uncertainty:"UNAVAILABLE",review_state:"HUMAN_REVIEW"}}
}
export function createVisualProposal(i:{company_id:string;kind:VisualProposal["kind"];result:VisualResult;evidence_refs:readonly string[];source_revision:number}):VisualProposal{
 if(i.result.company_id!==i.company_id)throw Error("visual_cross_company_result");
 if(i.result.verified||i.result.authority_effect!==false)throw Error("visual_authority_forbidden");
 if(i.source_revision!==i.result.source_revision)throw Error("visual_source_revision_conflict");
 if(i.result.review_state==="REJECTED")throw Error("visual_result_rejected");
 return{proposal_id:"proposal:"+key([i.company_id,i.kind,i.result.request_id,i.source_revision]),company_id:i.company_id,kind:i.kind,source_revision:i.source_revision,finding_refs:i.result.findings.map(f=>f.finding_id),evidence_refs:[...new Set([...i.evidence_refs,...i.result.lineage.source_evidence_refs])],uncertainty:i.result.uncertainty,review_state:"PENDING_REVIEW",authority_effect:false};
}
export function recordVisualReview(p:VisualProposal,i:{company_id:string;reviewer_ref:string;decision:"ACCEPT_OBSERVATION"|"REJECT";reason:string;current_source_revision:number;fresh_authority_ref:string|null}){
 need(i.reviewer_ref,"reviewer");need(i.reason,"review_reason");if(i.company_id!==p.company_id)throw Error("visual_review_company_mismatch");if(i.current_source_revision!==p.source_revision)throw Error("visual_source_revision_conflict");
 if(i.decision==="ACCEPT_OBSERVATION"&&!i.fresh_authority_ref)throw Error("visual_fresh_authority_required");
 return{proposal_id:p.proposal_id,company_id:p.company_id,decision:i.decision,reviewer_ref:i.reviewer_ref,reason:i.reason,source_revision:p.source_revision,authority_decision_ref:i.fresh_authority_ref,accepted_as:"OBSERVATION" as const,verified:false as const,reviewed_at:new Date().toISOString()};
}
export function recordVisualVerification(i:{company_id:string;proposal:VisualProposal;observed_ref:string;verification_ref:string;current_source_revision:number;authority_valid:boolean}){
 if(i.company_id!==i.proposal.company_id)throw Error("visual_verification_company_mismatch");if(i.current_source_revision!==i.proposal.source_revision)throw Error("visual_source_revision_conflict");if(!i.authority_valid)throw Error("visual_fresh_authority_required");need(i.observed_ref,"observed_outcome");need(i.verification_ref,"verification_ref");
 return{company_id:i.company_id,proposal_id:i.proposal.proposal_id,observed_ref:i.observed_ref,verification_ref:i.verification_ref,verified_by_observation:true,model_output_used_as_proof:false as const};
}
export function createVisualChecklistProposal(i:{company_id:string;version:number;items:CaptureChecklist["items"];source:"vertical-pack"|"business-standards"}){
 if(!Number.isInteger(i.version)||i.version<1||!i.items.length)throw Error("visual_profile_invalid");
 return{proposal_id:"profile:"+key(i),company_id:i.company_id,version:i.version,items:i.items.map(x=>({...x})),source:i.source,review_state:"PENDING_REVIEW" as const,effective_company_policy:false as const};
}
