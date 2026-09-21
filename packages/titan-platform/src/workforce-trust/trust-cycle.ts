export type TrustCycleInput = {
  company_id: string; agent_id: string; capability: string;
  outcome_success: boolean; policy_compliant: boolean;
  human_correction: boolean; reversed: boolean;
  evidence_refs?: string[];
};
export type TrustCycleEvidence = TrustCycleInput & {
  schema: "titan.workforce.trust-cycle.v1";
  successful: boolean;
  authority_effect: false; grants_authority: false;
};
const required=(v:string,n:string)=>{const x=String(v??"").trim();if(!x)throw new Error(`${n}-required`);return x};
export function evaluateTrustCycle(input:TrustCycleInput):TrustCycleEvidence{
  const company_id=required(input.company_id,"company_id");
  const agent_id=required(input.agent_id,"agent_id");
  const capability=required(input.capability,"capability");
  const successful=input.outcome_success===true&&input.policy_compliant===true&&input.human_correction!==true&&input.reversed!==true;
  return Object.freeze({...input,company_id,agent_id,capability,successful,
    schema:"titan.workforce.trust-cycle.v1",authority_effect:false as const,grants_authority:false as const});
}
export function trustScopeKey(v:{company_id:string;agent_id:string;capability:string}){
  return `${required(v.company_id,"company_id")}::${required(v.agent_id,"agent_id")}::${required(v.capability,"capability")}`;
}
