import { readFileSync } from "node:fs"; import { resolve } from "node:path";
import { describe,expect,it } from "vitest";
const read=(p:string)=>readFileSync(resolve(process.cwd(),p),"utf8");
describe("invoice CRUD portability",()=>{
 it("locks invoice before edit/delete",()=>{
  const s=read("app/api/v1/invoices/[id]/route.ts");
  expect((s.match(/FOR UPDATE/g) ?? []).length).toBeGreaterThanOrEqual(2);
 });
 it("invoice pages avoid postgres casts/null ordering",()=>{
  expect(read("app/app/invoices/page.tsx")).not.toMatch(/NULLS\s+LAST/i);
  expect(read("app/app/invoices/[id]/page.tsx")).not.toMatch(/::\w+/);
 });
 it("service minimum recalculation avoids RETURNING/casts",()=>{
  expect(read("lib/invoices/service-minimum.ts")).not.toMatch(/\bRETURNING\b|::\w+/i);
 });
});
