const req=(v:unknown,l:string)=>{const s=String(v??"").trim();if(!s)throw new Error(l+" is required");return s};
export type CompanyScopedReference={company_id:string;ref_type:string;ref_id:string};
export function assertCompanyScopedReferences(companyId:string,references:readonly CompanyScopedReference[]):void{
 const company_id=req(companyId,"company_id");
 for(const reference of references){
  const refCompany=req(reference.company_id,"reference.company_id");
  if(refCompany!==company_id)throw new Error("CROSS_COMPANY_REFERENCE_REJECTED");
  req(reference.ref_type,"reference.ref_type");req(reference.ref_id,"reference.ref_id");
 }
}
export function buildCompanyScopedReferenceSet(companyId:string,references:readonly CompanyScopedReference[]){
 assertCompanyScopedReferences(companyId,references);
 return Object.freeze({company_id:req(companyId,"company_id"),references:Object.freeze(references.map(r=>Object.freeze({...r}))),reference_validation_only:true as const,automatic_mutation:false as const,grants_authority:false as const,execution_permitted:false as const});
}
