import test from "node:test";
import assert from "node:assert/strict";
import { RuntimeAuthorityGateway } from "./runtime-authority-gateway.mjs";

const canonical=(decision="ALLOW",company_id="co-1")=>({
  company_id,authority_decision_id:"auth-1",worker_id:"worker-1",capability:"booking.create",
  operation_id:"run-1",action_id:"run-1",decision,evaluated_at:new Date().toISOString(),
  evaluated_risk:{level:"medium",source:"risk-engine",ref:"risk-1"},
});

test("only canonical ALLOW becomes runtime approved",async()=>{
 const gateway=new RuntimeAuthorityGateway({
  contextResolver:{async evaluate(){return canonical("ALLOW");}},
  executionGateway:{async execute(){throw new Error("unused");}},
 });
 const decision=await gateway.authorize({company_id:"co-1",agent_id:"worker-1",capability:"booking.create",run_id:"run-1"});
 assert.equal(decision.status,"approved");
 assert.equal(decision.canonical.decision,"ALLOW");
});

test("approval requirement is preserved and other outcomes deny",async()=>{
 for(const [value,status] of [["APPROVAL_REQUIRED","approval_required"],["DENY","denied"],["EVIDENCE_REQUIRED","denied"],["AUTHORITY_UNAVAILABLE","denied"]]){
  const gateway=new RuntimeAuthorityGateway({contextResolver:{async evaluate(){return canonical(value);}},executionGateway:{async execute(){}}});
  assert.equal((await gateway.authorize({company_id:"co-1",agent_id:"worker-1",capability:"booking.create",run_id:"run-1"})).status,status);
 }
});

test("execution revalidates company binding and carries evaluated risk",async()=>{
 let request;
 const gateway=new RuntimeAuthorityGateway({
  contextResolver:{async evaluate(){return canonical();}},
  executionGateway:{async execute(value){request=value;return {state:"VERIFIED",verified:true};}},
 });
 const decision={status:"approved",decision_id:"auth-1",canonical:canonical()};
 await gateway.execute({decision,capability:{name:"booking.create"},input:{},idempotency_key:"tool-1",company_id:"co-1",work_id:"work-1",agent_id:"worker-1",run_id:"run-1"});
 assert.equal(request.company_id,"co-1");
 assert.equal(request.decision_id,"auth-1");
 assert.equal(request.risk.level,"medium");
 assert.equal(request.risk.source,"risk-engine");
 await assert.rejects(()=>gateway.execute({decision,capability:{name:"booking.create"},input:{},idempotency_key:"tool-2",company_id:"co-2",work_id:"work-1",agent_id:"worker-1",run_id:"run-1"}),/company-mismatch/);
});
