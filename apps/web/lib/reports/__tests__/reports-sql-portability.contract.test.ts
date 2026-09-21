import { describe,expect,it } from "vitest";
import { readFileSync } from "node:fs"; import { resolve } from "node:path";
const s=readFileSync(resolve(process.cwd(),"app/app/reports/queries.ts"),"utf8");
describe("reports SQL portability",()=>{
 it("avoids PostgreSQL FILTER aggregates",()=>expect(s).not.toMatch(/\bFILTER\s*\(/i));
 it("avoids PostgreSQL epoch extraction",()=>expect(s).not.toMatch(/EXTRACT\s*\(\s*EPOCH/i));
});
