import { describe,expect,it } from "vitest";
import { buildTitanFieldDefect,buildTitanFieldInspection,buildTitanFieldPermit } from "@titan-zero/titan-platform/business-ops";
import { canonicalCompanyIdFromSession } from "@/lib/auth/company-boundary";

const provenance={source:"route-test",recorded_at:"2026-09-22T00:00:00.000Z",idempotency_key:"k1"};
describe("field API package contracts",()=>{
 it("derives canonical company_id from authenticated compatibility boundary",()=>{
  expect(canonicalCompanyIdFromSession("account-1")).toBe("account-1");
  expect(()=>canonicalCompanyIdFromSession(" ")).toThrow("CANONICAL_COMPANY_BOUNDARY_UNAVAILABLE");
 });
 it("consumes permits through the public titan-platform boundary",()=>{
  const p=buildTitanFieldPermit({permit_id:"p1",company_id:"c1",work_order_id:"wo1",permit_type:"building",state:"inspection_required",provenance},{as_of:"2026-09-22"});
  expect(p.completion_blocked).toBe(true);expect(p.grants_authority).toBe(false);
 });
 it("consumes inspections through the public titan-platform boundary",()=>{
  const i=buildTitanFieldInspection({inspection_id:"i1",company_id:"c1",permit_id:"p1",inspection_date:"2026-09-22",result:"passed",provenance});
  expect(i.result).toBe("passed");expect(i.execution_permitted).toBe(false);
 });
 it("consumes defects through the public titan-platform boundary",()=>{
  const d=buildTitanFieldDefect({defect_id:"d1",company_id:"c1",punch_list_id:"pl1",work_order_id:"wo1",description:"fix",category:"safety",severity:"critical",state:"completed",provenance});
  expect(d.completion_blockers).toContain("DEFECT_COMPLETED_NOT_VERIFIED");expect(d.grants_authority).toBe(false);
 });
});
