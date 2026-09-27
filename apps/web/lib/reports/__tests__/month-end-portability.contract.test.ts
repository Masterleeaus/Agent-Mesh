import { describe,expect,it } from "vitest";
import { readFileSync } from "node:fs"; import { resolve } from "node:path";
const files=["app/app/expenses/page.tsx","app/api/v1/reports/month-end-export/route.ts","app/app/reports/close/page.tsx"];
describe("month-end finance SQL portability",()=>it("avoids PostgreSQL date/cast/lateral constructs",()=>{
 for(const f of files){const s=readFileSync(resolve(process.cwd(),f),"utf8"); expect(s).not.toMatch(/::[A-Za-z]|interval\s+'|to_char\s*\(|\bLATERAL\b/i);}
}));
