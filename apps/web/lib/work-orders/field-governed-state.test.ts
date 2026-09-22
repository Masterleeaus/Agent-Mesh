import { describe,expect,it,vi } from "vitest";
import { recordGovernedPermitState } from "./field-governed-state";
const client=()=>({query:vi.fn()}) as any;
const ctx={accountId:"a1",company_id:"c1",actorId:"u1",traceId:"t1",role:"admin" as const};
const permit={permit_id:"p1",work_order_id:"wo1",permit_type:"building",state:"active",expiry_date:"2027-01-01",completion_blockers:[],provenance:{idempotency_key:"same-key"}};
describe("field mutation idempotency",()=>{
 it("rejects reuse of an idempotency key with a different payload",async()=>{
  const c=client();c.query.mockResolvedValueOnce({rows:[{id:"p1",state:"expired",expiry_date:"2027-01-01"}]});
  await expect(recordGovernedPermitState(c,ctx,permit)).rejects.toThrow("IDEMPOTENCY_KEY_PAYLOAD_CONFLICT");
  expect(c.query).toHaveBeenCalledTimes(1);
 });
 it("rejects reuse of a key for another entity",async()=>{
  const c=client();c.query.mockResolvedValueOnce({rows:[{id:"p2",state:"active",expiry_date:"2027-01-01"}]});
  await expect(recordGovernedPermitState(c,ctx,permit)).rejects.toThrow("IDEMPOTENCY_KEY_PAYLOAD_CONFLICT");
 });
});
