import { readFileSync } from "node:fs"; import { resolve } from "node:path";
import { describe,expect,it } from "vitest";
const read=(p:string)=>readFileSync(resolve(process.cwd(),p),"utf8");
describe("expense attribution and portability",()=>{
 it("resolves job attribution server-side and persists property/client",()=>{
  const s=read("app/api/v1/expenses/route.ts");
  expect(s).toContain("resolveExpenseAttribution");
  expect(s).toContain("property_id");
  expect(s).not.toMatch(/\bRETURNING\b/i);
 });
 it("guards PostgreSQL RLS context",()=>{
  expect(read("lib/expenses/db.ts")).toContain('getDatabaseDialect() === "postgres"');
 });
 it("fuel attachment is free of PostgreSQL-only casts/RETURNING/NULLS LAST/IS DISTINCT FROM",()=>{
  const s=read("lib/expenses/attach-fuel-expense.ts");
  expect(s).not.toMatch(/\bRETURNING\b|::\w+|NULLS\s+LAST|IS\s+DISTINCT\s+FROM/i);
 });
});
