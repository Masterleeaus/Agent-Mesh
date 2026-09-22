import { describe,expect,it } from "vitest";
import { buildTitanWarranty,buildTitanWarrantyClaim } from "../src/warranty";
import { buildTitanProjectSubmittal } from "../src/project-submittal";
const prov={source:"test",recorded_at:"2026-09-22T00:00:00Z",idempotency_key:"k"};
describe("converged business integrity",()=>{
 it("rejects unsafe warranty totals",()=>expect(()=>buildTitanWarrantyClaim({claim_id:"c",company_id:"co",warranty_id:"w",source_job_id:"j",claim_type:"labor",description:"x",claimed_date:"2026-09-22",labor_cost_cents:Number.MAX_SAFE_INTEGER,parts_cost_cents:1,provenance:prov})).toThrow(/safe integer/));
 it("rejects unsafe submittal totals",()=>expect(()=>buildTitanProjectSubmittal({submittal_id:"s",company_id:"co",project_id:"p",title:"x",submittal_type:"product_data",submitted_by_ref:"u",state:"draft",revision_number:1,date_submitted:"2026-09-22",document_refs:[],quantity:Number.MAX_SAFE_INTEGER,unit_cost_cents:2,provenance:prov})).toThrow(/safe integer/));
 it("rejects impossible warranty dates",()=>expect(()=>buildTitanWarranty({warranty_id:"w",company_id:"co",source_job_id:"j",client_id:"c",title:"x",coverage_type:"custom",start_date:"2026-02-31",end_date:"2026-03-01",provenance:prov})).toThrow(/ISO date/));
});
