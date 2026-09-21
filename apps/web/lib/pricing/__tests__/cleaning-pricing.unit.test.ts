import { describe,expect,it } from "vitest";
import { calculateCleaningPrice } from "../cleaning-pricing";
describe("cleaning pricing",()=>{
 it("supports hourly + frequency + addon + minimum + travel + deposit",()=>{
  const r=calculateCleaningPrice({mode:"hourly",hours:2,hourlyRateCents:5000,frequencyDiscountBps:1000,addonsCents:[1500],minimumCents:9000,travelCents:1000,depositBps:2500});
  expect(r.subtotal_cents).toBe(11500); expect(r.total_cents).toBe(12500); expect(r.deposit_cents).toBe(3125);
 });
 it("supports fixed room/task packages",()=>{
  const r=calculateCleaningPrice({mode:"fixed",fixedBaseCents:8000,roomCents:[2000,1500],taskCents:[1000],addonsCents:[],travelCents:0});
  expect(r.total_cents).toBe(12500);
 });
});
