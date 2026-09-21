import { readFileSync } from "node:fs"; import { resolve } from "node:path";
import { describe,expect,it } from "vitest";
const full=readFileSync(resolve(process.cwd(),"app/app/reports/queries.ts"),"utf8");
const s=full.slice(full.indexOf("export async function loadInvoiceAging"));
describe("invoice aging portability",()=>{
 it("avoids PostgreSQL FILTER/casts/interval literals",()=>expect(s).not.toMatch(/\bFILTER\s*\(|::\w+|interval\s+'/i));
 it("uses canonical outstanding balance including deposit credits",()=>expect(s).toContain("balance_cents"));
});
