import { describe,it } from "node:test";
import assert from "node:assert/strict";
import { assertCompanyScopedReferences,buildCompanyScopedReferenceSet } from "../src/business-reference-integrity.ts";
describe("company-scoped business references",()=>{
 it("accepts same-company references without granting authority",()=>{
  const out=buildCompanyScopedReferenceSet("c1",[{company_id:"c1",ref_type:"work_order",ref_id:"wo1"},{company_id:"c1",ref_type:"change_order",ref_id:"co1"}]);
  assert.equal(out.grants_authority,false);assert.equal(out.execution_permitted,false);
 });
 it("rejects cross-company references",()=>assert.throws(()=>assertCompanyScopedReferences("c1",[{company_id:"c2",ref_type:"project",ref_id:"p1"}]),/CROSS_COMPANY_REFERENCE_REJECTED/));
});
