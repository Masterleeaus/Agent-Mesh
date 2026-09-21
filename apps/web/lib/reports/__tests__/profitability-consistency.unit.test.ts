import { describe,expect,it } from "vitest";
import { marginBasisPoints, outstandingBalanceCents, profitabilityCents } from "../profitability";
describe("profitability consistency",()=>{
 it("uses canonical balances",()=>expect(outstandingBalanceCents([{status:"partial",balance_cents:250},{status:"paid",balance_cents:0}])).toBe(250));
 it("calculates profit",()=>expect(profitabilityCents(10000,6500)).toBe(3500));
 it("calculates integer basis-point margin",()=>expect(marginBasisPoints(10000,6500)).toBe(3500));
});
