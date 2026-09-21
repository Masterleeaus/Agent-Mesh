import { readFileSync } from "node:fs"; import { resolve } from "node:path";
import { describe,expect,it } from "vitest";
const read=(p:string)=>readFileSync(resolve(process.cwd(),p),"utf8");
describe("invoice lifecycle consistency",()=>{
 it("serializes manual transitions and tenant-scopes writes",()=>{
  const s=read("app/api/v1/invoices/[id]/transition/route.ts");
  expect(s).toContain("FOR UPDATE");
  expect(s).toMatch(/UPDATE invoices[\s\S]*account_id/);
 });
 it("payment synchronization reselect is tenant scoped",()=>{
  const s=read("app/api/v1/invoices/[id]/payments/route.ts");
  expect(s).toMatch(/SELECT status, paid_cents, total_cents, invoice_number FROM invoices WHERE id = \$1 AND account_id = \$2/);
 });
});
