import { assertAuthorityDecisionAllowsExecution } from "./authority-evaluator.mjs";

const STATUS=Object.freeze({
  ALLOW:"approved",
  APPROVAL_REQUIRED:"approval_required",
});

export class RuntimeAuthorityGateway {
  constructor({contextResolver,executionGateway,authorityStore}={}){
    if(!contextResolver?.evaluate)throw new Error("runtime-authority-context-resolver-required");
    if(!executionGateway?.execute)throw new Error("runtime-authority-execution-gateway-required");
    this.contextResolver=contextResolver;
    this.executionGateway=executionGateway;
    this.authorityStore=authorityStore;
  }

  async authorize(input){
    const canonical=await this.contextResolver.evaluate({
      ...input,
      operation_id:input.run_id,
      action_id:input.idempotency_key??input.run_id,
    });
    if(this.authorityStore?.appendDecision)await this.authorityStore.appendDecision(canonical);
    return Object.freeze({
      status:STATUS[canonical.decision]??"denied",
      decision_id:canonical.authority_decision_id,
      canonical,
    });
  }

  async execute({decision,capability,input,idempotency_key,company_id,work_id,agent_id,run_id}){
    const canonical=decision?.canonical;
    if(!canonical)throw new Error("runtime-canonical-authority-decision-required");
    assertAuthorityDecisionAllowsExecution(canonical,{
      company_id,
      capability:capability?.name??canonical.capability,
      worker_id:agent_id,
    });
    return this.executionGateway.execute({
      execution_id:`execution:${run_id}:${idempotency_key}`,
      company_id,
      decision_id:canonical.authority_decision_id,
      work_id,
      run_id,
      agent_id,
      capability:capability?.name??canonical.capability,
      input,
      idempotency_key,
      authority:{status:"approved"},
      risk:{status:canonical.evaluated_risk?.level==="critical"?"denied":"approved",...canonical.evaluated_risk},
    });
  }
}
