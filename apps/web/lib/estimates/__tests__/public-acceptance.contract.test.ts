import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
const source=()=>readFileSync(resolve(process.cwd(),"app/api/portal/estimates/[token]/route.ts"),"utf8");
describe("public estimate acceptance contract",()=>{
 it("serializes acceptance and only transitions sent estimates",()=>{
  const s=source();
  expect(s).toContain("FOR UPDATE");
  expect(s).toContain('estimate.status !== "sent"');
 });
 it("records the public response in the audit trail",()=>{
  const s=source();
  expect(s).toContain("appendAuditLog");
  expect(s).toContain('via: "portal"');
 });
 it("guards PostgreSQL RLS context from MySQL",()=>{
  expect(source()).toContain('getDatabaseDialect() === "postgres"');
 });
});
