import test from "node:test";
import assert from "node:assert/strict";
// Canonical authority runtime is JavaScript today; this test intentionally
// exercises the production module from the Workforce package.
// @ts-ignore
import { RuntimeAuthorityGateway } from "../../../packages/runtime/authority/runtime-authority-gateway.mjs";
// @ts-ignore
import { AuthorityContextResolver } from "../../../packages/runtime/authority/authority-context-resolver.mjs";

const company_id="company-authority";
const worker_id="worker-authority";
const capability="booking.create";

const planned=(decision="ALLOW")=>({
  company_id,
  authority_decision_id:"auth-planned",
  worker_id,
  capability,
  operation_id:"run-1",
  action_id:"action-1",
  decision,
  evaluated_at:"2026-10-02T00:00:00.000Z",
  evaluated_risk:{level:"low",source:"test",ref:"risk-1"},
});

test("consequential execution re-evaluates current authority and blocks a post-plan revocation",async()=>{
  let providerCalls=0;
  const gateway=new RuntimeAuthorityGateway({
    contextResolver:{async evaluate(input:any){return {
      ...planned("DENY"),
      authority_decision_id:input.authority_decision_id,
      supersedes_authority_decision_id:input.supersedes_authority_decision_id,
      evaluated_at:input.now,
      reason_codes:["policy_not_allowed"],
    };}},
    executionGateway:{async execute(){providerCalls++;return {state:"VERIFIED"};}},
  });
  await assert.rejects(
    ()=>gateway.execute({
      decision:{status:"approved",decision_id:"auth-planned",canonical:planned()},
      capability:{name:capability},input:{authority_usage:{amount:25,currency:"AUD"}},
      idempotency_key:"action-1",company_id,work_id:"work-1",agent_id:worker_id,run_id:"run-1",
    }),
    /authority-not-allowed:DENY/,
  );
  assert.equal(providerCalls,0);
});

function resolver({limits,usage,score=65,entitlements=["booking"],handshake={platform:true,user:true,assurance:true}}:{limits:any;usage:any;score?:number;entitlements?:string[];handshake?:any}){
  const snapshot={
    company_id,decision_id:`snap-${score}`,capability,effective_score:score,status:"verified",source:"titan-autonomy",
    verified_at:"2026-10-02T00:00:00Z",expires_at:"2026-10-03T00:00:00Z",
    trusted_auto_handshake:handshake,predictive_ready:false,
  };
  const store={
    async latestAutonomySnapshot(){return snapshot;},
    async latestApproval(){return {company_id,status:"not_required"};},
  };
  return new AuthorityContextResolver({
    authorityStore:store,
    requirementResolver:{async resolve(){return {
      company_id,capability,operation:"create",effect:"read",
      required_permissions:["booking.write"],required_entitlements:["booking"],
      required_evidence:[],minimum_autonomy_score:51,limits,
    };}},
    accessResolver:{async resolve(){return {permissions:["booking.write"],entitlements};}},
    governanceResolver:{async resolve(){return {policy_allows:true,governance_allows:true,assurance_allows:true};}},
    evidenceResolver:{async resolve(){return {status:"not_required",refs:[]};}},
    riskResolver:{async resolve(){return {level:"low",source:"test",ref:"risk-1"};}},
    connectivityResolver:{async resolve(){return {state:"online"};}},
    usageResolver:{async resolve(){return usage;}},
  });
}

const authorityInput={
  company_id,agent_id:worker_id,capability,operation_id:"run-limit",action_id:"action-limit",
  now:"2026-10-02T00:10:00Z",
};

test("exact spend and provider-cost ceilings allow the boundary and deny one cent above it",async()=>{
  const limits={currency:"AUD",max_amount:100,max_provider_cost:5,max_messages:null,max_recipients:null};
  assert.equal((await resolver({limits,usage:{currency:"AUD",amount:100,provider_cost:5}}).evaluate(authorityInput)).decision,"ALLOW");
  const spend=await resolver({limits,usage:{currency:"AUD",amount:100.01,provider_cost:5}}).evaluate(authorityInput);
  assert.equal(spend.decision,"DENY");
  assert.ok(spend.reason_codes.includes("amount_limit_exceeded"));
  const provider=await resolver({limits,usage:{currency:"AUD",amount:100,provider_cost:5.01}}).evaluate(authorityInput);
  assert.equal(provider.decision,"DENY");
  assert.ok(provider.reason_codes.includes("provider_cost_limit_exceeded"));
});

test("communication ceilings and missing usage fail closed",async()=>{
  const limits={currency:null,max_amount:null,max_provider_cost:null,max_messages:1,max_recipients:2};
  assert.equal((await resolver({limits,usage:{messages:1,recipients:2}}).evaluate(authorityInput)).decision,"ALLOW");
  const tooMany=await resolver({limits,usage:{messages:2,recipients:3}}).evaluate(authorityInput);
  assert.equal(tooMany.decision,"DENY");
  assert.ok(tooMany.reason_codes.includes("message_limit_exceeded"));
  assert.ok(tooMany.reason_codes.includes("recipient_limit_exceeded"));
  const missing=await resolver({limits,usage:{}}).evaluate(authorityInput);
  assert.equal(missing.decision,"DENY");
  assert.ok(missing.reason_codes.includes("message_limit_usage_missing"));
  assert.ok(missing.reason_codes.includes("recipient_limit_usage_missing"));
});


test("a fresh verified authority decision can safely re-upgrade after a persisted contraction",async()=>{
  let providerCalls=0;
  let evaluatedParent:string|undefined;
  const contracted={...planned("DENY"),authority_decision_id:"auth-contracted",supersedes_authority_decision_id:"auth-planned",evaluated_at:"2026-10-02T00:01:00.000Z"};
  const gateway=new RuntimeAuthorityGateway({
    contextResolver:{async evaluate(input:any){
      evaluatedParent=input.supersedes_authority_decision_id;
      return {
        ...planned("ALLOW"),
        authority_decision_id:input.authority_decision_id,
        supersedes_authority_decision_id:input.supersedes_authority_decision_id,
        evaluated_at:input.now,
      };
    }},
    authorityStore:{
      async latestDecisionForBinding(){return contracted;},
      async appendDecision(){},
    },
    executionGateway:{async execute(){providerCalls++;return {state:"VERIFIED",verified:true};}},
  });
  const result=await gateway.execute({
    decision:{status:"approved",decision_id:"auth-planned",canonical:planned()},
    capability:{name:capability},input:{authority_usage:{amount:25,currency:"AUD"}},
    idempotency_key:"action-1",company_id,work_id:"work-1",agent_id:worker_id,run_id:"run-1",
  });
  assert.equal(evaluatedParent,"auth-contracted");
  assert.equal(providerCalls,1);
  assert.equal(result.state,"VERIFIED");
});


test("authority class ceilings, entitlement separation and recursive handshake fail closed at exact transitions",async()=>{
  const noLimits={currency:null,max_amount:null,max_provider_cost:null,max_messages:null,max_recipients:null};
  const below=await resolver({limits:noLimits,usage:{},score:50}).evaluate(authorityInput);
  assert.equal(below.decision,"ESCALATE");
  assert.ok(below.reason_codes.includes("autonomy_below_required"));
  assert.equal((await resolver({limits:noLimits,usage:{},score:51}).evaluate(authorityInput)).decision,"ALLOW");

  const noEntitlement=await resolver({limits:noLimits,usage:{},score:65,entitlements:[]}).evaluate(authorityInput);
  assert.equal(noEntitlement.decision,"DENY");
  assert.ok(noEntitlement.reason_codes.includes("missing_entitlement"));

  const missingPlatform=await resolver({limits:noLimits,usage:{},score:71,handshake:{platform:false,user:true,assurance:true}}).evaluate(authorityInput);
  assert.equal(missingPlatform.decision,"ESCALATE");
  assert.ok(missingPlatform.reason_codes.includes("trusted_auto_platform_handshake_missing"));
  const missingUser=await resolver({limits:noLimits,usage:{},score:71,handshake:{platform:true,user:false,assurance:true}}).evaluate(authorityInput);
  assert.equal(missingUser.decision,"APPROVAL_REQUIRED");
  assert.ok(missingUser.reason_codes.includes("trusted_auto_user_handshake_missing"));
});
