import { describe, expect, it, vi } from "vitest";
import { syncDefectCompletionBlockers, syncFieldCompletionBlockerProjection, syncInspectionCompletionBlockers } from "./field-completion-blocker-projection";

function client(){return {query:vi.fn().mockResolvedValue({rows:[],rowCount:0})} as any;}

describe("field completion blocker projections",()=>{
 it("resolves stale reasons then upserts current blockers",async()=>{
  const c=client();await syncFieldCompletionBlockerProjection(c,"a1",{company_id:"c1",work_order_id:"wo1",source_type:"permit",source_id:"p1",reasons:["PERMIT_EXPIRED","PERMIT_EXPIRED"]});
  expect(c.query).toHaveBeenCalledTimes(3);
  expect(c.query.mock.calls[1][1][5]).toBe("PERMIT_EXPIRED");
 });
 it("clears a source projection when no blockers remain",async()=>{
  const c=client();await syncDefectCompletionBlockers(c,"a1",{company_id:"c1",work_order_id:"wo1",defect_id:"d1",completion_blockers:[]});
  expect(c.query).toHaveBeenCalledTimes(1);
 });
 it("failed inspections project a blocker while passed inspections resolve it",async()=>{
  const failed=client();await syncInspectionCompletionBlockers(failed,"a1",{company_id:"c1",work_order_id:"wo1",permit_id:"p1",inspection_id:"i1",result:"failed"});
  expect(failed.query).toHaveBeenCalledTimes(3);expect(failed.query.mock.calls[2][1][5]).toBe("FAILED_INSPECTION_UNRESOLVED");
  const passed=client();await syncInspectionCompletionBlockers(passed,"a1",{company_id:"c1",work_order_id:"wo1",permit_id:"p1",inspection_id:"i1",result:"passed"});
  expect(passed.query).toHaveBeenCalledTimes(2);
 });
 it("cancelled required inspections remain blocking",async()=>{
  const c=client();await syncInspectionCompletionBlockers(c,"a1",{company_id:"c1",work_order_id:"wo1",permit_id:"p1",inspection_id:"i2",result:"cancelled"});
  expect(c.query).toHaveBeenCalledTimes(3);expect(c.query.mock.calls[2][1][5]).toBe("REQUIRED_INSPECTION_NOT_PASSED");
 });
 it("requires canonical projection identifiers",async()=>{
  const c=client();await expect(syncFieldCompletionBlockerProjection(c,"a1",{company_id:"",work_order_id:"wo1",source_type:"defect",source_id:"d1",reasons:[]})).rejects.toThrow("company_id is required");
  expect(c.query).not.toHaveBeenCalled();
 });
});
