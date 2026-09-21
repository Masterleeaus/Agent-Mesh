import { readFileSync } from "node:fs"; import { resolve } from "node:path";
import { describe,expect,it } from "vitest";
describe("billable material carry-through portability",()=>{
 it("does not depend on postgres RETURNING/casts/interval literals/ANY arrays",()=>{
  const s=readFileSync(resolve(process.cwd(),"lib/invoices/job-expenses.ts"),"utf8");
  expect(s).not.toMatch(/\bRETURNING\b|::\w+|ANY\s*\(|interval\s+'/i);
 });
});
