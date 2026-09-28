export type CounterfactualBranch={schema:"titan.counterfactual-branch.v1";branch_id:string;company_id:string;parent_evidence_checkpoint:string;assumptions:readonly string[];provenance_ref:string;classification:"COUNTERFACTUAL";authority_granted:false;created_at:string};
const req=(v:unknown,n:string)=>{const x=String(v??"").trim();if(!x)throw new Error(`${n}-required`);return x;};
export function createCounterfactualBranch(input:{branch_id:string;company_id:string;parent_evidence_checkpoint:string;assumptions:string[];provenance_ref:string;created_at?:string}):CounterfactualBranch{
 const created_at=input.created_at??new Date().toISOString(); if(!Number.isFinite(Date.parse(created_at)))throw new Error("created_at-invalid");
 const assumptions=[...new Set(input.assumptions.map(v=>req(v,"assumption")))]; if(!assumptions.length)throw new Error("assumptions-required");
 return Object.freeze({schema:"titan.counterfactual-branch.v1",branch_id:req(input.branch_id,"branch_id"),company_id:req(input.company_id,"company_id"),parent_evidence_checkpoint:req(input.parent_evidence_checkpoint,"parent_evidence_checkpoint"),assumptions:Object.freeze(assumptions),provenance_ref:req(input.provenance_ref,"provenance_ref"),classification:"COUNTERFACTUAL",authority_granted:false,created_at});
}
export function compareCounterfactualBranches(branches:readonly CounterfactualBranch[],company_id:string):{branch_ids:readonly string[];isolated:true}{
 const company=req(company_id,"company_id"); if(branches.some(b=>b.company_id!==company))throw new Error("branch-company-mismatch"); const ids=branches.map(b=>b.branch_id); if(new Set(ids).size!==ids.length)throw new Error("branch-id-duplicate"); return Object.freeze({branch_ids:Object.freeze(ids),isolated:true as const});
}
export function assertCounterfactualCannotEnterFactual(record:{classification?:string;authority_granted?:boolean}){if(record.classification!=="COUNTERFACTUAL")throw new Error("counterfactual-classification-required");if(record.authority_granted===true)throw new Error("counterfactual-authority-forbidden");return true;}
