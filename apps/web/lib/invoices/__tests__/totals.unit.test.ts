import { describe,expect,it } from "vitest";
import { calculateCommercialTotals, percentOfCents } from "../totals";
describe("commercial totals",()=>{
 it("rounds percentage math once to integer cents",()=>expect(percentOfCents(999,825)).toBe(82));
 it("clamps discounts at zero subtotal",()=>expect(calculateCommercialTotals({lineSubtotalCents:500,discountCents:700,taxCents:10})).toEqual({subtotal_cents:0,tax_cents:10,total_cents:10}));
 it("adds surcharge before stored tax",()=>expect(calculateCommercialTotals({lineSubtotalCents:1000,surchargeCents:50,taxCents:100}).total_cents).toBe(1150));
});
