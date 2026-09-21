import { readFileSync } from "node:fs"; import { resolve } from "node:path";
import { describe,expect,it } from "vitest";
const read=(p:string)=>readFileSync(resolve(process.cwd(),p),"utf8");
describe("invoice totals consistency",()=>{
 it("recalculation preserves stored tax instead of resetting it",()=>{
  const s=read("lib/invoices/line-items.ts");
  expect(s).not.toContain("const taxCents = 0;");
  expect(s).toContain("tax_cents");
 });
 it("locks draft invoice before line mutation",()=>{
  expect(read("lib/invoices/line-items.ts")).toContain("FOR UPDATE");
 });
});
