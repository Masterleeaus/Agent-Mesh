import { readFileSync } from "node:fs"; import { resolve } from "node:path";
import { describe,expect,it } from "vitest";
const read=(p:string)=>readFileSync(resolve(process.cwd(),p),"utf8");
describe("payment idempotency/provider references",()=>{
 it("stores idempotency keys structurally, not in notes",()=>{
  const s=read("app/api/v1/invoices/[id]/payments/route.ts");
  expect(s).toContain("idempotency_key");
  expect(s).not.toContain("[idem:");
 });
 it("Square webhook provider lookups are tenant scoped",()=>{
  const s=read("app/api/webhooks/square/route.ts");
  expect(s).toMatch(/external_provider = 'square' AND external_payment_id = \$1[\s\S]*account_id = \$2/);
 });
});
