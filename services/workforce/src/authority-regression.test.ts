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

function resolver({limits,usage}:{limits:any;usage:any}){
  const snapshot={
    company_id,decision_id:"snap-1",capability,effective_score:65,status:"verified",source:"titan-autonomy",
    verified_at:"2026-10-02T00:00:00Z",expires_at:"2026-10-03T00:00:00Z",
    trusted_auto_handshake:{platform:true,user:true,assurance:true},predictive_ready:false,
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
    accessResolver:{async resolve(){return {permissions:["booking.write"],entitlements:["booking"]};}},
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
