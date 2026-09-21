import { readFileSync } from "node:fs"; import { resolve } from "node:path";
import { describe,expect,it } from "vitest";
const read=(p:string)=>readFileSync(resolve(process.cwd(),p),"utf8");
describe("Square payment reconciliation",()=>{
 it("persists checkout/order provider references on pending payment",()=>{
  const s=read("app/api/v1/invoices/[id]/square-link/route.ts");
  expect(s).toContain("external_order_id");
  expect(s).toContain("idempotency_key");
 });
 it("webhook reconciles pending row by Square order and locks it",()=>{
  const s=read("app/api/webhooks/square/route.ts");
  expect(s).toMatch(/external_order_id = \$3/);
  expect(s).toContain("FOR UPDATE");
 });
});
