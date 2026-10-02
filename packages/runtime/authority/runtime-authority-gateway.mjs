import { randomUUID } from "node:crypto";
import { assertAuthorityDecisionAllowsExecution } from "./authority-evaluator.mjs";

const STATUS=Object.freeze({
  ALLOW:"approved",
  APPROVAL_REQUIRED:"approval_required",
});

const required=(value,code)=>{const text=String(value??"").trim();if(!text)throw new Error(code);return text;};

function nextEvaluationTime(previous){
  const now=Date.now();
  const prior=Date.parse(String(previous?.evaluated_at??""));
  return new Date(Number.isFinite(prior)&&prior>=now?prior+1:now).toISOString();
}

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
    const previous=decision?.canonical;
    if(!previous)throw new Error("runtime-canonical-authority-decision-required");
    const capabilityName=required(capability?.name??previous.capability,"runtime-capability-required");

    // The authorization decision is only a historical fact. Re-resolve current
    // authority at the consequential execution boundary so revocation, expiry,
    // risk/policy contraction, approval changes and connectivity changes take
    // effect even when they occur after planning/authorization.
    assertAuthorityDecisionAllowsExecution(previous,{
      company_id,
      capability:capabilityName,
      worker_id:agent_id,
    });

    const parent=this.authorityStore?.latestDecisionForBinding
      ? await this.authorityStore.latestDecisionForBinding({
          company_id,worker_id:agent_id,capability:capabilityName,
          operation_id:previous.operation_id??run_id,
          action_id:previous.action_id??idempotency_key??run_id,
        })??previous
      : previous;
    assertAuthorityDecisionAllowsExecution(parent,{
      company_id,capability:capabilityName,worker_id:agent_id,
    });

    const current=await this.contextResolver.evaluate({
      company_id,
      agent_id,
      worker_type:previous.worker_type,
      surface:previous.surface,
      capability:capabilityName,
      operation_id:parent.operation_id??run_id,
      action_id:parent.action_id??idempotency_key??run_id,
      run_id,
      idempotency_key,
      execution_mode:"autonomous",
      input,
      execution_input:input,
      authority_decision_id:`authority:${required(run_id,"runtime-run-id-required")}:${required(idempotency_key??run_id,"runtime-idempotency-key-required")}:execute:${randomUUID()}`,
      supersedes_authority_decision_id:parent.authority_decision_id,
      now:nextEvaluationTime(parent),
    });

    if(this.authorityStore?.appendDecision)await this.authorityStore.appendDecision(current);
    assertAuthorityDecisionAllowsExecution(current,{
      company_id,
      capability:capabilityName,
      worker_id:agent_id,
    });

    return this.executionGateway.execute({
      execution_id:`execution:${run_id}:${idempotency_key}`,
      company_id,
      decision_id:current.authority_decision_id,
      supersedes_decision_id:parent.authority_decision_id,
      work_id,
      run_id,
      agent_id,
      capability:capabilityName,
      input,
      idempotency_key,
      authority:{status:"approved",revalidated:true,evaluated_at:current.evaluated_at},
      risk:{status:current.evaluated_risk?.level==="critical"?"denied":"approved",...current.evaluated_risk},
    });
  }
}
