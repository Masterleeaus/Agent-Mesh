import { readFileSync } from "node:fs"; import { resolve } from "node:path";
import { describe,expect,it } from "vitest";
const read=(p:string)=>readFileSync(resolve(process.cwd(),p),"utf8");
describe("job material persistence portability",()=>{
 it("line mutation avoids RETURNING",()=>{
  const s=read("app/api/v1/jobs/[id]/materials/[lineId]/route.ts");
  expect(s).not.toMatch(/\bRETURNING\b/i);
  expect(s).toContain("SELECT * FROM job_material_lines");
 });
 it("seed hydration avoids postgres array/cast operators",()=>{
  const s=read("lib/jobs/buy-list-seed.ts");
  expect(s).not.toMatch(/ANY\s*\(|cardinality\s*\(|::uuid|::text|::float/i);
 });
});
