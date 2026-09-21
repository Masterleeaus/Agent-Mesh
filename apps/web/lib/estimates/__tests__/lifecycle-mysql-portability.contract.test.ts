import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
const read=(p:string)=>readFileSync(resolve(process.cwd(),p),"utf8");
describe("estimate lifecycle MySQL portability",()=>{
 it("response endpoint does not require PostgreSQL RETURNING or set_config",()=>{
  const s=read("app/api/v1/estimates/[id]/respond/route.ts");
  expect(s).not.toMatch(/\bRETURNING\b/i);
  expect(s).not.toMatch(/\bset_config\s*\(/i);
 });
 it("send and transition validation do not use PostgreSQL casts",()=>{
  expect(read("app/api/v1/estimates/[id]/send/route.ts")).not.toMatch(/::int\b/i);
  expect(read("app/api/v1/estimates/[id]/transition/route.ts")).not.toMatch(/::int\b/i);
 });
});
